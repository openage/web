
import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavComponent } from '../../../ux/nav/nav.component';
import { NotFoundComponent } from '../../../ux/not-found/not-found.component';
import { TogglerComponent } from '../../../ux/toggler/toggler.component';
import { ErrorModel, Logger } from '../../models';
import { ConstantService } from '../../services/constant.service';
import { ContextService } from '../../services/context.service';
import { BrandingComponent } from '../branding/branding.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CurrentRoleComponent } from '../current-role/current-role.component';
import { LayoutComponent } from '../layout/layout.component';

@Component({
    selector: 'page-side-bar',
    imports: [
    RouterModule,
    LayoutComponent
],
    templateUrl: './side-bar.component.html',
    styleUrl: './side-bar.component.scss'
})
export class SideBarComponent implements OnInit, AfterViewInit {

  _logger: Logger = new Logger('SideBarComponent');

  // @ViewChild('searchComponent')
  // searchComponent?: TemplateRef<any>;

  layout?: any;
  components: any = [];
  templates: any = {};
  data: any = {};

  errors?: ErrorModel[] = [];

  constructor(
    public context: ContextService,
    public constant: ConstantService
  ) {
    context.errors.changes.subscribe((errors) => {
      // this.snackBar.open(errors, null, { duration: 5000, verticalPosition: 'top', panelClass: 'error' });
      this.errors = errors;
      // this.cleanErrors();
    });
  }

  ngOnInit() {
    const logger = this._logger.get('ngOnInit');
    logger.debug('templates', this.templates);
    const sidebar = this.context.getPageMeta('sidebar');

    if (sidebar) {
      this.layout = sidebar.layout;
      this.constant.populate(sidebar.data).then((data) => {
        this.data = data || {};
      })
      this.components = sidebar.components;
    }

  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.templates = {};
      // this.templates['search'] = this.searchComponent;
    });
  }

  // @HostListener('window:scroll', [])
  // onWindowScroll() {
  //   this.isScrolled = window.scrollY > 0;
  // }
}
