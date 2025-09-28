import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpMock = TestBed.inject(HttpTestingController);
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  function createService(options: { navigatorLang?: string; savedLanguage?: string | null } = {}): TranslationService {
    const { navigatorLang = 'en-US', savedLanguage = null } = options;

    Object.defineProperty(window.navigator, 'language', { value: navigatorLang, configurable: true });
    Object.defineProperty(window.navigator, 'languages', { value: [navigatorLang], configurable: true });

    if (savedLanguage) {
      sessionStorage.setItem('selectedLanguage', savedLanguage);
    } else {
      sessionStorage.removeItem('selectedLanguage');
    }

    const service = TestBed.runInInjectionContext(() => new TranslationService(TestBed.inject(HttpClient)));
    const req = httpMock.expectOne('/lang.json');
    req.flush({
      greeting: { en: 'Hello', it: 'Ciao' },
    });
    return service;
  }

  it('should fall back to navigator Italian when no saved language exists', () => {
    const service = createService({ navigatorLang: 'it-IT' });
    expect(service.getLanguage()).toBe('it');
  });

  it('should use saved language over navigator preference', () => {
    const service = createService({ navigatorLang: 'it-IT', savedLanguage: 'en' });
    expect(service.getLanguage()).toBe('en');
  });

  it('should set language and persist when manually selected', () => {
    const service = createService();
    service.setLanguage('it', true);
    expect(service.getLanguage()).toBe('it');
    expect(sessionStorage.getItem('selectedLanguage')).toBe('it');
  });

  it('should translate keys and fallback when translation missing', () => {
    const service = createService();
    expect(service.translate('greeting')).toBe('Hello');
    expect(service.translate('missing_key')).toBe('missing_key');
  });
});
