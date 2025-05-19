import { EventEmitter, Inject, Injectable, TemplateRef, DOCUMENT } from '@angular/core';
import { Subject } from 'rxjs';
import { NavService } from './nav.service';
import { ErrorService } from './error.service';
import { Logger, Pic } from '../models';
import { ContextService } from './context.service';
import { AlertService } from './alert.service';

import { Action } from '../models/action.model';

@Injectable({
  providedIn: 'root',
})
export class UxService {
  logger = new Logger('UxService');

  private _progressItem = new Subject<any>();

  progressItem = this._progressItem.asObservable();


  onSearch: EventEmitter<object> = new EventEmitter<object>();
  onTabSelect: EventEmitter<object> = new EventEmitter<object>();

  constructor(
    @Inject(DOCUMENT)
    private document: Document,
    private context: ContextService
  ) {
  }

  public init = async () => {
    const log = this.logger.get('init');

    this.context.tenantChanges.subscribe((t: any) => this._init());
    this.context.applicationChanges.subscribe((t: any) => this._init());
    this.context.organizationChanges.subscribe((t: any) => this._init());
    this.context.roleChanges.subscribe((r: any) => this._init());
    this.context.page.changes.subscribe((n) => this.context.actions.clear());
  }
  private _init = async () => {
    const log = this.logger.get('init');

    const logo = this.context.organization()?.logo || this.context.tenant()?.logo || new Pic({
      url: '/asset/images/logo.png'
    })
    this.context.logo.set(logo);

    const application = this.context.application();
    const theme = application?.theme;

    if (theme?.style) {
      this.addStyle('theme', theme.style);
    }

    if (theme?.icon) {
      this.addStyle('icon', theme.icon);
    }

    let styleCount = 0

    if (application?.styles) {
      for (const style of application.styles) {
        this.addStyle(`style-${styleCount++}`, style);
      }
    }

    this.context.theme.set(theme);
    log.end();
  }

  handleItemProgress(item: any) {
    const url = this.context.currentApplication().services.find((s: any) => s.code === item.api.code).url
    item.url = `${url}/${item.api.service}/${item.id}`
    item.code = item.id
    return this._progressItem.next(item);
  }

  public getIcon(type: any) {
    switch (type) {
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'file-doc';
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-excel':
        return 'file-excel';
      case 'application/pdf':
        return 'file-pdf';
      case 'image/jpeg':
      case 'image/png':
      case 'image/svg':
      case 'image/jpg':
        return 'file-img';
      case 'text/html':
      case 'html':
      case 'text':
        return 'file-html';
      case 'json':
      case 'text/json':
      case 'application/json':
        return 'file-json';

      case 'link':
        return 'file-link';

      default:
        return 'file-upload';
    }
  }

  reset() {
    this.context.title.clear()
    this.context.breadcrumbs.clear();
    this.context.entity.clear();
    this.context.actions.clear();
    this.context.search.clear();
    this.context.errors.clear()
  }


  addStyle(id: string, style: string) {
    let element = this.document.getElementById(id) as any;
    const isLink = (style.startsWith('http') || style.startsWith('/'));
    if (!element) {
      if (isLink) {
        element = this.document.createElement('link');
        element.rel = 'stylesheet';
      } else {
        element = this.document.createElement('style');
      }
      element.id = id;
      this.document.head.appendChild(element);
    }

    if (isLink) {
      element.href = style;
    } else {
      element.appendChild(this.document.createTextNode(style));
    }
  }

  removeStyle(id: string) {
    const element = this.document.getElementById(id);
    if (element) { element.remove(); }
  }

  removeScript(id: string) {
    const element = this.document.getElementById(id);
    if (element) { element.remove(); }
  }

  addScript(id: string, script: string) {
    let element = this.document.getElementById(id) as any;
    const isLink = (script.startsWith('http') || script.startsWith('/'));
    if (!element) {
      if (isLink) {
        element = this.document.createElement('link');
        element.rel = 'stylesheet';
      } else {
        element = this.document.createElement('script');
      }
      element.id = id;
      this.document.head.appendChild(element);
    }
    if (isLink) {
      element.href = script;
    } else {
      element.text = script;
    }
  }

  showMessage(
    message?: string,
    options?: {
      type?: string,
      title?: string,

      timer?: number,
      actions?: Action[]
    }
  ) {
    const subject = new Subject<boolean>();

    options = options || {};
    options.type = options.type || 'info';

    // const dialog = this.dialog.open(ConfirmDialogComponent, { width: '350px' });
    // const instance = dialog.componentInstance;

    // options = options || {
    //   hide: {
    //     confirm: false,
    //     cancel: false,
    //   }
    // };

    // instance.title = title || instance.title || 'Success';
    // instance.message = message || instance.message || '';
    // instance.confirmTitle = options.confirmTitle || instance.confirmTitle || 'OK';
    // instance.cancelTitle = options.cancelTitle || instance.cancelTitle;

    // instance.options = options;

    // dialog.afterClosed().subscribe((r) => {
    //   if (r !== undefined) {
    //     subject.next(r);
    //   }
    // });

    return subject.asObservable();
  }

  download(url: string, name?: string) {
    const a = this.document.createElement('a');
    document.body.appendChild(a);
    a.href = url;
    a.download = name || 'download';
    a.click();
    document.body.removeChild(a);
  }
}
