export interface IService {
  init?: () => Promise<void>;
}

export type PVoid = Promise<void>;
