import {useSQLiteContext, type SQLiteDatabase} from 'expo-sqlite';
import {VideoRecord, TikTokVideoData} from '../../utils/types/api';

const DATABASE_VERSION = 1;
const CREATE_VIDEOS_TABLE = `
  PRAGMA journal_mode = 'wal';
  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    cover TEXT NOT NULL,
    duration INTEGER NOT NULL,
    hdplay TEXT NOT NULL,
    hd_size INTEGER NOT NULL,
    play TEXT NOT NULL,
    size INTEGER NOT NULL,
    author_unique_id TEXT NOT NULL,
    author_nickname TEXT NOT NULL,
    author_avatar TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'downloading'
  );
`;

export async function migrateVideosDbIfNeeded(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{user_version: number} | null>('PRAGMA user_version');
  const currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentDbVersion === 0) {
    await db.execAsync(CREATE_VIDEOS_TABLE);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

interface VideosDatabase {
  saveVideo: (videoData: TikTokVideoData) => Promise<void>;
  getVideos: () => Promise<VideoRecord[]>;
  getVideoById: (id: string) => Promise<VideoRecord | null>;
  deleteVideo: (id: string) => Promise<void>;
  updateVideoStatus: (id: string, status: VideoRecord['status']) => Promise<void>;
}

export function useVideosDatabase(): VideosDatabase {
  const db = useSQLiteContext();

  return {
    async saveVideo(videoData: TikTokVideoData): Promise<void> {
      try {
        const videoRecord: VideoRecord = {
          id: videoData.id,
          title: videoData.title,
          cover: videoData.cover,
          duration: videoData.duration,
          hdplay: videoData.hdplay,
          hd_size: videoData.hd_size,
          play: videoData.play,
          size: videoData.size,
          author_unique_id: videoData.author.unique_id,
          author_nickname: videoData.author.nickname,
          author_avatar: videoData.author.avatar,
          created_at: new Date().toISOString(),
          status: 'downloading',
        };

        await db.runAsync(
          `INSERT OR REPLACE INTO videos (
            id, title, cover, duration, hdplay, hd_size, play, size,
            author_unique_id, author_nickname, author_avatar, created_at, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            videoRecord.id,
            videoRecord.title,
            videoRecord.cover,
            videoRecord.duration,
            videoRecord.hdplay,
            videoRecord.hd_size,
            videoRecord.play,
            videoRecord.size,
            videoRecord.author_unique_id,
            videoRecord.author_nickname,
            videoRecord.author_avatar,
            videoRecord.created_at,
            videoRecord.status,
          ],
        );
      } catch (error) {
        console.error('Failed to save video:', error);
        throw new Error('Failed to save video to database');
      }
    },

    async getVideos(): Promise<VideoRecord[]> {
      try {
        const videos = await db.getAllAsync<VideoRecord>(
          'SELECT * FROM videos ORDER BY created_at DESC',
        );
        return videos ?? [];
      } catch (error) {
        console.error('Failed to get videos:', error);
        return [];
      }
    },

    async getVideoById(id: string): Promise<VideoRecord | null> {
      try {
        return await db.getFirstAsync<VideoRecord>('SELECT * FROM videos WHERE id = ?', id);
      } catch (error) {
        console.error('Failed to get video by id:', error);
        return null;
      }
    },

    async deleteVideo(id: string): Promise<void> {
      try {
        await db.runAsync('DELETE FROM videos WHERE id = ?', id);
      } catch (error) {
        console.error('Failed to delete video:', error);
        throw new Error('Failed to delete video from database');
      }
    },

    async updateVideoStatus(id: string, status: VideoRecord['status']): Promise<void> {
      try {
        await db.runAsync('UPDATE videos SET status = ? WHERE id = ?', [status, id]);
      } catch (error) {
        console.error('Failed to update video status:', error);
        throw new Error('Failed to update video status in database');
      }
    },
  };
}
