import {SQLiteDatabase} from 'expo-sqlite';
import {migrateVideosDbIfNeeded} from './videos';

export * from './videos';

export async function migrateAllDatabases(db: SQLiteDatabase) {
  await migrateVideosDbIfNeeded(db);
}
