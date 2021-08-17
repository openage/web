import { TemplateRef } from "@angular/core";
import { EditorOptions } from "../../core/models/editor.options";



export class InputOptions extends EditorOptions {

  min: number;

  trigger?: 'any' | 'finish';
  changed: 'keep' | 'reset'; // reset will clear the input
  keys: {
    cancel?: string,
    finish?: string
  };

  format?: {
    casing?: string,
    trim?: boolean,
  }
  displayFn: any

  constructor(obj?: any) {

    super(obj);
    obj = obj || {};

    this.required = obj.required;
    this.disabled = obj.disabled;
    this.displayFn = obj.displayFn;


    this.min = obj.min || 0;

    this.format = obj.format || {
      casing: 'none',
      trim: true
    };

    this.trigger = obj.trigger || 'any';
    this.changed = obj.changed || 'keep';
    this.keys = obj.keys || {};
    this.keys.cancel = this.keys.cancel || 'Escape';
    this.keys.finish = this.keys.finish || 'Enter';
  }
}
