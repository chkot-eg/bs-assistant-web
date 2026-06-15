import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorResponse } from '../models/message.model';
import { OAuthService } from 'angular-oauth2-oidc';
import { UserMappingService } from '../services/user-mapping.service';

/**
 * HTTP interceptor:
 *
 * 1. Adds `Authorization: Bearer <token>` from the Microsoft access token
 *    so the backend can validate the user's identity.
 * 2. Adds `X-Library: <library>` header so the backend knows which IBM i
 *    library to route queries to for this user.
 * 3. Translates backend error responses into human-readable messages.
 * 4. On 401 — re-initiates Microsoft login (token expired).
 *
 * Note: SSE (EventSource) does not support custom headers — the streaming
 * endpoint uses the `?library=` query param which is set by AgenticStreamService.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const oauthService      = inject(OAuthService);
  const userMappingService = inject(UserMappingService);

  const token   = oauthService.getAccessToken();
  const library = userMappingService.library;

  // Build headers — skip external requests (EG mapping API, Microsoft auth endpoints)
  const isInternalApi = req.url.startsWith('/') || req.url.includes('localhost');
  let authReq = req;

  if (isInternalApi && token) {
    const headers: { [key: string]: string } = {
      Authorization: `Bearer ${token}`
    };
    if (library) {
      headers['X-Library'] = library;
    }
    authReq = req.clone({ setHeaders: headers, withCredentials: true });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 — token expired, re-login
      if (error.status === 401) {
        oauthService.initCodeFlow();
        return throwError(() => error);
      }

      let userMessage = 'An unexpected error occurred';

      if (error.status === 0) {
        userMessage = 'Cannot connect to server. Is the backend running on port 8080?';
      } else if (error.error && typeof error.error === 'object') {
        if ('error' in error.error && typeof error.error.error === 'string') {
          userMessage = error.error.error;
        } else if ('message' in error.error) {
          const backendError = error.error as ErrorResponse;
          userMessage = backendError.message || backendError.error;
        }
      } else if (typeof error.error === 'string') {
        userMessage = error.error;
      }

      if (error.status === 403) {
        userMessage = 'Access denied. You do not have permission for this action.';
      } else if (error.status === 429) {
        userMessage = 'Too many requests. Please wait before trying again.';
      } else if (error.status === 503) {
        userMessage = 'Service unavailable. The system may be starting up.';
      }

      console.error(`[API Error] ${error.status} ${req.url}: ${userMessage}`);

      return throwError(() => ({
        ...error,
        userMessage
      }));
    })
  );
};
