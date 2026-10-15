/* eslint-disable no-constant-condition */
/* eslint-disable no-prototype-builtins */
import { ChangeDetectorRef, Component, effect, EventEmitter, inject, Injector, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { FieldEditorModel } from '../../core/models/field-editor.model';
import { Action } from '../../core/models/action.model';
import { ActionComponent } from "../action/action.component";
import { FieldEditorComponent } from '../../components/field-editor/field-editor.component';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from "../icon/icon.component";
import moment from 'moment';
import { ContextService } from '../../core/services/context.service';
import { Logger } from '../../core/models';
import { TransformService } from '../../core/services/transform.service';
import { StringService } from '../../core/services';
import { DomSanitizer } from '@angular/platform-browser';
import { ContentService } from '../../core/services/content.service';
import { NavService } from '../../core/services/nav.service';
import { ConstantService } from '../../core/services/constant.service';

@Component({
  selector: 'oa-list, oa-table',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  imports: [
    ActionComponent,
    FieldEditorComponent,
    CommonModule,
    FormsModule,
    IconComponent
    // PaginatorComponent,
    // PaginationControlsComponent
  ]
})
export class ListComponent implements OnInit {

  @Input()
  class?: string;

  @Input()
  style: any;

  @Input()
  indexTemplate?: TemplateRef<any>;

  @Input()
  headerTemplate?: TemplateRef<any>;

  @Input()
  rowTemplate?: TemplateRef<any>;

  @Input()
  detailsTemplate?: TemplateRef<any>;

  @Input()
  footerTemplate?: TemplateRef<any>;

  @Input()
  cellTemplate?: TemplateRef<any>;

  @Input()
  actionTemplate?: TemplateRef<any>;

  @Input()
  editorTemplate?: TemplateRef<any>;

  @Input()
  options: any = {};

  // currentPage: number = 1;
  // pageSize: number = 10;

  @Input()
  value: any;

  @Input()
  actions: any = {}  // {} || []

  @Input()
  stats: any = {};

  @Input()
  view: 'form' | 'table' | 'grid' | 'week' = 'table'

  @Output()
  changed: EventEmitter<any> = new EventEmitter();

  @Output()
  edited: EventEmitter<any> = new EventEmitter();

  @Input()
  edit!: (any: any) => any;

  @Output()
  saved: EventEmitter<any> = new EventEmitter();

  @Input()
  save!: (any: any) => any;

  @Output()
  canceled: EventEmitter<any> = new EventEmitter();

  @Input()
  cancel!: (any: any) => any;

  @Output()
  removed: EventEmitter<any> = new EventEmitter();

  @Input()
  remove!: (any: any, number: number) => any;

  @Output()
  selected: EventEmitter<any> = new EventEmitter();


  errors: any = {};
  isFormSubmit: boolean = false;

  rows: any[] = [];
  cols: any[] = [];
  isLoading = false;
  skeletonContent?: string;
  listContent?: string;
  listTemplate?: string;

  initialized = false;
  logger = new Logger(ListComponent);

  context = inject(ContextService);
  router = inject(Router);
  location = inject(Location);
  transform = inject(TransformService);
  strings = inject(StringService);
  content = inject(ContentService);
  nav = inject(NavService);
  constants = inject(ConstantService);
  private changeDetector = inject(ChangeDetectorRef);
  private injector = inject(Injector);
  private isTemplateLoading = false;
  private isDataLoading = false;
  isCustomTemplateLoaded = false;
  private resolvedValue?: any;

  constructor() { }

  ngOnInit(): void {

    this.options = this.options || {};
    this.style = this.options?.style || {};
    this.createActions();
    const templateCode = this.options?.template?.code;
    if (templateCode) {
      void this.loadTemplate(templateCode);
      void this.loadSkeleton(templateCode);
    }

    if (typeof this.value === 'string') {
      const key = this.value;
      const value = this.context.data().get(key);
      if (value) {
        this.setResolvedValue(value);
      } else {
        this.isDataLoading = true;
        this.updateLoadingState();
      }
      effect(() => {
        const resolvedValue = this.context.data().get(key);
        if (resolvedValue) {
          this.setResolvedValue(resolvedValue);
        }
      }, { injector: this.injector });
    } else {
      this.setResolvedValue(this.value);
    }
  }

  private setResolvedValue(value: any, isStreamEmission = false): void {
    if (value === this.resolvedValue && !isStreamEmission) { return; }
    this.resolvedValue = value;

    if (value?.subscribe && !isStreamEmission) {
      this.isDataLoading = true;
      this.updateLoadingState();
      value.subscribe((resolvedValue: any) => {
        this.setResolvedValue(resolvedValue, true);
        this.changeDetector.markForCheck();
      });

      const hasResolvedPage = Array.isArray(value.items) &&
        (value.items.length > 0 || value.limit === 0 || value.count > 0);
      if (hasResolvedPage) {
        this.setResolvedValue(value, true);
        this.changeDetector.markForCheck();
      }
      return;
    }

    this.value = value;
    this.isDataLoading = false;
    this.init();
    this.initialized = true;
    this.updateLoadingState();
  }

  private async loadTemplate(code: string): Promise<void> {
    this.isTemplateLoading = true;
    this.updateLoadingState();

    try {
      const template = await this.constants.templates.get(code);

      if (!template) {
        throw new Error(`List template '${code}' is empty`);
      }

      this.listTemplate = template;
      this.isCustomTemplateLoaded = true;
      this.renderListTemplate();
    } catch (error) {
      this.logger.error('Failed to load list template', code, error);
    } finally {
      this.isTemplateLoading = false;
      this.updateLoadingState();
      this.changeDetector.markForCheck();
    }
  }

  private async loadSkeleton(code: string): Promise<void> {
    try {
      this.skeletonContent = await this.constants.templates.get(`${code}.skeleton`);
    } catch (error: any) {
      if (error?.status !== 404) {
        this.logger.error('Failed to load list template skeleton', code, error);
      }
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  private updateLoadingState(): void {
    this.isLoading = !!this.options?.template?.code && (this.isTemplateLoading || this.isDataLoading);
  }

  private renderListTemplate(): void {
    if (!this.listTemplate) { return; }

    try {
      this.listContent = this.content.inject(this.listTemplate, this.rows);
    } catch (error) {
      this.logger.error('Failed to render list template', error);
      this.isCustomTemplateLoaded = false;
    }
  }

  init() {

    if (!this.value || (!this.options?.fields?.length && !this.options?.template?.code && !this.isCustomTemplateLoaded)) {
      this.rows = [];
      this.renderListTemplate();
      return
    }

    const fields = this.options?.fields || [];
    this.cols = fields.filter((f: any) => f.key !== 'action')
    this.view = this.options.view || 'table';
    if (this.view === 'week') {
      const starDate = this.options.week.start
        ? moment(this.strings.inject(this.options.week.start, this.value))
        : moment();

      const weekStart = moment(starDate).startOf('week');
      for (let index = 0; index < 7; index++) {
        const field: any = {};
        const date = moment(weekStart).add(index, 'day')
        field.label = date.format('ddd');
        field.class = date.format('ddd');
        field.key = date.format('YYYY-MM-DD');
        this.cols.push(field);
      }
    }

    const actionCol = fields.find((f: any) => f.key === 'action')
    if (actionCol) {
      this.cols.push(actionCol);
    }

    this.value = this.value.items || this.value
    if (!Array.isArray(this.value)) {
      this.value = [this.value]
    }
    this.rows = this.transform.apply(this.value, this.options?.transforms);
    this.renderListTemplate();
  }

  select(item: any): void {
    this.value.forEach((i: any) => i.isSelected = false);
    (item as any).isSelected = true;
    this.selected.emit(item);
    // to add route /{selected route name} from the url
    if (this.options?.type && this.options?.type == 'detail') {
      this.enableEditMode(item)
    } else if (this.options?.entity) {
      this.nav.goto({
        type: this.options.entity.type,
        code: item.code,
        id: item.id
      });
    } else {
      const currentUrl = this.location.path();
      const newUrl = `${currentUrl}/${encodeURIComponent(item.code)}`;
      this.router.navigateByUrl(newUrl);
    }
  }

  enableEditMode(item: any) {
    item.isEditMode = true;
  }

  saveEdit(item: any) {
    item.isEditMode = false;
  }

  cancelEdit(item: any) {
    item.isEditMode = false;
  }
  // setRows() {
  //   this.rows = []

  //   this.value.forEach(item => {
  //     let rowItem = { item: item, columns: this.setField(this.options, item) }
  //     this.rows.push(rowItem)
  //   })
  // }

  // setField(options, row) {
  //   let columns = []
  //   options.fields.forEach(column => {
  //     let columnItem = column
  //     columnItem.value = column.key.split('.').reduce((obj, level) => obj && obj[level], row);
  //     // columnItem['isKeyExists'] = this.checkKeyExists(row, column.key)
  //     columns.push(columnItem)
  //   })

  //   return JSON.parse(JSON.stringify(columns))
  // }


  createActions() {
    const field = this.options?.fields?.find((f: { key: string; }) => f.key === 'action')
    if (!field) { return }

    // this.actions = this.actions || {};

    // if (Array.isArray(this.actions)) {
    //   const actions: any = {};
    //   this.actions.forEach(action => {
    //     if (typeof action === 'function') {
    //       actions[action.name] = {
    //         code: action.name,
    //         event: action
    //       }
    //     } else {
    //       actions[action.code] = action;
    //     }
    //   });
    //   this.actions = actions;
    // } else {
    //   for (const code in this.actions) {
    //     const action = this.actions[code];
    //     if (typeof action === 'function') {
    //       this.actions[code] = {
    //         code: code,
    //         event: action
    //       }
    //     }
    //   }
    // }

    const actions: Action[] = [];

    (field?.config?.actions || []).forEach((action: any) => {

      if (typeof action === 'string') {
        action = {
          code: action
        };
      }

      if (this.actions[action.code]) {
        action.event = this.actions[action.code].event;
      }

      switch (action.code) {
        case 'select':
          if (!action.event) {
            action.event = (i: any) => { this.onSelect(i); };
          }
          break;

        case 'edit':
          if (!action.event) {
            action.event = (i: any) => { this.onEdit(i); };
          }
          break;

        case 'save':
          if (!action.event) {
            action.event = (i: any) => { this.onSave(i); }
          }
          break;

        case 'cancel':
          if (!action.event) {
            action.event = (i: any) => { this.onCancel(i); }
          }
          break;

        case 'remove':
          if (!action.event) {
            action.event = (i: any) => { this.onRemove(i); }
          }
          break;
      }

      action.type = action.type || 'icon';
      action.style = action.style || (action.type === 'icon' ? 'subtle' : 'default');
      actions.push(new Action(action));
    });

    this.actions = actions.filter(i => this.context.hasPermission(i.permissions));
  }



  checkKeyExists(item: any, key: any) {
    let isExists = false;
    if (key.includes('.')) {
      const value = key.split('.').reduce((obj: any, level: any) => obj && obj[level], item)
      if (value === undefined) {
        isExists = false;
      } else {
        isExists = true;
      }
    } else {
      isExists = item.hasOwnProperty(key)
    }

    return isExists
  }

  resetError(ms = 5000) {
    setTimeout(() => {
      this.isFormSubmit = false;
      this.errors = {}
    }, ms)
  }

  onReset() {
    // this.init(this.options.columns);
    this.resetError(0);
  }

  setValue(obj: any, key: any, value: any, i = 0): any {
    if (typeof obj === 'object' && !obj.hasOwnProperty(key[i]) && (i < (key.length - 1))) {
      obj[key[i]] = {}
    }

    if (obj[key[i]] && typeof obj[key[i]] === 'object' && !Array.isArray(obj[key[i]])) {
      return this.setValue(obj[key[i]], key, value, i + 1)
    }

    obj[key[i]] = value
    return
  }

  setData(columns: any) {
    for (const column of columns) {
      if (typeof column.control === 'object') {
        this.setData(column.control.columns)
      } else {
        this.setValue(this.value, column.key.split('.'), column.value);
      }
    }
  }

  onSubmit(columns: any) {
    if (this.view === 'table' || this.view === 'grid') {
      this.changed.emit(this.value);
      return
    }

    this.isFormSubmit = true;
    setTimeout(() => {
      if (this.errors && Object.keys(this.errors).length && Object.values(this.errors).find(v => v !== undefined && v !== null && v !== '')) {
        this.resetError();
        return;
      }
      this.setData(columns)
      this.changed.emit(this.value);
    }, 0);
  }

  isEmpty(item: any) {
    item = item || {}
    if (!Object.values(item).find(v => v !== undefined || v !== null || v !== '')) {
      return true
    }
    return false
  }
  onSelect(item: any) {
    if (this.select) { this.select(item); }
  }

  onEdit(item: any) {
    item.isEditing = true;
    if (this.edit) { this.edit(item); }
    this.edited.emit(item)
  }

  onSave(item: any) {
    if (!this.isEmpty(item)) {
      item.isEditing = false;
      if (this.save) { this.save(item); }
      this.saved.emit(item);
    }
  }

  onCancel(item: any) {
    item.isEditing = false;
    if (this.cancel) { this.cancel(item); }
    this.canceled.emit(item);
  }

  onRemove(item: any) {
    item.isDeleted = true;
    const index = this.value.findIndex((i: any) => i.isDeleted);
    this.value.splice(index, 1);
    if (this.remove) { this.remove(item, index); }
    this.removed.emit(item);
  }

  getClass(field: FieldEditorModel, item: any) {
    let valueClass = field.style?.value?.class || this.style?.value?.class;

    if (!valueClass || typeof valueClass === 'string') {
      return valueClass || '';
    }

    const value = this.getValue(field, item);
    valueClass = valueClass.find((c: any) => {
      switch (c.operator) {
        case '>':
          return value > c.value || item[c.key1] > item[c.key2];
        case '>=':
          return value >= c.value || item[c.key1] >= item[c.key2];
        case '<':
          return value < c.value || item[c.key1] < item[c.key2];
        case '<=':
          return value <= c.value || item[c.key1] <= item[c.key2];

        case '===':
        case '==':
        case '=':
          return value === c.value || item[c.key1] === item[c.key2];

        case '!==':
        case '!=':
          return value !== c.value || item[c.key1] !== item[c.key2];
      }
      return
    })

    if (valueClass) {
      return valueClass.class;
    }

    return '';
  }

  getStyle(field: any, item: any) {

    let valueStyle = field.style?.value?.styles || field.style?.value?.style || this.style?.value?.style || {};

    if (!Array.isArray(valueStyle)) {
      return valueStyle;
    } else if (!valueStyle.length) {
      return {};
    }

    const value = this.getValue(field, item);

    valueStyle = valueStyle.find((c: any) => {
      switch (c.operator) {
        case '>':
          return value > c.value;
        case '>=':
          return value >= c.value;
        case '<':
          return value < c.value;
        case '<=':
          return value <= c.value;

        case '===':
        case '==':
        case '=':
          return value === c.value;

        case '!==':
        case '!=':
          return value !== c.value;
      }
      return
    });
    return valueStyle?.style || {};
  }

  getValue(field: FieldEditorModel, item: any): any {
    if (!field.key) return null;

    const keys = this.parseKeyPath(field.key);
    let value = this.getNestedValue(item, keys);

    if (value === undefined || value === null) {
      value = field?.value?.default;
    }

    return this.formatValue(field, value, item);
  }

  formatValue(field: any, value: any, item: any): any {
    if (!value) return value;
    return this.content.transform(value, field.format)
  }


  parseKeyPath(key: string): (string | number)[] {
    return key
      .replace(/\[(\d+)]/g, '.$1')
      .split('.')
      .map(segment => isNaN(Number(segment)) ? segment : Number(segment));
  }

  getNestedValue(obj: any, path: (string | number)[]): any {

    let current = obj;

    for (const key of path) {
      if (current == null || !current.hasOwnProperty(key)) {

        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  getLabel(field: FieldEditorModel): string | number {
    const label = field.label;

    return label!;
  }

  getSummary(field: any) {

    if (!field.summary) {
      return '';
    }

    if (field.summary.value) {
      return field.summary.value;
    }

    let value = this.stats[field.key];
    if (value) {
      return value;
    }

    const numOr0 = (n: any) => {
      if (isNaN(n)) return 0;

      if (typeof n === 'number') return n;

      return parseFloat(n);
    }

    switch (field.summary.type) {
      case 'sum':
        value = this.value.reduce((t: any, i: any) => t + numOr0(i[field.key]), 0);
        break;

      case 'min':
        value = Math.min(...this.value.map((i: any) => numOr0(i[field.key])));
        break;

      case 'max':
        value = Math.max(...this.value.map((i: any) => numOr0(i[field.key])));
        break;

      case 'average':
        value = this.value.reduce((t: any, i: any) => t + numOr0(i[field.key]), 0) / this.value.length;
        break;

      case 'count':
        value = this.value.length;
        break;
    }

    return value;
  }

  isCellClickable(field: FieldEditorModel) {
    return !!field?.config?.click;
  }
  onCellClick(field: any, item: any) {

    const config = field?.config?.click || field?.click || {};

    if (config.toggle === 'details') {
      item.isSelected = !item.isSelected;
      return;
    }

    // let click = field.click || {}
    // if (!(click.params || click.config)) {
    //   return;
    // }

    // const obj = this.params || {};

    // for (const param of (click.params || [])) {
    //   if (param.value) {
    //     obj[param.key] = param.value;
    //   } else if (param.field) {
    //     obj[param.key] = item[param.field] || this.params[param.field];
    //   }
    // }

    // this.selected.emit({
    //   dialog: click.dialog,
    //   routerLink: click.routerLink,
    //   params: obj,
    //   config: click.config
    // });
  }
}
