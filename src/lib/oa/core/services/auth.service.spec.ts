import { inject, TestBed } from '@angular/core/testing';

import { AuthService } from '.';
import { ContextService } from './context.service';
import { DataService } from './data.service';

describe('AuthService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService],
    });
  });

  it('should be created', inject([AuthService], (service: AuthService) => {
    expect(service).toBeTruthy();
  }));

  it('should reuse an existing session when switching to a target role', async () => {
    const auth = TestBed.inject(AuthService);
    const context = TestBed.inject(ContextService);
    const dataService = TestBed.inject(DataService);

    const role = { key: 'manager', type: { code: 'manager' } } as any;
    const session = { id: 12, token: 'token-123', role, user: { id: 7, roles: [role] } } as any;

    context.user.set({ id: 7, roles: [role] } as any);
    spyOn(dataService, 'get').and.resolveTo(session);
    spyOn(dataService, 'create');

    const result = await auth.switchRole('manager');

    expect(dataService.get).toHaveBeenCalledWith('my', jasmine.objectContaining({
      src: ':directory/sessions',
      headers: jasmine.objectContaining({ 'x-role-key': 'manager' })
    }));
    expect(dataService.create).not.toHaveBeenCalled();
    expect(context.session()?.id).toBe(12);
    expect(context.role()?.key).toBe('manager');
    expect(result).toEqual(session);
  });
});
