export class ViewerOptions {
  class?: string;
  style?: any;
  view?: string;
  template?: any;

  constructor(obj?: any) {
    obj = obj || {};
    this.class = obj.class;
    this.style = obj.style;
    this.view = obj.view;
    this.template = obj.template;

    if (!this.view && this.template) {
      this.view = 'template';
    }
  }
}
