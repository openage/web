import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Action } from '../models/action.model';
import { ContextService } from './context.service';

@Injectable({
  providedIn: 'root'
})
export class ConstantService {

  private _errors: any = {};
  private _messages: any = {};
  private _actions: any = {};
  private _icons: any = {};
  private _lists: any = {};

  private _mimes: any = {
    mp4: "video/mp4",
    webm: "video/webm",
    ogg: "video/ogg"
  }

  constructor(
    private http: HttpClient,
    private context: ContextService
  ) {

    this.http.get('assets/data/messages.json', { responseType: 'text' })
      .subscribe((data) => {
        this._messages = {};
        JSON.parse(data).items.forEach((item: { code: string; ref: string | number; }) => {
          this._messages[item.code.toLowerCase()] = item.ref ? this._messages[item.ref] : item;
        });
      });

    this.http.get('assets/data/errors.json', { responseType: 'text' })
      .subscribe((data) => {
        this._errors = {};
        JSON.parse(data).items.forEach((item: { code: string; ref: string | number; }) => {
          this._errors[item.code.toLowerCase()] = item.ref ? this._errors[item.ref] : item;
        });
      });

    this.http.get('assets/data/actions.json', { responseType: 'text' })
      .subscribe((data) => {
        this._actions = {};
        JSON.parse(data).items.forEach((item: { code: string; ref: string | number; }) => {
          this._actions[item.code.toLowerCase()] = item.ref ? this._actions[item.ref] : item;
        });
      });

    this.http.get('assets/data/icons.json', { responseType: 'text' })
      .subscribe((data) => {
        this._icons = {};
        JSON.parse(data).items.forEach((item: { code: string; ref: string | number; }) => {
          this._icons[item.code.toLowerCase()] = item.ref ? this._icons[item.ref] : item;
        });
      });

    this.http.get('assets/data/lists.json', { responseType: 'text' })
      .subscribe((data) => {
        this._lists = {};
        JSON.parse(data).items.forEach((item: { code: string; ref: string | number; }) => {
          this._lists[item.code.toLowerCase()] = item.ref ? this._lists[item.ref] : item;
        });
      });
  }

  errors = {
    get: (code: string) => {
      if (!code) return;
      return this._errors[code.toLowerCase()];
    }
  }

  messages = {
    get: (code: string) => {
      if (!code) return;
      return this._messages[code.toLowerCase()];
    }
  }

  actions = {
    get: (item: Action | any) => {
      if (!item) return;

      if (typeof item === 'string') {
        item = new Action({ code: item })
      } else if (!(item instanceof Action)) {
        item = new Action(item);
      }

      const code = item.code.toLowerCase();

      let action = this._actions[code];
      const icon = this._icons[code]

      if (icon) {
        if (action) {
          action.icon = action.icon || icon;
          action.title = action.title || icon.title;
        } else {
          action = {
            title: icon.title,
            icon: icon
          }
        }
      }

      if (action) {
        item.title = item.title || action.title || action.label;
        item.icon = item.icon || action.icon;
        item.type = item.type || action.type;
        item.value = item.value || action.value;
        item.display = item.display || action.display;
        item.options = item.options || action.options;
        item.permissions = item.permissions || action.permissions;
        item.handler = item.handler || action.handler;
        item.provider = item.provider || action.provider;
        item.config = item.config || action.config;

        if (item.isDisabled !== undefined) {
          item.isDisabled = action.isDisabled;
        }

        if (item.isCancelled !== undefined) {
          item.isCancelled = action.isCancelled;
        }

        if (item.isSkipActionOnList !== undefined) {
          item.isSkipActionOnList = action.isSkipActionOnList;
        }

        if (item.isAuto !== undefined) {
          item.isAuto = action.isAuto;
        }
      }

      item.icon = item.icon || item.code;

      return item
    }
  }

  icons = {
    get: (code: string | number) => {
      if (!code) return;
      return this._icons[code];
    }
  }

  lists = {
    get: (code: string | number) => {
      if (!code) return;
      return this._lists[code];
    }
  }

  mimes = {
    get: (ext: string) => {
      if (!ext) return;

      return this._mimes[ext.toLowerCase()];
    }
  }

  populate = async (data: any) => {
    if (!data) {
      return;
    }

    const injectUrl = (url?: string) => {
      if (!url) {
        return '';
      }

      if (url.startsWith('http') || url.startsWith('/')) {
        return url;
      }

      let serviceCode = 'app';
      if (url.startsWith(':')) {
        serviceCode = url.split('/')[0].substring(1);
      }

      const service: any = this.context.application()?.getService(serviceCode);

      if (!service) {
        throw new Error(`service '${serviceCode}' is not defined`)
      }

      if (url.startsWith(':')) {
        url = url.replace(`:${serviceCode}`, service.url)
      } else {
        url = `${service.url}/${url}`
      }

      return url
    }

    const getData = (d: any) => {
      if (typeof d === "string") {
        d = {
          code: d,
          src: d
        }
      }
      return new Promise((res, rej) => {
        if (!d.src) {
          return res(d);
        }
        const url = injectUrl(d.src);
        this.http.get(url, { responseType: 'text' }).subscribe((r) => {
          res({
            code: d.code,
            data: JSON.parse(r)
          });
        })
      })
    }
    return new Promise((res, rej) => {
      Promise.all(data.map((d: any) => getData(d))).then((results: any[]) => {
        const item: any = {}
        results.forEach(r => {
          item[r.code] = r.data;
        });

        res(item)
      })
    })
  }
}
