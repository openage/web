import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { ConstantService } from '../../core/services/constant.service';
import { TogglerOptions } from './toggler.options';

@Component({
  selector: 'oa-toggler',
  standalone: true,
  imports: [
    IconComponent,
    TooltipDirective
  ],
  templateUrl: './toggler.component.html',
  styleUrls: ['./toggler.component.scss']
})
export class TogglerComponent implements OnInit, OnChanges {

  @Input()
  value: any;

  @Input()
  code?: string;

  @Input()
  view: 'icon' | 'button' | 'select' | 'mini-fab' = 'icon';

  @Input()
  disabled = false;

  @Input()
  readonly = false;

  @Input()
  required = false;

  @Output()
  valueChange: EventEmitter<any> = new EventEmitter();

  @Input()
  items: {
    label: string,
    icon: any,
    class?: string,
    style?: any,
    code: any,
    value?: any,
    index?: number,
    isSelected?: boolean
  }[] = [];

  @Input()
  options: TogglerOptions | any;

  selected: any;
  constructor(
    private constantService: ConstantService
  ) {
  }

  init() {
    if (this.code) {
      const list = this.constantService.icons.get(this.code);

      this.items = list.items
    }
  }

  ngOnInit() { }
  ngOnChanges(changes: SimpleChanges): void {
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].index = i;
      this.items[i].value = this.items[i].value || this.items[i].code
      this.items[i].isSelected = false;
    }

    if (this.value) {
      this.selected = this.items.find((i) => { return `${i.value}` === `${this.value}` });
    } else if (this.items.length) {
      this.selected = this.items[0];
      this.value = this.selected.value;
    }

    if (this.selected) {
      this.selected.isSelected = true;
    }

  }

  onToggle() {
    this.onSelect(this.items[this.selected.index - 1] || this.items[this.items.length - 1]);
  }

  onSelect(option: any) {
    this.selected.isSelected = false;

    this.selected = option;
    this.selected.isSelected = true;

    this.value = this.selected.value;
    this.valueChange.emit(this.value);
  }

}
