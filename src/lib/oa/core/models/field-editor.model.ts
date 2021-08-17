import { FieldModel } from "./field.model";

export class FieldEditorModel extends FieldModel {

  options?: [{
    label?: string
    value?: string
    style? :any 
  }];

  showFilters?: boolean;
  format: any
  showLabel: any

  constructor(obj?: any) {
    super(obj);


    this.options = obj.options;


    this.showFilters = obj.showFilters;
    this.format = obj.format;
    this.showLabel = obj.showLabel;




    if (obj.options) {
      this.config.options = obj.options;
    }
  }

}
