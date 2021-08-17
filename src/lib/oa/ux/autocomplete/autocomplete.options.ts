import { TemplateRef } from '@angular/core';
import { InputOptions } from '../input/input.options';
import { Action } from '../../core/models/action.model';

export class AutoCompleteOptions {

  required?: string;
  label?: string;
  view?: {
    icon?: string,
    inline?: boolean,
    style?: any,
    class?: string
  };
  input?: InputOptions;
  data?: any;
  search: {
    field?: string,
    params?: any,
    limit?: number,
    items?: any[],
    skipSubjectStore?: boolean
  } = {};
  add?: Action;
  preFetch?: boolean;
  autoSelect?: boolean;
  showDefaults?: boolean;
  prefixItem?: [];
  messages: {
    noRecords?: string
  } = {};
  displayFn?: (value: any) => string;
  templates: {
    value?: TemplateRef<any>,
    placeholder?: TemplateRef<any>,
    item?: TemplateRef<any>
  } = {};

  constructor(obj?: any) {
    obj = obj || {};

    this.label = obj.label;
    this.required = obj.required;
    if (obj.messages) {
      this.messages = obj.messages;
    }
    this.messages.noRecords = this.messages.noRecords || 'No Records Found';


    if (obj.templates) {
      this.templates = obj.templates;
    }
    if (!this.templates.item) {
      this.templates.item = this.templates.value;
    }

    this.view = obj.view || {
      inline: false
    };

    this.data = obj.data || {};

    this.search = obj.search || {};

    this.preFetch = obj.preFetch;
    this.autoSelect = obj.autoSelect;
    this.showDefaults = obj.showDefaults;
    this.prefixItem = obj.prefixItem;
    this.displayFn = obj.displayFn;
    this.add = obj.add;

    if (obj.autoSelect === undefined) {
      this.autoSelect = false;
    }

    if (obj.showDefaults === undefined) {
      this.showDefaults = false;
    }

    this.search.field = this.search.field || 'text';

    if (!this.displayFn) {
      this.displayFn = (value) => {
        if (!value) {
          return '';
        }

        if (typeof value !== 'object') {
          return value
        } else {
          return value.title || value.label || value.name || '';
        }
      };
    }

    this.input = new InputOptions(obj.input || {
      min: 3,
      trigger: 'any',
      changed: 'keep'
    });

    this.input.templates = this.input.templates || this.templates;
    this.input.displayFn = this.input.displayFn || this.displayFn;
  }
}
