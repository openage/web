import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GotoEntityButtonComponent } from './goto-entity-button.component';

describe('GotoEntityButtonComponent', () => {
  let component: GotoEntityButtonComponent;
  let fixture: ComponentFixture<GotoEntityButtonComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GotoEntityButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GotoEntityButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
