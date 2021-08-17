import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ValidationService {

  constructor() { }

  textLength = 100;
  passwordMinLength = 6;
  passwordMaxLength = 12;
  portNumberLength = 6;
  pinCodeLength = 6;
  userCodeLength = 5;
  organizationCodeLength = 3;
  tenantCodeLength = 3;

  password: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;

  code: RegExp = /^[a-zA-Z0-9]*$/;

  name: RegExp = /^[_A-z0-9]*((-|\s)*[_A-z0-9])*$/;

  orgName: RegExp = /^[ A-Za-z0-9_.&_']*$/;

  number: RegExp = /^[0-9]*$/;

  bssid: RegExp = /^(([A-Fa-f0-9]{2}[:]){5}[A-Fa-f0-9]{2}[,]?)+$/;

  gst: RegExp = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  pan: RegExp = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
  // eslint-disable-next-line max-len
  email: RegExp = /^(([^<>()\[\]\\.,;:+\s@"]+(\.[^<>()\[\]\\.,;:+\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  numberWithTwoDecimals: RegExp = /^[0-9]+(\.[0-9]{1,2})?$/;
  // eslint-disable-next-line max-len
  ipAddress: RegExp = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // eslint-disable-next-line max-len
  mobile: RegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  isMobileValid(value: string | number): any {
    const identity = `${value}`;
    // if (!identity.match(/^\d{10}$/) &&
    //   !identity.match(/^(\+\d{1,3}[- ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/)) {
    //   return { code: 'INVALID' };
    // }
    if (!identity.match(/((\+*)((0[ -]*)*|((91 )*))((\d{12})+|(\d{10})+))|\d{5}([- ]*)\d{6}/)) {
      return { code: 'PHONE_DMC' };
    }
  }

  isGSTValid(value: string): any {
    if (!this.gst.test(value)) {
      return { code: 'GST_DMC' };
    }
  }

  isPANValid(value: string): any {
    if (!this.pan.test(value)) {
      return { code: 'PAN_DMC' };
    }
  }

  isNameValid(value: string): any {
    if (!this.name.test(value)) {
      return { code: 'NAME_DMC' };
    }
  }

  isOrgNameValid(value: string): any {
    if (!this.orgName.test(value)) {
      return { code: 'ORGANIZATION_NAME_DMC' };
    }
  }

  isBssidValid(value: string): any {
    if (!this.bssid.test(value)) {
      return { code: 'BSSID_DMC' };
    }
  }

  isEmailValid(value: string): any {
    if (!this.email.test(value)) {
      return { code: 'EMAIL_DMC' };
    }
  }

  isIpAddressValid(value: string): any {
    if (!this.ipAddress.test(value)) {
      return { code: 'IPA_DMC' };
    }
  }

  isCodeValid(value: string): any {
    if (!value || !this.code.test(value) || value.length < 3) {
      return { code: 'CODE_DMC' };
    }
  }

  isUserCodeValid(value: string): any {
    if (!value || value.length < this.userCodeLength) {
      return { code: 'USER_CODE_DMC' }
    }
  }

  isOrganizationCodeValid(value: string): any {
    if (!value || value.length < this.organizationCodeLength) {
      return { code: 'ORGANIZATION_CODE_DMC' };
    }
  }

  isTenantCodeValid(value: string): any {
    if (!value || value.length < this.tenantCodeLength) {
      return { code: 'TENANT_CODE_DMC' };
    }
  }

  isPasswordValid(value: string): any {
    if (!value || value.length < this.passwordMinLength || value.length > this.passwordMaxLength || !this.password.test(value)) {
      return { code: 'PASSWORD_DMC' };
    }
  }

  isAccountNumberValid(value: string | number): any {
    const identity = `${value}`;

    if (identity.length < 6 || identity.length > 18) {
      return { code: 'ACCOUNT_CODE_DMC' };
    }

  }
}
