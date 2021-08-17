import { Component, Input, OnInit } from '@angular/core';
import { ContextService } from '../../services/context.service';
import { Role } from '../../models/role.model';
import { AuthService } from '../../services';
import { NavService } from '../../services/nav.service';
import { Application, Tenant } from '../../models';
import { AvatarComponent } from '../../../ux/avatar/avatar.component';
import { FormatPipe } from '../../../pipes/format.pipe';
import { BrandingComponent } from '../branding/branding.component';
import { CurrentRoleOptions } from './current-role.options';
import { IconComponent } from '../../../ux/icon/icon.component';
import { DialogDirective } from '../../../directives/dialog.directive';

@Component({
  selector: 'page-role',
  standalone: true,
  imports: [AvatarComponent, FormatPipe, BrandingComponent, IconComponent, DialogDirective],
  templateUrl: './current-role.component.html',
  styleUrls: ['./current-role.component.scss']
})
export class CurrentRoleComponent implements OnInit {
  isImpersonateSession: boolean = false
  currentRole?: Role;
  currentTenant?: Tenant;
  currentApplication?: Application;

  @Input()
  options?: CurrentRoleOptions | any;


  constructor(
    public navService: NavService,
    public context: ContextService,
    public auth: AuthService
  ) {
    context.roleChanges.subscribe((r) => this.currentRole = r);
    this.context.impersonateChanges.subscribe(result => {
      this.isImpersonateSession = result
    })
  }

  ngOnInit(): void {
    this.options = this.options || {};
    if (this.options! instanceof CurrentRoleOptions) {
      this.options = new CurrentRoleOptions(this.options);
    }
    this.currentRole = this.context.currentRole();
    this.currentTenant = this.context.currentTenant();
    this.currentApplication = this.context.application();
  }

  selectRole(role?: Role) {
    this.context.setRole(role);
    this.navService.goto('home.dashboard');
    setTimeout(() => {
      location.reload();
    }, 2);
  }

  endSession() {
    if (this.isImpersonateSession) {
      this.endImpersonation();
    } else {
      this.logout();
    }
  }

  endImpersonation() {
    this.context.endImpersonateSession()
    this.navService.goto('home.dashboard');
  }

  logout = () => {
    this.auth.logout();
    this.context.clear();
    window.location.reload()
  }

  // getLogo(): string {
  //   if (!this.currentRole.organization) {
  //     return '/assets/images/logo.png'
  //   }
  //   if (this.currentRole.organization.logo && this.currentRole.organization.logo.url) {
  //     return this.currentRole.organization.logo.url;
  //   } else {
  //     return `/assets/images/${this.currentRole.organization.type}/default.png`;
  //   }
  // }

}
