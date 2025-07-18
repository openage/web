import { TransformPlugin } from "../transform.plugin";

export class MergeTransform implements TransformPlugin {
  canHandle(type: any): boolean {
    return type === 'merge';
  }
  transform(data: any, config?: any) {
    const sourcePath = config?.source
    const targetPath = config?.target

    const run = (d: any) => {
      const target = this.getValue(d, targetPath)
      const source = this.getValue(d, sourcePath)

      if (Array.isArray(target)) {
        if (Array.isArray(source)) {
          source.forEach(s => target.push(s))
        } else {
          target.push(source)
        }
      } else {
        Object.assign(target, source)
      }
    }

    if (Array.isArray(data)) {
      data.map(d => run(d))
    } else {
      run(data)
    }

    return data
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
}
