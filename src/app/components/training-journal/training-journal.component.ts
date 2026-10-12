import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../utils/translate.pipe';
import { BottomNavbarComponent } from '../../common/bottom-navbar/bottom-navbar.component';
import {
  TrainingJournalService
} from '../../../services/training-journal.service';
import {
  IEveningJournalEntry,
  IConfidenceVaultItem,
  IPostWorkoutDifficulty,
  IExerciseCatalogItem,
  IPeriodicTest,
  ITestScore,
  IPersonalMantra,
  IResetRoutineStep
} from '../../interfaces/training-journal.interfaces';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexDataLabels,
  ApexGrid,
  ApexMarkers,
  ApexTooltip,
  ApexAnnotations
} from 'ng-apexcharts';

export type JournalTab = 'evening' | 'difficulties' | 'tests' | 'routine';

export type TestChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  colors: string[];
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  markers: ApexMarkers;
  tooltip: ApexTooltip;
  annotations?: ApexAnnotations;
};

@Component({
  selector: 'app-training-journal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslatePipe,
    BottomNavbarComponent,
    NgApexchartsModule
  ],
  providers: [DatePipe],
  templateUrl: './training-journal.component.html',
  styleUrl: './training-journal.component.scss'
})
export class TrainingJournalComponent implements OnInit, OnDestroy {
  public journalService = inject(TrainingJournalService);
  private datePipe = inject(DatePipe);

  // Active Tab
  public activeTab: JournalTab = 'evening';

  // ── Module 1: Evening Journal & 90s Timer ──────────────────────────────────
  public timerRemainingSeconds = 90;
  public isTimerRunning = false;
  private timerInterval: any = null;

  public eveningForm = {
    date: new Date().toISOString().split('T')[0],
    realEffortRating: 8,
    realEffortNotes: '',
    successes: '',
    concreteProgress: '',
    energyLevel: 4
  };
  public showEveningSuccessAlert = false;

  // Confidence Vault
  public isAddingVaultMoment = false;
  public vaultForm = {
    title: '',
    date: new Date().toISOString().split('T')[0],
    contextOrOpponent: '',
    detailedStory: '',
    takeaway: '',
    tagInput: 'Gara, Rimonta'
  };
  public isBoosterOpen = false;
  public boosterIndex = 0;

  // ── Module 2: Post-Workout Difficulties ("Fatto Freddo") ───────────────────
  public diffForm = {
    technicalError: '',
    errorCount: 4,
    attemptsCount: 10,
    context: '',
    exerciseCode: 'EX-TT-01',
    recoveryDate: this.getDefaultRecoveryDate()
  };
  public emotionalAnalysis = {
    isEmotional: false,
    detectedPhrases: [] as string[],
    suggestion: ''
  };
  public selectedExerciseInfo: IExerciseCatalogItem | null = null;
  public difficultyFilter: 'all' | 'pending' | 'in_recovery' | 'resolved' = 'all';
  public showDiffSuccessAlert = false;

  // ── Module 3: Periodic Tests Tracker ───────────────────────────────────────
  public testCategoryFilter: 'all' | 'physical' | 'technical' = 'all';
  public selectedTestId: string = 'test_side_step';
  public chartOptions: Partial<TestChartOptions> = {};

  public isLoggingScoreModalOpen = false;
  public logScoreForm = {
    testId: 'test_side_step',
    date: new Date().toISOString().split('T')[0],
    score: 0,
    notes: ''
  };

  // ── Module 4: Mantra & Mental Routine (R.R.P.R.) ───────────────────────────
  public mantraForm = {
    text: '',
    focusArea: 'terza_palla' as IPersonalMantra['focusArea']
  };
  public mantraValidation = {
    isValid: true,
    issues: [] as string[],
    recommendations: [] as string[]
  };
  public showMantraSuccessAlert = false;

  // Interactive Reset Routine Simulator
  public isRoutineSimRunning = false;
  public routineStepIndex = 0;
  public routineStepSecondsLeft = 3;
  private routineInterval: any = null;

  ngOnInit() {
    this.updateSelectedExerciseInfo();
    this.setupTestChart();
  }

  ngOnDestroy() {
    this.clearTimer();
    this.clearRoutineInterval();
  }

  // ── Tab Management ─────────────────────────────────────────────────────────
  public setTab(tab: JournalTab) {
    this.activeTab = tab;
    if (tab === 'tests') {
      setTimeout(() => this.setupTestChart(), 100);
    }
  }

  // ── 90-Second Evening Timer ────────────────────────────────────────────────
  public startTimer() {
    if (this.isTimerRunning) return;
    this.isTimerRunning = true;
    this.timerInterval = setInterval(() => {
      if (this.timerRemainingSeconds > 0) {
        this.timerRemainingSeconds--;
      } else {
        this.pauseTimer();
      }
    }, 1000);
  }

