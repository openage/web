import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import * as moment from 'moment';

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: 'countdown-clock',
    templateUrl: './countdown-clock.component.html',
    styleUrls: ['./countdown-clock.component.css'],
    standalone: false
})
export class CountdownClockComponent implements OnInit, OnChanges {

  @Input()
  from: Date;

  @Input()
  due: Date;

  @Input()
  canStart: boolean;

  @Input()
  canFinish: boolean;

  @Output()
  started: EventEmitter<Date> = new EventEmitter();

  @Output()
  finished: EventEmitter<Date> = new EventEmitter();

  timeLeft: string;

  secondsLeft: number;

  constructor() { }

  ngOnInit() {
    this.updateTimeLeft();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.updateTimeLeft();
  }

  updateTimeLeft() {
    this.timeLeft = '';

    if (!this.due) {
      return;
    }

    this.secondsLeft = 0;
    if (moment(this.due).isBefore(new Date())) {
      this.timeLeft = '00:00:00';
      return;
    }

    const duration = moment.duration(moment(this.due).diff(new Date(), 'seconds'), 'seconds');
    this.secondsLeft = duration.asSeconds();
    const hours = '0' + duration.hours();
    const minutes = '0' + duration.minutes();
    const seconds = '0' + duration.seconds();
    this.timeLeft = `${hours.slice(-2)}:${minutes.slice(-2)}:${seconds.slice(-2)}`;
    if (!this.timeLeft) {
      this.timeLeft = '10:00';
    }
    setTimeout(() => this.updateTimeLeft(), 1000);
  }

  start() {
    this.started.emit(new Date());
  }

  finish() {
    this.finished.emit(new Date());
  }

}
