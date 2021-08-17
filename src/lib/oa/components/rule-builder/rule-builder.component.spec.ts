import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RuleBuilderComponent } from './rule-builder.component';

describe('RuleBuilderComponent', () => {
  let component: RuleBuilderComponent;
  let fixture: ComponentFixture<RuleBuilderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RuleBuilderComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RuleBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
