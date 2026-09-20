import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../../core/services';
import { NavService } from '../../core/services/nav.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams: {} } }
        },
        {
          provide: AuthService,
          useValue: {
            setRedirectUrl: jasmine.createSpy('setRedirectUrl'),
            login: jasmine.createSpy('login').and.resolveTo({}),
            sendLoginOtp: jasmine.createSpy('sendLoginOtp').and.resolveTo({}),
            context: {
              user: () => ({ roles: [] }),
              role: () => ({ key: 'user' })
            }
          }
        },
        {
          provide: NavService,
          useValue: { goto: jasmine.createSpy('goto') }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the login step and move through the steps', () => {
    component.options = {
      steps: [
        { code: 'login', label: 'Sign In', identityTypes: [{ code: 'email', label: 'Email', credentialMethods: [{ code: 'password', label: 'Password' }] }] },
        { code: 'credentials', label: 'Credentials' },
        { code: 'roles', label: 'Choose a role' }
      ]
    };

    component.ngOnInit();

    expect(component.currentStep.code).toBe('login');
    expect(component.steps.length).toBe(3);

    component.selectStep('credentials');
    expect(component.currentStep.code).toBe('credentials');

    component.selectStep('roles');
    expect(component.currentStep.code).toBe('roles');
  });
});
