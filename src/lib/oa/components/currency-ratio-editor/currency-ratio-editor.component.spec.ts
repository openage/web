import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrencyRatioEditorComponent } from './currency-ratio-editor.component';

describe('CurrencyRatioEditorComponent', () => {
  let component: CurrencyRatioEditorComponent;
  let fixture: ComponentFixture<CurrencyRatioEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CurrencyRatioEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrencyRatioEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
