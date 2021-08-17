import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HtmlViewerComponent } from './html-viewer.component';

describe('HtmlViewerComponent', () => {
  let component: HtmlViewerComponent;
  let fixture: ComponentFixture<HtmlViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HtmlViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HtmlViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
