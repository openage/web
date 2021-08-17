export class FilterOptions {
  class?: string;
  style?: any;

  view?: string;

  title: {
    hide?: boolean;
    text?: string
  };

  apply: {
    hide?: boolean;
    text?: string
  };

  reset: {
    hide?: boolean;
    text?: string
  };

  constructor(obj?: any) {
    obj = obj || {};
    this.class = obj.class;
    this.style = obj.style;

    this.view = obj.view || 'inline';
    this.title = obj.title || {};
    this.title.text = obj.title.text || 'Filters';
    this.apply = obj.apply || {};
    this.apply.text = this.apply.text || 'Apply';
    this.reset = obj.reset || {};
    this.reset.text = this.reset.text || 'Reset';
  }
}
