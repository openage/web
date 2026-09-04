import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicPageComponent } from './dynamic-page.component';

describe('DynamicPageComponent', () => {
  let component: DynamicPageComponent;
  let fixture: ComponentFixture<DynamicPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DynamicPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
