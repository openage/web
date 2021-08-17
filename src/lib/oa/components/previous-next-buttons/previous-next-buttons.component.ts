import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-pager-mini',
  templateUrl: './previous-next-buttons.component.html',
  styleUrls: ['./previous-next-buttons.component.css']
})
export class PreviousNextButtonsComponent {

  @Input()
  current: number;

  @Input()
  total: number;

  @Input()
  step = 1;

  @Output()
  changed: EventEmitter<number> = new EventEmitter();

  constructor() { }


  onPrevious() {
    this.current = this.current - this.step;
    if (this.current < 1) {
      this.current = 1;
    }

    this.changed.emit(this.current);

  }

  onNext() {
    this.current = this.current + this.step;
    if (this.current > this.total) {
      this.current = this.total;
    }

    this.changed.emit(this.current);
  }

}
