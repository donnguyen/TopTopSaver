import {PhotoResponse, FormDataFile} from '../../utils/types/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is not defined in environment variables');
}

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const photoApi = {
  async upload(file: FormDataFile, preset: string): Promise<PhotoResponse> {
    const formData = new FormData();
    formData.append('photo[original]', file);
    formData.append('photo[preset]', preset);

    try {
      const response = await fetch(`${API_BASE_URL}/photos.json`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new APIError(response.status, `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      return data as PhotoResponse;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Failed to upload photo');
    }
  },
};
