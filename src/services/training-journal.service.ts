import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  IEveningJournalEntry,
  IConfidenceVaultItem,
  IPostWorkoutDifficulty,
  IExerciseCatalogItem,
  IPeriodicTest,
  ITestScore,
  IPersonalMantra,
  IResetRoutineStep
} from '../app/interfaces/training-journal.interfaces';

const STORAGE_KEY = 'pong_training_coach_journal_v1';

@Injectable({
  providedIn: 'root'
})
export class TrainingJournalService {

  // ── Exercise Catalog ────────────────────────────────────────────────────────
  readonly exerciseCatalog: IExerciseCatalogItem[] = [
    {
      code: 'EX-TT-01',
      name: 'Cesto: 3ª Palla su palla tagliata al centro/gomito',
      category: 'cesto',
      description: 'Lancio pallina tagliata corta o mezza lunga al gomito. Uscita rapida di gambe e topspin d\'apertura controllato.',
      recommendedReps: '4 serie da 20 palline'
    },
    {
      code: 'EX-TT-02',
      name: 'Falkenberg Drill a velocità progressiva',
      category: 'footwork',
      description: 'Rovescio da angolo rovescio -> Dritto da angolo rovescio -> Dritto da angolo dritto. Focus su appoggio gamba destra.',
      recommendedReps: '6 serie da 90 secondi'
    },
    {
      code: 'EX-TT-03',
      name: 'Risposta corta su servizio tagliato laterale a uscire',
      category: 'servizio',
      description: 'Lettura immediata dello spin avversario, anticipo col tocco delicato sopra il tavolo a filo rete.',
      recommendedReps: '30 ripetizioni'
    },
    {
      code: 'EX-TT-04',
      name: 'Topspin d\'apertura su palla liscia profonda',
      category: 'tecnica',
      description: 'Apertura compatta e impatto al punto più alto della traiettoria con chiusura in avanti e rotazione avambraccio.',
      recommendedReps: '5 serie da 15 palline'
    },
    {
      code: 'EX-TT-05',
      name: 'Block attivo e orientato su topspin arrotato',
      category: 'tecnica',
      description: 'Assorbimento dello spin con inclinazione racchetta chiusa e spinta controllata negli angoli profondi.',
      recommendedReps: '50 scambi consecutivi'
    },
    {
      code: 'EX-TT-06',
      name: 'Transizione rapida Block Rovescio -> Controtop Dritto',
      category: 'tattica',
      description: 'Passaggio fulmineo dal blocco passivo al colpo d\'attacco risolutivo con arretramento controllato di mezzo metro.',
      recommendedReps: '20 sequenze'
    },
    {
      code: 'EX-TT-07',
      name: 'Servizio corto pendolare con variazione finta al gomito',
      category: 'servizio',
      description: 'Stesso movimento d\'impatto variando solo l\'asse di spazzolata: prima tagliato corto, poi liscio profondo in pancia.',
      recommendedReps: '40 servizi con bersaglio'
    },
    {
      code: 'EX-TT-08',
      name: 'Footwork: Spostamento passo-giro su palla in pancia',
      category: 'footwork',
      description: 'Libera lo spazio corporeo facendo un rapido mezzo-passo indietro con la gamba per caricare il dritto potente.',
      recommendedReps: '30 esecuzioni'
    },
    {
      code: 'EX-TT-09',
      name: 'Flip di Rovescio ("Chiquita") su servizio corto',
      category: 'tecnica',
      description: 'Gomito alto e polso caricato all\'interno, apertura della pallina con forte rotazione laterale/superiore.',
      recommendedReps: '25 tentativi su cesto'
    },
    {
      code: 'EX-TT-10',
      name: 'Scambio di controtaglio teso e palla aggressiva al dritto',
      category: 'tattica',
      description: 'Palleggio tagliato basso e profondo per forzare l\'avversario all\'errore o generare palla comoda d\'attacco.',
      recommendedReps: '15 scambi lunghi'
    }
  ];

