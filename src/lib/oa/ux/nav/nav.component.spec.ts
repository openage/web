import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NavComponent } from './nav.component';
import { Link } from '../../core/models';

describe('SideNavComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NavComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve quick-link children from a nested navigation item', () => {
    const child = new Link({
      code: 'task-templates',
      title: 'Task Templates',
      url: '/console/task-templates',
      permissions: [],
      index: 0
    });
    spyOn(component.navService, 'getByCode').and.returnValue(new Link({ items: [child] }));

    expect(component.getValues('process-studio')).toEqual([child]);
  });
});
