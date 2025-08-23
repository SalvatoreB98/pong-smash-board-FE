import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { ModalService } from '../services/modal.service';
import { CommonModule } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations'; // ✅ Import animations
import { TranslationService } from '../services/translation.service';
import { HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslatePipe } from './utils/translate.pipe';
import { authTokenInterceptor } from './interceptors/auth-token.interceptor';
import { apiPrefixInterceptor } from './interceptors/api-url.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([authTokenInterceptor, apiPrefixInterceptor]),

    ),
    ModalService,
    CommonModule,
    TranslationService,
    TranslatePipe,
  ],
};
