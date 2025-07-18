import moment from "moment";
import { TransformPlugin } from "../transform.plugin";

export class MapTransform implements TransformPlugin {
  canHandle(type: any): boolean {
    return type === 'map';
  }
  transform(data: any, config?: any) {
    const run = (d: any) => {
      const mapped: any = {};
      for (const key in config) {
        let value = config[key];

        if (value.startsWith('{{')) {
          value = value.substr(2, value.length - 4)

          const parts = value.split('|')
          value = this.getValue(d, parts[0])

          if (parts[1]) {
            value = this.format(value, parts[1])
          }
        }
        mapped[key] = value
      }
      return mapped
    }
    if (Array.isArray(data)) {
      return data.map(d => run(d))
    } else {
      return run(data)
    }
  }

  private getValue(obj: any, key: any) {
    let keys = key
    if (typeof keys === 'string') {
      keys = keys.split('.')
    }

    const get = (item: any): any => {
      const current = keys.shift()

      if (!keys.length) {
        return item[current]
      } else if (item[current]) {
        return get(item[current])
      }
    }
    return get(obj)
  }

  format(value: any, format: string) {
    if (!value) return ''
    if (moment(value).isValid()) {
      value = moment(value).format(format);
    }
    return value;
  }
}
