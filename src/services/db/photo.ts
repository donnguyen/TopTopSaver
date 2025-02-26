import {SQLiteProvider, useSQLiteContext, type SQLiteDatabase} from 'expo-sqlite';
import {PhotoResponse} from '../../utils/types/api';
import React from 'react';

const DATABASE_VERSION = 1;
const CREATE_PHOTOS_TABLE = `
  PRAGMA journal_mode = 'wal';
  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY,
    jobId TEXT NOT NULL,
    preset TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    originalUrl TEXT NOT NULL,
    resultHdUrl TEXT,
    url TEXT NOT NULL,
    country TEXT NOT NULL,
    documentType TEXT NOT NULL,
    dimension TEXT NOT NULL,
    status TEXT NOT NULL
  );
`;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{user_version: number} | null>('PRAGMA user_version');
  const currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentDbVersion === 0) {
    await db.execAsync(CREATE_PHOTOS_TABLE);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

interface PhotosDatabase {
  savePhoto: (photo: PhotoResponse) => Promise<void>;
  getPhotos: () => Promise<PhotoResponse[]>;
  getPhotoById: (id: number) => Promise<PhotoResponse | null>;
  deletePhoto: (id: number) => Promise<void>;
  updatePhoto: (id: number, updates: Partial<PhotoResponse>) => Promise<void>;
}

export function usePhotosDatabase(): PhotosDatabase {
  const db = useSQLiteContext();

  return {
    async savePhoto(photo: PhotoResponse): Promise<void> {
      try {
        await db.runAsync(
          `INSERT OR REPLACE INTO photos (
            id, jobId, preset, createdAt, updatedAt, originalUrl, resultHdUrl, url,
            country, documentType, dimension, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            photo.id,
            photo.jobId,
            photo.preset,
            photo.createdAt,
            photo.updatedAt,
            photo.originalUrl,
            photo.resultHdUrl,
            photo.url,
            photo.country,
            photo.documentType,
            photo.dimension,
            photo.status,
          ],
        );
      } catch (error) {
        console.error('Failed to save photo:', error);
        throw new Error('Failed to save photo to database');
      }
    },

    async getPhotos(): Promise<PhotoResponse[]> {
      try {
        const photos = await db.getAllAsync<PhotoResponse>(
          'SELECT * FROM photos ORDER BY createdAt DESC',
        );
        return photos ?? [];
      } catch (error) {
        console.error('Failed to get photos:', error);
        return [];
      }
    },

    async getPhotoById(id: number): Promise<PhotoResponse | null> {
      try {
        return await db.getFirstAsync<PhotoResponse>('SELECT * FROM photos WHERE id = ?', id);
      } catch (error) {
        console.error('Failed to get photo by id:', error);
        return null;
      }
    },

    async deletePhoto(id: number): Promise<void> {
      try {
        await db.runAsync('DELETE FROM photos WHERE id = ?', id);
      } catch (error) {
        console.error('Failed to delete photo:', error);
        throw new Error('Failed to delete photo from database');
      }
    },

    async updatePhoto(id: number, updates: Partial<PhotoResponse>): Promise<void> {
      try {
        const updateFields = Object.keys(updates)
          .map(field => `${field} = ?`)
          .join(', ');
        const values = [...Object.values(updates), id];

        await db.runAsync(`UPDATE photos SET ${updateFields} WHERE id = ?`, values);
      } catch (error) {
        console.error('Failed to update photo:', error);
        throw new Error('Failed to update photo in database');
      }
    },
  };
}
