import { Entity } from "./entity.model";
import { ModelBase } from "./model-base.model";

export class Progress extends ModelBase {
  type?: any;
  icon?: string;
  url?: string;
  value: number = 0;
  // status?: 'new'| 'queued'| 'in-progress'| 'complete'| 'errored' | 'aborted';
  error?: any;
  redirect?: {
    type: string,
    url: string
  }
  progress?: any;

  constructor(obj?: any) {
    super(obj)
    if (!obj) return;

    this.type = obj.type;
    this.url = obj.url;
    this.value = obj.value;
    this.error = obj.error;
    this.redirect = obj.redirect;
    this.progress = obj.progress || 0;
  }
}
