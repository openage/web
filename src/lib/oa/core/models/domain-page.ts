import { Subject } from "rxjs";
import { DataService } from "../services/data.service";


export class DomainPage {
  public items: any[] = [];
  public total = 0;
  public limit = 10;
  public skip = 0;
  public index = 0;

  public count = 0;

  public query: any = {};
  public sort: any = {};


  private _subject = new Subject<any>();
  public _changes = this._subject.asObservable();

  private _options: any;
  private _dataService?: DataService;

  constructor(data?: any, options?: any, dataService?: DataService) {
    options = options || {};
    this._options = options.config || {};
    this._dataService = dataService;

    this.query = options.query || {};
    const page = options.page || {}

    this.limit = page.limit || page.pageSize || 10;
    this.skip = page.skip || page.offset || 0;
    this.sort = page.sort
    this.index = Math.floor(this.skip / this.limit);
    this._set(data)
  }

  private _set = (page: any) => {
    this.items = page?.items || [];
    this.total = page?.total || this.items.length;
    this.limit = page?.limit || page?.pageSize || this.items.length;

    if (page?.pageNo !== undefined || page?.index !== undefined) {
      this.index = page?.index !== undefined ? page?.index : page?.pageNo - 1;
      this.skip = this.index * this.limit;
    } else if (page?.skip !== undefined || page?.offset !== undefined) {
      this.skip = page?.skip || page?.offset || 0;
      this.index = Math.floor(this.skip / this.limit);
    }

    this.count = Math.ceil(this.total / this.limit);
    this._subject.next(this);
  }

  public refresh = async () => {
    if (this._dataService) {
      const data = await this._dataService.search(this.query, {
        page: {
          skip: this.skip,
          limit: this.limit,
          sort: this.sort
        },
        config: this._options
      });
      this._set(data)
    }

    return this;
  };
  public add = async () => {
    if (this._dataService) {
      const data = await this._dataService.create(this.query, {
        page: {
          skip: this.skip,
          limit: this.limit,
          sort: this.sort
        },
        config: this._options
      });
      this._set(data)
    }

    return this;
  };
  public subscribe(fn: (page: any) => any) {
    return this._changes.subscribe(fn);
  }

  public goto = async (index: number) => {
    if (index < 0) {
      this.index = 0;
    } else if (index > this.count - 1) {
      this.index = this.count - 1;
    } else {
      this.index = index;
    }

    this.skip = this.index * this.limit;
    await this.refresh();
  };

  public previous = async () => {
    this.goto(this.index - 1)
  };

  public next = async () => {
    this.goto(this.index + 1)
  };
}
