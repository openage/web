import { Observable } from 'rxjs';
import { Page } from '../models/page.model';

export interface IApi<TModel> {

  afterCreate: Observable<TModel>;
  afterUpdate: Observable<TModel>;
  afterRemove: Observable<number | string>;
  afterPost: Observable<any>;
  afterBulk: Observable<any>;
  afterUpload: Observable<any>;

  get: (id: number | string, options?: any) => Promise<TModel | undefined>;
  search: (query?: any, options?: any) => Promise<Page<TModel> | undefined>;
  create: (model: any, options?: any) => Promise<TModel | undefined>;
  update: (id: number | string, model: any, options?: any) => Promise<TModel | undefined>;
  remove: (id: number | string, options?: any) => Promise<boolean>;
  post: (data: any, options?: any) => Promise<any>;
  bulk: (models: TModel[], options?: any) => Promise<any>;
  upload: (file: File, query?: any, options?: any) => Promise<any>
}
