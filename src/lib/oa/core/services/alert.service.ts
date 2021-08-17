import { Injectable } from '@angular/core';
import { AlertOptions } from "../models/alert.options";
import { ContextService } from './context.service';
import { ErrorModel } from '../models';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor(private context: ContextService) {

    this.context.errors.changes.subscribe(errors => {
      this.show(errors, new AlertOptions({ title: 'Errors', view: 'dialog', duration: 3000 }))
    });
  }

  public show = (data: any, options?: AlertOptions) => {
    options = options || new AlertOptions({ title: 'Dialog', view: 'dialog' })

    const subject = new Subject<any>();
    if (!options.onClose) {
      options.onClose = (data, err) => {
        if (err) {
          subject.error(err);
        } else {
          subject.next(data)
        }
      };
    }

    return subject;
  }

  public error = (errors: Error | ErrorModel | string | string[] | ErrorModel[], options?: AlertOptions) => {
    return this.show(errors, options || new AlertOptions({ title: 'Errors', view: 'dialog', duration: 3000 }))
  }

  public info = (message: string, options?: AlertOptions) => {
    return this.show(message, options || new AlertOptions({ title: 'Info', view: 'subtle', duration: 3000 }))
  }

  public success = (message?: string, options?: AlertOptions) => {
    return this.show(message, options || new AlertOptions('Success'))
  }

  public confirm = async (message?: string, options?: AlertOptions) => {
    options = options || new AlertOptions({ title: 'Confirm', view: 'dialog' })
    return this.show(message, options)
  }
}
