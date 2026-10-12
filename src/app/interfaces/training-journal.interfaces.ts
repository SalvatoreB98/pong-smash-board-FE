export interface IEveningJournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  realEffortRating: number; // 1-10
  realEffortNotes: string; // Impegno reale di oggi
  successes: string; // Successi (anche parziali)
  concreteProgress: string; // Progressi concreti
  durationSecondsTaken?: number;
  energyLevel?: number; // 1-5
  createdAt: string;
}

export interface IConfidenceVaultItem {
  id: string;
  title: string;
  date: string;
  contextOrOpponent: string;
  detailedStory: string;
  takeaway: string;
  tags: string[];
  favorite?: boolean;
  createdAt: string;
}

export interface IPostWorkoutDifficulty {
  id: string;
  date: string;
  technicalError: string; // Errore tecnico misurabile
  errorCount: number; // es. 4
  attemptsCount: number; // es. 10
  errorRatePct: number; // 40%
  context: string; // es. "Sotto 8-8 su servizio lungo tagliato"
  exerciseCode: string; // es. "EX-TT-01"
  exerciseName: string;
  recoveryDate: string; // Data scadenza / giorno di recupero
  status: 'pending' | 'in_recovery' | 'resolved';
  resolutionNotes?: string;
  createdAt: string;
}

export interface IExerciseCatalogItem {
  code: string;
  name: string;
  category: 'tecnica' | 'tattica' | 'footwork' | 'cesto' | 'servizio';
  description: string;
  recommendedReps: string;
}

export interface IPeriodicTest {
  id: string;
  name: string;
  category: 'physical' | 'technical';
  unit: string;
  higherIsBetter: boolean;
  description: string;
  benchmarkScore: number;
  icon: string;
}

export interface ITestScore {
  id: string;
  testId: string;
  date: string;
  score: number;
  notes?: string;
  createdAt: string;
}

export interface IPersonalMantra {
  id: string;
  text: string;
  focusArea: 'servizio' | 'terza_palla' | 'punti_pesanti' | 'respiro' | 'gambe' | 'generale';
  isActive: boolean;
  createdAt: string;
}

export interface IResetRoutineStep {
  key: 'release' | 'review' | 'park' | 'replace';
  stepNumber: number;
  name: string;
  shortName: string;
  tagline: string;
  instruction: string;
  physicalCue: string;
  durationSeconds: number;
  color: string;
  icon: string;
}
