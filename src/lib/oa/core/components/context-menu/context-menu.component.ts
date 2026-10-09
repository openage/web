import { Component, effect, inject, Input, OnInit } from '@angular/core';
import { ContextService } from '../../services/context.service';
import { Action } from '../../models/action.model';
import { NavService } from '../../services/nav.service';
import { ConstantService } from '../../services/constant.service';
import { ActionComponent } from '../../../ux/action/action.component';
import { LayoutComponent } from "../layout/layout.component";

@Component({
  selector: 'oa-context-menu',
  imports: [ActionComponent],
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.css']
})
export class ContextMenuComponent implements OnInit {

  @Input()
  items: any[] = [];

  @Input()
  view: 'bar' | 'inline' | 'raised' | 'stroked' | 'flat' | 'icon' | 'fab' | 'mini-fab' = 'flat';

  context = inject(ContextService);
  navService = inject(NavService);
  constantService = inject(ConstantService);

  constructor() {
    effect(() => {
      this.items = this.context.actions()
      this.init()
    });
  }

  ngOnInit(): void {
    this.init();
  }

  init() {
    const themeCode = this.context.theme()?.code;
    this.items = (this.items || [])
      .filter((i: any) => this.context.hasPermission(i.permissions))
      .map((item: any) => {
        const i = this.constantService.actions.get(
          item && typeof item === 'object' ? { ...item } : item
        );
        if (!i) {
          return i;
        }
        i.type = i.type || 'button';
        const classes = (i.class || (i.type === 'icon' ? 'subtle' : 'primary context-menu-action'))
          .split(/\s+/)
          .filter(Boolean);
        if (themeCode && !classes.includes(themeCode)) {
          classes.push(themeCode);
        }
        i.class = classes.join(' ');
        return i;
      });
  }

  back() {
    this.navService.back();
  }

  toggle(item: Action) {
    item.value = !item.value;
    if (item.event) {
      item.event(item.value);
    }
  }

  onSelect(item: Action, value: any) {
    item.options?.forEach((i: { isSelected: boolean; }) => i.isSelected = false);
    value.isSelected = true;
    if (item.event) {
      item.event(item.value);
    }
  }
}
