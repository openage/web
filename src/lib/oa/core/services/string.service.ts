import { Injectable } from '@angular/core';
import moment from 'moment';

@Injectable({
  providedIn: 'root'
})

export class StringService {

  constructor() { }

  format(value: any, format: string) {
    if (!value) return ''
    if (moment(value).isValid()) {
      value = moment(value).format(format);
    }
    return value;
  }

  inject(str: string, data: object) {
    const template = str;
    let isObject = false

    function getValue(obj: any, is: any, value?: any) {
      if (typeof is === 'string') {
        is = is.split('.')
      }
      if (is.length === 1 && value !== undefined) {
        // eslint-disable-next-line no-return-assign
        if ((typeof obj === 'object') && (Object.keys(obj).length != 0)) {
          isObject = true
          value = JSON.stringify(value)
        }
        // eslint-disable-next-line no-return-assign
        return obj[is[0]] = value
      } else if (is.length === 0) {
        if (obj && (typeof obj === 'object') && (Object.keys(obj).length != 0)) {
          isObject = true
          obj = JSON.stringify(obj)
        }
        return obj
      } else {
        const prop = is.shift()
        // Forge a path of nested objects if there is a value to set
        if (value !== undefined && obj[prop] === undefined) { obj[prop] = {} }
        return getValue(obj[prop], is, value)
      }
    }

    let templateString = template.replace(/{{\s*([^\s|}]+)(?:\|([^\s}]+))?\s*}}/g, (match, key, format) => {
      let value = getValue(data, key)

      if (format) {
        value = this.format(value, format);
      }
      return value;
    })
    if (isObject) {
      const replateArray = [
        { from: '"[', to: '[' },
        { from: ']"', to: ']' },
        { from: '"{', to: '{' },
        { from: '}"', to: '}' },
        { from: '[object ', to: '{' },
        { from: 'Object]', to: '}' }]
      if (replateArray.some(el => templateString.includes(el.from))) {
        templateString = this.removeDoubleQuotes(templateString, replateArray)
      }
    }

    return templateString
  }

  removeDoubleQuotes(templateString: any, replateArray: any) {
    for (const r of replateArray) {
      const strr = templateString.split(r.from)
      templateString = strr.join(r.to)
    }
    if (replateArray.some((el: any) => templateString.includes(el.from))) {
      this.removeDoubleQuotes(templateString, replateArray)
    }
    return templateString
  }

  setValue(str: any, value: any, model: any) { // str: [], value: need to set, model: properties
    const data = model;
    const place: any[] = str.split('.');
    let count = 0;

    function sValue(data: any, is: any, objValue: any) {
      count++;
      data[is] = objValue || {};
      if (count === place.length) {
        data[is] = value;
        return;
      } else {
        return sValue(data[is], place[count], data[is][place[count]]);
      }
    }

    sValue(data, place[0], data[place[0]]);

    return data;
  }

  inflate(flattened: any) {
    const model: any = {}

    Object.getOwnPropertyNames(flattened).forEach(key => {
      const value = flattened[key]

      if (!value) {
        return
      }

      const parts = key.split('-')
      let index = 0
      let obj = model

      for (const part of parts) {
        if (index === parts.length - 1) {
          obj[part] = value
        } else {
          obj[part] = obj[part] || {}
        }

        obj = obj[part]
        index++
      }
    })

    return model
  }

}
