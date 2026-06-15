import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * authGuard — protects routes that require Microsoft SSO authentication.
 *
 * Since APP_INITIALIZER already handles the initial auth redirect,
 * this guard is a fast synchronous check — the token is either in
 * memory (valid) or the user needs to log in again (e.g. token expired
 * while on the page).
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) {
    return true;
  }
  auth.login(); // redirect to Microsoft login
  return false;
};
