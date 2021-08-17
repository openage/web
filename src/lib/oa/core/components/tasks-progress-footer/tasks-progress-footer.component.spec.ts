import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TasksProgressFooterComponent } from './tasks-progress-footer.component';

describe('TasksProgressFooterComponent', () => {
  let component: TasksProgressFooterComponent;
  let fixture: ComponentFixture<TasksProgressFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TasksProgressFooterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TasksProgressFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