  // ── Standard Periodic Tests ────────────────────────────────────────────────
  readonly defaultPeriodicTests: IPeriodicTest[] = [
    {
      id: 'test_side_step',
      name: 'Agilità: Side-Step 30 sec',
      category: 'physical',
      unit: 'rip',
      higherIsBetter: true,
      description: 'Spostamento laterale rapido tra le due estremità del tavolo (tocchi con la mano sul bordo in 30 secondi).',
      benchmarkScore: 28,
      icon: 'fa-solid fa-person-running'
    },
    {
      id: 'test_reaction_sprint',
      name: 'Sprint Reazione 10m Tavolo-Barriera',
      category: 'physical',
      unit: 'sec',
      higherIsBetter: false,
      description: 'Scatto da posizione di guardia al tocco della barriera di fondo e ritorno al tavolo.',
      benchmarkScore: 2.45,
      icon: 'fa-solid fa-stopwatch'
    },
    {
      id: 'test_vertical_jump',
      name: 'Salto Verticale Esplosivo',
      category: 'physical',
      unit: 'cm',
      higherIsBetter: true,
      description: 'Misurazione dell\'elevazione da fermo per monitorare la reattività del treno inferiore.',
      benchmarkScore: 48,
      icon: 'fa-solid fa-bolt'
    },
    {
      id: 'test_core_plank',
      name: 'Resistenza Core / Isometric Plank',
      category: 'physical',
      unit: 'sec',
      higherIsBetter: true,
      description: 'Tenuta isometrica frontale per stabilizzazione del bacino durante i colpi in torsione.',
      benchmarkScore: 120,
      icon: 'fa-solid fa-shield-heart'
    },
    {
      id: 'test_third_ball_accuracy',
      name: 'Precisione 3ª Palla su Bersaglio',
      category: 'technical',
      unit: 'centri/20',
      higherIsBetter: true,
      description: 'Topspin d\'attacco su palla tagliata con bersaglio 30x30 cm nell\'angolo profondo (su 20 tentativi).',
      benchmarkScore: 14,
      icon: 'fa-solid fa-bullseye'
    },
    {
      id: 'test_service_double_bounce',
      name: 'Servizio Corto (Doppio Rimbalzo)',
      category: 'technical',
      unit: 'a segno/20',
      higherIsBetter: true,
      description: 'Servizi corti regolamentari che rimbalzano due volte sulla metà campo avversaria prima di uscire.',
      benchmarkScore: 16,
      icon: 'fa-solid fa-table-tennis-paddle-ball'
    },
    {
      id: 'test_fast_rally_60s',
      name: 'Regolarità Scambio Veloce 60s',
      category: 'technical',
      unit: 'colpi',
      higherIsBetter: true,
      description: 'Numero massimo di scambi consecutivi dritto su dritto ad alta cadenza senza commettere errori.',
      benchmarkScore: 65,
      icon: 'fa-solid fa-repeat'
    },
    {
      id: 'test_topspin_vs_backspin',
      name: 'Topspin su Backspin Pesante',
      category: 'technical',
      unit: 'centri/25',
      higherIsBetter: true,
      description: 'Attacco su palla tagliata pesante dal cesto: palline valide e con curva corretta a segno su 25.',
      benchmarkScore: 19,
      icon: 'fa-solid fa-fire'
    }
  ];

  // ── Micro-routine post-punto (R.R.P.R.) ────────────────────────────────────
  readonly resetRoutineSteps: IResetRoutineStep[] = [
    {
      key: 'release',
      stepNumber: 1,
      name: 'Release',
      shortName: 'Rilascia',
      tagline: 'Scarica la tensione fisica istantaneamente',
      instruction: 'Espira profondamente a labbra aperte, allenta la stretta delle dita sul manico e lascia cadere le spalle.',
      physicalCue: 'Espirazione sonora + dita morbide sul telaio',
      durationSeconds: 3,
      color: '#38bdf8',
      icon: 'fa-solid fa-wind'
    },
    {
      key: 'review',
      stepNumber: 2,
      name: 'Review',
      shortName: 'Analisi a Freddo',
      tagline: 'Solo un singolo dato oggettivo, zero giudizio',
      instruction: 'Identifica in 2 secondi il fatto tecnico (es: "ero in ritardo di gambe" o "colpita sotto"). Bandisci ogni autocritica emotiva.',
      physicalCue: 'Sguardo fermo verso un punto neutro',
      durationSeconds: 3,
      color: '#facc15',
      icon: 'fa-solid fa-magnifying-glass-chart'
    },
    {
      key: 'park',
      stepNumber: 3,
      name: 'Park',
      shortName: 'Accantona',
      tagline: 'Il punto appena giocato è nel cassetto sigillato',
      instruction: 'Esegui il gesto ancora: tocca il tavolo col palmo, guarda l\'asciugamano o gira la racchetta. Quel punto non esiste più.',
      physicalCue: 'Tocco del tavolo con mano libera o giro racchetta',
      durationSeconds: 3,
      color: '#fb923c',
      icon: 'fa-solid fa-box-archive'
    },
    {
      key: 'replace',
      stepNumber: 4,
      name: 'Replace',
      shortName: 'Sostituisci & Reset',
      tagline: 'Attiva il Mantra e prepara l\'azione presente',
      instruction: 'Richiama il tuo Mantra positivo e visualizza chiaramente il servizio o la ricezione. Piedi reattivi, pronti a saltellare.',
      physicalCue: 'Molleggio sulle punte + sguardo fisso sulla pallina',
      durationSeconds: 3,
      color: '#4ade80',
      icon: 'fa-solid fa-bolt'
    }
  ];

