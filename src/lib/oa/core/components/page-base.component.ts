import { AfterViewInit, ChangeDetectorRef, Component, OnChanges, OnDestroy, OnInit, SimpleChanges, TemplateRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Entity, Link, Logger } from '../models';
import { StorageService } from '../services';
import { ContextService } from '../services/context.service';
import { UxService } from '../services/ux.service';
import { ConstantService } from '../services/constant.service';
import { NavService } from '../services/nav.service';

@Component({
  template: ''
})
export abstract class PageBaseComponent implements OnInit, OnDestroy {

  private _ux: UxService = inject(UxService);
  private constant: ConstantService = inject(ConstantService);
  private navService: NavService = inject(NavService);
  private context: ContextService = inject(ContextService);
  private _route: ActivatedRoute = inject(ActivatedRoute);
  private storage: StorageService = inject(StorageService);

  isCurrent = true;
  isInitialized = false;
  path?: string;
  page?: Link;
  layout?: any;
  footer?: any;
  components: any = [];
  templates: any = {};

  // entity?: Entity;
  showFilters?: boolean;
  filters?: any[] = [];
  view: any;

  // data: any = {};
  private _logger = new Logger(PageBaseComponent);

  isShow?: boolean;
  topPosToStartShowing = 100;

  abstract setContext(items: any[]): any[] | void;

  constructor() { }
  ngOnInit(): void {
    this.path = this.navService.getPath(this._route.snapshot);
    this.page = this.navService.getByPath(this.path);

    const current = this.context.page.get()
    this.isCurrent = current?.code === this.page?.code;
    this.isInitialized = false;

    this.context.page.changes.subscribe(p => {
      this.isCurrent = p?.code === this.page?.code;
      this.isInitialized = false;
      if (this.isCurrent) {
        this._logger.debug(`for page change`)
        this._init()
      }
    })

    if (this.isCurrent) {
      this._logger.debug(`for ng Init`)

      this._init()
    }
  }

  params = (key: string, value?: any) => {
    if (!value) {
      return this.page?.params?.get ? this.page.params?.get(key) : this.storage.components(this.page?.code || 'default').get(key)
    }

    this.storage.components(this.page?.code || 'default').set(key, value)
  }

  private _init = () => {

    this.context.isProcessing.set(true);

    const entity = this.params('entity');
    if (entity) {
      if (entity.code && entity.code.startsWith(':')) {
        entity.code = this.params(entity.code.substring(1));
      }

      this.setEntity(entity);
    }

    this.view = this.params('view')
    this.showFilters = this.params('show.filters')

    this._setLayout();
    this._setContext();
    this._setFitlers();
    this.isInitialized = true;

    this.context.isProcessing.set(false);

  }

  /**
   * fetches actions from meta and tries to render it. It takes array of one of the following type
   * array of string
   * ["add", "close"]
   *
   * or full object meta
   * [{
   *    "code": "reset",
   *    "label": "Reset"
   *    "permissions": [
   *      "system.manage"
   *    ]
   * }]
   *
   */

  private _setContext() {
    const mapToObject = (i: any) => {
      return typeof i === 'string' ? {
        code: i
      } : i;
    };

    let items = (this.context.getPageMeta('actions') || [])
      .map((i: any) => {
        i = mapToObject(i);

        const children = (i.config?.items || i.items || i.options || []).map((c: any) => mapToObject(c));
        if (children.length) {
          i.options = children;
        }

        return i;
      })
    if (this.setContext) {
      const value = this.setContext(items);
      if (value) {
        items = value;
      }
    }

    items.forEach((item: any) => {
      switch (item.code) {
        case 'filters':
          item.event = () => {
            this.params('show.filters', this.showFilters = !this.showFilters);
          }
          break;

        case 'help':
          item.value = item.value || item.helpCode || `root|help|${this.page?.code?.replace('.', '|')}`;
          break;

        case 'list':
          item.event = () => { this.params('view', this.view = 'list') };
          break;

        case 'grid':
          item.event = () => { this.params('view', this.view = 'grid') };
          break;

        case 'table':
          item.event = () => { this.params('view', this.view = 'table') };
          break;
      }
    });

    // this.actions = items.map((a: any) => new Action(a));
    this.context.actions.set(items);
  }

  private _setFitlers() {
    this.filters = (this.page?.meta?.filters || this.page?.meta?.search || [])
    this.context.search.set(this.filters);
  }

  private _setLayout() {
    const log = this._logger.get("_setLayout");
    this.layout = this.context.getPageMeta('layout');
    this.footer = this.context.getPageMeta('footer')
    const components = this.context.getPageMeta('components');

    let items = [];
    if (!Array.isArray(components)) {
      for (const c in components) {
        if (Object.prototype.hasOwnProperty.call(components, c)) {
          const item = components[c];
          item.code = c
          items.push(item);
        }
      }
    } else {
      items = components;
    }

    this.components = items.filter((s: any) => this.context.hasPermission(s.permissions))
    this.layout.sections = this.layout.sections || this.layout.items || [];
    if (this.footer) {
      this.footer.layout.sections = this.footer.layout.sections || this.footer.components || [];
    }

    log.end(`layout sections: ${this.layout.sections.length}, components: ${this.components.length}`)
  }


  addTemplate(type: string, template?: TemplateRef<any>) {
    const log = this._logger.get("addTemplate");

    if (template) {
      this.templates[type.toLowerCase()] = template;
    } else {
      log.warn('template is undefined');
    }
    log.end();
  }

  setEntity(obj: any) {
    const entity = new Entity();

    if (typeof obj === 'string') {
      entity.code = obj;
      entity.id = obj;
    } else {
      entity.id = obj.id || entity.id;
      entity.code = obj.code || entity.code;
      entity.code = entity.code || `${entity.id}`;
      entity.id = entity.id || entity.code;
      entity.type = obj.type || entity.type;
      entity.name = obj.name || entity.name;
    }

    this.context.entity.set(entity);
  }

  ngOnDestroy(): void {
    this._ux.reset();
    this.page = undefined;
  }
}
