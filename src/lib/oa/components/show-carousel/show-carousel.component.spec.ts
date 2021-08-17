import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ShowCarouselComponent } from './show-carousel.component';

describe('ShowCarouselComponent', () => {
  let component: ShowCarouselComponent;
  let fixture: ComponentFixture<ShowCarouselComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowCarouselComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
