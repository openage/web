import { Component, Input, OnInit } from '@angular/core';
import { ConstantService } from '../../services/constant.service';

@Component({
  selector: 'oa-not-available',
  standalone: true,
  templateUrl: './not-available.component.html',
  styleUrls: ['./not-available.component.css']
})
export class NotAvailableComponent implements OnInit {

  @Input()
  code?: string;

  @Input()
  title?: string;

  @Input()
  icon?: string;

  constructor(
    public constants: ConstantService
  ) { }

  ngOnInit() {
    const item = this.constants.messages.get(this.code || 'not-available');
    this.title = this.title || item.message;
    this.icon = this.icon || item.icon;
  }

}
