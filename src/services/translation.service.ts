import { Injectable } from '@angular/core';
import { BehaviorSubject, first } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  /** Dizionario delle traduzioni */
  private translations: { [key: string]: { [lang: string]: string } } = {
    title: {
      it: "Ciao Mondo",
      en: "Hello World"
    }
  };

  /** Lingua corrente con un `BehaviorSubject` per aggiornamenti reattivi */
  private currentLang = new BehaviorSubject<string>('en'); // Default: Inglese

  constructor(private http: HttpClient) {
    const userLanguage = navigator.language || navigator.languages[0] || 'en';
    if (userLanguage.startsWith('it')) {
      this.currentLang.next('it');
    }
    this.loadTranslations(); 
  }

  /** Cambia la lingua e aggiorna lo stato */
  setLanguage(lang: string) {
    this.currentLang.next(lang);
  }

  /** Ottiene la lingua corrente */
  getLanguage() {
    console.log(this.currentLang.value);
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
