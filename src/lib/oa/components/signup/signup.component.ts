import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Organization, Tenant, User } from '../../core/models';
import { Profile } from '../../core/models/profile.model';
import { Role } from '../../core/models/role.model';
import { AuthService } from '../../core/services';
import { NavService } from '../../core/services/nav.service';
import { ContextService } from '../../core/services/context.service';

type SignupView = 'individual' | 'employee' | 'organization' | 'tenant';

interface SignupConfig {
  label?: string;
  view?: SignupView;
  typeCode?: string;
  roleType?: string;
  source?: unknown;
  login?: string;
}

@Component({
  selector: 'oa-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  imports: [CommonModule, FormsModule]
})
export class SignupComponent implements OnInit, OnDestroy {
  @Input() label?: string;
  @Input() config: SignupConfig = {};
  @Input() style?: Record<string, string>;
  @Input() class?: string;
  @Input() view: SignupView = 'individual';
  @Input() typeCode?: string;
  @Input() roleType?: string;
  @Input() source?: unknown;
  @Input() oneStep = true;
  @Input() sessionId?: string;
  @Input() tokenString?: string;
  @Input() organization?: Organization;

  @Output() valueChange = new EventEmitter<User>();
  @Output() created = new EventEmitter<void>();
  @Output() processing = new EventEmitter<boolean>();
  @Output() success = new EventEmitter<Role | undefined>();
  @Output() failure = new EventEmitter<Error>();

  profile = new Profile({});
  email = '';
  mobile = '';
  password = '';
  confirmPassword = '';
  otp = '';
  organizationName = '';
  organizationCode = '';
  tenantName = '';
  tenantCode = '';
  user?: User;
  error?: string;
  afterSignUp = false;
  isProcessing = false;
  disableResend = false;
  countdownSeconds = 0;

  private resendTimer?: ReturnType<typeof setInterval>;
  private auth = inject(AuthService);
  private navService = inject(NavService);
  private context = inject(ContextService);

  ngOnInit(): void {
    this.view = this.config.view || this.view;
    this.label = this.config.label || this.label || this.defaultLabel();
    this.typeCode = this.config.typeCode || this.typeCode;
    this.roleType = this.config.roleType || this.roleType;
    this.source = this.config.source || this.source;
  }

  ngOnDestroy(): void { this.stopResendTimer(); }

  async register(): Promise<void> {
    if (this.isProcessing) { return; }
    const validationError = this.validate();
    if (validationError) { this.setError(validationError); return; }

    const user = new User({ email: this.email.trim() || undefined, phone: this.mobile.trim() || undefined, profile: this.profile });
    (user as User & { password: string }).password = this.password;
    this.setProcessing(true);
    this.error = undefined;
    try {
      const session: any = await this.auth.signup(
        user,
        this.getOrganization(),
        this.roleType,
        this.source,
        undefined,
        this.getTenant()
      );
      this.user = user;
      this.sessionId = session?.id;
      if (!this.sessionId) { throw new Error('Signup did not return a confirmation session.'); }
      this.afterSignUp = true;
      this.valueChange.emit(user);
      this.created.emit();
    } catch (error: unknown) {
      this.setError(this.errorMessage(error));
    } finally {
      this.setProcessing(false);
    }
  }

  async confirm(): Promise<void> {
    if (this.isProcessing || !this.sessionId) { return; }
    if (!this.otp.trim()) { this.setError('Enter the verification code.'); return; }

    this.setProcessing(true);
    this.error = undefined;
    try {
      const role = await this.auth.verifyOtp(this.sessionId, this.otp.trim());
      this.success.emit(role);
      this.login();
    } catch (error: unknown) {
      this.setError(this.errorMessage(error));
    } finally {
      this.setProcessing(false);
    }
  }

  async resendOtp(): Promise<void> {
    if (this.disableResend || this.isProcessing) { return; }
    const email = this.email.trim();
    const mobile = this.mobile.trim();
    if (!email && !mobile) { this.setError('Enter an email address or mobile number before requesting a new code.'); return; }

    this.setProcessing(true);
    this.error = undefined;
    try {
      const session: any = await this.auth.sendOtp(email, mobile, '');
      this.sessionId = session?.id || this.sessionId;
      this.startResendTimer();
    } catch (error: unknown) {
      this.setError(this.errorMessage(error));
    } finally {
      this.setProcessing(false);
    }
  }

  login(): void { this.navService.goto('auth.login'); }

  private validate(): string | undefined {
    if (!this.profile.firstName?.trim() || !this.profile.lastName?.trim()) { return 'Enter your first and last name.'; }
    if (!this.email.trim() && !this.mobile.trim()) { return 'Enter an email address or mobile number.'; }
    if (this.email.trim() && !/^\S+@\S+\.\S+$/.test(this.email.trim())) { return 'Enter a valid email address.'; }
    if (this.password.length < 8) { return 'Password must contain at least 8 characters.'; }
    if (this.password !== this.confirmPassword) { return 'Passwords do not match.'; }
    if (this.view === 'employee' && !this.context.organization() && !this.organizationCode.trim()) {
      return 'Enter the organization code.';
    }
    if (this.view === 'organization' && (!this.organizationName.trim() || !this.organizationCode.trim())) {
      return 'Enter the organization name and code.';
    }
    if (this.view === 'tenant' && (!this.tenantName.trim() || !this.tenantCode.trim())) {
      return 'Enter the tenant name and code.';
    }
    return undefined;
  }

  isEmployeeWithoutOrganization(): boolean {
    return this.view === 'employee' && !this.context.organization();
  }

  private getOrganization(): Organization | undefined {
    if (this.view === 'employee') {
      return this.context.organization() || new Organization({ code: this.organizationCode.trim() });
    }
    if (this.view === 'organization') {
      return new Organization({ name: this.organizationName.trim(), code: this.organizationCode.trim() });
    }
    return undefined;
  }

  private getTenant(): Tenant | undefined {
    return this.view === 'tenant'
      ? new Tenant({ name: this.tenantName.trim(), code: this.tenantCode.trim() })
      : undefined;
  }

  private defaultLabel(): string {
    switch (this.view) {
      case 'employee': return 'Join your organization';
      case 'organization': return 'Create an organization';
      case 'tenant': return 'Create a tenant';
      default: return 'Join this tenant';
    }
  }

  private setProcessing(value: boolean): void { this.isProcessing = value; this.processing.emit(value); }
  private setError(message: string): void { this.error = message; this.failure.emit(new Error(message)); }
  private errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Unable to complete signup. Please try again.'; }

  private startResendTimer(): void {
    this.stopResendTimer();
    this.disableResend = true;
    this.countdownSeconds = 30;
    this.resendTimer = setInterval(() => {
      this.countdownSeconds -= 1;
      if (this.countdownSeconds <= 0) { this.stopResendTimer(); this.disableResend = false; }
    }, 1000);
  }

  private stopResendTimer(): void {
    if (this.resendTimer) { clearInterval(this.resendTimer); this.resendTimer = undefined; }
  }
}
