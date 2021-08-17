import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AmountEditorComponent } from './amount-editor.component';

describe('AmountEditorComponent', () => {
  let component: AmountEditorComponent;
  let fixture: ComponentFixture<AmountEditorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AmountEditorComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AmountEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
