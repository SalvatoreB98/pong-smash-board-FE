import { Injectable } from '@angular/core';
import { BehaviorSubject, first } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  public languages = [
    { code: "it", label: "italian" },
    { code: "en", label: "english" },
    { code: "es", label: "spanish" },
    { code: "de", label: "german" },
    { code: "fr", label: "french" }
  ]

  /** Dizionario delle traduzioni */
  private translations: { [key: string]: { [lang: string]: string } } = {
    title: {
      it: "",
      en: "d"
    }
  };

  /** Lingua corrente con un `BehaviorSubject` per aggiornamenti reattivi */
  public currentLang = new BehaviorSubject<string>('en'); // Default: Inglese

  constructor(private http: HttpClient) {
    const userLanguage = navigator.language || navigator.languages[0] || 'en';
    const savedLanguage = sessionStorage.getItem("selectedLanguage");

    if (savedLanguage) {
      this.setLanguage(savedLanguage, false); // usa quello salvato
    } else if (userLanguage.startsWith('it')) {
      this.setLanguage('it', true); // setta italiano se il browser è in IT
    } else if (userLanguage.startsWith('es')) {
      this.setLanguage('es', true); // setta spagnolo se il browser è in ES
    } else if (userLanguage.startsWith('de')) {
      this.setLanguage('de', true); // setta tedesco se il browser è in DE
    } else if (userLanguage.startsWith('fr')) {
      this.setLanguage('fr', true); // setta francese se il browser è in FR
    } else {
      this.setLanguage('en', true); // fallback
    }

    this.loadTranslations();
  }

  /** Cambia la lingua e aggiorna lo stato */
  setLanguage(lang: string, isManuallySet = false) {
    this.currentLang.next(lang);
    if (isManuallySet) {
      sessionStorage.setItem("selectedLanguage", lang);
    }
  }

  /** Ottiene la lingua corrente */
  getLanguage() {
    return this.currentLang.value;
  }
  private loadTranslations() {
    this.http.get<{ [key: string]: { [lang: string]: string } }>('/lang.json')
      .pipe(first()) // ✅ Prende solo il primo valore e si completa
      .subscribe({
        next: data => this.translations = data,
        error: err => console.error("Errore nel caricamento delle traduzioni:", err)
      });
  }

  /** Restituisce la traduzione per una chiave */
  translate(key: string): string {
    const lang = this.getLanguage();
    return this.translations[key]?.[lang] || key; // Se non trova la traduzione, ritorna la chiave originale
  }
}
