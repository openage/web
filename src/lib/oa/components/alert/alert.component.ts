import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'oa-alert',
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.css'],
    standalone: false
})
export class AlertComponent implements OnInit {

  @Input()
  class: string;

  @Input()
  view: string = 'banner';

  @Input()
  value: any[] | any = [];

  constructor() { }

  ngOnInit(): void {
    if (!Array.isArray(this.value)) {
      this.value = [this.value];
    }
  }

  onClose() {
    this.value = [];
  }

}
