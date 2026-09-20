import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Organization, Tenant, User } from '../../core/models';
import { Profile } from '../../core/models/profile.model';
import { Role } from '../../core/models/role.model';
import { AuthService } from '../../core/services';
import { ContextService } from '../../core/services/context.service';
import { ActionComponent } from "../../ux/action/action.component";

@Component({
  selector: 'oa-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  imports: [CommonModule, FormsModule, ActionComponent]
})
export class SignupComponent implements OnInit, OnDestroy {
  @Input() label?: string;
  @Input() options: any = {};
  @Input() style?: Record<string, string>;
  @Input() class?: string;
  @Input() typeCode?: string;
  @Input() source?: unknown;
  @Input() oneStep = true;
  @Input() sessionId?: string | number;
  @Input() tokenString?: string;
  @Input() organization?: Organization;

  @Output() valueChange = new EventEmitter<Role>();
  @Output() created = new EventEmitter<void>();
  @Output() processing = new EventEmitter<boolean>();
  @Output() success = new EventEmitter<Role | undefined>();
  @Output() failure = new EventEmitter<Error>();

  profile = new Profile({});
  password = '';
  confirmPassword = '';
  otp = '';

  organizationName = '';
  organizationCode = '';
  tenantName = '';
  tenantCode = '';

  error?: string;
  isProcessing = false;

  availableRoles: any[] = [];
  selectedRole?: any;

  identityTypes: any[] = [];
  selectedIdentityType: any;

  credentialMethods: any[] = []
  selectedCredentialMethod: any;

  identityValue = '';

  steps: any[] = [];
  currentStep: any;

  signupType = '';
  isLoggedIn = false;
  verificationInitiated = false;
  verificationDone = false;
  verificationRetry = false;
  countdownSeconds = 0;

  createdRole: any;



  private resendTimer?: ReturnType<typeof setInterval>;
  private auth = inject(AuthService);
  private context = inject(ContextService);

  ngOnInit(): void {
    const currentUser = this.context.user();
    this.isLoggedIn = !!currentUser?.id;

    // this.view = this.options.view || this.view;
    this.label = this.options.label || this.label;
    this.typeCode = this.options.typeCode || this.typeCode;
    this.source = this.options.source || this.source;
    this.steps = this.options.steps || [];

    this.selectStep('user')


    // const configuredSignupType = this.signupTypes.find(type => type.view === this.view) || this.signupTypes[0];
    // this.signupType = configuredSignupType?.code || '';
    // if (configuredSignupType) {
    //   this.view = configuredSignupType.view;
    //   this.roleType = configuredSignupType.roleType;
    //   this.allowOrganizationCreate = this.canCreateOrganization(configuredSignupType);
    // }

    if (this.isLoggedIn) {
      this.profile = currentUser?.profile || this.profile;
      if (currentUser?.email) {
        this.identityValue = currentUser?.email
        this.selectedIdentityType = this.identityTypes.find(type => type.code === 'email')
      } else if (currentUser?.phone) {
        this.identityValue = currentUser?.phone
        this.selectedIdentityType = this.identityTypes.find(type => type.code === 'phone')
      }
      this.selectStep('roles')
    }
  }

  ngOnDestroy(): void { this.stopResendTimer(); }

  selectStep(code: string): void {
    this.error = undefined;

    this.currentStep = this.steps.find(s => s.code === code);

    switch (code) {
      case 'user':
        this.identityTypes = this.currentStep?.identityTypes;
        this.selectIdentityType(this.identityTypes[0]);
        break;

      case 'credentials':
        this.credentialMethods = this.currentStep?.methods;
        this.selectCredentialMethod(this.credentialMethods[0]);
        break;

      case 'roles':
        this.availableRoles = this.currentStep?.roles.filter((r: { level: string; create: any; }) => {
          // Check if there's a tenant in context
          if (this.context.tenant()?.id) {
            if (this.context.organization()?.id) {// Case 1: Tenant + Organization context
              return r.level === 'organization' && !r.create
            } else { // Case 2: Tenant only (no organization)
              return r.level === 'organization' || (r.level === 'tenant' && !this.isLoggedIn && !r.create)
            }
          } else {// Case 3: No tenant (probably creating a new tenant)
            return r.level === 'tenant' && !!r.create
          }
        })
        this.selectRole(this.availableRoles[0])
        break;

      case 'success':
        if (this.currentStep.next?.value === 'switch-role') {
          this.currentStep.next.event = this.switchRole
        }
        break;
    }

    return this.currentStep;
  }

  nextStep(): void {
    switch (this.currentStep?.code) {
      case 'user':
        this.selectStep('credentials');
        break;

      case 'credentials':
        this.selectStep('roles');
        break;

      case 'roles':
        this.selectStep('team');
        break;
      case 'team':
        this.selectStep('review');
        break;
    }
  }

