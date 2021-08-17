import { Action } from "../../core/models/action.model";
import { EditorOptions } from "../../core/models/editor.options";
import { FieldModel } from "../../core/models/field.model";

export class FormOptions {
  class?: string;
  style?: any;

  view?: string;
  sections: any[] = [];
  fields: FieldModel[] = [];
  actions: Action[] = [];
  constructor(obj?: any) {
    obj = obj || {};
    this.class = obj.class;
    this.style = obj.style;
    this.view = obj.view;

    this.fields = (obj.fields || []).map((i: any) => new FieldModel(i))
    this.actions = (obj.actions || []).map((i: any) => new Action(i))
    this.sections = (obj.sections || [])
  }
}
