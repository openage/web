import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';

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

  title = environment.title;
  styles: any = {};
  envName: string = 'prod';
  theme?: Theme;

  isProcessing?: boolean = true;
  underMaintenance?: string;
  isInitialized = true;
  header?: any;
  footer?: any;
  sidebar?: any;
  layoutType?: string = 'sticky-header';

  logger = new Logger(AppComponent);
  constructor(
    public context: ContextService,
    private uxService: UxService,
    private navService: NavService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const log = this.logger.get('constructor');
    context.init();
    navService.init();

    const application = context.currentApplication();

    if (application && application.env && application.env !== 'prod') {
      this.envName = application.env;
    }

    context.theme.changes.subscribe(t => { this.theme = t; this.setTheme(); });
    context.isProcessing.changes.subscribe(t => setTimeout(() => this.isProcessing = !!t));
    context.underMaintenance.changes.subscribe(t => this.underMaintenance = t);
  }

  ngOnInit(): void {
    const log = this.logger.get('ngOnInit')
    this.theme = this.context.theme.get();
    this.header = this.context.getPageMeta('header');
    this.sidebar = this.context.getPageMeta('sidebar');
    this.footer = this.context.getPageMeta('footer');
    this.styles = this.context.getPageMeta('styles');
    this.layoutType = this.context.getAppMeta('layout') || 'sticky-header';

    this.setTheme();
    // this.isProcessing = this.context.isProcessing.get();
    this.underMaintenance = this.context.underMaintenance.get();

    log.end()
  }

  setTheme() {
    if (this.theme?.style) {
      this.uxService.addStyle('theme', this.theme?.style);
    }

    if (this.theme?.icon) {
      this.uxService.addStyle('icon', this.theme?.icon);
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
