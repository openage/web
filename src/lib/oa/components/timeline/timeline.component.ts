import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import * as moment from 'moment';
import { Timeline } from '../../models/timeline.model';

@Component({
  selector: 'oa-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit, OnChanges {

  @Input()
  items: Timeline[] = [];

  list: {
    date: string,
    day: string,
    activities: Timeline[];
  }[] = [];

  constructor() { }

  ngOnInit(): void { }

  ngOnChanges() {
    this.items = this.items && this.items.length ? JSON.parse(JSON.stringify(this.items)) : []

    this.sortItems();
    this.setItems()
  }

  sortItems() {
    this.items.sort((a, b) => { return +new Date(a.expectedTime) - +new Date(b.expectedTime); });
  }

  setItems() {
    const data = this.groupByLocation(this.items);

    const groupedItems = data.reduce((groups, item) => {
      const date = moment(item.expectedTime).format('DD MMM YYYY').toString();
      if (!groups[date]) { groups[date] = []; }

      groups[date].push(item);
      return groups;
    }, {});

    const groupArrays = Object.keys(groupedItems).map((date) => {
      return {
        date: moment(date).format('DD MMM YYYY'),
        day: moment(date).format('ddd'),
        activities: groupedItems[date]
      };
    });

    this.list = groupArrays
  }

  groupByLocation(items) {
    const sortedArray = []
    const data = [...items] || [];
    let location = ''

    for (const item of data) {
      const activity = JSON.parse(JSON.stringify(item))

      if (!activity.location) {
        sortedArray.push(activity)

      } else if (activity.location !== location) {
        location = activity.location

        const temp = data.filter(i => i.location === location)
        temp.forEach(i => { i.type = 'event' })

        sortedArray.push({
          actualTime: activity.actualTime || null,
          // event: [activity.location],
          event: [''],
          expectedTime: activity.expectedTime,
          formattedEventStr: '',
          location: activity.location,
          timeStamp: activity.actualTime,
          type: activity.type
        }, ...temp)
      }
    }

    return sortedArray
  }

}
