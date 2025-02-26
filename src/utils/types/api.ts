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

export interface FormDataFile {
  uri: string;
  type: string;
  name: string;
}

export interface PhotoResponse {
  id: number;
  jobId: string;
  preset: string;
  createdAt: string;
  updatedAt: string;
  originalUrl: string;
  resultHdUrl: string;
  url: string;
  country: string;
  documentType: string;
  dimension: string;
  status: 'processing' | 'completed' | 'failed';
}

export interface PhotoUploadPayload {
  photo: {
    original: FormDataFile;
    preset: string;
  };
}
