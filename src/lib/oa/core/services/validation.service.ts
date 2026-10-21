import { Injectable } from '@angular/core';
import { BuilderValidationError } from '../../../oa/ux/builder/builder-metadata.model';

interface SchemaNode {
  $ref?: string;
  type?: string | string[];
  enum?: unknown[];
  const?: unknown;
  required?: string[];
  properties?: Record<string, SchemaNode>;
  items?: SchemaNode;
  oneOf?: SchemaNode[];
  minLength?: number;
  minItems?: number;
  minimum?: number;
  maximum?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ValidationService {

  constructor() { }

  validate(data: unknown, schema: Record<string, unknown>): BuilderValidationError[] {
    const errors: BuilderValidationError[] = [];
    const root = schema as SchemaNode;
    this.validateNode(data, root, root, '$', errors, 0);
    return errors;
  }

  private validateNode(
    value: unknown,
    schema: SchemaNode,
    root: SchemaNode,
    path: string,
    errors: BuilderValidationError[],
    depth: number
  ): void {
    if (depth > 64) {
      errors.push({ path, message: 'Schema nesting exceeds the supported validation depth.' });
      return;
    }

    if (schema.$ref) {
      const referenced = this.resolveReference(schema.$ref, root);
      if (!referenced) {
        errors.push({ path, message: `Unresolved schema reference "${schema.$ref}".` });
        return;
      }
      this.validateNode(value, referenced, root, path, errors, depth + 1);
      return;
    }

    if (schema.oneOf?.length) {
      const matches = schema.oneOf.map((option) => {
        const optionErrors: BuilderValidationError[] = [];
        this.validateNode(value, option, root, path, optionErrors, depth + 1);
        return optionErrors;
      }).filter((optionErrors) => optionErrors.length === 0);
      if (matches.length !== 1) {
        errors.push({ path, message: `Expected a value matching exactly one of ${schema.oneOf.length} schema variants.` });
      }
      return;
    }

    const expectedTypes = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
    if (expectedTypes.length && !expectedTypes.some((type) => this.matchesType(value, type))) {
      errors.push({
        path,
        message: `Expected ${expectedTypes.join(' or ')}, received ${this.describeType(value)}.`,
        suggestion: `Provide a ${expectedTypes[0]} value.`
      });
      return;
    }

    if (schema.const !== undefined && value !== schema.const) {
      errors.push({ path, message: `Expected the constant value ${JSON.stringify(schema.const)}.` });
    }
    if (schema.enum && !schema.enum.some((candidate) => candidate === value)) {
      errors.push({ path, message: `Value must be one of: ${schema.enum.map(String).join(', ')}.` });
    }

    if (typeof value === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push({ path, message: `Must contain at least ${schema.minLength} character(s).` });
      }
      return;
    }

    if (typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push({ path, message: `Must be at least ${schema.minimum}.` });
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push({ path, message: `Must be at most ${schema.maximum}.` });
      }
      return;
    }

    if (Array.isArray(value)) {
      if (schema.minItems !== undefined && value.length < schema.minItems) {
        errors.push({ path, message: `Must contain at least ${schema.minItems} item(s).` });
      }
      if (schema.items) {
        value.forEach((item, index) => this.validateNode(item, schema.items!, root, `${path}[${index}]`, errors, depth + 1));
      }
      return;
    }

    if (value && typeof value === 'object') {
      const objectValue = value as Record<string, unknown>;
      for (const required of schema.required || []) {
        if (!(required in objectValue)) {
          errors.push({ path: `${path}.${required}`, message: 'Required property is missing.' });
        }
      }
      for (const [key, propertySchema] of Object.entries(schema.properties || {})) {
        if (key in objectValue) {
          this.validateNode(objectValue[key], propertySchema, root, `${path}.${key}`, errors, depth + 1);
        }
      }
    }
  }

  private resolveReference(reference: string, root: SchemaNode): SchemaNode | undefined {
    if (!reference.startsWith('#/')) return undefined;
    return reference.slice(2).split('/').reduce<unknown>((current, segment) => {
      if (!current || typeof current !== 'object') return undefined;
      return (current as Record<string, unknown>)[segment.replace(/~1/g, '/').replace(/~0/g, '~')];
    }, root) as SchemaNode | undefined;
  }

  private matchesType(value: unknown, expected: string): boolean {
    switch (expected) {
      case 'object': return value !== null && typeof value === 'object' && !Array.isArray(value);
      case 'array': return Array.isArray(value);
      case 'integer': return typeof value === 'number' && Number.isInteger(value);
      case 'number': return typeof value === 'number' && Number.isFinite(value);
      case 'null': return value === null;
      case 'string': return typeof value === 'string';
      case 'boolean': return typeof value === 'boolean';
      default: return true;
    }
  }

  private describeType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

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
