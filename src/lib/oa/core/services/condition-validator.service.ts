import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConditionValidatorService {
  check(data: any, condition: any) {
    if (typeof condition != 'object') {
      return condition
    }
    return this.evaluate(condition.key, condition.value, condition.operator, data)
  }

  private evaluate(key: string, value: string | any, operator: string, data: any) {
    let result: any
    result = operator !== 'OR'
    value = value === 'null' || value === 'undefined' ? null : value

    if (Array.isArray(value) && value.length && !(typeof value[0] == 'string')) {
      for (let i = 0; i < value.length; i++) {
        const v = value[i]
        if (operator === 'OR') { result = result || this.evaluate(v.key, v.value, v.operator, data) }
        if (operator === 'AND') { result = result && this.evaluate(v.key, v.value, v.operator, data) }
      }
      return result
    } else {
      // const keyValue = this.getValue(data, key.split('.'))
      let keyValue = key.split('.').reduce((obj, next) => obj && obj[next], data)
      keyValue = keyValue ? keyValue : null

      switch (operator) {
        case '>':
          return keyValue > value
        case '<':
          return keyValue < value
        case '<=':
          return keyValue <= value
        case '>=':
          return keyValue >= value
        case '==':
          return keyValue === value
        case '===':
          return keyValue === value
        case '!=':
          return keyValue !== value
        case 'in':
          return value.includes(keyValue)
        case 'nin':
          return !value.includes(keyValue)
      }
    }
  }

  // private getValue(obj: Object, key: string[], i = 0) {
  //   if (typeof obj === 'object' && !obj.hasOwnProperty(key[i])) {
  //     return null
  //   } else if (obj[key[i]] && typeof obj[key[i]] === 'object') {
  //     return this.getValue(obj[key[i]], key, i + 1)
  //   } else {
  //     return obj[key[i]]
  //   }
  // }
}

