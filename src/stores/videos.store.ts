import {makeAutoObservable, runInAction} from 'mobx';
import {VideoRecord, TikTokVideoData} from '@app/utils/types/api';
import {useVideosDatabase} from '@app/services/db';
import {useStores} from './index';
import {useCallback} from 'react';

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
      const videoRecords = await videosDb.getVideos();

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
      runInAction(() => {
        this.setError(error instanceof Error ? error.message : 'Failed to delete video');
      });
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
      runInAction(() => {
        this.setError(error instanceof Error ? error.message : 'Failed to update video status');
      });
    }
  };

  // Add a new method to save a video to the database and update the store
  saveVideoToDb = async (
    videoData: TikTokVideoData,
    videosDb: ReturnType<typeof useVideosDatabase>,
  ) => {
    try {
      // Save to database
      await videosDb.saveVideo(videoData);

      // Get the video from the database to ensure we have the correct format
      const videos = await videosDb.getVideos();
      const savedVideo = videos.find(v => v.id === videoData.id);

      if (savedVideo) {
        // Update the store with the saved video
        runInAction(() => {
          this.addVideo(savedVideo);
        });
      }

      return true;
    } catch (error) {
      runInAction(() => {
        this.setError(error instanceof Error ? error.message : 'Failed to save video');
      });
      return false;
    }
  };
}

// Custom hook to use the videos store with the database
export const useVideosStore = () => {
  const {videos: videosStore} = useStores();
  const videosDb = useVideosDatabase();

  const loadVideos = useCallback(() => {
    return videosStore.loadVideos(videosDb);
  }, [videosStore, videosDb]);

  const deleteVideo = useCallback(
    (id: string) => {
      return videosStore.deleteVideoFromDb(id, videosDb);
    },
    [videosStore, videosDb],
  );

  const updateVideoStatus = useCallback(
    (id: string, status: VideoRecord['status']) => {
      return videosStore.updateVideoStatusInDb(id, status, videosDb);
    },
    [videosStore, videosDb],
  );

  // Add a new method to save a video
  const saveVideo = useCallback(
    (videoData: TikTokVideoData) => {
      return videosStore.saveVideoToDb(videoData, videosDb);
    },
    [videosStore, videosDb],
  );

  return {
    videos: videosStore.videos,
    isLoading: videosStore.isLoading,
    error: videosStore.error,
    loadVideos,
    deleteVideo,
    updateVideoStatus,
    saveVideo,
  };
};
