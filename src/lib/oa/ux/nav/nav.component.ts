import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { NavService } from '../../core/services/nav.service';
import { UxService } from '../../core/services/ux.service';
import { ContextService } from '../../core/services/context.service';
import { Link } from '../../core/models';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'oa-nav',
  imports: [
    IconComponent
  ],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit, OnDestroy {

  @Input()
  view?: 'side' | 'top' | 'quick-links';

  @Input()
  class?: string;

  @Input()
  options: any;

  @Input()
  value: any;

  @Input()
  src?: string;

  active?: any;

  selectedNav: Link = new Link({});
  isExpanded?: boolean;

  @Output()
  isExpand: EventEmitter<boolean> = new EventEmitter()

  context = inject(ContextService);
  navService = inject(NavService);
  uxService = inject(UxService);
  router = inject(Router);

  constructor() {
    // context.navs.changes.subscribe((t) => this.getValues());
  }

  getValues(src?: string) {
    src = src || 'root';

    const isVisible = (item: Link) =>
      this.context.hasPermission(item.permissions) && item.view !== 'hidden' && item.title && item.url;
    const value = (this.context.navs() || [])
      .filter(isVisible)
      .sort((a, b) => a.index - b.index)

    if (src === 'root') {
      return value;
    }

    const children: Link[] = this.navService.getByCode(src)?.items || [];
    return children
      .filter(isVisible)
      .sort((a, b) => a.index - b.index);
  }

  ngOnInit() {
    this.options = this.options || {};
    this.view = this.view || this.options.view;
    this.class = this.class || this.options.class;
    this.isExpanded = this.isExpanded || this.options.isExpanded;
    const configuredValues = Array.isArray(this.value) ? this.value : undefined;
    this.src = this.src || (typeof this.value === 'string' ? this.value : undefined) || this.options.src;

    this.value = this.view === 'quick-links' && configuredValues
      ? configuredValues
        .map((item: any) => {
          if (typeof item === 'string') {
            return this.navService.getByCode(item);
          }

          return item?.code
            ? this.navService.getByCode(item.code) || (item.title && item.url ? item : undefined)
            : item?.title && item?.url ? item : undefined;
        })
        .filter((item: Link | undefined): item is Link => !!item)
        .filter((item: Link) => this.context.hasPermission(item.permissions) && item.view !== 'hidden' && item.title && item.url)
      : this.getValues(this.src);

    if (this.view === 'quick-links') {
      const currentPageCode = this.context.page()?.code;
      this.value = this.value.filter((item: Link) => item.code !== currentPageCode);
    }

    const active = this.active?.code || this.active;
    const activeNav = this.value.find((v: { code: any; }) => v.code === active);

    if (activeNav) { activeNav.isActive = true; }
  }

  isActive(nav: Link) {
    const code = this.active.code || this.active;
    return nav.code === code;
  }

  ngOnDestroy(): void {
    this.selectedNav = new Link({});
  }

  select(nav: Link) {
    this.value?.forEach((i: { isActive: boolean; }) => i.isActive = false);
    // nav.current = new Link();
    nav.isActive = true
    this.navService.goto(nav);
  }

  fetchReportAreas() {
    // if (!this.value) {
    //   return;
    // }
    // const report = this.value.find((n) => n.title === 'Reports');

    // if (!report) {
    //   return;
    // }

    // if (report.items && report.items.length) {
    //   return;
    // }
    // this.reportAreaService.search().subscribe((page) => {
    //   report.items = page.items.map((i) => {
    //     return new Link({
    //       title: i.name,
    //       routerLink: ['/reports', i.code],
    //       permissions: i.permissions
    //     });
    //   });
    // });
  }

  stringify(object: any): string {
    return JSON.stringify(object)
  }
}
