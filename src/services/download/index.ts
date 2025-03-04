import * as FileSystem from 'expo-file-system';
import {Platform} from 'react-native';
import {VideoRecord} from '@app/utils/types/api';
import {makeAutoObservable} from 'mobx';

// Define download progress type
export interface DownloadProgress {
  videoId: string;
  progress: number; // 0-100
  bytesWritten: number;
  contentLength: number;
  isDone: boolean;
  error?: string;
  uri?: string;
}

// Define download manager class
export class DownloadManager {
  // Map to store download progress for each video
  downloadProgress: Map<string, DownloadProgress> = new Map();
  // Map to store download resumable objects
  private downloadTasks: Map<string, FileSystem.DownloadResumable> = new Map();

  constructor() {
    makeAutoObservable(this);
  }

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

      // Initialize progress
      this.downloadProgress.set(video.id, {
        videoId: video.id,
        progress: 0,
        bytesWritten: 0,
        contentLength: 0,
        isDone: false,
      });

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

          // Update progress
          this.downloadProgress.set(video.id, {
            videoId: video.id,
            progress,
            bytesWritten: downloadProgress.totalBytesWritten,
            contentLength: downloadProgress.totalBytesExpectedToWrite,
            isDone: progress >= 100,
          });
        },
      );

      // Store download task
      this.downloadTasks.set(video.id, downloadResumable);

      // Start download
      const result = await downloadResumable.downloadAsync();

      if (result) {
        // Download completed successfully
        this.downloadProgress.set(video.id, {
          videoId: video.id,
          progress: 100,
          bytesWritten: 0, // We don't have this info in the result
          contentLength: 0, // We don't have this info in the result
          isDone: true,
          uri: result.uri,
        });

        // Clean up
        this.downloadTasks.delete(video.id);
      }
    } catch (error) {
      console.error(`Error downloading video ${video.id}:`, error);

      // Update progress with error
      this.downloadProgress.set(video.id, {
        ...(this.downloadProgress.get(video.id) || {
          videoId: video.id,
          progress: 0,
          bytesWritten: 0,
          contentLength: 0,
          isDone: false,
        }),
        error: error instanceof Error ? error.message : 'Download failed',
      });

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
          this.downloadProgress.set(videoId, {
            videoId,
            progress: 100,
            bytesWritten: 0, // We don't have this info in the result
            contentLength: 0, // We don't have this info in the result
            isDone: true,
            uri: result.uri,
          });

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

        // Update progress
        this.downloadProgress.delete(videoId);

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

  // Get download progress for a video
  getProgress = (videoId: string): DownloadProgress | undefined => {
    return this.downloadProgress.get(videoId);
  };

  // Get all download progress
  getAllProgress = (): DownloadProgress[] => {
    return Array.from(this.downloadProgress.values());
  };
}

// Create singleton instance
export const downloadManager = new DownloadManager();

// Hook to use download manager
export const useDownloadManager = () => {
  return downloadManager;
};
