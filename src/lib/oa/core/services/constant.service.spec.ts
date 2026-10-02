import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ConstantService } from './constant.service';

describe('ConstantService', () => {
  let service: ConstantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConstantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should tolerate action definitions without a code', () => {
    const action = { title: 'Save Changes', config: { target: { service: 'registry' } } };

    expect(() => service.actions.get(action)).not.toThrow();

    const resolved = service.actions.get(action);
    expect(resolved.title).toBe('Save Changes');
  });
});
