import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { OAuthModule } from 'angular-oauth2-oidc';

import { routes } from './app.routes';
import { errorInterceptor } from './interceptors/error.interceptor';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorInterceptor])),
    provideAnimationsAsync(),

    // Register angular-oauth2-oidc for standalone Angular
    importProvidersFrom(OAuthModule.forRoot()),

    // Block app bootstrap until Microsoft auth is resolved.
    // This ensures the loading screen stays visible during the
    // token exchange and ERP mapping fetch — the chat UI only
    // renders once the user's IBM i library is known.
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.initialize(),
      deps: [AuthService],
      multi: true
    }
  ]
};
