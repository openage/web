import { Injectable } from '@angular/core';
import { Pic } from '../models';
import { Profile } from '../models/profile.model';
import moment from 'moment';
import { TitleCasePipe } from '@angular/common';
import { ContextService } from './context.service';

@Injectable({
  providedIn: 'root'
})
export class ContentService {

  constructor(
    private context: ContextService
  ) { }

  /**
   * Replaces placeholders in a string with corresponding values from a data object.
   * Placeholders can be in the format ${key} or {{key}}.
   *
   * @param str - The template string containing placeholders in the format ${key} or {{key}}.
   * @param data - The object containing key-value pairs for replacement.
   * @returns A string with placeholders replaced by corresponding values from the data object.
   *
   * @example
   * const templateString = "Hello, ${user.name}! You have {{user.notifications}} new notifications.";
   * const data = {
   *   user: {
   *     name: "Alice",
   *     notifications: 5
   *   }
   * };
   * const result = inject(templateString, data);
   * Output: "Hello, Alice! You have 5 new notifications."
   *
   * @example
   * const nestedTemplate = "The quick ${animal.type.color} ${animal.type.species} jumps over the lazy {{animal.other.color}} {{animal.other.species}}.";
   * const nestedData = {
   *   animal: {
   *     type: {
   *       color: "brown",
   *       species: "fox"
   *     },
   *     other: {
   *       color: "dog",
   *       species: "dog"
   *     }
   *   }
   * };
   * const nestedResult = inject(nestedTemplate, nestedData);
   * // Output: "The quick brown fox jumps over the lazy dog dog."
   */
  inject(str: string, data: object): string {
    const template = str;

    /**
     * Recursively retrieves or sets a value in a nested object based on a path.
     *
     * @param obj - The object to traverse.
     * @param is - The path to the value as a string or an array of strings.
     * @param value - The value to set at the path (optional).
     * @returns The value at the specified path, or sets the value if provided.
     */
    function getValue(obj: any, is: any, value?: any): any {
      if (typeof is === 'string') {
        is = is.split('.');
      }
      if (is.length === 1 && value !== undefined) {
        return obj[is[0]] = value;
      } else if (is.length === 0) {
        return obj;
      } else {
        const prop = is.shift();
        // Forge a path of nested objects if there is a value to set
        if (value !== undefined && obj[prop] === undefined) {
          obj[prop] = {};
        }
        return getValue(obj[prop], is, value);
      }
    }

    // Replace both ${key} and {{key}} placeholders
    return template.replace(/\$\{(.+?)\}|\{\{(.+?)\}\}/g, (match, p1, p2) => {
      const key = p1 || p2; // Determine which placeholder syntax was used
      return getValue(data, key);
    });
  }

