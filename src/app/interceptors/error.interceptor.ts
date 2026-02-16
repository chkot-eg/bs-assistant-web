import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ErrorResponse } from '../models/message.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let userMessage = 'An unexpected error occurred';

      if (error.status === 0) {
        userMessage = 'Cannot connect to server. Is the backend running on port 8080?';
      } else if (error.error && typeof error.error === 'object') {
        // Handle { success: false, error: "..." } pattern
        if ('error' in error.error && typeof error.error.error === 'string') {
          userMessage = error.error.error;
        }
        // Handle Spring ErrorResponse { message: "..." } pattern
        else if ('message' in error.error) {
          const backendError = error.error as ErrorResponse;
          userMessage = backendError.message || backendError.error;
        }
      } else if (typeof error.error === 'string') {
        userMessage = error.error;
      }

      if (error.status === 429) {
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