  // ── Reactive Subjects ──────────────────────────────────────────────────────
  private eveningEntriesSubject = new BehaviorSubject<IEveningJournalEntry[]>([]);
  public eveningEntries$: Observable<IEveningJournalEntry[]> = this.eveningEntriesSubject.asObservable();

  private confidenceVaultSubject = new BehaviorSubject<IConfidenceVaultItem[]>([]);
  public confidenceVault$: Observable<IConfidenceVaultItem[]> = this.confidenceVaultSubject.asObservable();

  private difficultiesSubject = new BehaviorSubject<IPostWorkoutDifficulty[]>([]);
  public difficulties$: Observable<IPostWorkoutDifficulty[]> = this.difficultiesSubject.asObservable();

  private testLogsSubject = new BehaviorSubject<ITestScore[]>([]);
  public testLogs$: Observable<ITestScore[]> = this.testLogsSubject.asObservable();

  private mantrasSubject = new BehaviorSubject<IPersonalMantra[]>([]);
  public mantras$: Observable<IPersonalMantra[]> = this.mantrasSubject.asObservable();

  public getConfidenceVaultSnapshot(): IConfidenceVaultItem[] {
    return this.confidenceVaultSubject.value;
  }

  public getDifficultiesSnapshot(): IPostWorkoutDifficulty[] {
    return this.difficultiesSubject.value;
  }

  public getEveningEntriesSnapshot(): IEveningJournalEntry[] {
    return this.eveningEntriesSubject.value;
  }

  constructor() {
    this.loadState();
  }

