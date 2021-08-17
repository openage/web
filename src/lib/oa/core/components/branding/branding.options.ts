
export class BrandingOptions {

  view: 'tenant' | 'organization' | 'page' = 'tenant';
  logo?: {
    size?: string
  };
  title?: {
    show?: boolean
  };

  class?: string;
  style?: any;

  constructor(obj?: any) {
    obj = obj || {};

    this.view = obj.view || 'tenant';
    this.logo = obj.logo || {};
    this.title = obj.title || {};
    this.style = obj.style;
    this.class = obj.class;

  }
}
