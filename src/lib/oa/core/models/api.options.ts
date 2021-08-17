import { ErrorHandler } from "@angular/core";
import { IAuth } from "../services/auth.interface"

export class ApiOptions<TModel>{
  auth?: IAuth;
  collection?: any;
  headers?: any;
  map?: (obj: any) => TModel;
  extension?: string;
  errorHandler?: ErrorHandler;

  constructor(obj: any) {
    if (!obj) return;

    if (typeof obj === 'string') {
      this.collection = obj;
      return
    }

    this.auth = obj.auth;
    this.collection = obj.collection;
    this.headers = obj.headers;
    this.map = obj.map;
    this.extension = obj.extension;
    this.errorHandler = obj.errorHandler;
  }

}


export class ApiMethodOptions {

  path?: string;
  offline?: boolean
  timeStamp?: Date
  map?: (obj: any) => any
  handleError?: (error: any) => void

  constructor(obj: any) {
    if (!obj) return;

    if (typeof obj === 'string') {
      this.path = obj;
      return;
    }
    this.path = obj.path;
    this.offline = obj.offline;
    this.timeStamp = obj.timeStamp;
    this.map = obj.map;
    this.handleError = obj.handleError;
  }
}

export class ApiGetOptions extends ApiMethodOptions {

  watch?: number

  constructor(obj: any) {
    super(obj);
    if (!obj) return;

    this.watch = obj.watch;
  }
}

export class ApiSearchOptions extends ApiMethodOptions {
  offset?: number;
  limit?: number;
  sort?: any;
  skipSubjectStore?: boolean;

  constructor(obj: any) {
    super(obj);
    if (!obj) return;

    this.offset = obj.offset || obj.skip;
    this.limit = obj.limit;
    this.sort = obj.sort;
    this.path = obj.path;
    this.skipSubjectStore = obj.skipSubjectStore;

  }
}
