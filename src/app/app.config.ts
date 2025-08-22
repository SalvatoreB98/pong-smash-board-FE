import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { ModalService } from '../services/modal.service';
import { CommonModule } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations'; // ✅ Import animations
import { TranslationService } from '../services/translation.service';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';
import { TranslatePipe } from './utils/translate.pipe';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideAnimations(),
    provideHttpClient(),
    ModalService, 
    CommonModule,
    TranslationService,
    TranslatePipe
  ],
};
