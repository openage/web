import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'search'
})
export class SearchPipe implements PipeTransform {

  public transform(items, args?: any) {

    if (!items || !items.length) { return items; }

    const conditions = [];

    for (const k in args) {
      const condition: any = {
        operator: 'eq'
      };
      if (k === 'key') {
        condition.key = args[k];
        condition.value = args['value'];
      } else {
        condition.key = k;
        condition.value = args[k];
      }

      if (condition.key.indexOf('-') !== -1 || condition.key.startsWith('_') || condition.value === undefined) {
        continue;
      }

      if (condition.value && typeof condition.value === 'string' && condition.value.startsWith('like:')) {
        condition.value = condition.value.substr(5);
        condition.operator = 'like';
      }
      conditions.push(condition);
    }

    const getValue = (item, key) => {
      let value = item;
      for (const field of key.split('.')) {
        if (value[field] === undefined) {
          return;
        }
        value = value[field];
      }
      return value;
    };

    return (items || []).filter((i) => {
      for (const condition of conditions) {

        const value = getValue(i, condition.key);

        if (value === undefined) {

          if (condition.value !== 'none') {
            return false;
          }

          continue;
        } else if (typeof value === 'object') {
          continue;
        }

        switch (condition.operator) {
          case 'eq':
            if (value !== condition.value) {
              return false;
            }
            break;

          case 'like':
            if (value.toLowerCase().indexOf(condition.value.toLowerCase()) === -1) {
              return false;
            }
            break;
        }


      }
      return true;
    });

  }

}