  previousStep(): void {
    this.error = undefined;
    switch (this.currentStep.code) {
      case 'user':
        break;
      case 'roles':
        break;
      case 'team':
        if (this.availableRoles.length >= 1) {
          this.selectStep('roles');
        }
        break;
      case 'review':
        this.selectStep('team');
        break;
    }
  }

  selectIdentityType(type: any): void {
    if (!type) { return; }
    this.selectedIdentityType = type;
    this.otp = '';
    this.error = undefined;
  }

  selectCredentialMethod(method: any): void {
    this.selectedCredentialMethod = method;
    this.error = undefined;
    this.password = '';
    this.confirmPassword = '';
  }

  selectRole(role: any): void {
    this.selectedRole = role;
    switch (this.selectedRole.level) {
      case 'organization':
        this.organizationCode = role.organization?.code || this.organizationCode;
        break;

      case 'tenant':
        this.tenantCode = role.tenant?.code || this.tenantCode;
        break;
    }
    this.error = undefined;
  }

  async validateUser(): Promise<void> {
    if (this.isProcessing) { return; }

    if (this.isLoggedIn) {
      this.currentStep = this.steps.find(s => s.code === 'roles')
      return;
    }

    if (!this.profile.firstName?.trim() || !this.profile.lastName?.trim()) { this.setError('Enter your first and last name.'); return; }

    const validators = this.selectedIdentityType.validators || {};
    if (validators.required && !this.identityValue) { this.setError(validators.required.message); return; }
    if (validators.pattern) {
      const compiledPattern = new RegExp(validators.pattern.regex, validators.pattern.flags || '');
      if (!compiledPattern.test(this.identityValue)) { this.setError(validators.pattern.message); return; }
    }

    this.setProcessing(true);
    this.error = undefined;
    try {
      // if (validators.shouldExist) {
      //   const exist = await this.codeExists(this.identityValue, this.selectedIdentityType.code);
      //   if ((validators.shouldExist.exist && exist) || (!validators.shouldExist.exist && !exist)) { this.setError(validators.shouldExist.message); return; }
      // }

      const userModel: any = {}
      userModel[this.selectedIdentityType?.code] = this.identityValue;
      userModel.profile = this.profile;

      const session: any = await this.auth.signup(userModel, this.source);
      this.sessionId = session.id;
      if (!this.sessionId) { throw new Error('Signup did not return a confirmation session.'); }
      this.verificationInitiated = true;
    } catch (error: unknown) {
      this.setError(this.errorMessage(error));
    } finally {
      this.setProcessing(false);
    }
  }

  async confirmOtp(): Promise<void> {
    if (this.isProcessing || !this.sessionId) { return; }
    if (!this.otp.trim()) { this.setError('Enter the verification code.'); return; }

    this.setProcessing(true);
    this.error = undefined;
    try {
      await this.auth.verifyOtp(this.sessionId, this.otp.trim());
      this.verificationInitiated = false;
      this.verificationDone = true;
      this.nextStep();

    } catch (error: unknown) {
      this.setError(this.errorMessage(error));
    } finally {
      this.setProcessing(false);
    }
  }

  async resendOtp(): Promise<void> {
    if (!this.verificationRetry || this.isProcessing) { return; }
    if (!this.identityValue?.trim()) { this.setError(`Enter an ${this.selectedIdentityType?.code} before requesting a new code.`); return; }

    this.setProcessing(true);
    this.error = undefined;
    try {
      const session: any = await this.auth.sendOtp(this.identityValue, this.selectedIdentityType?.code, '');
      this.sessionId = session?.id || this.sessionId;
      this.startResendTimer();
    } catch (error: unknown) {
      this.setError(this.errorMessage(error));
    } finally {
      this.setProcessing(false);
    }
  }

  async setCredentials() {
    if (this.isProcessing || !this.sessionId) { return; }

    const validators = this.selectedCredentialMethod.validators || {};
    if (validators.required && !this.password.trim()) { this.setError(validators.required.message); return; }
    if (validators.match && this.password !== this.confirmPassword) { this.setError(validators.match.message); return; }
    if (validators.policy) { const policyError = this.validatePasswordPolicy(validators.policy); if (policyError) { this.setError(policyError); return; } }

    this.setProcessing(true);
    this.error = undefined;
    try {
      await this.auth.setPassword(this.password.trim());
      this.nextStep()
    } catch (error: unknown) {
      this.setError(this.errorMessage(error));
    } finally {
      this.setProcessing(false);
    }
  }





