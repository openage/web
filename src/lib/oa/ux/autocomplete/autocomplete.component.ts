/* eslint-disable @typescript-eslint/no-this-alias */
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Subject } from 'rxjs';
import { PaginatorComponent } from '../../components/paginator/paginator.component';
import { Action } from '../../core/models/action.model';
import { StorageService } from '../../core/services';
import { ContentService } from '../../core/services/content.service';
import { ContextService } from '../../core/services/context.service';
import { DataService } from '../../core/services/data.service';
import { UxService } from '../../core/services/ux.service';
import { ActionComponent } from "../action/action.component";
import { AutoCompleteOptions } from './autocomplete.options';
import { NgTemplateOutlet } from '@angular/common';


@Component({
  selector: 'oa-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  imports: [
    PaginatorComponent,
    NgTemplateOutlet,
    ActionComponent]
})
export class AutocompleteComponent implements OnInit, OnChanges {

  @Input()
  id?: string;

  @Input()
  optionsId?: string;

  @Input()
  style?: any;

  @Input()
  class?: string;

  @Input()
  disabled = false;

  @Input()
  readonly = false;

  @Input()
  required = false;

  @Input()
  value: any;

  @Input()
  label?: string;

  @Input()
  showLabel: boolean = true;

  @Input()
  placeholder?: string;

  @Input()
  api?: DataService;

  @Input()
  url?: {
    code?: string;
    addOn?: string;
  };

  @Input()
  displayValue?: () => string;

  @Input()
  options: AutoCompleteOptions | any;

  @Output()
  valueChange: EventEmitter<any> = new EventEmitter();

  @Output()
  changed: EventEmitter<any>; // obsolete

  // @ViewChild(MatMenuTrigger)
  // trigger: MatMenuTrigger;

  @Output()
  mouseMove: EventEmitter<any> = new EventEmitter();


  @ViewChild('placeholderTemplate')
  placeholderTemplate?: TemplateRef<any>;

  @ViewChild('valueTemplate')
  valueTemplate?: TemplateRef<any>;

  @ViewChild('inputContainer')
  inputContainer?: ElementRef;

  @ViewChild('autoCompleteContainer')
  autoCompleteContainer?: ElementRef;

  // @ViewChild('itemsMenuTrigger')
  // itemsMenuTrigger: MatMenuTrigger;

  @Input()
  preFix?: Action;

  @Input()
  postFix?: Action;

  @Input()
  storeKeys: any;  // Object Only

  @Input()
  componentName?: string;

  showOptions = false;

  hoverOnOptions = false;

  isProcessing = false;
  isEditing = false;

  add?: Action;
  reset?: Action;
  search = '';
  error?: string;

  items: any[] = [];
  pager: any;

  query: any = {};

  currentPageNo: number = 1;
  totalPages?: number;
  total?: number;

  ddlPosition = 'down';
  ddlType = 'dropdown';
  ddlWidth = '0px';
  debounceTimer: any;

  constructor(
    public uxService: UxService,
    private context: ContextService,
    private cache: StorageService,
    private content: ContentService
  ) {
    // this.pager = this;
    this.changed = this.valueChange;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.options =
      this.options && this.options instanceof AutoCompleteOptions
        ? this.options
        : new AutoCompleteOptions(this.options);

    this.label = this.label || this.options.label;
    this.required = this.required || this.options.required;

    if (this.options.data && Array.isArray(this.options.data)) {
      this.items = this.options.data;
    }

    if (this.storeKeys && (this.items.length <= 5)) {
      this.addRecentItems();
    }

    if (this.options.view) {
      if (this.options.view.icon) {
        this.preFix = new Action({
          icon: this.options.view.icon,
          type: 'icon',
        });
      }
    }

    if (
      this.options.add &&
      this.options.add.event &&
      this.context.hasPermission(this.options.add.permissions)
    ) {
      this.add = new Action(this.options.add);
      this.add.event = () => {
        const newItem: any = {};
        newItem[this.options.search.field] = this.search;
        this.options.add.event(newItem);
      };
    }

    if (!this.postFix) {
      this.postFix = new Action({
        code: 'close',
        event: () => this.onRemove()
      });
    }

    if (this.options.preFetch) {
      this.query = this.options.search.params || {};
      this.fetch(null, false);
    }
  }

  setBusy(value: boolean) {
    if (value) {
      const original = this.postFix;
      this.isProcessing = true;
      this.postFix = new Action({
        code: 'busy',
        event: () => {
          this.postFix = original;
        }
      });
    } else {
      this.isProcessing = false;
      if (this.postFix?.event) {
        this.postFix.event();
      }
    }
  }

  ngOnInit() {
    if (!this.id) {
      this.id = `autocomplete-${Math.ceil(100 * Math.random())}`;
      if (!this.optionsId) {
        this.optionsId = `${this.id}-options`;
      }
    }

    if (this.options?.data?.src) {
      this.api = new DataService().init(this.options?.data?.src);
    }

    // this.options = this.options && this.options instanceof AutoCompleteOptions ?
    //   this.options :
    //   new AutoCompleteOptions(this.options);

    // if (!this.value) {
    //   this.isEditing = true;
    // }

    // if (this.options.preFetch) {
    //   this.fetch(null, false);
    // }
  }

  addOptionsListener() {
    if (!this.optionsId) {
      return;
    }
    const el = document.getElementById(this.optionsId);
    const new_this = this;
    if (el) {
      el.onmouseover = function () {
        new_this.hoverOnOptions = true;
      };

      el.onmouseout = function () {
        new_this.hoverOnOptions = false;
      };
    }
    setTimeout(() => this.addOptionsListener(), 1000);
  }

