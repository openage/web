import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FileProviderComponent } from './file-provider.component';

describe('FileProviderComponent', () => {
  let component: FileProviderComponent;
  let fixture: ComponentFixture<FileProviderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FileProviderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileProviderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
