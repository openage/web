/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { RouteDataResolver } from './route-data.resolver';

describe('Resolver: RouteData', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RouteDataResolver]
    });
  });

  it('should ...', inject([RouteDataResolver], (service: RouteDataResolver) => {
    expect(service).toBeTruthy();
  }));
});
