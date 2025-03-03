import {AuthApi} from './auth';
import {CounterApi} from './counter';
import {tiktokApi} from './tiktok';
import type {IService, PVoid} from '../types';

export class ApiService implements IService {
  private inited = false;

  counter: CounterApi;
  auth: AuthApi;
  tiktok = tiktokApi;

  constructor() {
    this.counter = new CounterApi();
    this.auth = new AuthApi();
  }

  init = async (): PVoid => {
    if (!this.inited) {
      // your code ...

      this.inited = true;
    }
  };
}
