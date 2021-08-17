import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services';
import { ContextService } from '../services/context.service';
import { NavService } from '../services/nav.service';

export const roleGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const context = inject(ContextService);
  const navService = inject(NavService);

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

  return true;
};