  /**
 * Sets a nested property within an object based on a given path string.
 * @param str The dot-separated path string indicating the nested property to set.
 * @param value The value to set at the specified nested property.
 * @param model The object on which to set the nested property.
 * @returns The modified object with the nested property set.
 *
 * @example
 * const obj1 = {
 *   a: {
 *     b: {
 *       c: 5
 *     }
 *   }
 * };
 * const result1 = setValue('a.b.c', 10, obj1);
 *
 * @example
 * const obj2 = {
 *   x: {
 *     y: {}
 *   }
 * };
 * const result2 = setValue('x.y.z', 'hello', obj2);
 *
 * @example
 * const obj3 = {};
 * const result3 = setValue('a.b.c', true, obj3);
 */
  setValue(str: string, value: any, model: any) { // str: [], value: need to set, model: properties
    const data = model;
    const place: any[] = str.split('.');
    let count = 0;

    function sValue(data: any, is: string | number, objValue: object) {
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

  /**
   * Inflates a flat object with keys containing '-' as a delimiter into a nested object.
   *
   * @param obj - The flat object with keys containing '-' as a delimiter.
   * @returns A nested object with keys transformed based on the '-' delimiter.
   *
   * @example
   * const flatObj1 = {
   *   'a-b-c': 1,
   *   'a-b-d': 2,
   *   'e-f': 3
   * };
   * const nestedObj1 = inflate(flatObj1);
   * // Output:
   * // {
   * //   a: {
   * //     b: {
   * //       c: 1,
   * //       d: 2
   * //     }
   * //   },
   * //   e: {
   * //     f: 3
   * //   }
   * // }
   *
   * @example
   * const flatObj2 = {
   *   'x-y': {
   *     'z-w': 4
   *   }
   * };
   * const nestedObj2 = inflate(flatObj2);
   * // Output:
   * // {
   * //   x: {
   * //     y: {
   * //       'z-w': 4
   * //     }
   * //   }
   * // }
   *
   * @example
   * const flatObj3 = {
   *   'key1': 'value1',
   *   'key2-key3-key4': 'value2'
   * };
   * const nestedObj3 = inflate(flatObj3);
   * // Output:
   * // {
   * //   key1: 'value1',
   * //   key2: {
   * //     key3: {
   * //       key4: 'value2'
   * //     }
   * //   }
   * // }
   */
  inflate(obj: any): any {
    const result: any = {};

    Object.keys(obj).forEach(key => {
      const keys = key.split('-');
      let currentLevel = result;

      keys.forEach((part, index) => {
        if (!currentLevel[part]) {
          currentLevel[part] = {};
        }

        if (index === keys.length - 1) {
          currentLevel[part] = obj[key];
        }

        currentLevel = currentLevel[part];
      });
    });

    return result;
  }

  /**
   * Flattens a nested object, joining keys with a specified delimiter.
   *
   * @param obj - The nested object to flatten.
   * @param parentKey - The base key to prepend to the flattened keys. Default is an empty string.
   * @param delimiter - The delimiter to use for joining keys. Default is '-'.
   * @returns A flattened object with keys joined by the specified delimiter.
   *
   * @example
   * const nestedObj1 = {
   *   a: {
   *     b: {
   *       c: 1,
   *       d: {
   *         e: 2
   *       }
   *     }
   *   },
   *   f: 3
   * };
   * const flattenedObj1 = deflate(nestedObj1);
   * // Output: {
   * //   'a-b-c': 1,
   * //   'a-b-d-e': 2,
   * //   'f': 3
   * // }
   *
   * @example
   * const nestedObj2 = {
   *   key1: {
   *     subkey1: {
   *       value: 'hello'
   *     },
   *     subkey2: {
   *       nested: {
   *         prop: 'world'
   *       }
   *     }
   *   }
   * };
   * const flattenedObj2 = deflate(nestedObj2, 'prefix');
   * // Output: {
   * //   'prefix-key1-subkey1-value': 'hello',
   * //   'prefix-key1-subkey2-nested-prop': 'world'
   * // }
   */
  deflate(obj: any, parentKey: string = '', delimiter: string = '-') {
    const result: any = {};

    function recurse(currObj: any, currKey: string) {
      Object.keys(currObj).forEach(key => {
        const newKey = currKey ? `${currKey}${delimiter}${key}` : key;
        if (typeof currObj[key] === 'object' && currObj[key] !== null && !Array.isArray(currObj[key])) {
          recurse(currObj[key], newKey);
        } else {
          result[newKey] = currObj[key];
        }
      });
    }

    recurse(obj, parentKey);
    return result;
  }

  /**
 * Splits content into slides based on a specified splitter string.
 * @param content The content to split into slides.
 * @param splitter The string used to split the content into slides (default is '---').
 * @returns An array of slides, each containing an id, image (if applicable), and description.
 *
 * @example
 * const content1 = `
 *   <div>Slide 1</div>
 *   <div>---</div>
 *   <div>Slide 2</div>
 * `;
 * const slides1 = split(content1);
 * // Output: [
 * //   { id: 0, image: '', description: 'Slide 1' },
 * //   { id: 1, image: '', description: 'Slide 2' }
 * // ]
 *
 * @example
 * const content2 = `
 *   <div>Slide A</div>
 *   <div>---</div>
 *   <div>Slide B</div>
 *   <div>---</div>
 *   <div>Slide C</div>
 * `;
 * const slides2 = split(content2, '---');
 * // Output: [
 * //   { id: 0, image: '', description: 'Slide A' },
 * //   { id: 1, image: '', description: 'Slide B' },
 * //   { id: 2, image: '', description: 'Slide C' }
 * // ]
 */
  split(content: string, splitter: string = '---'): any[] {
    const slides: any[] = [];
    const sections = (content && content !== `<div>${splitter}</div>`)
      ? content.split(`<div>${splitter}</div>`) : [''];

    const storySections: string[] = [];
    sections.forEach((i) => {
      i.split(splitter).forEach((subItem) => storySections.push(subItem));
    });
    let index = 0;
    storySections.forEach((section) => {
      const attachments = this.extractUrls(section);
      const slide = {
        id: index,
        image: '',
        description: section
      };

      index++;

      slides.push(slide);
      if (attachments && attachments.length) {

        for (const attachment of attachments) {


          let url = attachment.url;
          if (!url) {
            continue;
          }
          url = url.replace('</span>', '');
          url = url.replace('<span>', '');
          url = url.replace('/blob/', '/raw/');
          if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.gif')) {
            slide.image = url;
          }
        }
      }
    });

    return slides;
  }

  /**
 * Extracts URLs from the given text and creates Pic objects with metadata.
 * @param text The input text from which URLs are extracted.
 * @returns An array of Pic objects representing the extracted URLs with metadata.
 *
 * Example usage:
 *
 * @example
 * const text1 = 'Check out this image: https://example.com/image.jpg';
 * const result1 = extractUrls(text1);
 * // Output: [ { url: 'https://example.com/image.jpg', thumbnail: 'https://example.com/image.jpg', type: 'image/jpg' } ]
 *
 * @example
 * const text2 = 'No valid URLs in this text.';
 * const result2 = extractUrls(text2);
 * // Output: []
 *
 * @example
 * const text3 = 'Here are some images: https://example.com/image1.png and https://example.com/image2.gif';
 * const result3 = extractUrls(text3);
 * // Output: [ { url: 'https://example.com/image1.png', thumbnail: 'https://example.com/image1.png', type: 'image/png' },
 * //           { url: 'https://example.com/image2.gif', thumbnail: 'https://example.com/image2.gif', type: 'image/gif' } ]
 */
  extractUrls = (text: string): Pic[] => {
    const attachments: Pic[] = [];

    if (!text) {
      return attachments;
    }
    const urls = text.match(/\b(https?:\/\/\S+(?:png|jpe?g|gif)\s*)\b/g);
    if (!urls) {
      return attachments;
    }
    urls.forEach((url) => {
      const attachment = new Pic();
      attachment.url = url;
      attachment.thumbnail = url;
      if (url.endsWith('.jpg') || url.endsWith('.jpeg')) {
        attachment.type = 'image/jpg';
      } else if (url.endsWith('.png')) {
        attachment.type = 'image/png';
      } else if (url.endsWith('.gif')) {
        attachment.type = 'image/gif';
      }
      attachments.push(attachment);
    });

    return attachments;
  }

  getTextFromEvent($event: any, options?: { placeholder?: string }): string | undefined {
    options = options || {};
    if ($event.type && $event.type === 'keypress') {
      if ($event.key === 'Enter') {
        $event.preventDefault();
        $event.target.blur();
      }
      return;
    }

    let subject: string;

    if (typeof $event === 'string') {
      subject = $event
    } else {
      subject = $event.target.tagName === 'INPUT' ? $event.target.value : $event.target.innerText;
    }
    if (!subject) {
      return;
    }
    subject = subject.replace(/\r?\n/g, '').trim();

    if (subject === options.placeholder) {
      if ($event.target.tagName === 'INPUT') {
        $event.target.value = options.placeholder;
      } else {
        $event.target.innerText = options.placeholder;
      }
      return;
    }

    return subject;
  }

  setTextFromEvent($event: any, newPlaceholder: string) {
    if ($event.type && $event.type === 'keyup') {
      return;
    }
    if ($event.target.tagName === 'INPUT') {
      $event.target.value = newPlaceholder;
    } else {
      $event.target.innerText = newPlaceholder;
    }
  }

  getInitials(text: any) {
    let item = '';
    (text || '').split(' ').forEach((i: any) => item = `${item} ${i}`)
    return item.trim();
  }

  transform(value: any, args?: any): any {
    if (!value) {
      return '';
    }

    switch (typeof value) {
      case 'number':
        return this.transformNumber(value, args);
      case 'string':
        return this.transformString(value, args);
      default:
        break
    }

    if (moment.isDate(value)) {
      return this.transformDate(value, args)
    }

    if (value instanceof Profile) {
      return this.transformProfile(value, args)
    } else if (value.profile) {
      return this.transformProfile(value.profile, args)
    }

    return 'unknown';
  }


  transformString(value: string, args: any) {

    const format = args;
    switch (format) {
      case 'title': return new TitleCasePipe().transform(value);
      // case 'camel': return this.numberToShort(value);
      // case 'kebab': return this.numberToComma(value);
      // case 'initials': return this.numberTo2Decimals(value);
    }

    return value;

  }

  transformNumber(value: number, args: any) {

    const format = args;
    switch (format) {
      case 'word': return this.numberToWord(value);
      case 'short': return this.numberToShort(value);
      case 'comma': return this.numberToComma(value);
      case '2-decimals': return this.numberTo2Decimals(value);
    }

    return value.toString();

  }

  numberToCurrency(value: number) {
    return Number(value.toFixed(2)).toLocaleString(this.context.culture().locale);
  }
  numberTo2Decimals(value: number) {
    return value.toFixed(2);
  }

  numberToComma(value: number) {
    return value.toLocaleString(this.context.culture().locale);
  }

  numberToShort(value: any): any {
    if (!value || isNaN(value)) { return '0'; }

    const abs = Math.abs(value);

    const powers = [
      { key: '', min: 1, max: 1000 },
      { key: ' K', min: 1000, max: Math.pow(10, 5) },
      { key: ' L', min: Math.pow(10, 5), max: Math.pow(10, 7) },
      { key: ' Cr', min: Math.pow(10, 7), max: Math.pow(10, 12) },
      { key: ' T', min: Math.pow(10, 12), max: Math.pow(10, 15) },
    ];

    const power = powers.find((i) => abs >= i.min && abs < i.max);
    let key = '';
    if (power) {
      value = value / power.min;
      key = power.key;
    }

    let stringified = `${Math.ceil(Math.abs(value) * 1000) / 1000}`;
    const indexOfDot = stringified.indexOf('.');
    if (indexOfDot !== -1) {
      const decimals = stringified.length - indexOfDot - 1;
      const integers = stringified.length - decimals - 1;

      if (integers >= 3) {
        stringified = stringified.substring(0, integers);
      } else if (integers >= 2) {
        stringified = stringified.substring(0, integers + 1 + (decimals > 1 ? 1 : decimals));
      } else if (integers >= 1) {
        stringified = stringified.substring(0, integers + 1 + (decimals > 2 ? 2 : decimals));
      }
    }

    return `${(value < 0 ? '-' : '')}${stringified}${key}`;
  }

  numberToWord(value: any) {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    function convert(num: any) {
      if ((num = num.toString()).length > 9) { return 'overflow'; }
      const n: any = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n) { return; } let str = '';
      str += (n[1] !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
      str += (n[2] !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
      str += (n[3] !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
      str += (n[4] !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
      str += (n[5] !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'only ' : '';
      return str;
    }

    return convert(value);
  }

  transformDate(value: any, args?: any): any {
    const format = args;
    return moment(value).format(format)
  }

  transformProfile(value: any, args?: any): any {
    if (!value) {
      return '';
    }

    if (value.profile) {
      value = value.profile;
    }

    if (typeof value === 'string') {
      const parts = value.replace('.', ' ').replace('-', ' ').replace('_', ' ').split(' ');

      let name = '';

      for (const part of parts) {
        if (name.indexOf(part) === -1) {
          name = `${name} ${part}`;
        }
      }

      value = name;
    } else if (value.firstName || value.name) {

      let name = value.firstName || value.name;
      if (value.lastName && value.firstName.indexOf(value.lastName) === -1) {
        name = `${name} ${value.lastName}`;
      }
      value = name;
    } else if (value.length) {
      let name = '';
      value.forEach((element: any) => {
        name = `${element.name}|${name}`;
      });

      value = name.substr(0, name.length - 1);
    } else if (typeof value !== 'string') {
      return ''
    }

    if (value) {
      value = value.replace('.', ' ').replace('-', ' ').replace('_', ' ').trim().toLowerCase().replace(/\b(\w)/g, (s: string) => s.toUpperCase())
    }

    return this.transformString(value, args)
  }

}
