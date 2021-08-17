import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UnitPickerComponent } from './unit-picker.component';

describe('UnitPickerComponent', () => {
  let component: UnitPickerComponent;
  let fixture: ComponentFixture<UnitPickerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UnitPickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnitPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
