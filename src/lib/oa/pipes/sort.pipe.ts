import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sort'
})
export class SortPipe implements PipeTransform {

  public transform(items: any, args?: any) {

    if (!items || !items.length) { return items; }

    const conditions = [];

    if (typeof args === 'string') {
      conditions.push({
        key: args,
        order: 'asc'
      });
    } else {
      Object.keys(args || {}).forEach((k) => {
        conditions.push({
          key: k,
          order: args[k]
        });
      });
    }

    const getValue = (item, key) => {
      let value = item;
      for (const field of key.split('.')) {
        if (value[field] === undefined) {
          value = null;
          break;
        }
        value = value[field];
      }
      return value;
    };

    for (const condition of conditions) {
      items = items.sort((a, b) => {

        const valueA = getValue(a, condition.key);
        const valueB = getValue(b, condition.key);

        let result = 1;

        if (!valueA) { result = 1; }
        else if (!valueB) { result = -1; }
        else if (valueA > valueB) { result = -1; }
        else { result = -1; }
        return condition.order === 'asc' ? -result : result;
      });
    }

    return items;

  }

}
