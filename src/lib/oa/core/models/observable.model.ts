import { Subject } from "rxjs";

export class ObservableStack<T> {
  private _items?: T[] = [];
  private _subject = new Subject<T[] | undefined>();

  changes = this._subject.asObservable();

  get() {
    return this._items;
  }

  find(fn: (item: T) => boolean): T | undefined {
    return this._items?.find(fn);
  }

  update(find: (item: T) => boolean, set: (item: T) => any) {
    const item = this._items?.find(find);

    if (item) {
      set(item);
      this._subject.next(this._items);
    }
  }

  set(items?: T[]) {
    this._items = items;
    this._subject.next(this._items);
    return this._items;
  }

  push(item: T) {
    this._items?.push(item);
    this._subject.next(this._items);
    return this._items;
  }

  pop() {
    if (this._items?.length) {
      this._items.pop();
    }

    this._subject.next(this._items);
    return this._items;
  }

  replace(item: T) {
    if (this._items?.length) {
      this._items.pop();
    }

    this._items?.push(item);
    this._subject.next(this._items);
    return this._items;

  }

  clear() {
    this._items = [];
    this._subject.next(this._items);

    return this._items;
  }
}


export class ObservableObject<T> {
  private _item?: T;
  [key: string]: any;
  private _subject = new Subject<T | undefined>();

  changes = this._subject.asObservable();

  get(): T | undefined {
    return this._item;
  }

  set(item?: T): T | undefined {
    if (typeof item === 'object' && item !== null) {
      Object.assign(this, item);
    } else {
      this._item = item;
    }

    this._item = item;
    this._subject.next(this._item);
    return this._item;
  }

  public subscribe(fn: (page: any) => any) {
    return this.changes.subscribe(fn);
  }

  public unsubscribe() {
    return this._subject.unsubscribe();
  }

  clear() {
    this._item = undefined;
    this._subject.next(this._item);
    return this._item;
  }
}
