import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, RouterModule } from '@angular/router';
import { routes } from './app.routes';
import { ModalService } from '../services/modal.service';
import { CommonModule } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TranslationService } from '../services/translation.service';
import { HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslatePipe } from './utils/translate.pipe';
import { authTokenInterceptor } from './interceptors/auth-token.interceptor';
import { apiPrefixInterceptor } from './interceptors/api-url.interceptor';
import { preventDuplicateInterceptor } from './interceptors/duplicate.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),                     
    importProvidersFrom(RouterModule),             
    provideAnimations(),
    provideHttpClient(
      withInterceptors([authTokenInterceptor, apiPrefixInterceptor, preventDuplicateInterceptor]),
    ),
    ModalService,
    CommonModule,
    TranslationService,
    TranslatePipe,
  ],
};
