import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';
import { IPlayer } from '../../../../services/players.service';
import { CompetitionService } from '../../../../services/competitions.service';
import { ICompetition } from '../../../../api/competition.api';
import { DataService } from '../../../../services/data.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectPlayerComponent } from '../../../utils/components/select-player/select-player.component';
import { VoiceScoreComponent } from './voice-score/voice-score.component';
import { ModalService } from '../../../../services/modal.service';
import { LoaderService } from '../../../../services/loader.service';
import { Utils } from '../../../utils/Utils';
import { StepIndicatorComponent } from '../../../common/step-indicator/step-indicator.component';
import { Group, mapGroupPlayerToIPlayer } from '../../../interfaces/group.interface';
import { KnockoutStage } from '../../../utils/enum';

@Component({
  selector: 'app-manual-points',
  imports: [SHARED_IMPORTS, SelectPlayerComponent, VoiceScoreComponent, StepIndicatorComponent],
  templateUrl: './manual-points.component.html',
  styleUrl: './manual-points.component.scss'
})
export class ManualPointsComponent implements OnChanges, OnInit {

  @Output() close = new EventEmitter<any>();
  @ViewChild('effectLeft') effectLeft!: ElementRef;
  @ViewChild('effectRight') effectRight!: ElementRef;
  @Input() isAlreadySelected = false;

  @Input() maxSets = 5;
  @Input() maxPoints = 21;
  initialMaxPoints = 21;
  @Input() player2: IPlayer | null = null;
  @Input() player1: IPlayer | null = null;
  @Input() players: IPlayer[] = [];
  @Input() groups: Group[] = [];
  @Input() isGroupKnockout = false;
  @Input() roundOfMatch: KnockoutStage | null = null;

  groupForm!: FormGroup;
  playersForm!: FormGroup;

  player1Points = 0;
  player2Points = 0;

  player1SetsPoints = 0;
  player2SetsPoints = 0;
  sets: Array<{ player1: number; player2: number }> = [];
  competition: ICompetition | null = null;
  isMobile = false;

  step = 1;
  totalSteps = 2;

  private isGroupMode = false;
  private groupsFromService: Group[] = [];
  private skipPlayerReset = false;
  private selectedGroupId: string | null = null;
  private groupPlayers: IPlayer[] = [];

  constructor(
    private dataService: DataService,
    private fb: FormBuilder,
    private modalService: ModalService,
    private loaderService: LoaderService,
    private competitionService: CompetitionService,
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['player1'] || changes['player2']) {
      if (this.playersForm) {
        this.playersForm.patchValue({
          player1: this.player1?.id ?? null,
          player2: this.player2?.id ?? null,
        }, { emitEvent: false });
      }
    }

