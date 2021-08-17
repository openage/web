import { Component, Input, OnInit } from '@angular/core';
import { ContextService } from '../../services/context.service';
import { Link } from '../../models';
import { CommonModule } from '@angular/common';
import { BrandingOptions } from './branding.options';
import { environment } from '../../../../../environments/environment';


@Component({
  selector: 'page-branding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './branding.component.html',
  styleUrls: ['./branding.component.scss']
})
export class BrandingComponent implements OnInit {

  @Input()
  class?: string;

  @Input()
  style?: any;

  @Input()
  logoSize?: string | number;

  @Input()
  options?: any;

  @Input()
  logo?: string;

  @Input()
  title?: string;

  currentPage?: Link;
  currentApplication: any;
  currentTenant: any;
  currentOrganization: any;

  constructor(
    // public navService: NavService,
    // public uxService: UxService,
    public context: ContextService,
  ) {
    context.applicationChanges.subscribe((t) => { this.currentApplication = t; this.init() });
    context.tenantChanges.subscribe((t) => { this.currentTenant = t; this.init() });
    context.organizationChanges.subscribe((t) => { this.currentOrganization = t; this.init(); });
    context.page.changes.subscribe(p => {
      this.currentPage = p;
      this.init();
    });
  }

  ngOnInit(): void {


    this.options = this.options || {};

    // if (this.options! instanceof BrandingOptions) {
    //   this.options = new BrandingOptions(this.options);
    // }

    this.logoSize = this.logoSize || this.options.logo?.size;
    this.class = this.class || this.options.class;
    this.style = this.style || this.options.style;


    this.currentApplication = this.context.currentApplication();
    this.currentTenant = this.context.currentTenant();
    this.currentOrganization = this.context.currentOrganization();


    this.style = this.style || {};

    // this.style.height = this.style.height || `${this.size}px`;
    // this.style.width =  this.style.width || `100%`;

    this.init();
  }

  init() {
    if (this.options.logo) {
      let logoUrl
      switch (this.options.logo.type) {
        case 'application':
          logoUrl = this.currentApplication?.logo?.url;
          break;
        case 'organization':
          logoUrl = this.currentOrganization?.logo?.url;
          break;
        case 'tenant':
          logoUrl = this.currentTenant?.logo?.url;
          break;
      }
      this.logo = logoUrl || this.currentApplication?.logo?.url || this.currentOrganization?.logo?.url || this.currentTenant?.logo?.url;
    }
    if (this.options.title) {

      let title
      switch (this.options.title.type) {
        case 'application':
          title = this.currentApplication?.title;
          break;
        case 'organization':
          title = this.currentOrganization?.title;
          break;
        case 'tenant':
          title = this.currentTenant?.title;
          break;
        case 'page':
          title = this.currentPage?.title;
          break;
      }

      this.title = title || this.currentApplication?.title || this.currentOrganization?.title || this.currentTenant?.title;
    }
  }
}
