import { Input, SimpleChanges } from '@angular/core';
import { Component, OnChanges } from '@angular/core';
import { ConstantService } from '../../core/services/constant.service';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
    selector: 'oa-icon',
    imports: [
        TooltipDirective
    ],
    templateUrl: './icon.component.html',
    styleUrls: ['./icon.component.scss']
})
export class IconComponent implements OnChanges {

  @Input()
  value: any;

  @Input()
  title?: string;

  @Input()
  class?: string;

  @Input()
  style?: any;

  icon: any;

  constructor(
    private constantService: ConstantService
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    this.init();
  }

  init() {

    if (!this.value) {
      return;
    }

    let icon: any = {};
    if (typeof this.value === 'string') {
      if (this.value.startsWith('http')) {
        icon.url = this.value;
      } else if (this.value.startsWith('fa-')) {
        icon.fa = this.value.substring(3);
      } else if (this.value.startsWith('oa-')) {
        icon.oa = this.value.substring(3);
        this.class = this.class || 'x-md';
      } else if (this.value.startsWith('mat-')) {
        icon.mat = this.value.substring(4);
      } else {
        const item = this.constantService.icons.get(this.value);
        if (item) {
          icon = item;
        } else {
          icon.mat = this.value;
        }
      }
    } else {
      icon = this.value;
    }

    this.icon = icon;

    this.class = this.class || icon.class;
    this.style = this.style || icon.style || {};
    if (typeof this.style === 'object') {
      if (icon.mat) {
        this.style['font-variation-settings'] = this.style['font-variation-settings'] || "'FILL' 1, 'wght' 100, 'GRAD' 0, 'opsz' 48;";
      } else if (icon.url) {
        this.style['background-size'] = 'cover';
        this.style['background'] = `url(${icon.url})`;
      }
    }

    this.title = this.title || icon.title;
  }

}
