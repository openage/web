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
  signupTypes?: SignupType[];
  allowOrganizationCreate?: boolean;
  identityTypes?: SignupIdentityType[] | SignupIdentityType[][];
  stepLabels?: any[];
}

interface SignupIdentityType {
  code: 'email' | 'mobile';
  label: string;
  icon?: string;
  placeholder?: string;
  credentialMethods?: SignupCredentialMethod[];
}

interface SignupCredentialMethod {
  code: 'password' | 'otp' | 'push';
  label: string;
  icon?: string;
  policy?: any;
}

interface SignupType {
  code: string;
  label: string;
  view: SignupView;
  roleType?: string;
}

interface SignupRole {
  code: string;
  label: string;
  roleType?: string;
  view?: SignupView;
  organization?: Organization;
  tenant?: Tenant;
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
  signupTypes: SignupType[] = [];
  identityTypes: SignupIdentityType[] = [];
  identityType: SignupIdentityType['code'] = 'email';
  identityValue = '';
  credentialMethod: SignupCredentialMethod['code'] = 'password';
  signupType = '';
  isLoggedIn = false;
  step = 1;
  otpSent = false;
  otpVerified = false;
  allowOrganizationCreate = false;
  organizationExists = false;
  organizationCreateRequested = false;
  tenantExists = false;
  availableRoles: SignupRole[] = [];
  selectedRole?: SignupRole;
  stepLabels: any[] = [];

  private resendTimer?: ReturnType<typeof setInterval>;
  private auth = inject(AuthService);
  private navService = inject(NavService);
  private context = inject(ContextService);

  ngOnInit(): void {
    this.isLoggedIn = !!this.context.session()?.user?.id || !!this.context.user()?.id;
    this.view = this.config.view || this.view;
    this.label = this.config.label || this.label || this.defaultLabel();
    this.typeCode = this.config.typeCode || this.typeCode;
    this.source = this.config.source || this.source;
    this.stepLabels = this.config.stepLabels || [];
    this.identityTypes = this.normalizeIdentityTypes(this.config.identityTypes) || this.defaultIdentityTypes();
    this.identityType = this.identityTypes[0]?.code || 'email';
    this.credentialMethod = this.credentialMethods[0]?.code || 'password';
    this.signupTypes = this.applicableSignupTypes(this.config.signupTypes || this.defaultSignupTypes());
    const configuredSignupType = this.signupTypes.find(type => type.view === this.view) || this.signupTypes[0];
    this.signupType = configuredSignupType?.code || '';
    if (configuredSignupType) {
      this.view = configuredSignupType.view;
      this.roleType = configuredSignupType.roleType;
      this.allowOrganizationCreate = this.canCreateOrganization(configuredSignupType);
    }
    if (this.isLoggedIn) {
      const currentUser = this.context.user();
      this.user = currentUser;
      this.profile = currentUser?.profile || this.profile;
      this.email = currentUser?.email || '';
      this.mobile = currentUser?.phone || '';
      this.identityType = this.email ? 'email' : 'mobile';
      this.identityValue = this.email || this.mobile;
      this.step = 2;
    }
    this.loadRoles();
  }

  ngOnDestroy(): void { this.stopResendTimer(); }

  async register(): Promise<void> {
    await this.submitUserInfo();
  }

