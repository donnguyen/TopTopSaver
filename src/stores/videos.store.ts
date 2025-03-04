import {makeAutoObservable, runInAction} from 'mobx';
import {VideoRecord, TikTokVideoData} from '@app/utils/types/api';
import {useVideosDatabase} from '@app/services/db';
import {useStores} from './index';
import {useCallback, useEffect} from 'react';
import {downloadManager, useDownloadManager, DownloadCallbacks} from '../services/download';

const LOADING_TIMEOUT = 10000; // 10 seconds

export class VideosStore {
  videos: VideoRecord[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setVideos = (videos: VideoRecord[]) => {
    this.videos = videos;
  };

  setIsLoading = (loading: boolean) => {
    this.isLoading = loading;
  };

  setError = (error: string | null) => {
    this.error = error;
  };

  addVideo = (video: VideoRecord) => {
    this.videos = [video, ...this.videos];
  };

  deleteVideo = (id: string) => {
    this.videos = this.videos.filter(video => video.id !== id);
  };

  updateVideo = (id: string, updatedVideo: Partial<VideoRecord>) => {
    const existingVideo = this.videos.find(video => video.id === id);
    if (!existingVideo) {
      return;
    }

    const updatedVideoFull: VideoRecord = {...existingVideo, ...updatedVideo};
    this.videos = this.videos.map(video => (video.id === id ? updatedVideoFull : video));
  };

  loadVideos = async (videosDb: ReturnType<typeof useVideosDatabase>) => {
    // Skip if already loading
    if (this.isLoading) {
      console.log('Already loading videos, skipping');
      return;
    }

    this.setIsLoading(true);
    this.setError(null);

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<VideoRecord[]>((_, reject) => {
        setTimeout(() => reject(new Error('Loading videos timed out')), LOADING_TIMEOUT);
      });

      // Create the actual fetch promise
      const fetchPromise = videosDb.getVideos();

      // Race the promises
      const videoRecords = await Promise.race([fetchPromise, timeoutPromise]);

      runInAction(() => {
        this.setVideos(videoRecords);
        this.setIsLoading(false);
      });
    } catch (error) {
      runInAction(() => {
        this.setError(error instanceof Error ? error.message : 'Failed to load videos');
        this.setIsLoading(false);
      });
    }
  };

  // Method to handle all video updates in one place
  updateVideoData = async (
    id: string,
    updates: Partial<VideoRecord>,
    videosDb: ReturnType<typeof useVideosDatabase>,
  ) => {
    try {
      // Update the database
      await videosDb.updateVideoData(id, updates);

      // Update the store
      runInAction(() => {
        this.updateVideo(id, updates);
      });
    } catch (error) {
      console.error('Failed to update video data:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to update video data');
    }
  };

  deleteVideoFromDb = async (id: string, videosDb: ReturnType<typeof useVideosDatabase>) => {
    try {
      await videosDb.deleteVideo(id);
      runInAction(() => {
        this.deleteVideo(id);
      });
    } catch (error) {
      console.error('Failed to delete video:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to delete video');
    }
  };

  saveVideoToDb = async (
    videoData: TikTokVideoData,
    videosDb: ReturnType<typeof useVideosDatabase>,
  ) => {
    try {
      // If the play URL doesn't start with http, prefix it with the host
      if (videoData.play && !videoData.play.startsWith('http')) {
        videoData = {
          ...videoData,
          play: `https://www.tikwm.com/${videoData.play}`,
        };
      }

      await videosDb.saveVideo(videoData);

      // Get the saved video to ensure it has the correct format
      const savedVideo = await videosDb.getVideoById(videoData.id);

      if (savedVideo) {
        runInAction(() => {
          this.addVideo(savedVideo);
        });

        // Start downloading the video without awaiting to prevent UI blocking
        // The download will continue in the background
        downloadManager.startDownload(savedVideo);
      }
    } catch (error) {
      console.error('Failed to save video:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to save video');
    }
  };

  // Create download callbacks
  createDownloadCallbacks = (videosDb: ReturnType<typeof useVideosDatabase>): DownloadCallbacks => {
    return {
      onProgress: (videoId: string, percentage: number) => {
        this.updateVideoData(videoId, {download_percentage: percentage}, videosDb);
      },
      onComplete: (videoId: string, localUri: string) => {
        this.updateVideoData(
          videoId,
          {
            local_uri: localUri,
            status: 'downloaded',
            download_percentage: 100,
          },
          videosDb,
        );
      },
      onError: (videoId: string, error: Error) => {
        console.error(`Download error for video ${videoId}:`, error);
        this.updateVideoData(videoId, {status: 'failed'}, videosDb);
        this.setError(error.message);
      },
    };
  };

  // Method to start downloading a video
  startVideoDownload = async (videoId: string, videosDb: ReturnType<typeof useVideosDatabase>) => {
    try {
      // Find the video in the store
      const video = this.videos.find(v => v.id === videoId);
      if (!video) {
        throw new Error('Video not found');
      }

      // Update status to downloading
      await this.updateVideoData(
        videoId,
        {
          status: 'downloading',
          download_percentage: 0,
        },
        videosDb,
      );

      // Start the download
      await downloadManager.startDownload(video);
    } catch (error) {
      console.error('Failed to start video download:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to start video download');
    }
  };
}

// Create a singleton instance
const videosStore = new VideosStore();

// Custom hook to use the videos store
export const useVideosStore = () => {
  const videosDb = useVideosDatabase();
  const downloadMgr = useDownloadManager();

  // Set up download callbacks
  useEffect(() => {
    const callbacks = videosStore.createDownloadCallbacks(videosDb);
    downloadMgr.setCallbacks(callbacks);
  }, [downloadMgr, videosDb]);

  const loadVideos = useCallback(async () => {
    await videosStore.loadVideos(videosDb);
  }, [videosDb]);

  const deleteVideo = useCallback(
    async (id: string) => {
      await videosStore.deleteVideoFromDb(id, videosDb);

      // Also cancel any ongoing download and delete the file
      await downloadMgr.cancelDownload(id);
    },
    [videosDb, downloadMgr],
  );

  const updateVideoData = useCallback(
    async (id: string, updates: Partial<VideoRecord>) => {
      await videosStore.updateVideoData(id, updates, videosDb);
    },
    [videosDb],
  );

  const saveVideo = useCallback(
    async (videoData: TikTokVideoData) => {
      await videosStore.saveVideoToDb(videoData, videosDb);
    },
    [videosDb],
  );

  const startDownload = useCallback(
    async (videoId: string) => {
      await videosStore.startVideoDownload(videoId, videosDb);
    },
    [videosDb],
  );

  return {
    videos: videosStore.videos,
    isLoading: videosStore.isLoading,
    error: videosStore.error,
    loadVideos,
    deleteVideo,
    updateVideoData,
    saveVideo,
    startDownload,
  };
};
