import { TransformPlugin } from "../transform.plugin";

export class AggregateTransform implements TransformPlugin {

  canHandle(type: any): boolean {
    return type === 'aggregate';
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
  transform(data: any, config?: any) {
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
