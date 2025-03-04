type ResponseStatus = 'success' | 'fail';

// Counter
export type Counter$Get$Response = {
  value: number;
};

// Auth
export type Auth$Login$Response = {
  status: 'success' | 'fail';
  data: any;
};

// TikTok API
export interface TikTokVideoResponse {
  code: number;
  msg: string;
  processed_time: number;
  data?: TikTokVideoData;
}

export interface TikTokVideoData {
  id: string;
  title: string;
  cover: string;
  duration: number;
  hdplay: string;
  hd_size: number;
  play: string;
  size: number;
  author: {
    id: string;
    unique_id: string;
    nickname: string;
    avatar: string;
  };
}

export interface VideoRecord {
  id: string;
  title: string;
  cover: string;
  duration: number;
  hdplay: string;
  hd_size: number;
  play: string;
  size: number;
  author_unique_id: string;
  author_nickname: string;
  author_avatar: string;
  created_at: string;
  status: 'downloading' | 'downloaded' | 'failed';
  local_uri?: string;
  download_percentage: number;
}
