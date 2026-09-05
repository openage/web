import { Component, ComponentRef, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { Action } from '../../core/models/action.model';
import { ConstantService } from '../../core/services/constant.service';
import { NavService } from '../../core/services/nav.service';
import { ContextService } from '../../core/services/context.service';
import { IconComponent } from '../icon/icon.component';
import { MenuDirective } from '../../directives/menu.directive';
import { TogglerComponent } from '../toggler/toggler.component';
import { AddFormPopUpComponent } from '../add-form-pop-up/add-form-pop-up.component';


@Component({
  selector: 'oa-action',
  standalone: true,
  imports: [
    IconComponent,
    TogglerComponent,
    MenuDirective,
  ],
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.css']
})
export class ActionComponent implements OnInit, OnChanges {

  @Input()
  options: Action | any;

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
  add!: AddFormPopUpComponent
  @ViewChild('popupContainer', { read: ViewContainerRef }) popupContainer!: ViewContainerRef;
  popupRef!: ComponentRef<AddFormPopUpComponent>;

  constantService = inject(ConstantService);
  navService = inject(NavService);
  // shareService = inject(ShareService);
  context = inject(ContextService);

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {

    if (typeof this.options === 'string') {
      this.options = { code: this.options }
    }

    this.event = this.event || this.options.event;

    this.class = this.class || this.options.class;
    this.style = this.style || this.options.style;

    if (!(this.options instanceof Action)) {
      this.options = new Action(this.options);
    }

    this.items = (this.options?.config?.items || this.options?.items || this.options?.options || []
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
      this.options = this.options || new Action({
        code: 'more'
      });
    }

    if (!this.options) { return; }

    if (this.options.isDisabled && this.options.display === 'disabled') {
      this.disabled = true;
    }

    this.options = this.constantService.actions.get(this.options);

    this.setEvent(this.options);

    if (this.items?.length) {
      this.items[0].isSelected = true;
    }

    this.view = this.view || this.options.view;

    if (!this.view) {
      this.view = this.options.icon ? 'icon' : 'button'
    }

    this.icon = this.options.icon || this.options.code;
    this.title = this.title || this.options.title;
    this.setValue();
  }

  ngOnInit() {
  }

  setValue() {
    this.value = this.value || this.options.value;
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
      const code = this.options.code;
      const values = Object.values(obj)
      if (!values.length) { return; }

      this.value = values.length === 1 ? values[0] : obj;

      this.options.event = () => {
        values.forEach((v: any) => {
          const fn = v[code]
          if (fn && typeof fn === 'function') {
            fn();
          }
        });
      };
    }

    for (const key of keys) {
      const value = this.context.data().get(key);
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

    if (!item.event && this.options.event) {
      item.event = () => this.options.event(item.value);
    }
  }



  onSelect(value: any) {
    // this.items.forEach((i) => i.isSelected = false);
    // value.isSelected = true;
    this.options.event(value, this.options.config);
  }

  onClick() {
    if (this.options.event) {
      this.options.event(this.value, this.options.config);
    }
    if (this.options.config === 'add-page') {
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
