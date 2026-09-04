import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services';
import { NavService } from '../../core/services/nav.service';

@Component({
  selector: 'oa-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule]
})
export class LoginComponent implements OnInit {

  @Input()
  label?: string;

  @Input()
  value: any;

  @Input()
  config?: any = {};

  @Output()
  valueChange: EventEmitter<any> = new EventEmitter();

  @Input()
  style?: any;

  @Input()
  class?: string;

  @Input()
  view?: string;

  identity = '';
  password = '';
  otp = '';
  identityType = 'email';
  identityTypes: any[] = [{
    code: 'email',
    label: 'Email',
    icon: 'fa fa-envelope',
    placeholder: 'abc@example.com',
    credentialMethods: [{ code: 'password', label: 'Password', icon: 'fa fa-lock' }]
  }];

  credentialMethod = 'password';
  oauthProviders: any[] = [];
  action = 'Login';
  passwordLoginFailed = false;

  private loginSessionId = '';

  @Input()
  error?: string;

  isSubmitting = false;

  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private navService = inject(NavService);

  ngOnInit() {
    this.config = this.config || {};
    this.label = this.config.label || this.label;
    this.view = this.config.view || this.view;
    this.action = this.config.action || this.action;
    this.identityTypes = this.config.identityTypes || [{
      code: 'email',
      label: 'Email',
      icon: 'fa fa-envelope',
      placeholder: 'abc@example.com',
      credentialMethods: [{ code: 'password', label: 'Password', icon: 'fa fa-lock' }]
    }];
    this.identityType = this.identityTypes[0]?.code || 'email';
    this.credentialMethod = this.credentialMethods[0]?.code || 'password';
    this.oauthProviders = this.config.oauthProviders || []
    const params = this.route.snapshot.queryParams;
    const redirectUrl = params['redirectUrl'] || params['redirect-url'] || params['redirect'] || '/home';
    this.auth.setRedirectUrl(redirectUrl);
  }

  async login() {
    if (this.isSubmitting) { return; }

    this.error = undefined;
    this.passwordLoginFailed = false;
    const identity = this.identity.trim();
    if (!identity ||
      (this.credentialMethod === 'password' && !this.password) ||
      (this.credentialMethod === 'otp' && !this.otp)) {
      this.error = `Enter your ${this.identityLabel?.toLowerCase()} and ${this.credentialLabel}.`;
      return;
    }

    this.isSubmitting = true;
    try {
      const credentials = this.identityCredentials(identity);
      if (this.credentialMethod === 'otp') {
        await this.auth.verifyLoginOtp(credentials.email, credentials.mobile, credentials.code, this.otp, this.loginSessionId);
      } else {
        await this.auth.verifyPassword(credentials.email, credentials.mobile, credentials.code,
          this.credentialMethod === 'password' ? this.password : '', undefined, undefined, this.credentialMethod);
      }
      this.onLogin();
    } catch (error: unknown) {
      this.passwordLoginFailed = this.credentialMethod === 'password';
      this.error = error instanceof Error ? error.message : 'Unable to sign in. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  async requestOtp() {
    const identity = this.identity.trim();
    if (!identity) {
      this.error = `Enter your ${this.identityLabel?.toLowerCase()} first.`;
      return;
    }

    this.error = undefined;
    this.isSubmitting = true;
    try {
      const credentials = this.identityCredentials(identity);
      const session = await this.auth.sendLoginOtp(credentials.email, credentials.mobile, credentials.code);
      this.loginSessionId = session?.id || session?.sessionId || '';
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to send the verification code.';
    } finally {
      this.isSubmitting = false;
    }
  }

  oauth(provider: any) {
    if (!provider.url) {
      this.error = `The ${provider.label} login is not configured.`;
      return;
    }
    window.location.assign(provider.url);
  }

  get identityLabel() {
    return this.identityTypes.find(i => i.code === this.identityType)?.label;
  }

  selectIdentityType(code: string) {
    this.identityType = code;
    this.credentialMethod = this.credentialMethods[0]?.code || 'password';
    this.passwordLoginFailed = false;
    this.identity = '';
    this.password = '';
    this.otp = '';
  }

  selectCredentialMethod(code: string) {
    this.credentialMethod = code;
    this.passwordLoginFailed = false;
  }

  get credentialLabel() {
    return this.credentialMethods.find((i: { code: string; }) => i.code === this.credentialMethod)?.label;
  }

  get credentialMethods() {
    return this.identityTypes.find(i => i.code === this.identityType)?.credentialMethods || [];
  }

  get identityPlaceholder() {
    return this.identityTypes.find(i => i.code === this.identityType)?.placeholder || '';
  }

  private identityCredentials(identity: string) {
    if (this.identityType === 'email' && identity.includes('@')) {
      return { email: identity, mobile: '', code: '' };
    }
    if (this.identityType === 'mobile' && /^\+?[\d ()-]+$/.test(identity)) {
      return { email: '', mobile: identity, code: '' };
    }
    return { email: '', mobile: '', code: identity };
  }

  onLogin() {
    this.navService.goto(this.auth.getRedirectUrl());
  }

  signUp() {
    this.navService.goto('auth.signup');
  }

  passwordReset() {
    this.navService.goto('auth.forgot-password');
  }
}
