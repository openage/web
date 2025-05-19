import { Component, Input, OnInit } from '@angular/core';
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

  constructor(
    private context: ContextService,
    private navService: NavService,
    private constantService: ConstantService
  ) {
    this.context.actions.changes.subscribe((items: any) => {
      this.items = items;
      this.init()
    });
  }

  ngOnInit(): void {
    this.init();
  }

  init() {
    this.items = (this.items || [])
      .filter((i: any) => this.context.hasPermission(i.permissions))
      .map((i: { type: string; style: string; }) => {
        i = this.constantService.actions.get(i);
        i.type = i.type || 'button';
        i.style = i.style || (i.type === 'icon' ? 'subtle' : 'primaryBackdrop');
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
