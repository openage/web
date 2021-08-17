import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { NavService } from '../../core/services/nav.service';
import { UxService } from '../../core/services/ux.service';
import { ContextService } from '../../core/services/context.service';
import { Link } from '../../core/models';
import { IconComponent } from '../icon/icon.component';
import { TogglerComponent } from '../toggler/toggler.component';
import { ActionComponent } from '../action/action.component';
import { HtmlViewerComponent } from "../html-viewer/html-viewer.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'oa-nav',
  standalone: true,
  imports: [
    IconComponent,
    HtmlViewerComponent,
    CommonModule
  ],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit, OnDestroy {

  @Input()
  view?: 'side' | 'top';

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

  constructor(
    public context: ContextService,
    public navService: NavService,
    public uxService: UxService,
    private router: Router
  ) {
    // context.navs.changes.subscribe((t) => this.getValues());
  }

  getValues(src?: string) {
    src = src || 'root';

    const value = (this.context.navs.get() || [])
      .filter((i) => this.context.hasPermission(i.permissions) && i.view !== 'hidden')
      .sort((a, b) => a.index - b.index)

    if (src === 'root') {
      return value;
    }

    return value.find((i) => i.code === src)?.items || [];
  }

  ngOnInit() {
    this.options = this.options || {};
    this.view = this.view || this.options.view;
    this.class = this.class || this.options.class;
    this.isExpanded = this.isExpanded || this.options.isExpanded;
    this.src = this.src || this.value || this.options.src;

    this.value = this.getValues(this.src);

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
