import { Action } from './action.model';

export class ErrorModel extends Error {
  code?: string;
  icon?: string;
  title?: string;
  description?: string;
  level?: 'error' | 'warn' | 'info';
  timer?: number;
  actions?: Action[];
  view?: 'dialog' | 'banner' | 'subtle';

  constructor(obj?: any) {

    super();

    if (!obj) {
      return;
    }

    this.code = obj.code;
    this.icon = obj.icon;
    this.title = obj.title || obj.name;
    this.description = obj.description || obj.message;
    this.timer = obj.duration || 0;
    this.level = obj.level || 'warn';
    this.view = obj.view || 'subtle';
    this.actions = (obj.actions || []).map((a: any) => new Action(a));
  }
}
