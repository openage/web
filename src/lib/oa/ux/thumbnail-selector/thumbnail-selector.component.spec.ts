import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThumbnailSelectorComponent } from './thumbnail-selector.component';

describe('ThumbnailSelectorComponent', () => {
  let component: ThumbnailSelectorComponent;
  let fixture: ComponentFixture<ThumbnailSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThumbnailSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ThumbnailSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
