import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InputSelectorComponent } from './input-selector.component';

describe('InputSelectorComponent', () => {
  let component: InputSelectorComponent;
  let fixture: ComponentFixture<InputSelectorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [InputSelectorComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
