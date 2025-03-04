import {makeAutoObservable, runInAction} from 'mobx';
import {VideoRecord, TikTokVideoData} from '@app/utils/types/api';
import {useVideosDatabase} from '@app/services/db';
import {useStores} from './index';
import {useCallback} from 'react';
import {downloadManager, useDownloadManager} from '../services/download';

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

  updateVideoStatus = (id: string, status: VideoRecord['status']) => {
    this.updateVideo(id, {status});
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

  updateVideoStatusInDb = async (
    id: string,
    status: VideoRecord['status'],
    videosDb: ReturnType<typeof useVideosDatabase>,
  ) => {
    try {
      await videosDb.updateVideoStatus(id, status);
      runInAction(() => {
        this.updateVideoStatus(id, status);
      });
    } catch (error) {
      console.error('Failed to update video status:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to update video status');
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

        // Start downloading the video
        await downloadManager.startDownload(savedVideo);
      }
    } catch (error) {
      console.error('Failed to save video:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to save video');
    }
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
      await this.updateVideoStatusInDb(videoId, 'downloading', videosDb);

      // Start the download
      await downloadManager.startDownload(video);
    } catch (error) {
      console.error('Failed to start video download:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to start video download');
    }
  };

  // Method to check download status and update video status
  checkDownloadStatus = async (videoId: string, videosDb: ReturnType<typeof useVideosDatabase>) => {
    try {
      // Get download progress
      const progress = downloadManager.getProgress(videoId);

      // If download is complete, update status and local URI
      if (progress?.isDone) {
        await this.updateVideoStatusInDb(videoId, 'downloaded', videosDb);

        // If we have a URI from the download progress, save it to the database
        if (progress.uri) {
          await videosDb.updateVideoLocalUri(videoId, progress.uri);

          // Also update the video in the store
          this.updateVideo(videoId, {
            status: 'downloaded',
            local_uri: progress.uri,
          });
        } else {
          // If no URI in progress, try to get the file path
          try {
            const filePath = await downloadManager.getVideoFilePath(videoId);
            const exists = await downloadManager.isVideoDownloaded(videoId);

            if (exists) {
              await videosDb.updateVideoLocalUri(videoId, filePath);
              this.updateVideo(videoId, {
                status: 'downloaded',
                local_uri: filePath,
              });
            }
          } catch (error) {
            console.error('Failed to get video file path:', error);
          }
        }
      } else if (progress?.error) {
        await this.updateVideoStatusInDb(videoId, 'failed', videosDb);
        this.updateVideo(videoId, {status: 'failed'});
      }
    } catch (error) {
      console.error('Failed to check download status:', error);
    }
  };
}

// Create a singleton instance
const videosStore = new VideosStore();

// Custom hook to use the videos store
export const useVideosStore = () => {
  const videosDb = useVideosDatabase();
  const downloadMgr = useDownloadManager();

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

  const updateVideoStatus = useCallback(
    async (id: string, status: VideoRecord['status']) => {
      await videosStore.updateVideoStatusInDb(id, status, videosDb);
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

  const checkDownloadStatus = useCallback(
    async (videoId: string) => {
      await videosStore.checkDownloadStatus(videoId, videosDb);
    },
    [videosDb],
  );

  return {
    videos: videosStore.videos,
    isLoading: videosStore.isLoading,
    error: videosStore.error,
    loadVideos,
    deleteVideo,
    updateVideoStatus,
    saveVideo,
    startDownload,
    checkDownloadStatus,
  };
};
