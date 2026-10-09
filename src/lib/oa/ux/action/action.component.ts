import { Component, ComponentRef, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { Action } from '../../core/models/action.model';
import { ConstantService } from '../../core/services/constant.service';
import { NavService } from '../../core/services/nav.service';
import { ContextService } from '../../core/services/context.service';
import { DataService } from '../../core/services/data.service';
import { IconComponent } from '../icon/icon.component';
import { MenuDirective } from '../../directives/menu.directive';
import { TogglerComponent } from '../toggler/toggler.component';
import { AddFormPopUpComponent } from '../add-form-pop-up/add-form-pop-up.component';
import { ContentService } from '../../core/services/content.service';


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
  contentService = inject(ContentService)
  navService = inject(NavService);
  // shareService = inject(ShareService);
  context = inject(ContextService);
  dataService = inject(DataService);

  // private initialData = new Map<string, any>();

  constructor() {
  }

  /**
   * Rebuilds the action state whenever Angular input values change.
   *
   * This method normalizes the raw action configuration, resolves action metadata,
   * applies any inherited event handlers, and prepares the UI state such as icon,
   * title, view mode, and selected item list.
   */
  ngOnChanges(changes: SimpleChanges): void {

    if (!this.options) {
      this.options = {};
    }

    if (typeof this.options === 'string') {
      this.options = { code: this.options }
    }

    this.event = this.event || this.options.event;

    const ctx = this.context.toObject();
    this.options = JSON.parse(this.contentService.inject(JSON.stringify(this.options), ctx))

    // Use the configured default value when no value is explicitly provided.
    this.value = this.value || this.options.value;

    if (this.value) {
      if (typeof this.value === 'string') {
        this.value = this.contentService.inject(this.value, ctx)
      } else if (typeof this.value === 'object') {
        this.value = JSON.parse(this.contentService.inject(JSON.stringify(this.value), ctx))
      }
    }

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

  /**
   * Resolves action values from context data and keeps them synchronized.
   *
   * The component accepts a string or array of context keys, looks up each value in
   * the shared application data store, and stores the resolved object in `this.value`.
   * If a resolved value exposes a `subscribe` API, the method listens for updates and
   * re-creates the action callback so the UI remains in sync with the latest data.
   */
  setValue() {

    // Normalize various input shapes into a flat list of keys.
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

    // Rebuild the action callback as soon as the underlying data changes.
    const createEvent = () => {
      const code = this.options.code;
      const values = Object.values(obj)
      if (!values.length) { return; }

      this.value = values.length === 1 ? values[0] : obj;

      this.options.event = this.options.event || (() => {
        values.forEach((v: any) => {
          const fn = v[code]
          if (fn && typeof fn === 'function') {
            fn();
          }
        });
      });
    }

    // Pull each referenced item from the shared data context and capture its initial state.
    for (const key of keys) {
      const value = this.context.data().get(key);
      if (value) {
        obj[key] = value;
        // if (!this.initialData.has(key) && typeof value === 'object') {
        //   this.initialData.set(key, JSON.parse(JSON.stringify(value)));
        // }
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

  /**
   * Assigns the default behavior for a known action type.
   *
   * Certain action codes like `link`, `back`, `data`, and `add` require specialized
   * navigation or popup flows. This method fills in those defaults while preserving any
   * custom handler already supplied by the caller.
   */
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
        item.event = item.event || (() => this.navigateBack());
        break;
      case 'clear':
      case 'close':
        item.event = item.event || (() => this.navService.back());
        break;
      case 'data':
        item.event = item.event || (() => this.dataAction());
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

  /**
   * Executes the current action when the component is activated by the user.
   *
   * This central entry point invokes the configured action callback, opens the add-page
   * popup when required, and emits the selected value to any parent component listening
   * for the `selected` event.
   */
  onClick() {
    if (this.options.event) {
      this.options.event(this.value, this.options.config);
    }
    if (this.options.config === 'add-page') {
      this.openPopup()
    }
    this.selected.emit(this.value);
  }

  /**
   * Performs CRUD operations against a target data source configured on the action.
   *
   * The method resolves the current record from the shared context, uses the configured
   * service/collection target to create, read, update, or delete data, and then writes
   * the result back into the application data store so connected components can react.
   */
  private async dataAction() {

    // Resolve the source key from either a direct string value or an object payload.
    let key: any;
    if (typeof this.value === 'string') {
      key = this.value
    } else {
      key = this.value.key || this.value.code;
    }

    const value = this.context.data().get(key);
    const id = value.id || value.code;
    const method = this.options?.config?.method;
    const target = this.options?.config?.target;
    if (!target?.service || !target?.collection || !this.value) {
      return;
    }

    let data: any;

    switch (method) {
      case 'reset':
        {
          const original: any = {}
          for (const [key, initial] of original) {
            const current = this.context.data().get(key);
            if (!current || typeof current !== 'object' || !initial || typeof initial !== 'object') {
              continue;
            }

            Object.keys(current).forEach(property => {
              if (!Object.prototype.hasOwnProperty.call(initial, property)) {
                delete current[property];
              }
            });
            Object.assign(current, JSON.parse(JSON.stringify(initial)));
          }
        }
        return

      case 'create':
        data = await this.dataService.create(value, target);
        break;

      case 'get':
        data = await this.dataService.get(id, target);
        break;

      case 'update':
        data = await this.dataService.update(id, value, target);
        break;

      case 'remove':
        data = await this.dataService.remove(id, target)
        break;
    }

    // Update the shared data map with the latest server response so the app stays consistent.
    const code = value.code || value.id;
    this.context.data.update((current) => {
      const next = new Map(current);
      if (method === 'remove' && next.has(code)) {
        next.delete(code);
      } else {
        next.set(code, data);
      }
      return next;
    });
  }

  /**
   * Navigates back to the previous screen or to a configured destination.
   *
   * When a specific `link` or `url` is provided, the component routes to that target;
   * otherwise it falls back to the default browser/history navigation behavior.
   */
  private navigateBack() {
    const target = this.options?.config?.link || this.options?.config?.url;
    if (!target) {
      this.navService.back();
      return;
    }

    const code = this.value?.code || this.value?.id;
    this.navService.goto(target, code ? { path: { code } } : {});
  }


  /**
   * Opens the add-form popup in the action's view container.
   *
   * The method clears any existing popup content, creates a new instance of the popup,
   * and wires the close event to the local cleanup helper.
   */
  openPopup() {
    this.popupContainer.clear();
    this.popupRef = this.popupContainer.createComponent(AddFormPopUpComponent);
    this.popupRef.instance.closePopup.subscribe(() => this.closePopup());
  }

  /**
   * Destroys the currently open popup instance.
   */
  closePopup() {
    this.popupRef.destroy();
  }
}
