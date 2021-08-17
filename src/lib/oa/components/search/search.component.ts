import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ContextService } from '../../core/services/context.service';
import { SearchOptions } from '../../core/models/search.options';
import { Action } from '../../core/models/action.model';
import { FieldEditorModel } from '../../core/models';
import { UxService } from '../../core/services/ux.service';
import { DataService } from '../../core/services/data.service';
import { FieldModel } from '../../core/models/field.model';

@Component({
  selector: 'oa-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  view: 'card' | 'bar' | 'column' | 'text' = 'bar';

  @Input()
  class?: string;

  @Input()
  style?: any;

  @Input()
  options: SearchOptions | any;

  @Input()
  count: any;

  @Input()
  value: any;

  searchClick = true;
  searchText = '';
  isEditing = false;

  params: FieldModel[] = [];
  dropDown: FieldModel[] = [];

  triggers: any = {};

  sorts: any[] = [];

  selectedSort: any;

  tabs: any[] = [];

  type: 'filters' | 'tabbed' | 'full-text' = 'filters';

  @ViewChild('inputContainer')
  inputContainer?: ElementRef;

  @Output()
  editing: EventEmitter<boolean> = new EventEmitter();

  @Output()
  changed: EventEmitter<any> = new EventEmitter();

  @Output()
  sorted: EventEmitter<any> = new EventEmitter();

  @Output()
  visible: EventEmitter<boolean> = new EventEmitter();

  searchTextChanged = new Subject<string>();

  ddlPosition = 'down';

  ddlWidth = '0px';
  selectedTab: any;

  clear = new Action({
    code: 'clear',
    event: () => {
      this.resetSearch();
    }
  });

  timer: any;

  subscription: Subscription;

  isShowSearchBar?: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public auth: ContextService,
    private http: HttpClient,
    private uxService: UxService,
  ) {
    let a = 0;
    let recall: string | boolean = true;
    this.subscription = this.route.queryParams.subscribe((query: any) => {
      a = a === 0 ? 1 : 2;
      if (query.recall) {
        recall = query.recall ? query.recall : true
      }
      if (query['fetch'] === 'false') {
        return;
      } else if (a === 1 && (recall === "true" || recall === true)) {
        for (const key in query) {
          this.params.push(new FieldEditorModel({ key, value: query[key] }));
        }
        this.searchByParams();
      } else if (query['search'] && this.searchText !== query['search']) {
        this.searchText = query['search'];
        this.timer = setTimeout(() => this.searchByText(this.searchText));
      } else {
        this.timer = setTimeout(() => this.searchByQuery(query));
      }
    });

    this.auth.showSearch.changes.subscribe((isShow) => {
      this.isShowSearchBar = isShow;
    })
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.value) {
      this.searchByQuery(this.value);
    }
  }

  ngOnInit() {
    this.auth.search.changes.subscribe((options) => {
      this.options = options;
      if (this.options && this.options.params && this.options.params.length > 0) {
        this.visible.emit(true);
      } else {
        this.visible.emit(false);
      }
      this.init();
    });



    this.uxService.onTabSelect.subscribe((selected: any) => {
      const selectedParamKey = Object.keys(selected)[0];
      this.params.forEach(param => {
        if (param.key === selectedParamKey) {
          param.value = selected[selectedParamKey]
        }
      })
      this.searchByParams();
    })

    this.searchTextChanged.pipe(debounceTime(1000)).subscribe((data) => {
      if (this.view === 'bar' && data !== 'report') {
        this.searchByParams()
      } else {
        this.onSearchReports();
      }
    })

    if (this.view !== 'bar') {
      this.init();
    }

  }

  init() {
    this.options = new SearchOptions(this.options);
    this.options.params = (this.options.params).filter((i: any) => this.auth.hasPermission(i.permissions));
    this.sorts = this.options.sorts;
    this.selectedSort = this.sorts.find((s) => s.isSelected);
    this.type = this.options.view;

    this.triggers = {};
    this.options.params.forEach((p: any) => {
      p.placeholder = p.label
      p.showLabel = false;
      p.config = p.config || {};
      p.config.class = this.view === 'bar' ? 'search-input' : ''

      if (p.config && p.config.trigger) {
        this.triggers[p.config.trigger] = p;
      }
    });

    this.renderFilters();

    // const tabParam = this.options.tabs || this.options.params.find((p: any) => p.control === 'tabs');
    // if (tabParam) {
    //   if (tabParam?.config?.stats && this.view !== 'bar') {
    //     if (tabParam.config.stats.value) {
    //       this.getTabs(tabParam, tabParam.config.stats.value);
    //     } else {
    //       this.getTabStats(tabParam).subscribe((stats) => {
    //         this.getTabs(tabParam, stats);
    //       });
    //     }
    //   } else if (tabParam?.config?.url) {
    //     this.getTabs(tabParam);
    //   } else if (tabParam?.config?.tabs || tabParam?.config?.items || tabParam?.config?.options || tabParam?.options) {
    //     this.tabs = tabParam.config.tabs || tabParam.config.items || tabParam.config.options || tabParam.options;
    //     if (this.timer) {
    //       clearTimeout(this.timer);
    //     }
    //     if (this.tabs.length) {
    //       this.onSelectedTab(this.tabs[0]);
    //     }
    //   }
    // }
  }

  onSelectedTab(tab: any) {

    const initializing = !this.selectedTab && !tab.value;

    if (!initializing) {
      this.resetSearch();
    }

    this.renderFilters();
    this.selectedTab = tab;
    const param = this.params.find((p) => p.key === this.selectedTab.key);
    if (param) {
      param.value = tab.value;
    }

    // if (this.params && this.params.length) {
    //   let param = this.params.find((param) => param.key === this.selectedTab.key);
    //   if (param) {
    //     let index = this.params.indexOf(param);
    //     this.params[index] = this.selectedTab
    //   } else {
    //     this.params.push(this.selectedTab)
    //   }
    // } else {
    //   this.params.push(this.selectedTab)
    // }

    if (!initializing && this.view === 'card') {
      this.searchByParams();
    }
  }

  getTabs(param: any) {
    if (param.config.tabs) {
      this.tabs = [];
      // param.config.tabs.forEach((item: any) => {
      //   if (!stats) {
      //     this.tabs.push({
      //       label: item.name,
      //       key: param.key,
      //       value: item.code,
      //     });
      //   } else if (stats[item.code || item.statKey]) {
      //     this.tabs.push({
      //       label: item.name,
      //       key: param.key,
      //       value: item.code,
      //       stat: stats[item.code || item.statKey]
      //     });
      //   }
      // });

      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.onSelectedTab(this.tabs[0]);
      return
    }
    const api = new DataService().init(param.config.data?.src).search().then((page) => {
      this.tabs = [{
        label: 'All',
        key: param.key,
        value: '',
        stat: this.count
      }];
      // page.items.forEach((item) => {

      //   if (!stats) {
      //     this.tabs.push({
      //       label: item.name,
      //       key: param.key,
      //       value: item.code,
      //     });
      //   } else if (stats[item.code]) {
      //     this.tabs.push({
      //       label: item.name,
      //       key: param.key,
      //       value: item.code,
      //       stat: stats[item.code]
      //     });
      //   }

      // });
      if (this.tabs && this.tabs.length) {
        if (this.timer) {
          clearTimeout(this.timer);
        }
        this.onSelectedTab(this.tabs[0]);
      }
    });
  }

  getTabStats(param: any) {
    const subject = new Subject<any>();

    const api = new DataService().init({
      service: 'insight',
      collection: 'reportMasters'
    });
    const pageOptions: any = {};
    pageOptions.path = `${param.config.stats.code}/data`;
    if (param.config.stats.options) {
      if (param.config.stats.options.assignee === 'my') {
        param.config.stats.options.assignee = this.auth.currentUser()?.email;
      }
    }
    api.search(param.config.stats.options, pageOptions).then((page) => {
      if (page?.items?.length) {
        subject.next(page.items[0]);
      } else {
        subject.next({});
      }
    });
    return subject.asObservable();
  }

  setAdvanceSearch() {
    this.getInputDetail();
    this.dropDown = [];
    this.params = [];
    this.options.params.forEach((param: any) => {
      if (param.control !== 'tabs') {
        if (param.group === 'advance' || this.params.length > (this.view !== 'bar' ? 2 : 4)) {
          this.dropDown.push(new FieldEditorModel(param));
        } else {
          if (!this.params.find(p => p.key === param.key)) {
            this.params.push(new FieldEditorModel(param));
          }
        }
      } else {
        if (!this.params.find(p => p.key === param.key)) {
          this.params.push(new FieldEditorModel(param));
        }
      }
    });

    if (this.view === 'bar' && this.dropDown.length) {
      this.pushMoreFilter();
    }

  }

  onFilterSelect(param: FieldEditorModel) {
    const index = this.dropDown.indexOf(param);
    this.dropDown.splice(index, 1);
    this.params.splice(this.params.length - 1, 0, param);
  }

  pushMoreFilter() {
    this.params.push(new FieldEditorModel({
      control: 'selectFilter',
      key: "more",
      label: "More filters",
      options: this.dropDown
    }));
  }

  onMoreFilters() {

    // const dialogRef = this.dialog.open(FiltersDialogComponent, {
    //   width: '50%',
    //   height: '477px'
    // })

    // const selectedParams = this.params.filter((param) => {
    //   if (param.control !== 'tabs') {
    //     if (param.key !== 'more') {
    //       return param;
    //     }
    //   }
    // });

    // dialogRef.componentInstance.availableFilters = JSON.parse(JSON.stringify(this.dropDown));
    // dialogRef.componentInstance.selectedFilters = selectedParams;

    // dialogRef.afterClosed().subscribe((data) => {
    //   if (data) {
    //     this.params = data.selectedFilters;
    //     this.dropDown = data.availableFilters;
    //     this.pushMoreFilter();
    //   }
    // })

  }

  onFieldChange(param: FieldEditorModel) {
    let value = param.value;

    if (value.value) {
      value = value.value;
    }

    switch (param.control) {
      case 'input':
      case 'inputNumber':
      case 'search-input':
      case 'rangeNumber':
        this.searchTextChanged.next(value);
        break;
      case 'text-input':
        this.searchTextChanged.next('report');
        break;
      case 'select':
      case 'date-picker':
        this.onSearchReports()
        break;
      default:
        if (this.view === 'bar') {
          this.searchByParams()
        }
        break;
    }
  }

  // onAutoCompleteSelect(obj, param: FieldEditorModel) {
  //   if (obj) {
  //     let name;
  //     let code;
  //     if (obj.name) { name = obj.name; } else if (obj.profile && obj.profile.firstName) {
  //       name = `${obj.profile.firstName} ${obj.profile.lastName}`;
  //     }
  //     if (param.valueKey && obj[param.valueKey]) {
  //       code = obj[param.valueKey];
  //     } else {
  //       code = obj.code;
  //     }

  //     param.valueLabel = name;
  //     param.value = code;
  //   } else {
  //     param.value = null;
  //     param.valueLabel = null;
  //   }
  //   if (this.view === 'bar') {
  //     this.searchByParams()
  //   }
  // }

  onSelect(item: any, param: FieldEditorModel) {
    if (typeof item === 'string') {
      param.value = {
        label: item,
        value: item
      };
    } else {

      param.value = {
        label: item.label || item.value,
        value: item.value
      };
    }
    if (this.view === 'bar') {
      this.searchByParams()
    }
  }

  // onSelectValue(value, param: FieldEditorModel) {
  //   param.value = value;
  //   if (this.view === 'bar') {
  //     this.searchByParams()
  //   }
  // }

  // onSelectDate(date, param: FieldEditorModel, type?: string) {
  //   if (type === 'from') {
  //     param.range.from.value = date;
  //     param.range.from.valueLabel = moment(date).format('DD-MM-YYYY');
  //   } else if (type === 'till') {
  //     param.range.till.value = date;
  //     param.range.till.valueLabel = moment(date).format('DD-MM-YYYY');
  //   } else {
  //     param.value = date;
  //     param.valueLabel = moment(date).format('DD-MM-YYYY');
  //   }
  //   if (this.view === 'bar') {
  //     this.searchByParams()
  //   }
  // }

  // onSelectDropDown(event: MatSelectChange, param: FieldEditorModel) {
  //   param.value = (typeof event.value === 'object') ? event.value.value : event.value;
  //   if (this.view === 'bar') {
  //     this.searchByParams()
  //   }
  // }

  // onInputKeyUp(event: KeyboardEvent, param: FieldEditorModel) {
  //   param.value = event.target['value'];
  //   this.searchTextChanged.next(event.target['value']);
  // }

  // onRangeChange(event: KeyboardEvent, param: FieldEditorModel, key: 'from' | 'till') {
  //   param.range[key].value = event.target['value'];
  //   this.searchTextChanged.next(event.target['value']);
  // }

  addToParam(param: FieldEditorModel) {
    if (param) {
      if (!this.params.find((p) => p.key === param.key)) {
        this.params.push(param);
      }
    }
  }

  onSort(item: any) {
    this.selectedSort = item;
    const sort: any = {};
    sort[item.code] = this.selectedSort.value || item.value;
    this.sorted.emit(sort);
  }

  getInputDetail() {
    setTimeout(() => {
      if (this.inputContainer) {
        const bounds = this.inputContainer.nativeElement.getBoundingClientRect();
        this.ddlWidth = bounds.width;
        this.ddlPosition = bounds.top / window.innerHeight > .5 ? 'up' : 'down';
      }
      // else {
      //   this.getInputDetail();
      // }
    });
  }

  onRemoveParam(param: any) {
    this.params = this.params.filter((p) => p.key !== param.key);
    this.searchByParams();
  }

  searchByParams() {
    const obj: any = {};
    this.params.forEach((param) => {
      if (param.value === undefined) {
        return;
      }
      if (param.type === 'range') {
        obj[`${param.key}-from`] = param.value.from;
        obj[`${param.key}-till`] = param.value.till;
        return;
      }

      let value = param.value

      if (typeof value === 'object') {
        value = value.value;
      }

      if (value === undefined) { return; }
      if (param.key) {
        obj[param.key] = typeof value === 'string' ? value.trim() : value;
      }

    });
    this.changed.emit(obj);
    this.uxService.onSearch.emit(obj);
    this.finishEditing();
  }

  resetSearch() {
    this.searchText = '';
    this.params = [];
    this.dropDown = [];
    if (this.route.snapshot.queryParams && this.route.snapshot.queryParams['text']) {
      this.route.snapshot.queryParams = { ...this.route.snapshot.queryParams, text: null };
    }
    const query: Params = Object.assign({}, this.route.snapshot.queryParams);
    // this.options.params.forEach((p) => {
    //   if (query[p.key]) {
    //     delete query[p.key];
    //   }
    // });

    this.router.navigate([], { queryParams: query });
    this.changed.emit(query);
    this.finishEditing();
  }

  renderFilters() {
    this.isEditing = true;
    this.editing.emit(this.isEditing);
    this.searchText = '';
    for (const p of this.params) {
      if (!p.value) {
        continue;
      }

      const renderValue = (i: any) => {
        this.searchText = `${this.searchText}${p.key}:  ${i.label ? i.label : i.value}, `;
      }

      const item = p.value

      if (item.from || item.till) {
        if (item.from) {
          renderValue(item.from);
        }
        if (item.till) {
          renderValue(item.till);
        }
      } else {
        renderValue(item);
      }
    }

    // if (this.searchText) {
    //   this.searchText = this.searchText.substring(0, this.searchText.length - 2);
    // }
    this.setAdvanceSearch();
  }

  finishEditing() {
    this.isEditing = false;
    this.editing.emit(this.isEditing);
  }

  searchByText($event: any) {
    const text: string = typeof $event === 'string' ? $event : $event.target.value;
    if (!text) {
      return this.resetSearch();
    }
    this.params = [];
    const query: Params = Object.assign({}, this.route.snapshot.queryParams);
    this.options.params.forEach((p: any) => {
      if (query[p.key]) {
        delete query[p.key];
      }
    });

    const triggers = Object.getOwnPropertyNames(this.triggers);

    for (let p of text.split(',')) {

      p = p.trim();

      const trigger = triggers.find((t) => p.startsWith(t));

      let param;
      let key: any;
      let value;

      if (trigger) {
        param = this.triggers[trigger];
        key = param.key;
        value = p.substring(trigger.length);

      } else {
        const parts = p.split(':');
        key = parts.length === 1 ? 'text' : parts[0].trim().toLowerCase();
        if (!key) {
          return;
        }

        param = this.options.params.find((o: any) => o.key.toLowerCase() === key);

        if (!param) {
          param = new FieldEditorModel({ key: key });
        }

        value = parts.length === 1 ? parts[0].trim() : parts[1].trim();
      }

      if (value) {

        if (param.config && param.config.op === 'like') {
          value = `like:${value}`;
        }

        param.value = value;
        this.params.push(param);
        query[key] = value;
      } else {
        delete query[key];
      }
    }

    this.router.navigate([], { queryParams: query });
    this.changed.emit(query);
    this.uxService.onSearch.emit(query);
    this.finishEditing();
  }

  searchByQuery(query: any) {
    this.params = [];
    if (query) {
      Object.keys(query).forEach((q) => {
        if (!this.options || !this.options.params.find((p: any) => p.key === query[q])) {
          this.params.push(new FieldEditorModel({ key: q, label: q, value: query[q] }));
        }
      });
    }

    this.changed.emit(query);
    this.uxService.onSearch.emit(query);
  }

  onResetFilters() {
    const url = this.router.url;
    this.setAdvanceSearch();
    if (url.startsWith('/reports')) {
      this.onSearchReports();
    } else {
      this.searchByParams();
    }
  }

  // onSelectReportSelector(event: MatSelectChange, param: FieldEditorModel) {
  //   param.value = event.value;
  //   if (param.value) {
  //     let option = param.config.options.filter((op: any) => op.value === param.value);
  //     param.valueLabel = option[0].label;
  //   }
  //   this.onSearchReports();
  // }

  // onReportsInputKeyUp(event: KeyboardEvent, param: FieldEditorModel) {
  //   param.value = event.target['value'];
  //   param.valueLabel = param.value;
  //   this.searchTextChanged.next('report');
  // }

  // onReportSelectDate(event: string | Date, param: FieldEditorModel) {
  //   param.value = event;
  //   param.valueLabel = moment(event).format('DD-MM-YYYY');
  //   this.onSearchReports()
  // }

  onSearchReports() {
    const hasValues = this.params.filter(param => param.value && param.value.label)
    this.uxService.onSearch.emit(hasValues);
  }

}
