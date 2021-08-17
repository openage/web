import { Injectable } from '@angular/core';
import moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class TransformService {

  constructor() { }
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
  private unwind(data: any, config: any) {
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
  private pivot(data: any[], config: any) {
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

  /**
   * @param data
   * example:
   * [
   *     { category: 'A', value: 10, date: '2024-01-01' },
   *     { category: 'B', value: 20, date: '2024-01-01' },
   *     { category: 'A', value: 15, date: '2024-01-02' },
   *     { category: 'B', value: 25, date: '2024-01-02' },
   * ]
   * @param config
   * example:
   * {
   *    groupBy: ['date'],
   *    aggregations: [
   *        { field: 'value', type: 'sum', output: 'totalValue' },
   *        { field: 'value', type: 'count', output: 'count' },
   *    ]
   *}
   * @returns
   * [
   *    {
   *        date: '2024-01-01',
   *        totalValue: 30,
   *        count: 2,
   *        items: [
   *            { category: 'A', value: 10, date: '2024-01-01' },
   *            { category: 'B', value: 20, date: '2024-01-01' },
   *        ],
   *    },
   *    {
   *        date: '2024-01-02',
   *        totalValue: 40,
   *        count: 2,
   *        items: [
   *            { category: 'A', value: 15, date: '2024-01-02' },
   *            { category: 'B', value: 25, date: '2024-01-02' },
   *        ],
   *    },
   *]

   */
  private aggregate(data: any[], config: any) {
    config.groupBy = config.groupBy || [];
    config.aggregations = config.aggregations || [];

    if (!Array.isArray(data)) {
      throw new Error('Input data must be an array.');
    }

    const result: any[] = [];
    const groupMap = new Map();

    for (const item of data) {
      // Create a composite key for grouping
      const groupKey = JSON.stringify(config.groupBy.map((key: any) => this.getValue(item, key)));

      if (!groupMap.has(groupKey)) {
        const baseObject = config.groupBy.reduce((acc: any, key: string) => {
          acc[key] = this.getValue(item, key);
          return acc;
        }, {});

        // Initialize aggregation fields and items array
        for (const agg of config.aggregations) {
          baseObject[agg.output] = agg.init || 0;
        }
        baseObject.items = []; // Store grouped items here

        groupMap.set(groupKey, baseObject);
      }

      const groupEntry = groupMap.get(groupKey);

      // Add the item to the group's items list
      groupEntry.items.push(item);

      // Perform aggregations
      for (const agg of config.aggregations) {
        const value = this.getValue(item, agg.field);
        switch (agg.type) {
          case 'sum':
            groupEntry[agg.output] += value;
            break;
          case 'count':
            groupEntry[agg.output] += 1;
            break;
          case 'average':
            if (!groupEntry[`${agg.output}_count`]) {
              groupEntry[`${agg.output}_count`] = 0;
              groupEntry[`${agg.output}_sum`] = 0;
            }
            groupEntry[`${agg.output}_count`] += 1;
            groupEntry[`${agg.output}_sum`] += value;
            groupEntry[agg.output] = groupEntry[`${agg.output}_sum`] / groupEntry[`${agg.output}_count`];
            break;
          default:
            throw new Error(`Unsupported aggregation type: ${agg.type}`);
        }
      }
    }

    // Convert the groupMap to an array
    for (const entry of groupMap.values()) {
      result.push(entry);
    }

    return result;
  }

  private merge(data: any, config: any) {
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

  private map(data: any, config: any) {
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

  apply(data: any, transforms: any): any {

    if (!transforms?.length) {
      return data;
    }

    for (const transform of transforms) {
      switch (transform.type) {
        case 'map':
          data = this.map(data, transform.config)
          break;
        case 'merge':
          data = this.merge(data, transform.config)
          break;
        case 'unwind':
          data = this.unwind(data, transform.config)
          break;

        case 'pivot':
          data = this.pivot(data, transform.config)
          break;

        case 'aggregate':
          data = this.aggregate(data, transform.config)
          break;

        default:
          break;
      }
    }

    return data;
  }



}



