import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services';
import { NavService } from '../../core/services/nav.service';

interface LoginConfig {
  message?: string;
  password?: { signupLink?: boolean };
  view?: string;
}

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
    const params = this.route.snapshot.queryParams;
    const redirectUrl = params['redirectUrl'] || params['redirect-url'] || params['redirect'] || '/home/dashboard';
    this.auth.setRedirectUrl(redirectUrl);
  }

  async login() {
    if (this.isSubmitting) { return; }

    this.error = undefined;
    const identity = this.identity.trim();
    if (!identity || !this.password) {
      this.error = 'Enter your email or mobile number and password.';
      return;
    }

    this.isSubmitting = true;
    try {
      await this.auth.verifyPassword(
        identity.includes('@') ? identity : '',
        identity.includes('@') ? '' : identity,
        '',
        this.password
      );
      this.onLogin();
    } catch (error: unknown) {
      this.error = error instanceof Error ? error.message : 'Unable to sign in. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  onLogin() {
    this.navService.goto(this.auth.getRedirectUrl());
  }

  signUp() {
    this.navService.goto('auth.signup');
  }
}
