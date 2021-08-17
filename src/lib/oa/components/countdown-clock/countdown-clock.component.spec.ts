import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CountdownClockComponent } from './countdown-clock.component';

describe('CountdownClockComponent', () => {
  let component: CountdownClockComponent;
  let fixture: ComponentFixture<CountdownClockComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CountdownClockComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CountdownClockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
