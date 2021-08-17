import { Component, ComponentRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, viewChild, ViewChildren, ViewContainerRef } from '@angular/core';
import { Action } from '../../core/models/action.model';
import { ConstantService } from '../../core/services/constant.service';
import { NavService } from '../../core/services/nav.service';
import { ContextService } from '../../core/services/context.service';
import { IconComponent } from '../icon/icon.component';
import { MenuDirective } from '../../directives/menu.directive';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { TogglerComponent } from '../toggler/toggler.component';
import { AddFormPopUpComponent } from '../add-form-pop-up/add-form-pop-up.component';


@Component({
  selector: 'oa-action',
  standalone: true,
  imports: [
    IconComponent,
    TogglerComponent,
    MenuDirective,
    TooltipDirective,
    AddFormPopUpComponent
  ],
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.css']
})
export class ActionComponent implements OnInit, OnChanges {

  @Input()
  item: Action | any;

  @Input()
  value: any;

  @Input()
  class?: string;

  @Input()
  style: any;

  @Input()
  event?: (obj?: any) => void;

  @Input()
  items: any[] = [];

  @Input()
  disabled = false;

  // @Input()
  // type?: string;

  @Input()
  icon: any;

  @Input()
  title: string = '';

  @Input()
  view?: string; // raised, stroked, flat, icon, fab, mini-fab

  @Output()
  selected: EventEmitter<any> = new EventEmitter();

  showList: boolean = false;
@ViewChild('add')
add!:AddFormPopUpComponent
@ViewChild('popupContainer', { read: ViewContainerRef }) popupContainer!: ViewContainerRef;
popupRef!: ComponentRef<AddFormPopUpComponent>;

  constructor(
    private constantService: ConstantService,
    private navService: NavService,
    // private shareService: ShareService,
    private context: ContextService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {

    if (typeof this.item === 'string') {
      this.item = { code: this.item }
    }

    this.event = this.event || this.item.event;

    this.class = this.class || this.item.class;
    this.style = this.style || this.item.style;

    if (!(this.item instanceof Action)) {
      this.item = new Action(this.item);
    }

    this.items = (this.item?.config?.items || this.item?.items || this.item?.options || []
    ).filter((i: { permissions: string | string[] | undefined; }) => this.context.hasPermission(i.permissions)
    ).map((i: any) => {
      i = i instanceof Action ? i : new Action(i);
      const item = this.constantService.actions.get(i.code);
      if (item) {
        i.icon = i.icon || item.icon;
        i.title = i.title || item.title;
        i.provider = i.provider || item.provider;
        i.config = { ...i.config, ...item.config }
        this.setEvent(i);
      }

      // i.event = i.event || (() => this.item.event(i.value));
      return i;
    });

    if (this.items?.length) {
      this.item = this.item || new Action({
        code: 'more'
      });
    }

    if (!this.item) { return; }

    if (this.item.isDisabled && this.item.display === 'disabled') {
      this.disabled = true;
    }

    this.item = this.constantService.actions.get(this.item);

    this.setEvent(this.item);

    if (this.items?.length) {
      this.items[0].isSelected = true;
    }

    this.view = this.view || this.item.view;

    if (!this.view) {
      this.view = this.item.icon ? 'icon' : 'button'
    }

    this.icon = this.item.icon || this.item.code;
    this.title = this.title || this.item.title;
    this.setValue();
  }

  ngOnInit() {
  }

  setValue() {
    this.value = this.value || this.item.value;
    let keys: string[] = [];
    if (typeof this.value === 'string') {
      if (this.value.indexOf(',') !== -1) {
        keys = this.value.split(',').map(v => v.trim());
      }
      else {
        keys = [this.value];
      }
    } else if (Array.isArray(this.value)) {
      for (const v of this.value) {
        if (typeof v === 'string') {
          keys.push(v);
        }
      }
    }

    if (!keys.length) { return; }
    const obj: any = {};

    const createEvent = () => {
      const code = this.item.code;
      const values = Object.values(obj)
      if (!values.length) { return; }

      this.value = values.length === 1 ? values[0] : obj;

      this.item.event = () => {
        values.forEach((v: any) => {
          const fn = v[code]
          if (fn && typeof fn === 'function') {
            fn();
          }
        });
      };
    }

    for (const key of keys) {
      const value = this.context.data(key);
      if (value) {
        obj[key] = value;
        if (value.subscribe) {
          value.subscribe((p: any) => {
            obj[key] = p;
            createEvent();
          })
        }
      }
    }
    createEvent();
  }

  setEvent(item: any) {
    switch (item.code) {

      case 'email':
        item.event = () => {
          // this.shareService.email(item.config);
        }
        break;

      case 'chat':
        item.event = () => {
          // this.shareService.chat(item.config);
        }
        break;

      case 'copy':
        item.event = () => {
          // this.shareService.copy(item.config);
        }
        break;

      case 'link':
        item.event = () => {
          if (!this.value) {
            return;
          }

          let link: any;

          if (typeof this.value === 'string') {

            link = this.value

          } else {
            link = this.value.link || this.value.key || this.value.code;
          }
          const params = this.value?.params || {}
          const query: any = params.query || {};

          if (query.redirect === "{{current.url}}") {
            query.redirect = window.document.location.href
          }

          this.navService.goto(link, params, this.value?.options);
        }
        break;

      case 'back':
      case 'clear':
      case 'close':
        item.event = item.event || (() => this.navService.back());
        break;
        case 'add':
          item.event = item.event || (() => this.openPopup());
          
          break;
      case 'help':
        item.event = item.event || (() => this.navService.goto('help.sections.details', { path: { code: this.value } }))
        break;
    }

    if (!item.event && this.item.event) {
      item.event = () => this.item.event(item.value);
    }
  }



  onSelect(value: any) {
    // this.items.forEach((i) => i.isSelected = false);
    // value.isSelected = true;
    this.item.event(value, this.item.config);
  }

  onClick() {
    if (this.item.event) {
      this.item.event(this.value, this.item.config);
    }
    if(this.item.config ==='add-page'){
      this.openPopup()
    }
    this.selected.emit(this.value);
  }
  openPopup() {
    this.popupContainer.clear();
    this.popupRef = this.popupContainer.createComponent(AddFormPopUpComponent);
    this.popupRef.instance.closePopup.subscribe(() => this.closePopup());
  }
  closePopup() {
    this.popupRef.destroy();
  }
}
