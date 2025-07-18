import { TransformPlugin } from "../transform.plugin";

export class UnwindTransform implements TransformPlugin {

  canHandle(type: any): boolean {
    return type === 'unwind';
  }

  /**
 *
 * @param data
 * [{
 *     id: 1,
 *     name: 'Parent',
 *     children: [
 *         { id: 101, name: 'Child A' },
 *         { id: 102, name: 'Child B' },
 *     ],
 * }]
 * @param config
 *
 * {
 *     path: 'children', // Field to unwind
 *     root: 'parent',   // Field to include root data
 * }
 *
 * @returns
 * [
 *     {
 *         id: 101,
 *         name: 'Child A',
 *         parent: {
 *             id: 1,
 *             name: 'Parent',
 *         },
 *     },
 *     {
 *         id: 102,
 *         name: 'Child B',
 *         parent: {
 *             id: 1,
 *             name: 'Parent',
 *         },
 *     },
 * ];
 */
  transform(data: any, config?: any) {
    const unwindPath = config?.path || 'children'
    const rootKey = config?.root

    if (!Array.isArray(data)) {
      data = [data]
    }

    const output: any[] = []

    data.forEach((item: any) => {

      let items = this.getValue(item, unwindPath) || []
      if (!Array.isArray(items)) { items = [items] }

      const root = { ...item }
      delete root[unwindPath]
      output.push(...items.map((i: any) => (rootKey
        ? {
          ...i,
          [rootKey]: root
        }
        : {
          ...i,
          ...root
        })))
    });


    return output
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