    if (changes['groups']) {
      this.trySelectGroup();
    }
  }

  ngOnInit() {
    this.checkViewport();
    this.initForms();
    this.updateMode();

    this.competitionService.activeCompetition$.subscribe(comp => {
      this.competition = comp;
      this.maxPoints = this.competition?.['points_type'] || 21;
      this.initialMaxPoints = this.maxPoints;
      this.maxSets = this.competition?.['sets_type'] || 10;
      this.updateMode();
    });

    this.dataService.groupsObs.subscribe(groups => {
      this.groupsFromService = groups ?? [];
      this.trySelectGroup();
    });

    if (this.isAlreadySelected && this.player1 && this.player2) {
      this.step = this.totalSteps;
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.checkViewport();
  }

  get isGroupSelectionStep(): boolean {
    return this.isGroupMode && this.step === 1;
  }

  get isPlayerSelectionStep(): boolean {
    return this.isGroupMode ? this.step === 2 : this.step === 1;
  }

  get isPointsStep(): boolean {
    return this.step === this.totalSteps;
  }

  get showGroupControls(): boolean {
    return this.isGroupMode;
  }

  get selectedGroup(): Group | null {
    const groups = this.availableGroups;
    return groups.find(group => group.id === this.selectedGroupId) ?? null;
  }

  get availablePlayers(): IPlayer[] {
    if (this.isGroupMode) {
      return this.groupPlayers.length ? this.groupPlayers : [];
    }

    return this.players ?? [];
  }

  get availableGroups(): Group[] {
    return this.groups?.length ? this.groups : this.groupsFromService;
  }

  private initForms() {
    this.groupForm = this.fb.group({
      groupId: [null, Validators.required],
    });

    this.groupForm.get('groupId')?.valueChanges.subscribe(groupId => {
      this.onGroupChanged(groupId ?? null);
    });

    this.playersForm = this.fb.group({
      player1: [this.player1?.id ?? null, Validators.required],
      player2: [this.player2?.id ?? null, Validators.required],
    });

    this.playersForm.valueChanges.subscribe(val => {
      this.player1 = this.findPlayerById(val.player1);
      this.player2 = this.findPlayerById(val.player2);
    });
  }

  private updateMode() {
    const competitionType = this.competition?.type ?? null;
    this.isGroupMode = this.isGroupKnockout || competitionType === 'group_knockout';
    this.totalSteps = this.isGroupMode ? 3 : 2;
    this.step = Math.min(this.step, this.totalSteps);

    if (!this.isGroupMode) {
      this.selectedGroupId = null;
      this.groupPlayers = [];
    } else {
      this.trySelectGroup();
    }
  }

  private checkViewport() {
    this.isMobile = window.innerWidth <= 768 || window.innerWidth < window.innerHeight;
  }

  onGroupContinue() {
    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }

    this.step = Math.max(this.step, 2);
  }

  onPlayersContinue() {
    if (this.playersForm.invalid) {
      this.playersForm.markAllAsTouched();
      return;
    }

    this.player1 = this.findPlayerById(this.playersForm.get('player1')?.value ?? null);
    this.player2 = this.findPlayerById(this.playersForm.get('player2')?.value ?? null);

    if (!this.player1 || !this.player2) {
      return;
    }

    this.step = this.totalSteps;
  }

  private onGroupChanged(groupId: string | null) {
    this.selectedGroupId = groupId;
    this.updateGroupPlayers();
    this.syncPlayersWithGroup();

    if (this.isGroupMode && !this.skipPlayerReset) {
      this.step = Math.min(this.step, this.totalSteps - 1);
    }

    this.skipPlayerReset = false;
  }

  private updateGroupPlayers() {
    if (!this.isGroupMode || !this.selectedGroupId) {
      this.groupPlayers = [];
      return;
    }

    const groups = this.availableGroups;
    const group = groups.find(item => item.id === this.selectedGroupId) ?? null;
    this.groupPlayers = group ? group.players.map(mapGroupPlayerToIPlayer) : [];
  }

  private syncPlayersWithGroup() {
    if (!this.isGroupMode) {
      return;
    }

    const allowedIds = new Set(this.groupPlayers.map(player => Number(player.id)));

    if (this.player1 && !allowedIds.has(Number(this.player1.id))) {
      this.player1 = null;
    }

    if (this.player2 && !allowedIds.has(Number(this.player2.id))) {
      this.player2 = null;
    }

    this.playersForm.patchValue({
      player1: this.player1?.id ?? null,
      player2: this.player2?.id ?? null,
    }, { emitEvent: false });
  }

  private trySelectGroup() {
    if (!this.isGroupMode) {
      return;
    }

    const groups = this.availableGroups;
    if (!groups.length) {
      return;
    }

    if (this.selectedGroupId) {
      this.updateGroupPlayers();
      return;
    }

    const candidate = this.findGroupForPlayers(groups);
    if (candidate) {
      this.skipPlayerReset = true;
      this.groupForm.patchValue({ groupId: candidate.id }, { emitEvent: true });
      if (this.isAlreadySelected && this.player1 && this.player2) {
        this.step = this.totalSteps;
      }
      return;
    }

    if (groups.length === 1) {
      this.skipPlayerReset = true;
      this.groupForm.patchValue({ groupId: groups[0].id }, { emitEvent: true });
      return;
    }
  }

  private findGroupForPlayers(groups: Group[]): Group | null {
    if (!this.player1 && !this.player2) {
      return null;
    }

    return groups.find(group => {
      const members = new Set(group.players.map(member => Number(member.id)));
      const player1Ok = !this.player1 || members.has(Number(this.player1.id));
      const player2Ok = !this.player2 || members.has(Number(this.player2.id));
      return player1Ok && player2Ok;
    }) ?? null;
  }

  private findPlayerById(id: number | null): IPlayer | null {
    if (id == null) {
      return null;
    }

    const source = this.isGroupMode ? this.groupPlayers : this.players;
    return source.find(player => Number(player.id) === Number(id)) ?? null;
  }

  getPlayers(player?: number): IPlayer[] {
    const basePlayers = this.availablePlayers;
    if (!basePlayers.length) {
      return [];
    }

    const loggedInPlayerId = this.dataService.getLoggedInPlayerId();
    let filtered = basePlayers.filter(p => Number(p.id) !== Number(loggedInPlayerId));

    const selectedPlayer1 = this.playersForm.get('player1')?.value;
    const selectedPlayer2 = this.playersForm.get('player2')?.value;

    if (player === 1 && selectedPlayer2) {
      filtered = filtered.filter(p => Number(p.id) !== Number(selectedPlayer2));
    }

    if (player === 2 && selectedPlayer1) {
      filtered = filtered.filter(p => Number(p.id) !== Number(selectedPlayer1));
    }

    return filtered;
  }

  setPlayer(player: { playerNumber: number; id: number }) {
    this.playersForm.get(`player${player.playerNumber}`)?.setValue(player.id);
  }

  onScoreChanged(event: { p1: number; p2: number }) {
    event.p1 = Math.min(event.p1, this.maxPoints + 1);
    event.p2 = Math.min(event.p2, this.maxPoints + 1);
    if (this.effectLeft && this.effectLeft.nativeElement) {
      if (this.player1Points !== event.p1) {
        this.triggerHighlight(this.effectLeft);
      }
      if (this.player2Points !== event.p2) {
        this.triggerHighlight(this.effectRight);
      }
    }
    this.player1Points = event.p1;
    this.player2Points = event.p2;
  }

  changePoint(player: number) {
    if (
      (player === 1 &&
        (this.player1Points < this.maxPoints ||
          (this.player1Points >= this.maxPoints - 1 &&
            this.player2Points >= this.maxPoints - 1 &&
            Math.abs(this.player1Points - this.player2Points) < 2))) ||
      (player === 2 &&
        (this.player2Points < this.maxPoints ||
          (this.player1Points >= this.maxPoints - 1 &&
            this.player2Points >= this.maxPoints - 1 &&
            Math.abs(this.player1Points - this.player2Points) < 2)))
    ) {
      if (player === 1) {
        this.player1Points++;
        this.triggerHighlight(this.effectLeft);
      } else if (player === 2) {
        this.player2Points++;
        this.triggerHighlight(this.effectRight);
      }
      if (this.player1Points >= this.maxPoints && this.player2Points >= this.maxPoints && Math.abs(this.player1Points - this.player2Points) < 2) {
        this.maxPoints += 2;
      }
    }
  }

  subtractPoint(player: number) {
    if (player === 1 && this.player1Points > 0) {
      this.recalculateMaxPoints();
      this.player1Points--;
    } else if (player === 2 && this.player2Points > 0) {
      this.player2Points--;
      this.recalculateMaxPoints();
    }
  }

  private recalculateMaxPoints() {
    if (
      this.player1Points >= this.initialMaxPoints - 1 &&
      this.player2Points >= this.initialMaxPoints - 1 &&
      Math.abs(this.player1Points - this.player2Points) < 2 &&
      this.maxPoints > this.initialMaxPoints
    ) {
      this.maxPoints -= 2;
    }
  }

  onPlayersBack() {
    if (this.isGroupMode) {
      this.step = 2;
      return;
    }
    this.step = 1;
  }

  onGroupBack() {
    if (this.isGroupMode) {
      this.step = 1;
    }
  }

  onSave() {
    if (this.player1Points > this.player2Points) {
      this.player1SetsPoints++;
      this.sets.push({ player1: this.player1Points, player2: this.player2Points });
      this.onReset();
    } else if (this.player2Points > this.player1Points) {
      this.player2SetsPoints++;
      this.sets.push({ player1: this.player1Points, player2: this.player2Points });
      this.onReset();
    }
  }

  onReset() {
    this.player1Points = 0;
    this.player2Points = 0;

    this.maxPoints = this.initialMaxPoints;
    if (this.effectRight && this.effectRight.nativeElement) {
      this.triggerHighlight(this.effectRight);
    }
    if (this.effectLeft && this.effectLeft.nativeElement) {
      this.triggerHighlight(this.effectLeft);
    }
  }

  isPointsError(p1: number, p2: number, maxPoints: number): boolean {
    if (p1 === 0 && p2 === 0) return true;

    const diff = Math.abs(p1 - p2);
    const max = Math.max(p1, p2);
    const min = Math.min(p1, p2);
    if (p1 < maxPoints && p2 < maxPoints) return true;

    if (max >= maxPoints) {
      if (diff >= 2) {
        if (p1 >= this.initialMaxPoints - 1 && p2 > this.initialMaxPoints - 1 && diff > 2) {
          return true;
        }
        return false;
      }
      return true;
    }
    return true;
  }

  private triggerHighlight(el: ElementRef) {
    if (!el || !el.nativeElement) return;

    const element = el.nativeElement;

    element.style.animation = 'none';
    element.offsetHeight;
    element.style.animation = '';

    element.classList.add(Utils.isIos() ? 'highlight-once-mobile' : 'highlight-once');

    element.addEventListener('animationend', () => {
      element.classList.remove(Utils.isIos() ? 'highlight-once-mobile' : 'highlight-once');
    }, { once: true });
  }

  isCompleted(): boolean {
    return this.player1SetsPoints >= this.maxSets || this.player2SetsPoints >= this.maxSets;
  }

  saveMatch(target: EventTarget | null) {
    if (!this.isCompleted()) {
      alert('La partita non è ancora conclusa!');
      return;
    }

    if (!this.player1 || !this.player2) {
      alert('Seleziona entrambi i giocatori!');
      return;
    }
    if (target instanceof HTMLElement) {
      this.loaderService.addSpinnerToButton(target);
    }

    const today = new Date();
    const formattedDate =
      today.toLocaleDateString('en-GB') +
      ` - ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

    const setsData = this.sets.map((s) => ({
      player1Points: s.player1 ?? s.player1 ?? 0,
      player2Points: s.player2 ?? s.player2 ?? 0
    }));

    const formData: { [key: string]: any; p1Score: number; p2Score: number; groupId?: string | null } = {
      date: formattedDate,
      player1: this.player1.id,
      player2: this.player2.id,
      p1Score: this.player1SetsPoints,
      p2Score: this.player2SetsPoints,
      setsPoints: setsData,
    };

    if (this.isGroupMode && this.selectedGroupId) {
      formData.groupId = this.selectedGroupId;
    }

    this.dataService.addMatch(formData, this.roundOfMatch ?? null).then(() => {
      this.modalService.closeModal();
      if (target instanceof HTMLElement) {
        this.loaderService.removeSpinnerFromButton(target);
      }
    }).catch(err => {
      console.error('Errore durante il salvataggio match', err);
    });
  }
}
