/* eslint-disable no-prototype-builtins */
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FieldEditorComponent } from '../../components/field-editor/field-editor.component';
import { TableEditorComponent } from '../table-editor/table-editor.component';
import { CommonModule } from '@angular/common';
import { FormOptions } from './form.options';
import { IconComponent } from "../icon/icon.component";
import { InputTextComponent } from "../input/input.component";
import { Logger } from '../../core/models';
import { ContextService } from '../../core/services/context.service';
import { FieldModel } from '../../core/models/field.model';
import { Action } from '../../core/models/action.model';
import { ActionComponent } from "../action/action.component";
import { UxService } from '../../core/services/ux.service';
import { DataService } from '../../core/services/data.service';



@Component({
  selector: 'oa-form',
  standalone: true,
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [
    FieldEditorComponent,
    TableEditorComponent,
    CommonModule,
    IconComponent,
    InputTextComponent,
    ActionComponent
  ]
})
export class FormComponent implements OnInit, OnChanges {

  @Input()
  value: any;

  @Input()
  options: any;

  @Output()
  valueChange: EventEmitter<any> = new EventEmitter();

  @Input()
  showReset: boolean = true;

  @Input()
  view: 'form' | 'table' = 'form'

  initialized = false;

  // @Output()
  // changed: EventEmitter<any> = new EventEmitter();

  // @Output()
  // save: EventEmitter<any> = new EventEmitter();

  // @Output()
  // delete: EventEmitter<any> = new EventEmitter();

  logger: Logger = new Logger('FormComponent');

  styles: any = {};
  content: any;

  // groups: any[] = [];
  fields: FieldModel[] = [];
  actions: Action[] = [];

  // initValue: any = {};

  errors: any = {};
  isFormSubmit: boolean = false;

  constructor(
    public context: ContextService,
    public dataService: DataService,
    private uxService: UxService
  ) { }

  ngOnInit(): void {

    const logger = this.logger.get('ngOnInit');
    this.styles = this.context.getPageMeta('styles') || {};

    this.options = this.options && this.options instanceof FormOptions ?
      this.options : new FormOptions(this.options);

    this.fields = this.options.fields;
    this.actions = this.options.actions;
    // this.initValue = JSON.parse(JSON.stringify(this.value));

    this.content = this.initSection({
      class: this.options.class || 'form',
      sections: this.options.sections
    });

    if (typeof this.value === 'string') {
      const value = this.context.data(this.value);

      if (value.subscribe) {
        value.subscribe((p: any) => {
          this.value = p;
          this.init(this.options.fields);
          this.initialized = true;
        })
      } else if (value) {
        this.value = value;
        this.init(this.options.fields)
        this.initialized = true;
      }
    } else {
      this.init(this.options.fields)
      this.initialized = true;
    }

    logger.end();

  }

  ngOnChanges(): void {
  }

  init(fields: any): void {
    if (!fields) {
      return;
    }
    for (const field of fields) {
      if (field.control === 'object') {
        this.init(field.fields)
      } else {
        field.value = this._getValue(this.value, field.key, field.defaultValue);
      }
    }
  }

  initSection(section: any) {
    const log = this.logger.get('initSection');
    section.style = this.getStyle(section);
    section.container = this.getContainer(section);


    const fields = section.fields || [];
    // fields.push(...this.fields.filter((c: any) => c.group?.toLowerCase() === section.code?.toLowerCase()));
    fields.push(...this.fields.filter((c: any) => c.section?.toLowerCase() === section.code?.toLowerCase() || c.value?.toLowerCase()));


    log.silly(`fields count: ${fields.length}`)
    section.fields = [];

    fields.forEach((i: any) => {
      const field = this.initField(i);
      section.fields.push(...(Array.isArray(field) ? field : [field]));
    })

    const actions = section.actions || [];
    actions.push(...this.actions.filter(c => c.group?.toLowerCase() === section.code?.toLowerCase()));

    log.silly(`actions count: ${actions.length}`)
    section.actions = [];

    actions.forEach((i: any) => {
      const field = this.initAction(i);
      section.actions.push(...(Array.isArray(field) ? field : [field]));
    })

    let sections = (section.sections || section.items || section.divs || []);
    if (!Array.isArray(sections)) {
      sections = [sections];
    }
    section.sections = sections.map((i: any) => {
      const s = this.initSection(i);
      // s.parent = section;
      return s;
    })

    return section;
  }

