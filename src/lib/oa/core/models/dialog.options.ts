import { Action } from "./action.model";

export class DialogOptions {

  view: 'inline' | 'modal' | 'dropdown' | 'full' | 'bottom-sheet' = 'modal';
  trigger: Action;
  actions: Action[] = [];

  constructor(obj?: any) {
    obj = obj || {};

    if (obj.trigger && !(obj.trigger instanceof Action)) {
      this.trigger = new Action(obj.trigger);
    } else {
      this.trigger = obj.trigger;
    }

    if (obj.actions) {
      this.actions = (obj.actions || []).map((a: any) => {
        if (a instanceof Action) {
          return a
        } else {
          return new Action(a);
        }
      })
    }

    this.view = obj.view || 'modal';

  }
}
