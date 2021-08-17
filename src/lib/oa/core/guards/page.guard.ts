import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { ContextService } from '../services/context.service';
import { NavService } from '../services/nav.service';
import { Link } from '../models';
import { AuthService } from '../services';

export const pageGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const context = inject(ContextService);
  const navService = inject(NavService);
  const router = inject(Router);

  const path = navService.getPath(route);
  const page: Link = navService.getLink(route);

  if (!page) {
    // If no item is found, navigate to the home page with the given path as a query parameter.
    navService.goto('home');
    return false;
  }

  if (page.permissions && page.permissions.length) {

    const session = await auth.getSession();

    if (!session) {
      return false;
    }

    const role = await context.getRole();

    if (!role) {
      navService.goto('auth.login', {
        query: {
          redirect: window.document.location.href
        }
      });
      return false;
    }

    if (!context.hasPermission(page.permissions)) {
      navService.goto([`/errors/access-denied`], { query: { path: route.url } });
      return false;
    }
  }

  page.meta = await navService.populateMeta(page);
  navService.setByPath(path, page);

  let url = path.split('?')[0].split('#')[0].toLowerCase()
  url = url.endsWith('/') ? url.substring(0, url.length - 1) : url;

  navService.setByPath(url, page);

  // const currentUrl = decodeURIComponent(router.url.split('?')[0].split('#')[0]).toLowerCase();
  const currentUrl = state.url.split('?')[0].split('#')[0].toLowerCase()
  if (url === currentUrl) {
    navService.setPage(page);
  }
  return true; // Return true to allow navigation
};
