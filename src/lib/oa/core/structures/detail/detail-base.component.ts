import { ErrorHandler, EventEmitter, Input, Output, Directive } from '@angular/core';
import { Observable, Subject } from 'rxjs';


import { IApi } from '../../services';
import { DetailOptions } from './detail-options.model';
import { ColumnModel } from '../../models/column.model';



@Directive()
export abstract class DetailBase<TModel> {

  @Input()
  view?: string;

  @Input()
  properties?: TModel | any;

  @Input()
  options: any = {};

  @Input()
  code?: number | string | any;

  @Input()
  columns: any;

  fields: any;

  @Output()
  change: EventEmitter<TModel> = new EventEmitter();

  @Output()
  fetched: EventEmitter<TModel> = new EventEmitter();

  @Output()
  created: EventEmitter<TModel> = new EventEmitter();

  @Output()
  updated: EventEmitter<TModel> = new EventEmitter();

  @Output()
  removed: EventEmitter<TModel> = new EventEmitter();

  @Output()
  errored: EventEmitter<any> = new EventEmitter();

  @Output()
  selected: EventEmitter<any> = new EventEmitter();

  errors: string[] = [];

  isProcessing = false;

  private originalModel?: TModel;

  private detailOptions: DetailOptions<TModel> | any;

  constructor(options: {
    api: IApi<TModel>,
    cache?: IApi<TModel>,
    properties?: TModel,
    watch?: number,
    map?: (obj: any) => TModel,
    fields?: {
      id: 'id' | string,
      timeStamp: 'timeStamp' | string
    },
    errorHandler?: ErrorHandler
  } | DetailOptions<TModel>) {

    if (options instanceof DetailOptions) {
      this.detailOptions = options;
    } else {
      this.detailOptions = new DetailOptions(options);

    }

    if (this.detailOptions.properties) {
      this.originalModel = JSON.parse(JSON.stringify(options.properties));
      this.setModel(options.properties!);
    }
  }

  preInit() {
    const fields: any = {};
    const columns: any = [];

    if (typeof this.columns === 'string') {
      this.columns = this.columns.split(',')
    }

    this.columns.forEach((column: any) => {
      if (typeof column === 'string') {
        column = {
          code: column
        }
      }

      column = new ColumnModel(column);

      columns.push(column);
      fields[column.code] = column;
    });

    this.fields = fields;
    this.columns = columns;
  }

  private setModel(model: TModel | any): void {
    if (!model) {
      return;
    }
    this.properties = { ...model };
    this.code = this.detailOptions.fields ? model[this.detailOptions.fields.id] : model['id'];
    if (this.errors) {
      this.errors.splice(0, this.errors.length);
    }
  }

  get(id: string | number, options?: {
    handleError?: (error: any) => void
  }): Observable<TModel> {
    this.isProcessing = true;
    const subject = new Subject<TModel>();
    this.detailOptions.api.get(id, {
      watch: this.detailOptions.watch,
      map: this.detailOptions.map,
      handleError: (options && options.handleError) ? options.handleError : undefined
    }).subscribe((data: any) => {
      this.setModel(data);
      if (this.detailOptions.cache) {
        this.detailOptions.cache.update(id, data).subscribe();
      }
      this.isProcessing = false;
      subject.next(this.properties);
      this.fetched.emit(this.properties);
      return data;
    }, (error: any) => {
      this.isProcessing = false;
      this.errors = [error];
      this.errored.next(error);
      if (this.detailOptions.errorHandler) {
        this.detailOptions.errorHandler.handleError(error);
      }
      subject.error(error);
    });
    return subject.asObservable();
  }

  set(data: TModel) {
    this.setModel(data);
  }

  getErrors() {
    if (!this.validate) {
      return;
    }
    const errors = this.validate();
    this.setErrors(errors);

    return this.errors && this.errors.length ? this.errors : null;
  }

  validate(): string | Error | string[] {
    return null as any;
  }

  setErrors(error?: string | Error | any[]) {
    const errors = [];
    if (typeof error === 'string') {
      errors.push(error);
    } else if (Array.isArray(error)) {
      errors.push(...error);
    } else {
      errors.push(error?.message);
    }

    const changed = this.errors.length !== errors.length;
    this.errors = errors;

    if (changed) {
      this.errored.next(this.errors.length ? this.errors : null);
    }
  }

  select() {
    this.selected.emit(this.properties);
  }

  refresh() {
    return this.get(this.code);
  }

  clear() {
    this.setModel(JSON.parse(JSON.stringify(this.detailOptions.properties)));
  }

  reset() {
    this.setModel(this.originalModel);
  }

  save(model?: any): Observable<TModel> {
    if (this.properties && this.properties[this.detailOptions.fields.id]) {
      return this.update(model);
    } else {
      return this.create(model);
    }
  }

  create(model?: any): Observable<TModel> {
    this.isProcessing = true;
    model = model || this.properties;
    const subject = new Subject<TModel>();
    this.detailOptions.api.create(model).subscribe((data: any) => {
      this.setModel(data);
      if (this.detailOptions.cache && this.detailOptions.fields.id) {
        this.detailOptions.cache.update(data[this.detailOptions.fields.id], data).subscribe();
      }
      this.isProcessing = false;
      this.created.emit(this.properties);
      this.change.emit(this.properties);
      subject.next(this.properties);
      return data;

    }, (error: any) => {
      this.isProcessing = false;
      this.errors = [error];
      this.errored.next(error);
      if (this.detailOptions.errorHandler) {
        this.detailOptions.errorHandler.handleError(error);
      }
      subject.error(error);
    });
    return subject.asObservable();
  }

  update(model?: any): Observable<TModel> {
    this.isProcessing = true;
    const id = this.properties[this.detailOptions.fields.id];
    model = model || this.properties;
    const subject = new Subject<TModel>();
    this.detailOptions.api.update(id, model).subscribe((data: any) => {
      this.setModel(data);
      if (this.detailOptions.cache) {
        this.detailOptions.cache.update(this.code, data).subscribe();
      }
      this.isProcessing = false;
      this.updated.emit(this.properties);
      this.change.emit(this.properties);
      subject.next(this.properties);
      return data;
    }, (error: any) => {
      this.isProcessing = false;
      this.errors = [error];
      this.errored.next(error);
      if (this.detailOptions.errorHandler) {
        this.detailOptions.errorHandler.handleError(error);
      }
      subject.error(error);
    });
    return subject.asObservable();
  }

  remove(): Observable<TModel> {
    const id = this.properties[this.detailOptions.fields.id] || this.code;

    this.isProcessing = true;
    const subject = new Subject<TModel>();

    this.detailOptions.api.remove(id).subscribe(() => {
      if (this.detailOptions.cache) {
        this.detailOptions.cache.remove(id).subscribe();
      }
      this.isProcessing = false;
      this.removed.emit(this.properties);
      this.change.emit(null!);
      subject.next(this.properties);
      return;
    }, (error: any) => {
      this.isProcessing = false;
      this.errors = [error];
      this.errored.next(error);
      if (this.detailOptions.errorHandler) {
        this.detailOptions.errorHandler.handleError(error);
      }
      subject.error(error);
    });
    return subject.asObservable();
  }
}
