import { Component, effect, ElementRef, HostListener, inject, OnInit, ViewChild, computed, signal } from '@angular/core';

import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { FooterComponent } from '../lib/oa/core/components/footer/footer.component';
import { HeaderComponent } from '../lib/oa/core/components/header/header.component';
import { Logger, Theme } from '../lib/oa/core/models';
import { ContextService } from '../lib/oa/core/services/context.service';
import { NotAvailableComponent } from '../lib/oa/core/components/not-available/not-available.component';
import { CommonModule } from '@angular/common';
import { UxService } from '../lib/oa/core/services/ux.service';
import { NavService } from '../lib/oa/core/services/nav.service';
import { SideBarComponent } from "../lib/oa/core/components/side-bar/side-bar.component";
import { TasksProgressFooterComponent } from '../lib/oa/core/components/tasks-progress-footer/tasks-progress-footer.component';
import { ContextMenuComponent } from "../lib/oa/core/components/context-menu/context-menu.component";

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    NotAvailableComponent,
    CommonModule,
    SideBarComponent,
    TasksProgressFooterComponent,
    ContextMenuComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  @ViewChild('pageBody')
  pageContainer?: ElementRef<any>;

  context = inject(ContextService);
  uxService = inject(UxService);
  navService = inject(NavService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  title = environment.title;

  styles = computed(() => this.context.getPageMeta('styles'));
  envName = computed(() => {
    const application = this.context.application();
    if (application && application.env && application.env !== 'prod') {
      return application.env;
    }
    return '';
  });

  theme = this.context.theme;
  isProcessing = this.context.isProcessing;
  underMaintenance = this.context.underMaintenance;
  isInitialized = true;

  header = signal(false);
  footer = signal(false);
  sidebar = signal(false);
  layoutType = signal('sticky-header');

  logger = new Logger(AppComponent);

  constructor() {
    const log = this.logger.get('constructor');
    this.navService.init();
    this.uxService.init();

    // Effects run once during initialization and again whenever either signal
    // changes, unlike a computed value which is evaluated only when read.
    effect(() => {
      this.setTheme();
      log.debug('effect');
      this.context.application();
      const page = this.context.page();
      if (!page) {
        this.header.set(false);
        this.footer.set(false);
        this.sidebar.set(false);
      } else {
        this.header.set(!this.context.getPageMeta('header.disabled'));
        this.footer.set(!this.context.getPageMeta('footer.disabled'));
        this.sidebar.set(!this.context.getPageMeta('side-bar.disabled'));
      }
      this.layoutType.set(this.context.getAppMeta('layout') || 'sticky-header');
    });
  }

  ngOnInit(): void {
    const log = this.logger.get('ngOnInit')
    log.end()
  }

  setTheme() {
    const theme = this.theme();
    if (theme?.style) {
      this.uxService.addStyle('theme', theme.style);
    }

    if (theme?.icon) {
      this.uxService.addStyle('icon', theme.icon);
    }
  }


  @HostListener('window:scroll')
  checkScroll() {
    if (this.pageContainer) {
      return;
    }
    // const scrollPosition = this.pageContainer.nativeElement.scrollTop || 0;

    // if (scrollPosition >= this.topPosToStartShowing) {
    //   this.isShow = true;
    // } else {
    //   this.isShow = false;
    // }
  }
  gotoTop() {
    if (this.pageContainer) {
      return;
    }
    // this.pageContainer?.nativeElement.scrollTop = 0;
  }
}
