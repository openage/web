import { Subject } from "rxjs";
import { DataService } from "../services/data.service";

export class DomainObject {

  id?: string | number;
  code?: string;
  name?: string;
  meta: any = {};
  status?: string;
  timeStamp?: Date;
  createdAt?: Date;
  [key: string]: any;

  processing?: {
    status: string,
    error: string
  }


  private _isNew = false;
  private _isDirty = false;
  private _undoStack: any[] = [];
  private _redoStack: any[] = [];

  private _subject = new Subject<any>();
  private _changes = this._subject.asObservable();

  private _dataService?: DataService;

  private _options: any;

  constructor(data?: any, options?: any, dataService?: DataService) {
    this._options = options || {};
    this._dataService = dataService;

    Object.assign(this, data)
    this._subject.next(this);
  }

  private _clone = () => {
    const obj = Object.assign({}, this)
    for (const key in obj) {
      if (key.startsWith('_') || typeof obj[key] === 'function') {
        delete obj[key];
      }
    }

    return obj;
  }

  private _merge = (source: any, target: any) => {
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key])
      ) {
        if (!target[key]) {
          target[key] = {};
        }
        this._merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }

    return target;
  }

  private _isSame = (obj1: any, obj2: any): boolean => {
    // Check if both are the same reference
    if (obj1 === obj2) {
      return true;
    }

    // If either is null or not an object, they are not equal
    if (
      obj1 === null ||
      obj2 === null ||
      typeof obj1 !== 'object' ||
      typeof obj2 !== 'object'
    ) {
      return false;
    }

    // Check if they have the same number of keys
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    // Recursively compare each property
    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false; // Key mismatch
      }
      if (!this._isSame(obj1[key], obj2[key])) {
        return false; // Value mismatch
      }
    }

    return true; // All checks passed
  }

  // private _set = (data: any): any => {
  //   if (this._isSame(data, this._obj)) {
  //     return this;
  //   }

  //   Object.assign(this, data)
  //   this._obj = data;
  //   // this.timeStamp = new Date();
  //   this._subject.next(this);
  // }

  // private _set = (data: any): any => {
  //   // if (this._isSame(data, this._obj)) {
  //   //   return this;
  //   // }
  //   // this._obj = this._merge(data, this);
  //   this._obj = data
  //   Object.assign(this, data)
  //   this._undoStack.push(this._obj);
  //   this._redoStack = [];
  //   this._isDirty = true;

  //   // this.timeStamp = new Date();
  //   this._subject.next(this);
  // }

  public set = (key: string, value: any) => {

    const item = this._clone();
    const parts = key.split('.').filter((k: any) => !!k)
    let obj: any = item;
    let index = 0;

    for (const part of parts) {
      if (index === parts.length - 1) {
        obj[part] = value
      } else {
        obj[part] = obj[part] || {}
      }

      obj = obj[part]
      index++
    }
    this._undoStack.push(this._clone());
    this._redoStack = [];
    this._isDirty = true;

    Object.assign(this, item)

    // this.timeStamp = new Date();
    this._subject.next(this);
  }

  public isDirty = () => this._isDirty;

  public refresh = async () => {
    if (this._dataService && this.id) {
      const data = await this._dataService.get(this.id, this._options);
      Object.assign(this, data)
      this._undoStack = [];
      this._redoStack = [];
      this._isDirty = false;
      this._subject.next(this)
    }

    return this;
  };

  public subscribe(fn: (page: any) => any) {
    return this._changes.subscribe(fn);
  }

  public reset = () => {

    while (this._redoStack.length > 0) {
      const lastChange = this._undoStack.pop();

      if (lastChange) {
        this._redoStack.push(lastChange);
        this._isDirty = this._undoStack.length > 0;
      } else {
        break; // Exit loop if no more changes to undo
      }
    }

    this._isDirty = false;
  }

  public undo = (): void => {
    const lastChange = this._undoStack.pop();

    this._isDirty = this._undoStack.length !== 0

    if (!lastChange) {
      return;
    }

    this._redoStack.push(lastChange);
    Object.assign(this, lastChange)
    this._subject.next(this);
  }

  public redo = (): void => {
    const lastRedo = this._redoStack.pop();
    if (!lastRedo) return;

    this._undoStack.push(lastRedo);
    this._isDirty = true;
    Object.assign(this, lastRedo)
    this._subject.next(this);
  }

  public save = async () => {
    let obj = this._clone();
    if (this._isNew) {
      obj = await this._dataService?.create(obj, this._options)
      this._isNew = false;
    } else if (this.id) {
      obj = await this._dataService?.update(this.id, obj, this._options)
    }

    Object.assign(this, obj)
    this._undoStack = [];
    this._redoStack = [];
    this._isDirty = false;
    this._subject.next(this);
  }
}


