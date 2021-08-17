import { TemplateRef } from "@angular/core";

export class FieldModel {
  // ordering
  index?: number;
  group?: any;
  container?: any;

  code?: string;
  label?: string;
  description?: string;
  icon?: string;

  // styling
  style?: any;
  class?: string;
  placeholder?: string;

  permissions?: any[];
  readonly?: boolean;
  isHidden?: boolean;
  isSelected?: boolean;

  // value
  key?: string;
  value?: any;
  type?: string;
  text?: string;

  template: {
    format?: string,
    default?: any,
    key?: string, // label = (key? value[key] : value)| format
  } = {};

  templates?: {
    value?: TemplateRef<any>,
    placeholder?: TemplateRef<any>
  }

  //editor
  control?: any;

  config?: any = {};
  required?: any;
  validations?: any[];

  constructor(obj?: any) {
    if (!obj) { return; }
    if (typeof obj === 'string') {
      obj = {
        key: obj
      }
    }
    this.index = obj.index;
    this.container = obj.container;
    this.group = obj.group || {};
    if (obj.groupKey) {
      this.group = {
        name: obj.group,
        key: obj.groupKey
      };
    }

    this.key = obj.key || obj.code;
    this.code = obj.code || this.key;
    this.label = obj.label || obj.name;
    this.description = obj.description || obj.message;
    this.icon = obj.icon;

    this.style = obj.style || {};
    this.class = obj.class;
    this.placeholder = obj.placeholder;

    this.permissions = obj.permissions;
    this.readonly = obj.readonly;
    this.isHidden = obj.isHidden;
    this.isSelected = obj.isSelected || false;

    this.value = obj.value;
    this.type = obj.type;
    this.text = obj.text || obj.valueLabel;

    this.template = obj.template || {};
    this.template.format = this.template.format || obj.format;


    this.control = obj.control;



    this.config = obj.config || obj.options || {};
    this.required = obj.required || 'missing-values';
    this.validations = obj.validations || [];

  }
}
