import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputWithHttpComponent } from './input-with-http.component';

describe('InputWithHttpComponent', () => {
  let component: InputWithHttpComponent;
  let fixture: ComponentFixture<InputWithHttpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InputWithHttpComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InputWithHttpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
