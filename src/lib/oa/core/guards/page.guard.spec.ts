import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, convertToParamMap, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services';
import { ContextService } from '../services/context.service';
import { NavService } from '../services/nav.service';
import { pageGuard } from './page.guard';

describe('pageGuard', () => {
  const auth = { getSession: jasmine.createSpy('getSession').and.resolveTo({ id: 12 }) };
  const cleanUrl = { queryParams: { 'access-token': 'token-123', next: 'profile' } };
  const router = { parseUrl: jasmine.createSpy('parseUrl').and.returnValue(cleanUrl) };
  const navService = {
    getPath: jasmine.createSpy('getPath').and.returnValue('/customers'),
    getLink: jasmine.createSpy('getLink').and.returnValue({}),
    populateMeta: jasmine.createSpy('populateMeta').and.resolveTo(undefined),
    setByPath: jasmine.createSpy('setByPath'),
    setPage: jasmine.createSpy('setPage'),
    goto: jasmine.createSpy('goto')
  };
  const executeGuard: CanActivateFn = (...parameters) =>
    TestBed.runInInjectionContext(() => pageGuard(...parameters));

  beforeEach(() => {
    auth.getSession.calls.reset();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ContextService, useValue: {} },
        { provide: NavService, useValue: navService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('should fetch the session for a public page when an access token is in the query', async () => {
    const route = {
      queryParamMap: convertToParamMap({ 'access-token': 'token-123' }),
      url: []
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/customers?access-token=token-123' } as RouterStateSnapshot;

    const result = await executeGuard(route, state);

    expect(auth.getSession).toHaveBeenCalled();
    expect(router.parseUrl).toHaveBeenCalledWith('/customers?access-token=token-123');
    expect(result).toBe(cleanUrl);
    expect(cleanUrl.queryParams).toEqual({ next: 'profile' });
  });
});
