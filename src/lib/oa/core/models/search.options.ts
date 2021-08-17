
export class SearchOptions {

  view?: any;
  // tabs?: ReportParam;
  // params?: ReportParam[];
  sorts?: any[];

  constructor(obj?: any) {
    obj = obj || {};

    this.view = obj.view || 'filters';
    this.sorts = obj.sorts || [];
    // this.params = obj.params || [];
    // this.tabs = obj.tabs;
  }
}
