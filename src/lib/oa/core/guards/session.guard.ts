import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services';

export const sessionGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const session = await auth.getSession();

  if (!session) {
    return false;
  }

  return true;
};