  initField(field: any) {
    const log = this.logger.get('initField');
    field.style = this.getStyle(field);
    return field;
  }

  initAction(action: any) {
    switch (action.code) {
      case 'reset':
        action.event = () => {
          this.value = this.value.reset();
          this.content = this.initSection({
            class: this.options.class || 'form',
            sections: this.options.sections
          });
        }
        break;
      case 'submit':
        action.event = () => {
          const target = action.config.target;
          switch (target.method) {
            case 'create':
              this.dataService.create(this.value, action.config.target).then((r) => {
                alert("success")
              });
              break;
          }
        }
        break;
    }

    return action;
  }

  getStyle(item: any) {
    let style = item.style || item.code;

    if (typeof style === 'string') {
      style = this.styles[style];
    }

    return style;
  }

  getContainer(item: any) {
    const container = item.container

    if (container) {
      container.body = container.body || {};
      let style = container.body.style || container.style || item.style || item.code

      if (style) {
        if (typeof style === 'string') {
          style = this.styles[item.style];
        }
        container.body.style = style;
      }

      let title = container.header?.title || container.title || item.title || item.label || item.name;
      if (title) {
        if (typeof title === 'string') {
          title = {
            text: title
          }
        }

        title.style = title.style || this.styles['container.title'];
        container.header = container.header || {};
        container.header.title = title
      }

      const icon = container.header?.icon || container.icon || item.icon;
      if (icon) {
        container.header = container.header || {};
        container.header.icon = icon
      }

      let link = container.header?.link || container.link || item.link;
      if (link) {
        if (typeof link === 'string') {
          link = {
            url: link,
            text: '...'
          }
        }

        link.style = link.style || this.styles['container.link'];
        container.header = container.header || {};
        container.header = container.header || {};
        container.header.link = link
      }

      let description = container.header?.description || container.description || item.description || item.summary || item.html;
      if (description) {
        if (typeof description === 'string') {
          description = {
            text: description
          }
        }

        description.style = description.style || this.styles['container.description'];
        container.header = container.header || {};
        container.header.description = description
      }
    }

    return container;
  }

  /***
   * @param path 'name.first
   */

  private _getValue(obj: any, path: any, defaultValue?: any): any {

    if (!path) {
      return obj;
    }

    if (!obj) {
      return defaultValue;
    }

    let value = (path.indexOf('.') == 0) ? this.value : obj;
    const keys = path.split('.').filter((k: any) => !!k)

    for (const key of keys) {
      if (Array.isArray(value)) {
        const arrayItem = value.find((item: any) => item[key] !== undefined);
        if (!arrayItem) {
          return defaultValue;
        }
        value = arrayItem[key];
      } else {
        value = value[key];
      }
      if (value === undefined) {
        return defaultValue;
      }
    }

    return value;
  }

  resetError(ms = 5000) {
    setTimeout(() => {
      this.isFormSubmit = false;
      this.errors = {}
    }, ms)
  }

  onReset() {
    this.fields = this.options.items.map((i: any) => this.initSection(i))
    this.resetError(0);
  }

  // getValue(item: any) {
  //   return this._getValue(this.value, item.key, item.defaultValue);
  // }

  setValue(item: any, value: any): any {

    if (this.value.set) {
      this.value.set(item.key, value);
      return;
    }

    const parts = item.key.split('.').filter((k: any) => !!k)

    let obj = this.value;
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
    return
  }

  onSubmit(fields: any) {
    this.isFormSubmit = true;

    if (this.errors && Object.keys(this.errors).length && Object.values(this.errors).find(v => v !== undefined && v !== null && v !== '')) {
      this.resetError();
      return;
    }
    this.valueChange.emit(this.value);

  }
}
