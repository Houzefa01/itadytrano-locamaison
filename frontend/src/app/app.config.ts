import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter, withViewTransitions, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
 
registerLocaleData(localeFr);
 
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: LOCALE_ID, useValue: 'fr' },
    provideRouter(
      routes,
      withViewTransitions(),           // transitions fluides entre pages
      withComponentInputBinding()      // bind route params → @Input()
    ),
    provideHttpClient(
      withInterceptors([jwtInterceptor]),
      withFetch()
    ),
  ],
};
