import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { SearchOptions } from '../../core/models/search.options';
import { ContextService } from '../../core/services/context.service';
import { UxService } from '../../core/services/ux.service';
import { FieldModel } from '../../core/models/field.model';
import { DataService } from '../../core/services/data.service';


@Component({
  selector: 'oa-tabs-search',
  templateUrl: './tabs-search.component.html',
  styleUrls: ['./tabs-search.component.css']
})
export class TabsSearchComponent implements OnInit, OnChanges {

  tabs: any[] = [];

  @Input()
  options: any;

  param?: FieldModel;

  timer: any;

  count: any;

  constructor(
    private http: HttpClient,
    public auth: ContextService,
    private uxService: UxService
  ) { }

  ngOnInit(): void {
    this.filterTabs();
  }

  ngOnChanges() {
    this.filterTabs();
  }

  filterTabs() {
    this.options = new SearchOptions(this.options);
    this.param = this.options.params.find((p: any) => p.control === 'tabs');
    this.tabs = this.param?.config?.tabs;
    if (this.param?.config?.stats) {
      if (this.param.config.stats.value) {
        this.getTabs(this.param, this.param.config.stats.value);
      } else {
        this.getTabStats(this.param).subscribe((stats) => {
          this.getTabs(this.param, stats);
        });
      }
    } else if (this.param?.config?.url) {
      this.getTabs(this.param);
    } else if (this.param?.config?.tabs || this.param?.config?.items || this.param?.config?.options) {
      this.tabs = this.param.config.tabs || this.param.config.items || this.param.config.options;
      if (this.timer) {
        clearTimeout(this.timer);
      }
      if (this.tabs.length) {
        if (this.param.value) {
          this.onSelectValue(this.param.value);
        } else {
          this.onSelectValue(this.tabs[0].value);
        }
      }
    }
  }

  getTabs(param?: FieldModel, stats?: any) {
    if (param?.config.tabs) {
      this.tabs = [];
      param.config.tabs.forEach((item: any) => {
        if (!stats) {
          this.tabs.push({
            label: item.name || item.label,
            key: param.key,
            value: item.code || item.value,
          });
        } else if (stats[item.code || item.statKey || item.value]) {
          this.tabs.push({
            label: item.name || item.label,
            key: param.key,
            value: item.code || item.value,
            stat: stats[item.code || item.statKey || item.value]
          });
        }
      });

      if (this.timer) {
        clearTimeout(this.timer);
      }
      // this.onSelectValue(this.tabs[0]?.value);
      return
    }
    new DataService().init(param?.config.data.src).search().then((page: any) => {
      this.tabs = [{
        label: 'All',
        key: param?.key,
        value: '',
        stat: this.count
      }];
      page?.items.forEach((item: any) => {
        if (!stats) {
          this.tabs.push({
            label: item.name,
            key: param?.key,
            value: item.code,
          });
        } else if (stats[item.code]) {
          this.tabs.push({
            label: item.name,
            key: param?.key,
            value: item.code,
            stat: stats[item.code]
          });
        }

      });
      if (this.tabs && this.tabs.length) {
        if (this.timer) {
          clearTimeout(this.timer);
        }
        // this.onSelectValue(this.tabs[0]?.value);
      }
    });
  }

  getTabStats(param: FieldModel) {
    const subject = new Subject<any>();
    const pageOptions = {
      path: `${param.config.stats.code}/data`
    };

    if (param.config.stats.options) {
      if (param.config.stats.options.assignee === 'my') {
        param.config.stats.options.assignee = this.auth.currentUser()?.email;
      }
    }
    new DataService().init(param.config.data.src || {
      service: 'insight',
      collection: 'reportTypes',
    }).search(param.config.stats.options, pageOptions).then((page: any) => {
      if (page.items && page.items.length) {
        subject.next(page.items[0]);
      } else {
        subject.next({});
      }
    });
    return subject.asObservable();
  }

  onSelectValue(event: string) {
    if (!this.param?.key) {
      return;
    }
    this.param.value = event;
    const query: any = {};
    query[this.param.key] = event;
    this.uxService.onTabSelect.emit(query);
  }
}
