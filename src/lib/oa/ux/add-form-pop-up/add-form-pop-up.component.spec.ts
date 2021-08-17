import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFormPopUpComponent } from './add-form-pop-up.component';

describe('AddFormPopUpComponent', () => {
  let component: AddFormPopUpComponent;
  let fixture: ComponentFixture<AddFormPopUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFormPopUpComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddFormPopUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