  private validatePasswordPolicy(policy: any): string | undefined {
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

  async validateRole(role: any): Promise<void> {
    if (this.selectedRole.level === 'organization') {
      return this.validateOrganization(role)
    }
    return this.validateTenant(role)
  }

  async validateOrganization(role: any): Promise<void> {
    const code = this.organizationCode.trim();

    const codeValidators = role.input?.validators || {};
    const createValidators = role.create?.validators || {};
    if (codeValidators.required && !code) { this.setError(codeValidators.required.message); return; }
    if (createValidators.required && !this.organizationName.trim()) { this.setError(createValidators.required.message); return; }


    this.setProcessing(true);
    try {
      // if (codeValidators.shouldExist) {
      //   const exist = await this.codeExists(code, 'organization');
      //   if ((codeValidators.shouldExist.exist && exist) || (!codeValidators.shouldExist.exist && !exist)) { this.setError(codeValidators.shouldExist.message); return; }
      // }

      this.nextStep()
    } catch (error: unknown) {
      this.setError(this.errorMessage(error));
    }
    finally {
      this.setProcessing(false);
    }
  }

  async validateTenant(role: any): Promise<void> {
    const code = this.tenantCode.trim();
    const codeValidators = role.input?.validators || {};
    const createValidators = role.create?.validators || {};
    if (codeValidators.required && !code) { this.setError(codeValidators.required.message); return; }
    if (createValidators.required && !this.tenantName.trim()) { this.setError(createValidators.required.message); return; }

    this.setProcessing(true);
    try {
      // if (codeValidators.shouldExist) {
      //   const exist = await this.codeExists(code, 'tenant');
      //   if ((codeValidators.shouldExist.exist && exist) || (!codeValidators.shouldExist.exist && !exist)) { this.setError(codeValidators.shouldExist.message); return; }
      // }
      this.nextStep();
    } catch (error: unknown) {
      this.setError(this.errorMessage(error));
    }
    finally {
      this.setProcessing(false);
    }
  }

  async createRole(selectedRole: any): Promise<void> {
    if (this.isProcessing) { return; }
    // const validationError = this.validateDestination();
    // if (validationError) { this.setError(validationError); return; }
    // if (!this.isLoggedIn && !this.verificationDone) { this.setError('Verify your account before continuing.'); return; }

    this.setProcessing(true);
    this.error = undefined;
    try {

      const roleModel: any = {
      }

      if (selectedRole.level === 'tenant') {
        roleModel.tenant = {
          code: this.tenantCode,
          name: this.tenantName
        }
      }

      if (selectedRole.level === 'organization') {
        roleModel.organization = {
          code: this.organizationCode,
          name: this.organizationName
        }
      }

      if (selectedRole.type) {
        roleModel.type = { code: selectedRole.type }
      }

      this.createdRole = await this.auth.createRole(roleModel)

      // const userModel: any = {}
      // userModel[this.selectedIdentityType?.code] = this.identityValue;
      // userModel.pofile = this.profile;

      this.selectStep('success');
      this.valueChange.emit(this.createdRole);
      this.created.emit();
    } catch (error: unknown) { this.setError(this.errorMessage(error)); }
    finally { this.setProcessing(false); }
  }

  async switchRole(): Promise<void> {
    this.auth.switchRole(this.createdRole)
  }

  // private validateDestination(): string | undefined {
  //   if (!this.selectedRole) { return 'Choose a role.'; }
  //   if (this.selectedRole.level === 'organization' && !this.organizationCode.trim()) {
  //     return this.selectedRole.input?.validators?.required?.message || 'Enter the team code.';
  //   }
  //   if (this.selectedRole.level === 'tenant' && !this.tenantCode.trim()) {
  //     return this.selectedRole.input?.validators?.required?.message || 'Enter the tenant code.';
  //   }
  //   return undefined;
  // }

  private async codeExists(code: string, type: string): Promise<boolean> {
    try {
      const result: any = await this.auth.exists(code, type);
      return result === true || result?.exists === true || result?.data?.exists === true || result?.items?.length > 0;
    } catch (error: unknown) {
      throw new Error(`Unable to verify the ${type}. Please try again.`);
    }
  }

  private setProcessing(value: boolean): void { this.isProcessing = value; this.processing.emit(value); }
  private setError(message: string): void { this.error = message; this.failure.emit(new Error(message)); }
  private errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Unable to complete signup. Please try again.'; }

  private startResendTimer(): void {
    this.stopResendTimer();
    this.verificationRetry = false;
    this.countdownSeconds = 30;
    this.resendTimer = setInterval(() => {
      this.countdownSeconds -= 1;
      if (this.countdownSeconds <= 0) { this.stopResendTimer(); this.verificationRetry = true; }
    }, 1000);
  }

  private stopResendTimer(): void {
    if (this.resendTimer) { clearInterval(this.resendTimer); this.resendTimer = undefined; }
  }
}
