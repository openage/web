import { TemplateRef } from "@angular/core";

export class EditorOptions {
  class?: string;
  style?: any;

  view?: string;
  placeholder?: string;

  required: boolean = false;
  readonly: boolean = false;
  disabled: boolean = false;

  templates?: {
    value?: TemplateRef<any>,
    placeholder?: TemplateRef<any>
  }

  constructor(obj?: any) {
    obj = obj || {};
    this.class = obj.class;
    this.style = obj.style;

    this.view = obj.view;
    this.placeholder = obj.placeholder || '';
    this.readonly = obj.readonly;
    this.required = obj.required;
    this.disabled = obj.disabled;

    this.templates = obj.templates || {};

  }
}
