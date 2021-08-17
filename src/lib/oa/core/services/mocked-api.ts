import { Observable, Subject } from 'rxjs';
import { IApi } from 'src/lib/oa/core/services';
import { Page, PageOptions } from '../models';

export class MockedService<TModel> implements IApi<TModel> {
  afterCreate: Observable<TModel>;
  afterUpdate: Observable<TModel>;
  afterRemove: Observable<string | number>;
  afterPost: Observable<any>;
  afterBulk: Observable<any>;
  afterUpload: Observable<any>;

  constructor(public items: TModel[]) {
    for (let index = 0; index < items.length; index++) {
      const item = items[index] as any;
      if (!item.id) {
        item.id = index + 1;
      }
    }
  }
  get(id: string | number, options?: { watch?: number; map?: (obj: any) => TModel; }): Observable<TModel> {
    const subject = new Subject<TModel>();

    setTimeout(() => {
      subject.next(this.items.find((i: any) => i.id === id));
    });

    return subject.asObservable();
  }
  search(query?: any, options?: PageOptions | { offset?: number; limit?: number; map?: (obj: any) => TModel; }): Observable<Page<TModel>> {
    const subject = new Subject<Page<TModel>>();

    setTimeout(() => {
      const page = new Page<TModel>();

      page.items = this.items;

      subject.next(page);
    });

    return subject.asObservable();
  }
  create(model: any, options?: { map?: (obj: any) => TModel; }): Observable<TModel> {
    const subject = new Subject<TModel>();
    model.id = this.items.length;
    this.items.push(model);

    setTimeout(() => {
      subject.next(model as TModel);
    });

    return subject.asObservable();
  }
  update(id: string | number, model: any, options?: { map?: (obj: any) => TModel; }): Observable<TModel> {
    const subject = new Subject<TModel>();

    setTimeout(() => {
      subject.next(model as TModel);
    });
    return subject.asObservable();
  }
  remove(id: string | number, options?: { offline?: boolean; }): Observable<void> {
    const subject = new Subject<void>();

    setTimeout(() => {
      this.items = this.items.filter((i: any) => i.id !== id);
      subject.next();
    });
    return subject.asObservable();
  }
  post(model: any, key?: string, options?: { map?: (obj: any) => TModel; }): Observable<any> {
    const subject = new Subject<any>();
    setTimeout(() => {
      subject.next('Done');
    });
    return subject.asObservable();
  }
  bulk(models: any[], path?: string, options?: { map?: (obj: any) => TModel; }): Observable<any> {
    const subject = new Subject<any>();
    setTimeout(() => {
      subject.next('Done');
    });
    return subject.asObservable();
  }
  upload(file: File, path?: string, query?: any): Observable<any> {
    const subject = new Subject<any>();
    setTimeout(() => {
      subject.next('Done');
    });
    return subject.asObservable();
  }

}
