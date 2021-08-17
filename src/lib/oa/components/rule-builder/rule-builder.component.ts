import { EventEmitter, Output } from '@angular/core';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'oa-rule-builder',
  templateUrl: './rule-builder.component.html',
  styleUrls: ['./rule-builder.component.css']
})
export class RuleBuilderComponent implements OnInit {

  @Input()
  value: any | {
    rules: [{
      data: any,
      condition: any[]
    }]
  };

  @Output()
  changed: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() {
    this.changed.emit(this.value);
  }

}