  // ── State Persistence ──────────────────────────────────────────────────────
  private loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.eveningEntriesSubject.next(parsed.eveningEntries || []);
        this.confidenceVaultSubject.next(parsed.confidenceVault || []);
        this.difficultiesSubject.next(parsed.difficulties || []);
        this.testLogsSubject.next(parsed.testLogs || []);
        this.mantrasSubject.next(parsed.mantras || []);
        return;
      }
    } catch (e) {
      console.warn('[TrainingJournalService] Errore lettura localStorage, carico seed di default:', e);
    }
    this.seedDefaultData();
  }

  private saveState() {
    const data = {
      eveningEntries: this.eveningEntriesSubject.value,
      confidenceVault: this.confidenceVaultSubject.value,
      difficulties: this.difficultiesSubject.value,
      testLogs: this.testLogsSubject.value,
      mantras: this.mantrasSubject.value,
      lastUpdated: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('[TrainingJournalService] Errore salvataggio localStorage:', e);
    }
  }

  // ── Default Seed Data (Real TT Coaching Scenarios) ─────────────────────────
  public seedDefaultData() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];

    const eveningEntries: IEveningJournalEntry[] = [
      {
        id: 'seed-evening-1',
        date: yesterday,
        realEffortRating: 9,
        realEffortNotes: 'Ho spinto al 100% per tutti gli 80 minuti di cesto e schemi liberi, mantenendo la concentrazione anche quando ero a corto di fiato negli ultimi 15 minuti.',
        successes: 'Ho tenuto la racchetta costantemente alta sui controtop al tavolo. Sono riuscito a piazzare 5 terze palle vincenti direttamente sul gomito avversario.',
        concreteProgress: 'Il posizionamento della gamba destra in arretramento sul topspin incrociato è ora molto più automatico: non perdo più l\'equilibrio verso sinistra.',
        durationSecondsTaken: 82,
        energyLevel: 4,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'seed-evening-2',
        date: threeDaysAgo,
        realEffortRating: 8,
        realEffortNotes: 'Intensità alta sulle gambe, ottima presenza mentale nei match di allenamento a fine seduta.',
        successes: 'Ottima risposta corta di rovescio sul servizio laterale-tagliato. Nessuna esitazione sul punto del 9-9.',
        concreteProgress: 'Prima palla di taglio molto più bassa rispetto alla scorsa settimana: l\'avversario non è quasi mai riuscito a tirare direttamente.',
        durationSecondsTaken: 75,
        energyLevel: 5,
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
      }
    ];

    const confidenceVault: IConfidenceVaultItem[] = [
      {
        id: 'seed-vault-1',
        title: 'Rimonta da 0-2 a 3-2 contro giocatore con puntinata lunga',
        date: '2025-11-20',
        contextOrOpponent: 'Campionato a squadre - Match decisivo contro Marco V.',
        detailedStory: 'Sotto di due set e con la frustrazione che saliva per i suoi tagli strani, mi sono fermato a inizio terzo set. Ho deciso di smettere di affrettare i punti: ho iniziato a fare il "palleggio morto" al centro e tirare solo sulla terza palla alta. Sul 10-10 al quinto set ho avuto il coraggio di fare il servizio corto a uscire e topspin deciso al centro. Vinto 12-10!',
        takeaway: 'La mia pazienza tattica supera qualsiasi gomma speciale. Quando respiro e muovo i piedi, trovo sempre la chiave.',
        tags: ['Rimonta', 'Puntinata Lunga', 'Gara', 'Freddezza'],
        favorite: true,
        createdAt: new Date('2025-11-21').toISOString()
      },
      {
        id: 'seed-vault-2',
        title: 'Serie impeccabile di 4 controtop vincenti consecutivi al tavolo',
        date: '2026-01-14',
        contextOrOpponent: 'Allenamento intensivo con lo sparring di prima categoria',
        detailedStory: 'Nello schema libero ad alta velocità ho anticipato la traiettoria sul suo topspin pesante: impatto esattamente al vertice, braccio rilassato che ha frustato in avanti. 4 scambi spettacolari chiusi tutti a mio favore con un timing perfetto.',
        takeaway: 'La fiducia nel colpo rapido al tavolo senza indietreggiare è la mia arma più letale.',
        tags: ['Controtop', 'Timing', 'Velocità', 'Sparring'],
        favorite: true,
        createdAt: new Date('2026-01-15').toISOString()
      }
    ];

    const difficulties: IPostWorkoutDifficulty[] = [
      {
        id: 'seed-diff-1',
        date: yesterday,
        technicalError: 'Terza palla sul gomito in ritardo con gambe ferme e racchetta bassa',
        errorCount: 4,
        attemptsCount: 10,
        errorRatePct: 40,
        context: 'Su servizio lungo avversario tagliato al centro-corpo sotto pressione a fine set',
        exerciseCode: 'EX-TT-01',
        exerciseName: 'Cesto: 3ª Palla su palla tagliata al centro/gomito',
        recoveryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      {
        id: 'seed-diff-2',
        date: threeDaysAgo,
        technicalError: 'Risposta corta tagliata andata lunga per piatto racchetta aperto troppo in anticipo',
        errorCount: 5,
        attemptsCount: 12,
        errorRatePct: 41.7,
        context: 'Ricezione di dritto su servizio corto con finta laterale',
        exerciseCode: 'EX-TT-03',
        exerciseName: 'Risposta corta su servizio tagliato laterale a uscire',
        recoveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        status: 'in_recovery',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
      },
      {
        id: 'seed-diff-3',
        date: '2026-02-01',
        technicalError: 'Block di rovescio aperto con racchetta troppo distante dal corpo',
        errorCount: 6,
        attemptsCount: 15,
        errorRatePct: 40,
        context: 'Contro attaccante veloce da media distanza',
        exerciseCode: 'EX-TT-05',
        exerciseName: 'Block attivo e orientato su topspin arrotato',
        recoveryDate: '2026-02-05',
        status: 'resolved',
        resolutionNotes: 'Risolto con 3 sessioni da 50 scambi orientati: gomito compatto e polso rigido.',
        createdAt: new Date('2026-02-01').toISOString()
      }
    ];

    const testLogs: ITestScore[] = [
      { id: 'log-1', testId: 'test_side_step', date: '2026-01-10', score: 24, notes: 'Baseline inizio anno', createdAt: '2026-01-10T10:00:00Z' },
      { id: 'log-2', testId: 'test_side_step', date: '2026-02-05', score: 27, notes: 'Ottimo passo laterale migliorato', createdAt: '2026-02-05T10:00:00Z' },
      { id: 'log-3', testId: 'test_side_step', date: yesterday, score: 30, notes: 'Nuovo record personale!', createdAt: '2026-02-18T10:00:00Z' },

      { id: 'log-4', testId: 'test_third_ball_accuracy', date: '2026-01-12', score: 10, notes: 'Difficoltà sui tagli pesanti', createdAt: '2026-01-12T10:00:00Z' },
      { id: 'log-5', testId: 'test_third_ball_accuracy', date: '2026-02-08', score: 13, notes: 'Traiettoria più arcuata', createdAt: '2026-02-08T10:00:00Z' },
      { id: 'log-6', testId: 'test_third_ball_accuracy', date: yesterday, score: 16, notes: '16 centri su 20 palline', createdAt: '2026-02-18T10:00:00Z' },

      { id: 'log-7', testId: 'test_reaction_sprint', date: '2026-01-15', score: 2.70, notes: 'Partenza un po\' pesante', createdAt: '2026-01-15T10:00:00Z' },
      { id: 'log-8', testId: 'test_reaction_sprint', date: '2026-02-10', score: 2.48, notes: 'Reattività migliorata sulle punte', createdAt: '2026-02-10T10:00:00Z' },

      { id: 'log-9', testId: 'test_service_double_bounce', date: '2026-01-18', score: 12, notes: 'Spesso la seconda pallina andava fuori', createdAt: '2026-01-18T10:00:00Z' },
      { id: 'log-10', testId: 'test_service_double_bounce', date: yesterday, score: 17, notes: 'Molto più backspin e altezza filo-rete', createdAt: '2026-02-18T10:00:00Z' }
    ];

    const mantras: IPersonalMantra[] = [
      {
        id: 'mantra-1',
        text: 'Io piego le gambe, aspetto la palla al vertice e spingo in avanti con decisione.',
        focusArea: 'terza_palla',
        isActive: true,
        createdAt: '2026-01-05T00:00:00Z'
      },
      {
        id: 'mantra-2',
        text: 'Io espiro profondamente prima di servire e guardo fisso il punto esatto di rimbalzo.',
        focusArea: 'servizio',
        isActive: true,
        createdAt: '2026-01-10T00:00:00Z'
      },
      {
        id: 'mantra-3',
        text: 'Sui punti decisivi io mantengo i piedi leggeri e gioco con coraggio senza rimpianti.',
        focusArea: 'punti_pesanti',
        isActive: true,
        createdAt: '2026-02-01T00:00:00Z'
      }
    ];

    this.eveningEntriesSubject.next(eveningEntries);
    this.confidenceVaultSubject.next(confidenceVault);
    this.difficultiesSubject.next(difficulties);
    this.testLogsSubject.next(testLogs);
    this.mantrasSubject.next(mantras);
    this.saveState();
  }

  // ── Cold Fact vs Emotional Judgment Analysis ──────────────────────────────
  public analyzeForEmotionalJudgment(text: string): {
    isEmotional: boolean;
    detectedPhrases: string[];
    suggestion: string;
  } {
    if (!text || text.trim().length === 0) {
      return { isEmotional: false, detectedPhrases: [], suggestion: '' };
    }

    const lower = text.toLowerCase();
    const forbiddenPhrases = [
      'gioco male',
      'faccio schifo',
      'sono scarso',
      'sotto pressione',
      'non riesco',
      'non so giocare',
      'non mi entra niente',
      'disastro',
      'incapace',
      'sempre peggio',
      'fallimento',
      'errori stupidi',
      'faccio cagare',
      'collasso mentale',
      'panico',
      'ansia totale',
      'perdo sempre',
      'non capisco un cazzo',
      'faccio pena',
      'odio il rovescio',
      'non valgo niente'
    ];

    const detected = forbiddenPhrases.filter(p => lower.includes(p));

    if (detected.length > 0) {
      let suggestion = 'Trasforma questo giudizio emotivo in un FATTO FREDDO MISURABILE:';
      if (lower.includes('sotto pressione') || lower.includes('gioco male')) {
        suggestion = 'Esempio: Invece di "' + detected[0] + '", scrivi: "Sul 9-9 ho affrettato la chiusura del dritto prima di appoggiare il piede destro (3 errori su 4 tentativi)".';
      } else if (lower.includes('non riesco') || lower.includes('non mi entra')) {
        suggestion = 'Esempio: Invece di "' + detected[0] + '", specifica: "Impatto della palla in ritardo sul colpo di taglio (5 errori su 8 risposte)".';
      } else {
        suggestion = 'Esempio: Descrivi il movimento biomeccanico o la traiettoria: "Angolo racchetta aperto troppo in fretta su palla tagliata pesante (4 su 10)".';
      }

      return {
        isEmotional: true,
        detectedPhrases: detected,
        suggestion
      };
    }

    return { isEmotional: false, detectedPhrases: [], suggestion: '' };
  }

  // ── Mantra Validator ───────────────────────────────────────────────────────
  public validateMantra(text: string): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    if (!text || text.trim().length < 8) {
      issues.push('Il mantra deve contenere una frase completa.');
      return { isValid: false, issues, recommendations };
    }

    const lower = text.toLowerCase();

    // Check negative wording
    const negativeWords = ['non', 'evitare', 'senza sbagliare', 'non devo', 'non voglio', 'mai più'];
    const foundNegatives = negativeWords.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(lower));
    if (foundNegatives.length > 0) {
      issues.push(`Evita negazioni come "${foundNegatives.join(', ')}". Il cervello registra l'azione che visualizzi.`);
      recommendations.push('Formula sempre in positivo: descrivi COSA FARE, non cosa evitare (es. "Colpisco con decisione al vertice" anziché "Non sbagliare la chiusura").');
    }

    // Check future/conditional tense words
    const hesitantWords = ['speriamo', 'dovrei', 'cercherò', 'proverò', 'forse', 'vorrei'];
    const foundHesitant = hesitantWords.filter(w => lower.includes(w));
    if (foundHesitant.length > 0) {
      issues.push(`Evita termini dubitativi come "${foundHesitant.join(', ')}".`);
      recommendations.push('Usa verbi assertivi al PRESENTE: "Io colpisco", "Io respiro", "Io spingo", "I miei piedi sono pronti".');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  // ── Evening Journal CRUD ───────────────────────────────────────────────────
  public addEveningEntry(entry: Omit<IEveningJournalEntry, 'id' | 'createdAt'>): IEveningJournalEntry {
    const newEntry: IEveningJournalEntry = {
      ...entry,
      id: 'eve-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const current = [newEntry, ...this.eveningEntriesSubject.value];
    this.eveningEntriesSubject.next(current);
    this.saveState();
    return newEntry;
  }

  public deleteEveningEntry(id: string) {
    const updated = this.eveningEntriesSubject.value.filter(e => e.id !== id);
    this.eveningEntriesSubject.next(updated);
    this.saveState();
  }

  // ── Confidence Vault CRUD ──────────────────────────────────────────────────
  public addConfidenceMoment(item: Omit<IConfidenceVaultItem, 'id' | 'createdAt'>): IConfidenceVaultItem {
    const newItem: IConfidenceVaultItem = {
      ...item,
      id: 'vault-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const current = [newItem, ...this.confidenceVaultSubject.value];
    this.confidenceVaultSubject.next(current);
    this.saveState();
    return newItem;
  }

  public toggleFavoriteConfidenceMoment(id: string) {
    const current = this.confidenceVaultSubject.value.map(item => {
      if (item.id === id) {
        return { ...item, favorite: !item.favorite };
      }
      return item;
    });
    this.confidenceVaultSubject.next(current);
    this.saveState();
  }

  public deleteConfidenceMoment(id: string) {
    const updated = this.confidenceVaultSubject.value.filter(i => i.id !== id);
    this.confidenceVaultSubject.next(updated);
    this.saveState();
  }

  // ── Post-Workout Difficulties CRUD ─────────────────────────────────────────
  public addDifficulty(item: Omit<IPostWorkoutDifficulty, 'id' | 'createdAt' | 'errorRatePct'>): IPostWorkoutDifficulty {
    const errorCount = Math.max(0, item.errorCount);
    const attemptsCount = Math.max(1, item.attemptsCount);
    const errorRatePct = Number(((errorCount / attemptsCount) * 100).toFixed(1));

    const newDiff: IPostWorkoutDifficulty = {
      ...item,
      errorCount,
      attemptsCount,
      errorRatePct,
      id: 'diff-' + Date.now(),
      createdAt: new Date().toISOString()
    };

    const current = [newDiff, ...this.difficultiesSubject.value];
    this.difficultiesSubject.next(current);
    this.saveState();
    return newDiff;
  }

  public updateDifficultyStatus(id: string, status: 'pending' | 'in_recovery' | 'resolved', resolutionNotes?: string) {
    const current = this.difficultiesSubject.value.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status,
          resolutionNotes: resolutionNotes !== undefined ? resolutionNotes : d.resolutionNotes
        };
      }
      return d;
    });
    this.difficultiesSubject.next(current);
    this.saveState();
  }

  public deleteDifficulty(id: string) {
    const updated = this.difficultiesSubject.value.filter(d => d.id !== id);
    this.difficultiesSubject.next(updated);
    this.saveState();
  }

  // ── Periodic Tests & Logs CRUD ─────────────────────────────────────────────
  public logTestScore(scoreData: Omit<ITestScore, 'id' | 'createdAt'>): ITestScore {
    const newScore: ITestScore = {
      ...scoreData,
      id: 'score-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const current = [newScore, ...this.testLogsSubject.value];
    this.testLogsSubject.next(current);
    this.saveState();
    return newScore;
  }

  public deleteTestScore(id: string) {
    const updated = this.testLogsSubject.value.filter(s => s.id !== id);
    this.testLogsSubject.next(updated);
    this.saveState();
  }

  public getScoresForTest(testId: string): ITestScore[] {
    return this.testLogsSubject.value
      .filter(s => s.testId === testId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  public getTestStats(test: IPeriodicTest): {
    latestScore: number | null;
    bestScore: number | null;
    previousScore: number | null;
    deltaPercentage: number | null;
    totalLogsCount: number;
  } {
    const scores = this.getScoresForTest(test.id);
    if (scores.length === 0) {
      return { latestScore: null, bestScore: null, previousScore: null, deltaPercentage: null, totalLogsCount: 0 };
    }

    const latest = scores[scores.length - 1].score;
    const previous = scores.length > 1 ? scores[scores.length - 2].score : null;

    let best = scores[0].score;
    for (const s of scores) {
      if (test.higherIsBetter ? s.score > best : s.score < best) {
        best = s.score;
      }
    }

    let deltaPercentage: number | null = null;
    if (previous !== null && previous !== 0) {
      const diff = latest - previous;
      deltaPercentage = Number(((diff / previous) * 100).toFixed(1));
    }

    return {
      latestScore: latest,
      bestScore: best,
      previousScore: previous,
      deltaPercentage,
      totalLogsCount: scores.length
    };
  }

  // ── Mantras CRUD ───────────────────────────────────────────────────────────
  public addMantra(mantra: Omit<IPersonalMantra, 'id' | 'createdAt'>): IPersonalMantra {
    const newMantra: IPersonalMantra = {
      ...mantra,
      id: 'mantra-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const current = [newMantra, ...this.mantrasSubject.value];
    this.mantrasSubject.next(current);
    this.saveState();
    return newMantra;
  }

  public toggleMantraActive(id: string) {
    const current = this.mantrasSubject.value.map(m => {
      if (m.id === id) {
        return { ...m, isActive: !m.isActive };
      }
      return m;
    });
    this.mantrasSubject.next(current);
    this.saveState();
  }

  public deleteMantra(id: string) {
    const updated = this.mantrasSubject.value.filter(m => m.id !== id);
    this.mantrasSubject.next(updated);
    this.saveState();
  }

  // ── Reset / Export Data ────────────────────────────────────────────────────
  public resetAllToDemo() {
    this.seedDefaultData();
  }
}
