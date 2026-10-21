import { TestBed } from '@angular/core/testing';

import { ValidationService } from './validation.service';

describe('ValidationService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ValidationService = TestBed.inject(ValidationService);
    expect(service).toBeTruthy();
  });

  it('reports missing required properties and invalid nested types', () => {
    const service = TestBed.inject(ValidationService);
    const errors = service.validate(
      { meta: { layout: { sections: 'not-an-array' } } },
      {
        type: 'object',
        required: ['code'],
        properties: {
          meta: {
            type: 'object',
            properties: {
              layout: {
                type: 'object',
                properties: { sections: { type: 'array' } }
              }
            }
          }
        }
      }
    );
    expect(errors.map((error) => error.path)).toEqual(['$.code', '$.meta.layout.sections']);
  });

  it('resolves local schema references and validates array items', () => {
    const service = TestBed.inject(ValidationService);
    const errors = service.validate(
      { sections: [{ title: '' }, { title: 'Valid' }] },
      {
        type: 'object',
        properties: {
          sections: { type: 'array', items: { $ref: '#/$defs/section' } }
        },
        $defs: {
          section: {
            type: 'object',
            required: ['title'],
            properties: { title: { type: 'string', minLength: 1 } }
          }
        }
      }
    );
    expect(errors.length).toBe(1);
    expect(errors[0].path).toBe('$.sections[0].title');
  });

  it('accepts exactly one matching oneOf branch', () => {
    const service = TestBed.inject(ValidationService);
    const schema = {
      oneOf: [
        { type: 'string' },
        { type: 'number' }
      ]
    };
    expect(service.validate('value', schema).length).toBe(0);
    expect(service.validate(true, schema).length).toBe(1);
  });

  it('reports required, minimum-length, and array-item schema violations at their paths', () => {
    const service = TestBed.inject(ValidationService);
    const errors = service.validate(
      { code: '', services: [false] },
      {
        type: 'object',
        required: ['code', 'title', 'services'],
        properties: {
          code: { type: 'string', minLength: 1 },
          title: { type: 'string', minLength: 1 },
          services: { type: 'array', items: { type: 'object' } }
        }
      }
    );
    expect(errors.map((error) => error.path)).toEqual(['$.title', '$.code', '$.services[0]']);
  });
});