  checkSelection(value: boolean) {
    if (!value && !this.hoverOnOptions) {
      this.onShowOptions(value);
    }
  }

  addRecentItems() {
    const recents = this.cache.components(`shared|autocomplete|${this.componentName}`).get('recents') || [];
    recents.forEach((recent: any) => {
      if (this.items.length <= 5) {
        this.items.push(recent);
      }
    });

    if (recents && recents.length) {
      this.onShowOptions(false);
    }
  }

  onTextChange(text: string) {
    clearTimeout(this.debounceTimer);
    this.items = [];
    if (!text) {
      setTimeout(() => {
        this.error = '';
        this.items = this.cache.components(`shared|autocomplete|${this.componentName}`).get('recents') || [];
      })
      this.items = [];
      return;
    }
    if (this.search === text) { return }
    this.debounceTimer = setTimeout(() => this.onChange(text), 500);
  }

  onChange(text: string) {
    if (this.isProcessing) {
      return;
    }

    this.error = undefined;
    this.search = text;

    this.query = this.options.search.params || {};
    this.query[this.options.search.field] = text;

    this.fetch();
  }
  mouseMoved(direction: any) {
    this.mouseMove.emit(direction)
  }
  onClick() {
    if (this.isProcessing) {
      return;
    }

    this.error = undefined;

    this.fetch();
  }

  showPage(pageNo: number) {
    if (this.isProcessing) {
      return;
    }
    if (pageNo === -2) {
      pageNo = 1;
      return;
    }

    if (pageNo === -1 && this.totalPages) {
      pageNo = this.totalPages;
      return;
    }

    return this.fetch({
      page: pageNo - 1
    });
  }

  showItems(limit: number) {
    if (this.isProcessing) {
      return;
    }
    return this.fetch({ limit: limit });
  }

  noItemsFound() {
    this.error = this.options.messages.noRecords;
    this.isEditing = true;
  }

  private fetch = async (options?: any, open = true) => {
    if (!this.disabled && !this.readonly && this.search.trim().length) {
      this.onShowOptions(true);
    }

    this.error = undefined;
    const subject = new Subject<void>();

    if (!this.api) {
      setTimeout(() => subject.next());
      return subject.asObservable();
    }

    this.setBusy(true);
    options = options || {};
    try {

      const page = await this.api.search(this.query, options)


      this.items = [];
      if (this.options?.prefixItem) {
        this.items.push(...this.options.prefixItem);
      }
      if (page) {
        if (page.items) {
          this.items.push(...page.items);
        }
        this.total = page.total || this.items.length;
        this.currentPageNo = page.pageNo || 1;
        if (this.options.search.limit) {
          this.totalPages = Math.ceil(this.total / this.options.search.limit);
        } else {
          this.totalPages = 1;
        }
      }

      if (this.items.length === 1 && this.options.autoSelect) {
        this.onSelect(this.items[0]);
        // this.changed.emit(this.items[0]);
      }

      if (!this.disabled && !this.readonly && this.search.trim().length) {
        if (this.items.length === 0) {
          this.error = this.options.messages.noRecords;
        } else {
          this.onShowOptions(open);
        }
      }

      this.addOptionsListener();



    } catch (err) {
      this.items = [];
      this.error = this.options.messages.noRecords;
    } finally {
      this.setBusy(false);
    }
    return
  }

  store(value: any) {
    if (!this.storeKeys) {
      return;
    }
    const recents = this.cache.components(`shared|autocomplete|${this.componentName}`).get('recents') || [];

    if (recents.find((data: any) => (data.code === value.code))) {
      return;
    }

    const temp = JSON.parse(this.content.inject(JSON.stringify(this.storeKeys), { data: value }));

    // append the last selected value to the list
    recents.unshift(temp);

    // delete the last element if array length exceeds 5
    if (recents.length > 5) {
      recents.splice(-1);
    }

    this.cache.components(`shared|autocomplete|${this.componentName}`).set('recents', recents);


  }

  onSelect($event: any) {
    this.value = $event;
    this.search = '';

    if (this.value) {
      this.store(this.value);
    }

    this.onShowOptions(false);
    this.isEditing = false;
    this.changed.emit(this.value);
  }

  onReset() {
    this.search = '';
    this.onShowOptions(false);
  }

  onHideOptions($event: any) {
    $event.preventDefault();
    this.onShowOptions(false);
  }

  onShowOptions(show: any) {

    if (this.disabled || this.readonly) {
      return;
    }

    this.items = this.items || this.cache.components('shared|autocomplete').get('recents');
    this.showOptions = show;

    // TODO: fix me
    // if (!this.trigger) return
    // if (show) {
    //   this.trigger.openMenu();
    // } else {
    //   this.trigger.closeMenu();
    // }


    // setTimeout(() => {
    //   if (this.showOptions === show) { return; }
    //   if (show) {
    //     const bounds =
    //       this.inputContainer.nativeElement.getBoundingClientRect();
    //     this.ddlWidth = bounds.width;
    //     this.ddlPosition =
    //       bounds.top / window.innerHeight > 0.5 ? 'up' : 'down';
    //     this.ddlType = this.options.view.inline ? 'inline' : 'dropdown';
    //   }
    //   this.showOptions = show;
    //   setTimeout(() => { // this will make the execution after the above boolean has changed
    //     this.inputContainer.nativeElement.focus();
    //   }, 0);
    // });
  }

  onRemove() {
    this.value = null;
    this.search = '';
    this.changed.emit(this.value);
  }
}
