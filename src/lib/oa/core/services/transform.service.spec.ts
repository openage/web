/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { TransformService } from './transform.service';

describe('Service: Transform', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TransformService]
    });
  });

  it('should ...', inject([TransformService], (service: TransformService) => {
    expect(service).toBeTruthy();
  }));
});
