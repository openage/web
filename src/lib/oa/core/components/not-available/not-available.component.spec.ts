import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NotAvailableComponent } from './not-available.component';

describe('NotAvailableComponent', () => {
  let component: NotAvailableComponent;
  let fixture: ComponentFixture<NotAvailableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NotAvailableComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotAvailableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
