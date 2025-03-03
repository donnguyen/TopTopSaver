import {TikTokVideoResponse} from '../../utils/types/api';

const TIKWM_API_URL = 'https://www.tikwm.com/api/';

export class APIError extends Error {
  public videoId?: string;

  constructor(
    public status: number,
    message: string,
    videoId?: string,
  ) {
    super(message);
    this.name = 'APIError';
    this.videoId = videoId;
  }
}

export const tiktokApi = {
  async downloadVideo(url: string): Promise<TikTokVideoResponse> {
    const params = new URLSearchParams();
    params.append('url', url);
    params.append('count', '12');
    params.append('cursor', '0');
    params.append('web', '1');
    params.append('hd', '1');

    try {
      const response = await fetch(`${TIKWM_API_URL}?${params.toString()}`, {
        method: 'POST',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0',
          Accept: 'application/json, text/javascript, */*; q=0.01',
          Host: 'www.tikwm.com',
          'Cache-Control': 'no-cache',
          Origin: 'https://www.tikwm.com',
          Referer: 'https://www.tikwm.com/',
        },
      });

      if (!response.ok) {
        throw new APIError(response.status, `Download failed with status ${response.status}`);
      }

      const data = (await response.json()) as TikTokVideoResponse;

      // Check if the API returned an error
      if (data.code !== 0) {
        // Extract video ID from URL if possible
        let videoId: string | undefined;
        const match = url.match(/\/video\/(\d+)/);
        if (match && match[1]) {
          videoId = match[1];
        }

        throw new APIError(data.code, data.msg || 'Failed to download TikTok video', videoId);
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to download TikTok video');
    }
  },
};
