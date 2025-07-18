import { TransformPlugin } from "../transform.plugin";

export class PivotTransform implements TransformPlugin {

  canHandle(type: any): boolean {
    return type === 'pivot';
  }

  /**
 * @param data
 * example:
 *  [
 *     { category: 'A', value: 10, date: '2024-01-01' },
 *     { category: 'B', value: 20, date: '2024-01-01' },
 *     { category: 'A', value: 15, date: '2024-01-02' },
 *     { category: 'B', value: 25, date: '2024-01-02' },
 *  ]
 * @param config
 * example:
 * {
 *    path: 'category',
 *    value: 'value',
 *    groupBy: ['date'],
 * }
 * @returns
 * example:
 * [
 *   { date: '2024-01-01', A: 10, B: 20 },
 *   { date: '2024-01-02', A: 15, B: 25 },
 * ]
 */
  transform(data: any, config?: any) {

    const pivotPath = config?.path || 'category';
    const valuePath = config?.value || 'value';
    const groupBy = config?.groupBy || [];

    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array.');
    }

    const result: any[] = [];
    const pivotMap = new Map();

    for (const item of data) {
      // Create a composite key for grouping
      const groupKey = JSON.stringify(groupBy.map((key: any) => this.getValue(item, key)));

      if (!pivotMap.has(groupKey)) {
        const baseObject = groupBy.reduce((acc: any, key: string) => {
          acc[key] = this.getValue(item, key);
          return acc;
        }, {});

        pivotMap.set(groupKey, baseObject);
      }

      const pivotKey = this.getValue(item, pivotPath);
      const pivotValue = this.getValue(item, valuePath);

      const pivotEntry = pivotMap.get(groupKey);
      pivotEntry[pivotKey] = pivotValue;
    }

    // Convert the pivotMap to an array
    for (const entry of pivotMap.values()) {
      result.push(entry);
    }

    return result;
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
