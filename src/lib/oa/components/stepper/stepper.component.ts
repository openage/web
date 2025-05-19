import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'shared-stepper',
    templateUrl: './stepper.component.html',
    styleUrls: ['./stepper.component.scss'],
    standalone: false
})
export class StepperComponent implements OnInit {

  @Input()
  items: {
    title: string;
    value: string;
    active: boolean;
    style: string;
  }[] | undefined

  @Output()
  selected: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  onSelect(item: { active: boolean; }) {
    item.active = true;
    this.selected.emit(item);
  }

}