  public pauseTimer() {
    this.isTimerRunning = false;
    this.clearTimer();
  }

  public resetTimer() {
    this.pauseTimer();
    this.timerRemainingSeconds = 90;
  }

  private clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public get timerProgressPct(): number {
    return Math.round(((90 - this.timerRemainingSeconds) / 90) * 100);
  }

  public get formattedTimer(): string {
    const m = Math.floor(this.timerRemainingSeconds / 60);
    const s = this.timerRemainingSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  public get currentTimerPhaseCue(): string {
    if (this.timerRemainingSeconds > 60) {
      return 'Fase 1/3: Focalizzati sull\'impegno e intensità reale di oggi (1-10)';
    } else if (this.timerRemainingSeconds > 30) {
      return 'Fase 2/3: Riconosci i successi del tavolo, anche parziali!';
    } else if (this.timerRemainingSeconds > 0) {
      return 'Fase 3/3: Fissa 1 progresso tecnico concreto e percepibile';
    } else {
      return 'Tempo completato! Salva la tua sessione e riposa.';
    }
  }

  // ── Evening Journal Actions ────────────────────────────────────────────────
  public saveEveningEntry() {
    if (!this.eveningForm.realEffortNotes.trim() && !this.eveningForm.successes.trim() && !this.eveningForm.concreteProgress.trim()) {
      return;
    }

    const durationTaken = 90 - this.timerRemainingSeconds;
    this.journalService.addEveningEntry({
      date: this.eveningForm.date,
      realEffortRating: Number(this.eveningForm.realEffortRating),
      realEffortNotes: this.eveningForm.realEffortNotes.trim(),
      successes: this.eveningForm.successes.trim(),
      concreteProgress: this.eveningForm.concreteProgress.trim(),
      durationSecondsTaken: durationTaken > 0 ? durationTaken : 90,
      energyLevel: this.eveningForm.energyLevel
    });

    this.showEveningSuccessAlert = true;
    setTimeout(() => (this.showEveningSuccessAlert = false), 4000);

    // Reset fields
    this.eveningForm.realEffortNotes = '';
    this.eveningForm.successes = '';
    this.eveningForm.concreteProgress = '';
    this.resetTimer();
  }

  public deleteEveningEntry(id: string) {
    if (confirm('Vuoi eliminare questa voce del diario serale?')) {
      this.journalService.deleteEveningEntry(id);
    }
  }

  // ── Confidence Vault Actions ───────────────────────────────────────────────
  public openAddVaultModal() {
    this.isAddingVaultMoment = true;
  }

  public closeAddVaultModal() {
    this.isAddingVaultMoment = false;
  }

  public saveConfidenceMoment() {
    if (!this.vaultForm.title.trim() || !this.vaultForm.detailedStory.trim()) {
      return;
    }

    const tags = this.vaultForm.tagInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    this.journalService.addConfidenceMoment({
      title: this.vaultForm.title.trim(),
      date: this.vaultForm.date,
      contextOrOpponent: this.vaultForm.contextOrOpponent.trim(),
      detailedStory: this.vaultForm.detailedStory.trim(),
      takeaway: this.vaultForm.takeaway.trim(),
      tags: tags.length > 0 ? tags : ['Fiducia', 'Partita'],
      favorite: true
    });

    this.isAddingVaultMoment = false;
    this.vaultForm.title = '';
    this.vaultForm.contextOrOpponent = '';
    this.vaultForm.detailedStory = '';
    this.vaultForm.takeaway = '';
  }

  public toggleFavoriteMoment(id: string) {
    this.journalService.toggleFavoriteConfidenceMoment(id);
  }

  public deleteMoment(id: string) {
    if (confirm('Eliminare questo momento di orgoglio dalla Banca della Fiducia?')) {
      this.journalService.deleteConfidenceMoment(id);
    }
  }

  public openBoosterModal() {
    const items = this.journalService.getConfidenceVaultSnapshot();
    if (items.length === 0) {
      alert('La Banca della Fiducia è vuota. Aggiungi prima un momento di orgoglio!');
      return;
    }
    this.isBoosterOpen = true;
    this.boosterIndex = 0;
  }

  public closeBoosterModal() {
    this.isBoosterOpen = false;
  }

  public nextBooster(max: number) {
    if (this.boosterIndex < max - 1) {
      this.boosterIndex++;
    } else {
      this.boosterIndex = 0;
    }
  }

  public prevBooster(max: number) {
    if (this.boosterIndex > 0) {
      this.boosterIndex--;
    } else {
      this.boosterIndex = max - 1;
    }
  }

  // ── Post-Workout Difficulties Actions ──────────────────────────────────────
  public onTechnicalErrorInput(value: string) {
    this.diffForm.technicalError = value;
    this.emotionalAnalysis = this.journalService.analyzeForEmotionalJudgment(value);
  }

  public onExerciseCodeChange(code: string) {
    this.diffForm.exerciseCode = code;
    this.updateSelectedExerciseInfo();
  }

  private updateSelectedExerciseInfo() {
    this.selectedExerciseInfo =
      this.journalService.exerciseCatalog.find(e => e.code === this.diffForm.exerciseCode) || null;
  }

  public get calculatedErrorRatePct(): number {
    const err = Math.max(0, this.diffForm.errorCount);
    const att = Math.max(1, this.diffForm.attemptsCount);
    return Number(((err / att) * 100).toFixed(1));
  }

  public saveDifficulty() {
    if (!this.diffForm.technicalError.trim()) return;

    if (this.emotionalAnalysis.isEmotional) {
      alert('Non puoi salvare un giudizio emotivo generico! Trasformalo prima in un fatto freddo misurabile seguendo il suggerimento.');
      return;
    }

    const exName = this.selectedExerciseInfo ? this.selectedExerciseInfo.name : this.diffForm.exerciseCode;

    this.journalService.addDifficulty({
      date: new Date().toISOString().split('T')[0],
      technicalError: this.diffForm.technicalError.trim(),
      errorCount: this.diffForm.errorCount,
      attemptsCount: this.diffForm.attemptsCount,
      context: this.diffForm.context.trim() || 'Fase di gioco / Cesto',
      exerciseCode: this.diffForm.exerciseCode,
      exerciseName: exName,
      recoveryDate: this.diffForm.recoveryDate,
      status: 'pending'
    });

    this.showDiffSuccessAlert = true;
    setTimeout(() => (this.showDiffSuccessAlert = false), 4000);

    // Reset
    this.diffForm.technicalError = '';
    this.diffForm.context = '';
    this.diffForm.errorCount = 3;
    this.diffForm.attemptsCount = 10;
    this.diffForm.recoveryDate = this.getDefaultRecoveryDate();
    this.emotionalAnalysis = { isEmotional: false, detectedPhrases: [], suggestion: '' };
  }

  public changeDifficultyStatus(id: string, status: 'pending' | 'in_recovery' | 'resolved') {
    let notes: string | undefined = undefined;
    if (status === 'resolved') {
      const res = prompt('Note di superamento (es. "Completate 3 sessioni di cesto, errore sceso sotto il 15%"):');
      notes = res ? res.trim() : 'Superato con successo!';
    }
    this.journalService.updateDifficultyStatus(id, status, notes);
  }

  public deleteDifficulty(id: string) {
    if (confirm('Vuoi eliminare questa difficoltà registrata?')) {
      this.journalService.deleteDifficulty(id);
    }
  }

  public filterDifficulties(items: IPostWorkoutDifficulty[]): IPostWorkoutDifficulty[] {
    if (this.difficultyFilter === 'all') return items;
    return items.filter(d => d.status === this.difficultyFilter);
  }

  private getDefaultRecoveryDate(): string {
    const d = new Date(Date.now() + 2 * 86400000);
    return d.toISOString().split('T')[0];
  }

  // ── Periodic Tests Tracker Actions ─────────────────────────────────────────
  public filterTests(tests: IPeriodicTest[]): IPeriodicTest[] {
    if (this.testCategoryFilter === 'all') return tests;
    return tests.filter(t => t.category === this.testCategoryFilter);
  }

  public selectTestForChart(testId: string) {
    this.selectedTestId = testId;
    this.setupTestChart();
  }

  public get currentSelectedTest(): IPeriodicTest | undefined {
    return this.journalService.defaultPeriodicTests.find(t => t.id === this.selectedTestId);
  }

  public openLogScoreModal(testId?: string) {
    if (testId) {
      this.logScoreForm.testId = testId;
    }
    this.logScoreForm.date = new Date().toISOString().split('T')[0];
    this.logScoreForm.score = 0;
    this.logScoreForm.notes = '';
    this.isLoggingScoreModalOpen = true;
  }

  public closeLogScoreModal() {
    this.isLoggingScoreModalOpen = false;
  }

  public submitTestScore() {
    if (!this.logScoreForm.testId) return;

    this.journalService.logTestScore({
      testId: this.logScoreForm.testId,
      date: this.logScoreForm.date,
      score: Number(this.logScoreForm.score),
      notes: this.logScoreForm.notes.trim()
    });

    this.isLoggingScoreModalOpen = false;
    this.setupTestChart();
  }

  public deleteTestScore(id: string) {
    if (confirm('Vuoi rimuovere questo punteggio storico?')) {
      this.journalService.deleteTestScore(id);
      this.setupTestChart();
    }
  }

  public setupTestChart() {
    const test = this.currentSelectedTest;
    if (!test) return;

    const scores = this.journalService.getScoresForTest(test.id);

    const categories = scores.map(s => {
      const d = new Date(s.date);
      return this.datePipe.transform(d, 'dd/MM') || s.date;
    });

    const seriesData = scores.map(s => s.score);

    this.chartOptions = {
      series: [
        {
          name: test.name,
          data: seriesData
        }
      ],
      chart: {
        type: 'line',
        height: 280,
        toolbar: { show: false },
        animations: { enabled: true, easing: 'easeinout', speed: 500 },
        background: 'transparent'
      },
      stroke: {
        curve: 'smooth',
        width: 3.5
      },
      colors: [test.category === 'physical' ? '#38bdf8' : '#facc15'],
      markers: {
        size: 5,
        colors: ['#05131c'],
        strokeColors: test.category === 'physical' ? '#38bdf8' : '#facc15',
        strokeWidth: 2,
        hover: { size: 7 }
      },
      grid: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        strokeDashArray: 4
      },
      xaxis: {
        categories,
        labels: {
          style: {
            colors: '#94a3b8',
            fontSize: '11px'
          }
        },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#94a3b8',
            fontSize: '11px'
          },
          formatter: (val: number) => `${val} ${test.unit}`
        }
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val: number) => `${val} ${test.unit}`
        }
      },
      annotations: {
        yaxis: [
          {
            y: test.benchmarkScore,
            borderColor: '#ec4899',
            strokeDashArray: 4,
            label: {
              borderColor: '#ec4899',
              style: {
                color: '#fff',
                background: '#ec4899',
                fontSize: '10px'
              },
              text: `Benchmark: ${test.benchmarkScore} ${test.unit}`
            }
          }
        ]
      }
    };
  }

  // ── Mantra Actions ─────────────────────────────────────────────────────────
  public onMantraInput(value: string) {
    this.mantraForm.text = value;
    this.mantraValidation = this.journalService.validateMantra(value);
  }

  public saveMantra() {
    if (!this.mantraForm.text.trim()) return;

    if (!this.mantraValidation.isValid) {
      alert('Il mantra presenta aspetti da ottimizzare (negazioni o formule dubitative). Riformulalo in modo assertivo al presente!');
      return;
    }

    this.journalService.addMantra({
      text: this.mantraForm.text.trim(),
      focusArea: this.mantraForm.focusArea,
      isActive: true
    });

    this.showMantraSuccessAlert = true;
    setTimeout(() => (this.showMantraSuccessAlert = false), 4000);

    this.mantraForm.text = '';
    this.mantraValidation = { isValid: true, issues: [], recommendations: [] };
  }

  public toggleMantraActive(id: string) {
    this.journalService.toggleMantraActive(id);
  }

  public deleteMantra(id: string) {
    if (confirm('Vuoi rimuovere questo mantra personale?')) {
      this.journalService.deleteMantra(id);
    }
  }

  // ── Interactive Reset Routine Simulator (R.R.P.R.) ─────────────────────────
  public startRoutineSimulation() {
    this.isRoutineSimRunning = true;
    this.routineStepIndex = 0;
    this.routineStepSecondsLeft = 3;
    this.clearRoutineInterval();

    this.routineInterval = setInterval(() => {
      if (this.routineStepSecondsLeft > 1) {
        this.routineStepSecondsLeft--;
      } else {
        if (this.routineStepIndex < this.journalService.resetRoutineSteps.length - 1) {
          this.routineStepIndex++;
          this.routineStepSecondsLeft = 3;
          if (navigator && 'vibrate' in navigator) {
            try { navigator.vibrate(80); } catch (_) {}
          }
        } else {
          this.stopRoutineSimulation();
        }
      }
    }, 1000);
  }

  public stopRoutineSimulation() {
    this.isRoutineSimRunning = false;
    this.clearRoutineInterval();
    this.routineStepSecondsLeft = 3;
  }

  public nextRoutineStep() {
    if (this.routineStepIndex < this.journalService.resetRoutineSteps.length - 1) {
      this.routineStepIndex++;
      this.routineStepSecondsLeft = 3;
    } else {
      this.stopRoutineSimulation();
    }
  }

  private clearRoutineInterval() {
    if (this.routineInterval) {
      clearInterval(this.routineInterval);
      this.routineInterval = null;
    }
  }

  public get currentRoutineStep(): IResetRoutineStep {
    return this.journalService.resetRoutineSteps[this.routineStepIndex] || this.journalService.resetRoutineSteps[0];
  }

  // Helpers
  public trackById = (_: number, item: { id: string }) => item.id;
  public trackByCode = (_: number, item: { code: string }) => item.code;
}
