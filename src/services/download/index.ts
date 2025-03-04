import * as FileSystem from 'expo-file-system';
import {Platform} from 'react-native';
import {VideoRecord} from '@app/utils/types/api';
import {makeAutoObservable} from 'mobx';
// Import VideosStore type only, not the actual store
import type {VideosStore} from '@app/stores/videos.store';

// Define download manager class
export class DownloadManager {
  // Map to store download resumable objects
  private downloadTasks: Map<string, FileSystem.DownloadResumable> = new Map();
  // Reference to the videos store for updating download progress
  private videosStoreRef: VideosStore | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  // Set the videos store reference
  setVideosStoreRef = (storeRef: VideosStore) => {
    this.videosStoreRef = storeRef;
  };

  // Get download directory
  private getDownloadDirectory = async (): Promise<string> => {
    const dir = `${FileSystem.documentDirectory}videos/`;

    // Check if directory exists, if not create it
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, {intermediates: true});
    }

    return dir;
  };

  // Get local file path for a video
  getVideoFilePath = async (videoId: string): Promise<string> => {
    const dir = await this.getDownloadDirectory();
    return `${dir}${videoId}.mp4`;
  };

  // Check if a video is already downloaded
  isVideoDownloaded = async (videoId: string): Promise<boolean> => {
    const filePath = await this.getVideoFilePath(videoId);
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    return fileInfo.exists;
  };

  // Start downloading a video
  startDownload = async (video: VideoRecord): Promise<void> => {
    try {
      // Skip if already downloading
      if (this.downloadTasks.has(video.id)) {
        console.log(`Already downloading video ${video.id}`);
        return;
      }

      // Check if video is already downloaded
      const isDownloaded = await this.isVideoDownloaded(video.id);
      if (isDownloaded) {
        console.log(`Video ${video.id} is already downloaded`);

        // Update store with completed status
        if (this.videosStoreRef) {
          this.videosStoreRef.updateVideoStatus(video.id, 'downloaded');
          this.videosStoreRef.updateVideoDownloadPercentage(video.id, 100);

          // Update local URI
          const filePath = await this.getVideoFilePath(video.id);
          this.videosStoreRef.updateVideo(video.id, {local_uri: filePath});
        }

        return;
      }

      // Get download URL (use play for normal quality or hdplay for HD)
      let downloadUrl = video.play;
      if (!downloadUrl) {
        throw new Error('No download URL available');
      }

      // Ensure the URL has the correct host prefix
      if (!downloadUrl.startsWith('http')) {
        downloadUrl = `https://www.tikwm.com/${downloadUrl}`;
      }

      // Get local file path
      const filePath = await this.getVideoFilePath(video.id);

      // Update store with initial progress
      if (this.videosStoreRef) {
        this.videosStoreRef.updateVideoDownloadPercentage(video.id, 0);
        this.videosStoreRef.updateVideoStatus(video.id, 'downloading');
      }

      // Create download resumable
      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        filePath,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        },
        downloadProgress => {
          const progress =
            (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;

          // Update store with progress
          if (this.videosStoreRef) {
            this.videosStoreRef.updateVideoDownloadPercentage(video.id, progress);

            // If download is complete, update status
            if (progress >= 100) {
              this.videosStoreRef.updateVideoStatus(video.id, 'downloaded');
              this.videosStoreRef.updateVideo(video.id, {local_uri: filePath});

              // Clean up
              this.downloadTasks.delete(video.id);
            }
          }
        },
      );

      // Store download task
      this.downloadTasks.set(video.id, downloadResumable);

      // Start download
      const result = await downloadResumable.downloadAsync();

      if (result) {
        // Download completed successfully
        if (this.videosStoreRef) {
          this.videosStoreRef.updateVideoDownloadPercentage(video.id, 100);
          this.videosStoreRef.updateVideoStatus(video.id, 'downloaded');
          this.videosStoreRef.updateVideo(video.id, {local_uri: result.uri});
        }

        // Clean up
        this.downloadTasks.delete(video.id);
      }
    } catch (error) {
      console.error(`Error downloading video ${video.id}:`, error);

      // Update store with error
      if (this.videosStoreRef) {
        this.videosStoreRef.updateVideoStatus(video.id, 'failed');
      }

      // Clean up
      this.downloadTasks.delete(video.id);
    }
  };

  // Pause download
  pauseDownload = async (videoId: string): Promise<void> => {
    const downloadTask = this.downloadTasks.get(videoId);
    if (downloadTask) {
      try {
        await downloadTask.pauseAsync();
        // Note: We don't need to update the task as pauseAsync modifies the existing object
      } catch (error) {
        console.error(`Error pausing download for video ${videoId}:`, error);
      }
    }
  };

  // Resume download
  resumeDownload = async (videoId: string): Promise<void> => {
    const downloadTask = this.downloadTasks.get(videoId);
    if (downloadTask) {
      try {
        const result = await downloadTask.resumeAsync();
        if (result) {
          // Download completed successfully
          if (this.videosStoreRef) {
            this.videosStoreRef.updateVideoDownloadPercentage(videoId, 100);
            this.videosStoreRef.updateVideoStatus(videoId, 'downloaded');
            this.videosStoreRef.updateVideo(videoId, {local_uri: result.uri});
          }

          // Clean up
          this.downloadTasks.delete(videoId);
        }
      } catch (error) {
        console.error(`Error resuming download for video ${videoId}:`, error);
      }
    }
  };

  // Cancel download
  cancelDownload = async (videoId: string): Promise<void> => {
    const downloadTask = this.downloadTasks.get(videoId);
    if (downloadTask) {
      try {
        // Just remove the task, the download will be aborted
        this.downloadTasks.delete(videoId);

        // Try to delete the partial file
        const filePath = await this.getVideoFilePath(videoId);
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(filePath);
        }
      } catch (error) {
        console.error(`Error canceling download for video ${videoId}:`, error);
      }
    }
  };
}

// Create singleton instance
export const downloadManager = new DownloadManager();

// Hook to use download manager
export const useDownloadManager = () => {
  return downloadManager;
};
