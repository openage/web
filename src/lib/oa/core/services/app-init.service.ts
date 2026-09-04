import { Injectable, Injector } from '@angular/core';
import { EnvironmentService } from './environment.service';
import { CacheService } from './cache.service';
import { Logger } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {

  logger = new Logger(AppInitService);

  constructor(
    private injector: Injector
  ) { }

  get environmentService(): EnvironmentService {
    return this.injector.get(EnvironmentService);
  }

  get cache(): CacheService {
    return this.injector.get(CacheService);
  }

  init(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.environmentService.init(this.cache).then((t) => {
        resolve(null);
      }, (err) => {
        this.logger.error(err);
      });
    });
  }
}
