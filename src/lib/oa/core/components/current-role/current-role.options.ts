import { BrandingOptions } from "../branding/branding.options";

export class CurrentRoleOptions {

  branding?: BrandingOptions;

  class?: string;
  style?: any;

  constructor(obj?: any) {
    obj = obj || {};

    this.branding = new BrandingOptions(obj.branding);



    this.style = obj.style;
    this.class = obj.class;

  }
}