  async submitUserInfo(): Promise<void> {
    if (this.isProcessing) { return; }
    if (this.isLoggedIn) { this.step = 2; return; }
    this.syncIdentityValue();
    const validationError = this.validateUserInfo();
    if (validationError) { this.setError(validationError); return; }

    const user = new User({ email: this.email.trim() || undefined, phone: this.mobile.trim() || undefined, profile: this.profile });
    (user as User & { password: string }).password = this.password;
    this.setProcessing(true);
    this.error = undefined;
    try {
      const session: any = await this.auth.signup(user, undefined, undefined, this.source);
      this.user = user;
      this.sessionId = session?.id;
      if (!this.sessionId) { throw new Error('Signup did not return a confirmation session.'); }
      this.otpSent = true;
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
      await this.auth.verifyOtp(this.sessionId, this.otp.trim());
      this.otpVerified = true;
      this.otpSent = false;
      this.step = 2;
      this.loadRoles();
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

  selectIdentityType(type: SignupIdentityType['code']): void {
    this.syncIdentityValue();
    this.identityType = type;
    this.identityValue = this.identityType === 'email' ? this.email : this.mobile;
    this.credentialMethod = this.credentialMethods[0]?.code || 'password';
    this.password = '';
    this.confirmPassword = '';
    this.error = undefined;
  }

  selectCredentialMethod(method: SignupCredentialMethod['code']): void {
    this.credentialMethod = method;
    this.password = '';
    this.confirmPassword = '';
    this.error = undefined;
  }

  get identityLabel(): string {
    return this.identityTypes.find(type => type.code === this.identityType)?.label || 'Identity';
  }

  get identityPlaceholder(): string {
    return this.identityTypes.find(type => type.code === this.identityType)?.placeholder || '';
  }

  stepLabel(code: string): string {
    return this.stepLabels.find(step => step.code === code)?.label || code;
  }

  get credentialMethods(): SignupCredentialMethod[] {
    return this.identityTypes.find(type => type.code === this.identityType)?.credentialMethods || [];
  }

  get credentialLabel(): string {
    return this.credentialMethods.find(method => method.code === this.credentialMethod)?.label || 'Credential';
  }

  get credentialPolicy(): any {
    return this.credentialMethods.find(method => method.code === this.credentialMethod)?.policy || {};
  }

  selectSignupType(type: SignupType): void {
    this.signupType = type.code;
    this.view = type.view;
    this.roleType = type.roleType;
    this.allowOrganizationCreate = this.canCreateOrganization(type);
    this.error = undefined;
  }

  selectRole(role: SignupRole): void {
    this.selectedRole = role;
    this.roleType = role.roleType;
    if (role.view) { this.view = role.view; }
    this.organizationCode = role.organization?.code || this.organizationCode;
    this.tenantCode = role.tenant?.code || this.tenantCode;
    this.error = undefined;
  }

  nextStep(): void {
    this.error = undefined;
    if (this.step === 2) {
      this.step = this.needsOrganizationStep() ? 3 : 4;
    } else if (this.step === 3) {
      this.step = 4;
    }
  }

  previousStep(): void {
    this.error = undefined;
    if (this.step === 4) { this.step = this.needsOrganizationStep() ? 3 : 2; }
    else if (this.step === 3) { this.step = 2; }
  }

  async validateOrganization(): Promise<void> {
    const code = this.organizationCode.trim();
    if (!code) { this.setError('Enter the organization code.'); return; }
    this.setProcessing(true);
    try {
      this.organizationExists = await this.codeExists(code, 'organization');
      if (!this.organizationExists && !this.allowOrganizationCreate) {
        this.setError('That organization does not exist.');
        return;
      }
      if (this.organizationExists) { this.step = 4; }
      else { this.organizationCreateRequested = false; this.step = 3; }
    } catch (error: unknown) { this.setError(this.errorMessage(error)); }
    finally { this.setProcessing(false); }
  }

  requestOrganizationCreate(): void {
    this.organizationCreateRequested = true;
    this.error = undefined;
  }

  async validateTenant(): Promise<void> {
    const code = this.tenantCode.trim();
    if (!code) { this.setError('Enter the tenant code.'); return; }
    this.setProcessing(true);
    try {
      this.tenantExists = await this.codeExists(code, 'tenant');
      if (this.view === 'tenant' && this.tenantExists) {
        this.setError('That tenant code is already in use.');
        return;
      }
      if (this.view === 'individual' && !this.tenantExists) {
        this.setError('That tenant does not exist.');
        return;
      }
      this.step = 4;
    } catch (error: unknown) { this.setError(this.errorMessage(error)); }
    finally { this.setProcessing(false); }
  }

  async create(): Promise<void> {
    if (this.isProcessing) { return; }
    const validationError = this.validateDestination();
    if (validationError) { this.setError(validationError); return; }
    if (!this.isLoggedIn && !this.otpVerified) { this.setError('Verify your account before continuing.'); return; }
    this.setProcessing(true);
    this.error = undefined;
    try {
      const user = this.user || new User({ email: this.email.trim() || undefined, phone: this.mobile.trim() || undefined, profile: this.profile });
      const session: any = await this.auth.signup(user, this.getOrganization(), this.roleType, this.source, undefined, this.getTenant());
      this.user = user;
      this.sessionId = session?.id || this.sessionId;
      this.afterSignUp = true;
      this.valueChange.emit(user);
      this.created.emit();
    } catch (error: unknown) { this.setError(this.errorMessage(error)); }
    finally { this.setProcessing(false); }
  }

  private validateUserInfo(): string | undefined {
    if (this.isLoggedIn) { return undefined; }
    if (!this.profile.firstName?.trim() || !this.profile.lastName?.trim()) { return 'Enter your first and last name.'; }
    if (!this.email.trim() && !this.mobile.trim()) { return 'Enter an email address or mobile number.'; }
    if (this.email.trim() && !/^\S+@\S+\.\S+$/.test(this.email.trim())) { return 'Enter a valid email address.'; }
    if (this.credentialMethod === 'password') {
      const policyError = this.validatePasswordPolicy();
      if (policyError) { return policyError; }
      if (this.password !== this.confirmPassword) { return 'Passwords do not match.'; }
    }
    return undefined;
  }

  private syncIdentityValue(): void {
    this.email = this.identityType === 'email' ? this.identityValue.trim() : '';
    this.mobile = this.identityType === 'mobile' ? this.identityValue.trim() : '';
  }

  private validatePasswordPolicy(): string | undefined {
    const policy = this.credentialPolicy;
    const minLength = policy.minLength ?? 8;
    if (this.password.length < minLength) {
      return policy.message || `Password must contain at least ${minLength} characters.`;
    }
    if (policy.maxLength && this.password.length > policy.maxLength) {
      return `Password must contain no more than ${policy.maxLength} characters.`;
    }
    if (policy.requireUppercase && !/[A-Z]/.test(this.password)) { return policy.message || 'Password must contain an uppercase letter.'; }
    if (policy.requireLowercase && !/[a-z]/.test(this.password)) { return policy.message || 'Password must contain a lowercase letter.'; }
    if (policy.requireNumber && !/\d/.test(this.password)) { return policy.message || 'Password must contain a number.'; }
    if (policy.requireSpecial) {
      const specialChars = policy.allowedSpecialChars || `^$*.[\\]{}()?!-"@#%&/,><':;|_~\``;
      const escapedSpecialChars = specialChars.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
      if (!new RegExp(`[${escapedSpecialChars}]`).test(this.password)) {
        return policy.message || 'Password must contain a special character.';
      }
      if (policy.allowedSpecialChars && [...this.password].some(char => /[^A-Za-z0-9]/.test(char) && !specialChars.includes(char))) {
        return policy.message || 'Password contains an unsupported special character.';
      }
    }
    if (policy.pattern) {
      try {
        if (!new RegExp(policy.pattern).test(this.password)) { return policy.message || 'Password does not meet the required policy.'; }
      } catch {
        return 'The configured password policy is invalid.';
      }
    }
    return undefined;
  }

  private defaultIdentityTypes(): SignupIdentityType[] {
    const password = { code: 'password' as const, label: 'Password', icon: 'fa fa-lock' };
    return [
      { code: 'email', label: 'Email', icon: 'fa fa-envelope', placeholder: 'Enter your email', credentialMethods: [password] },
      { code: 'mobile', label: 'Mobile', icon: 'fa fa-phone', placeholder: 'Enter your mobile number', credentialMethods: [password] }
    ];
  }

  private normalizeIdentityTypes(types?: SignupConfig['identityTypes']): SignupIdentityType[] | undefined {
    if (!types) { return undefined; }
    const normalized = Array.isArray(types[0]) ? (types as SignupIdentityType[][]).flat() : types as SignupIdentityType[];
    return normalized.length ? normalized : undefined;
  }

  private canCreateOrganization(type: SignupType): boolean {
    return type.view === 'organization' && type.roleType?.toLowerCase().includes('admin') === true;
  }

  private validateDestination(): string | undefined {
    if (this.view === 'employee' && !this.context.organization() && !this.organizationCode.trim()) {
      return 'Enter the organization code.';
    }
    if (this.view === 'organization' && !this.organizationCode.trim()) {
      return 'Enter the organization name and code.';
    }
    if (this.view === 'organization' && !this.organizationExists && !this.organizationName.trim()) {
      return 'Enter the organization name.';
    }
    if (this.view === 'individual' && !this.context.tenant() && !this.tenantCode.trim()) {
      return 'Enter the tenant code.';
    }
    if (this.view === 'tenant' && (!this.tenantName.trim() || !this.tenantCode.trim())) {
      return 'Enter the tenant name and code.';
    }
    return undefined;
  }

  private loadRoles(): void {
    const roles = this.context.user()?.roles || [];
    this.availableRoles = roles.map((role: any) => ({
      code: role.code || role.key,
      label: role.name || role.title || role.type?.name || role.type?.code || role.code,
      roleType: role.type?.code,
      view: this.signupTypes.find(type => type.roleType === role.type?.code)?.view,
      organization: role.organization,
      tenant: role.tenant
    }));
    if (!this.selectedRole) {
      this.selectedRole = this.availableRoles.find(role => role.roleType === this.roleType) || this.availableRoles[0];
    }
    if (!this.availableRoles.length) {
      this.availableRoles = this.signupTypes.map(type => ({ code: type.code, label: type.label, roleType: type.roleType, view: type.view }));
      this.selectedRole = this.availableRoles[0];
    }
  }

  private needsOrganizationStep(): boolean {
    if (this.view === 'employee' || this.view === 'organization') { return !this.context.organization()?.code; }
    if (this.view === 'individual' || this.view === 'tenant') { return !this.context.tenant()?.code; }
    return false;
  }

  private async codeExists(code: string, type: string): Promise<boolean> {
    try {
      const result: any = await this.auth.exists(code, type);
      return result === true || result?.exists === true || result?.data?.exists === true || result?.items?.length > 0;
    } catch (error: unknown) {
      throw new Error(`Unable to verify the ${type} code. Please try again.`);
    }
  }

  get contextTenantName(): string {
    const tenant = this.context.tenant();
    return tenant?.name || tenant?.code || '';
  }

  isEmployeeWithoutOrganization(): boolean {
    return this.view === 'employee' && !this.context.organization();
  }

  private getOrganization(): Organization | undefined {
    if (this.view === 'employee') {
      return this.context.organization() || new Organization({ code: this.organizationCode.trim() });
    }
    if (this.view === 'organization') {
      if (this.organizationExists) { return new Organization({ code: this.organizationCode.trim() }); }
      return new Organization({ name: this.organizationName.trim(), code: this.organizationCode.trim() });
    }
    return undefined;
  }

  private getTenant(): Tenant | undefined {
    if (this.view === 'tenant') { return new Tenant({ name: this.tenantName.trim(), code: this.tenantCode.trim() }); }
    if (this.view === 'individual') { return this.context.tenant() || new Tenant({ code: this.tenantCode.trim() }); }
    return undefined;
  }

  private defaultLabel(): string {
    switch (this.view) {
      case 'employee': return 'Join your organization';
      case 'organization': return 'Create an organization';
      case 'tenant': return 'Create a tenant';
      default: return 'Join this tenant';
    }
  }

  private defaultSignupTypes(): SignupType[] {
    return [
      { code: 'organization-member', label: 'Organization member', view: 'employee', roleType: 'organization.member' },
      { code: 'tenant-member', label: 'Tenant member', view: 'individual', roleType: 'tenant.member' },
      { code: 'organization-admin', label: 'Organization admin', view: 'organization', roleType: 'organization.admin' },
      { code: 'tenant-admin', label: 'Tenant admin', view: 'tenant', roleType: 'tenant.admin' }
    ];
  }

  private applicableSignupTypes(types: SignupType[]): SignupType[] {
    const hasTenant = !!this.context.tenant()?.code;
    const hasOrganization = !!this.context.organization()?.code;
    const applicableViews: SignupView[] = hasOrganization
      ? ['employee']
      : hasTenant
        ? ['employee', 'organization']
        : ['individual', 'tenant'];
    const applicable = types.filter(type => applicableViews.includes(type.view));
    return applicable.length ? applicable : types;
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
