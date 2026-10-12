import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, convertToParamMap, Router, RouterStateSnapshot, UrlSegmentGroup, UrlTree } from '@angular/router';
import { AuthService } from '../services';
import { ContextService } from '../services/context.service';
import { NavService } from '../services/nav.service';
import { pageGuard } from './page.guard';

describe('pageGuard', () => {
  const auth = { getSession: jasmine.createSpy('getSession').and.resolveTo({ id: 12 }) };
  const cleanUrl = new UrlTree(new UrlSegmentGroup([], {}), {
    'access-token': 'token-123',
    next: 'profile'
  }, null);
  const router = {
    parseUrl: jasmine.createSpy('parseUrl').and.returnValue(cleanUrl),
  };
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
    auth.getSession.and.resolveTo({ id: 12 });
    navService.goto.calls.reset();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ContextService, useValue: { hasPermission: () => true, role: () => ({ id: 1 }) } },
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
    expect(cleanUrl.queryParams).toEqual(jasmine.objectContaining({ next: 'profile' }));
  });

  it('should allow an intermediate route without a page when it has a child route', async () => {
    navService.getLink.and.returnValue(null);
    const route = {
      children: [{}],
      queryParamMap: convertToParamMap({}),
      url: []
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/crm/customers' } as RouterStateSnapshot;

    const result = await executeGuard(route, state);

    expect(result).toBeTrue();
    expect(navService.goto).not.toHaveBeenCalled();
  });

  it('should redirect to home when a leaf route has no page', async () => {
    navService.getLink.and.returnValue(null);
    const route = {
      children: [],
      queryParamMap: convertToParamMap({}),
      url: []
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/crm/customers' } as RouterStateSnapshot;

    const result = await executeGuard(route, state);

    expect(result).toBeFalse();
    expect(navService.goto).toHaveBeenCalledWith('home');
  });

  it('should redirect unauthenticated users to login when the page requires permissions', async () => {
    auth.getSession.and.resolveTo({ id: 'guest-session', permissions: ['guest'] });
    navService.getLink.and.returnValue({ permissions: ['user'] });
    const route = {
      children: [],
      queryParamMap: convertToParamMap({}),
      url: []
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/console' } as RouterStateSnapshot;

    const result = await executeGuard(route, state);

    expect(result).toBeFalse();
    expect(navService.goto).toHaveBeenCalledWith('auth.login', {
      query: { redirect: window.document.location.href }
    });
  });
});
