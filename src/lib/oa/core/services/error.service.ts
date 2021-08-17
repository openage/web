import { HttpClient } from '@angular/common/http';
import { ErrorHandler, Inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { NavService } from './nav.service';
import { ErrorModel, Logger } from '../models';
import { Subject } from 'rxjs';
import { DOCUMENT } from '@angular/common';


@Injectable({
  providedIn: 'root'
})
export class ErrorService implements ErrorHandler {
  logger = new Logger(ErrorService);
  /**
   *  error levels
   * - info - requires data correction
   * - warn - requires data correction
   * - error - requires reload
  */



  private _data: any = {};
  private _errors = new Subject<ErrorModel>();
  public errors = this._errors.asObservable();


  constructor(
    private http: HttpClient,
    @Inject(DOCUMENT)
    private document: Document,
    private navService: NavService
  ) {
    this.http.get('assets/data/errors.json', { responseType: 'text' })
      .subscribe((data) => {
        this._data = {};
        JSON.parse(data).items.forEach((item: any) => {
          this._data[item.code] = item.ref ? this._data[item.ref] : item;
        });
      });
  }

  get(error: any) {

    if (!error) { return }

    const key = error.code || error.message || error;

    let item = this._data[key];

    if (!item) {
      item = {
        code: key,
        level: 'fatal',
        title: error.name || error.message || 'Error',
        description: error.message || error.code || error,
        actions: [{
          code: 'reload',
          title: 'Reload',
          type: 'primary'
        }]
      };
    }

    for (const action of item.actions) {

      if (!action.code || action.event) {
        continue;
      }

      switch (action.code) {
        case 'reload':
          action.event = () => this.document.location.reload();
          break;
        case 'logout':
          // action.event = () => this.auth.logout();
          break;

        case 'notify-admin':
          action.event = () => {
            this.logger.info('implement notification');
          };
          break;
        case 'navigate':
          if (action.value && typeof action.value === 'string') {
            action.value = action.value.replace(':code', error.meta[error.meta.entity].code)
          }
          if (action.config && typeof action.config === 'string') {
            action.config = action.config.replace(':code', error.meta[error.meta.entity].code)
          }
          action.event = (value: any) => this.navService.goto(value);
          break;
      }
    }

    return new ErrorModel(item);
  }

  handleError(error: any): void {
    const userError = this.get(error);

    if (!userError) {
      return;
    }

    alert(userError.message);

    this._errors.next(userError);
    // TODO: hanlder error
    // if (this.snackBar) {
    //   this.snackBar.open(message, 'Error', {
    //     duration: 6000,
    //   });
    // }

  }

}
