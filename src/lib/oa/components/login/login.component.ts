import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services';
import { NavService } from '../../core/services/nav.service';
import { ActionComponent } from '../../ux/action/action.component';
import { Role } from '../../core/models/role.model';

@Component({
  selector: 'oa-login',
  templateUrl: './login.component.html',
  imports: [CommonModule, FormsModule, ActionComponent]
})
export class LoginComponent implements OnInit {

  @Input() label?: string;

  @Input() options?: any = {};
  @Input() style?: any;
  @Input() class?: string;
  @Input() view?: string;

  @Input() value: any;

  @Output() valueChange: EventEmitter<any> = new EventEmitter();
  @Output() processing = new EventEmitter<boolean>();
  @Output() success = new EventEmitter<Role | undefined>();
  @Output() failure = new EventEmitter<Error>();

  password = '';
  otp = '';

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

  oauthProviders: any[] = [];
  passwordLoginFailed = false;

  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private navService = inject(NavService);

  ngOnInit() {
    this.options = this.options || {};
    this.view = this.options.view || this.view;
    this.label = this.options.label || this.label;

    this.steps = this.options.steps || [];
    this.selectStep('user')

    const params = this.route.snapshot.queryParams;
    const redirectUrl = params['redirectUrl'] || params['redirect-url'] || params['redirect'];
    this.auth.setRedirectUrl(redirectUrl);
  }

  selectStep(code: string): void {
    this.error = undefined;
    this.currentStep = this.steps.find(s => s.code === code);

    switch (code) {
      case 'user':
        this.identityTypes = this.currentStep?.identityTypes;
        this.selectIdentityType(this.identityTypes[0]);
        this.credentialMethods = [];
        break;

      case 'credentials':
        this.credentialMethods = this.currentStep?.methods || [];
        this.selectCredentialMethod(this.credentialMethods[0]);
        break;
    }

    return this.currentStep;
  }

  nextStep() {
    switch (this.currentStep?.code) {
      case 'user':
        this.selectStep('credentials')
        break;

      case 'credentials':
        this.selectStep('roles')
        break;

      case 'roles':
        this.continueWithRole();
        break;
    }
  }

  previousStep() {
    if (this.currentStep?.code === 'credentials') {
      this.selectStep('user');
    }
  }

  selectIdentityType(type: any): void {
    if (!type) { return; }
    this.selectedIdentityType = type;
    this.error = undefined;
    this.passwordLoginFailed = false;
    this.identityValue = '';
    this.password = '';
    this.otp = '';
  }

  selectCredentialMethod(method: any): void {
    this.selectedCredentialMethod = method;
    this.error = undefined;
    this.password = '';
    this.passwordLoginFailed = false;
  }

  private setProcessing(value: boolean): void { this.isProcessing = value; this.processing.emit(value); }
  private setError(message: string): void { this.error = message; this.failure.emit(new Error(message)); }
  private errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Please try again.'; }

  async validateUser(): Promise<void> {
    if (this.isProcessing) { return; }

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

      this.nextStep()
    } catch (error: unknown) {
      this.setError(this.errorMessage(error));
    } finally {
      this.setProcessing(false);
    }
  }

  async login() {
    if (this.isProcessing) { return; }

    if (this.selectedCredentialMethod === 'push') {
      this.setError('Not Implmented')
      return;
    }

    this.error = undefined;
    const validators = this.selectedCredentialMethod.validators || {};
    if (validators.required && !this.password.trim()) { this.setError(validators.required.message); return; }

    const user: any = {};
    user[this.selectedIdentityType?.code] = this.identityValue;
    const credentials: any = {};
    credentials[this.selectedCredentialMethod.code] = this.selectedCredentialMethod.code === 'password' ? this.password : this.otp
    this.isProcessing = true;

    try {
      await this.auth.login(user, credentials);
      this.availableRoles = await this.auth.getMyRoles();
      this.selectRole(this.availableRoles[0])

      if (this.availableRoles.length > 1) {
        this.selectStep('roles');
        return;
      } else {
        this.skipRoleSelection()
      }

    } catch (error: unknown) {
      this.passwordLoginFailed = this.selectedCredentialMethod === 'password';
      this.errorMessage(error)
    } finally {
      this.isProcessing = false;
    }
  }

  async requestOtp() {
    this.error = undefined;
    this.isProcessing = true;
    try {
      await this.auth.sendOtp(this.identityValue.trim(), this.selectedIdentityType.code);
    } catch (error: unknown) {
      this.errorMessage(error)
    } finally {
      this.isProcessing = false;
    }
  }

  oauth(provider: any) {
    if (!provider.url) {
      this.error = `The ${provider.label} login is not configured.`;
      return;
    }
    window.location.assign(provider.url);
  }

  selectRole(role: any): void {
    this.selectedRole = role;
    this.error = undefined;
  }

  async continueWithRole() {
    if (!this.selectedRole) {
      this.selectedRole = this.availableRoles[0]
    }
    await this.auth.switchRole(this.selectedRole);
    this.navService.goto(this.auth.getRedirectUrl() || '/');
  }

  skipRoleSelection() {
    this.navService.goto(this.auth.getRedirectUrl() || '/');
  }
}
