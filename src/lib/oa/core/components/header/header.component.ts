import { AfterViewInit, Component, effect, HostListener, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Role } from '../../models/role.model';
import { ContextService } from '../../services/context.service';
import { ErrorModel, Logger } from '../../models';

import { ConstantService } from '../../services/constant.service';

import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../layout/layout.component';


@Component({
  selector: 'page-header',
  imports: [
    RouterModule,
    LayoutComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, AfterViewInit {

  _logger: Logger = new Logger('HeaderComponent');

  layout?: any;
  components: any = [];
  templates: any = {};
  data: any = {};


  errors?: ErrorModel[] = [];
  currentRole?: Role;
  device?: string;

  context = inject(ContextService);
  constant = inject(ConstantService);

  constructor() {
    effect(() => {
      this.errors = this.context.errors()
      this.currentRole = this.context.role();
      this.device = this.context.device();
    });

  }



  ngOnInit() {
    const logger = this._logger.get('ngOnInit');
    logger.debug('templates', this.templates);
    const header = this.context.getPageMeta('header');

    if (header) {
      this.layout = header.layout;
      this.constant.populate(header.data).then((data) => {
        this.data = data || {};
      })
      this.components = header.components;
    }

    this.currentRole = this.context.role();
    this.device = this.context.device();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.templates = {};
    });
  }

  // @HostListener('window:scroll', [])
  // onWindowScroll() {
  //   this.isScrolled = window.scrollY > 0;
  // }
}
