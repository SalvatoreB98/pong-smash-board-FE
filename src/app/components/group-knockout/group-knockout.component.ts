import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { EliminationBracketComponent, EliminationModalEvent } from '../elimination-bracket/elimination-bracket.component';
import { EliminationRound } from '../../interfaces/elimination-bracket.interface';
import { IPlayer } from '../../../services/players.service';
import { ICompetition } from '../../../api/competition.api';
import { TranslatePipe } from '../../utils/translate.pipe';
import { GroupKnockoutBoardComponent } from './group-knockout-board.component';
import { Group, GroupPlayer, QUALIFIED_PER_GROUP } from '../../interfaces/group.interface';
import { IMatch } from '../../interfaces/matchesInterfaces';
import { DataService } from '../../../services/data.service';
import { mapKnockoutResponse } from '../../interfaces/knockout.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-group-knockout',
  standalone: true,
  imports: [
    CommonModule,
    EliminationBracketComponent,
    GroupKnockoutBoardComponent,
    TranslatePipe
  ],
  templateUrl: './group-knockout.component.html',
  styleUrl: './group-knockout.component.scss'
})
export class GroupKnockoutComponent implements OnInit, OnDestroy {
  @Input() groups: Group[] = [];
  @Input() qualifiedPlayers: IPlayer[] = [];
  @Input() competition: ICompetition | null = null;
  @Input() readonly = false;
  @Input() matches: IMatch[] = [];
  @Output() roundSelected = new EventEmitter<EliminationModalEvent>();
  @Output() matchSelected = new EventEmitter<IMatch>();
  private _rounds: EliminationRound[] = [];
  private externalRounds: EliminationRound[] = [];
  private knockoutSubscription?: Subscription;
  private dataService = inject(DataService);
  readonly qualifiedPerGroup = QUALIFIED_PER_GROUP;
  isLoading = false;
  hasServiceRounds = false;

  @Input()
  set rounds(value: EliminationRound[] | null | undefined) {
    this.externalRounds = value ?? [];
    if (!this.hasServiceRounds) {
      this._rounds = [...this.externalRounds];
    }
  }

  get rounds(): EliminationRound[] {
    return this._rounds;
  }

  ngOnInit(): void {
    const cached = this.dataService.knockoutStage;
    if (cached) {
      this._rounds = mapKnockoutResponse(cached);
      this.hasServiceRounds = true;
    } else if (this.externalRounds.length && !this._rounds.length) {
      this._rounds = [...this.externalRounds];
    }

    this.knockoutSubscription = this.dataService.knockoutObs.subscribe(knockout => {
      this.hasServiceRounds = true;
      if (!knockout) {
        this._rounds = [];
        this.isLoading = false;
        return;
      }

      this._rounds = mapKnockoutResponse(knockout);
      this.isLoading = false;
    });
  }

  ngOnDestroy(): void {
    this.knockoutSubscription?.unsubscribe();
  }

  onRoundSelected(event: EliminationModalEvent) {
    if (this.readonly) {
      return;
    }
    this.roundSelected.emit(event);
  }

  async generateKnockouts() {
    if (!this.canGenerateKnockouts) {
      return;
    }

    const competitionId = this.competition?.id;
    if (competitionId == null) {
      return;
    }

    this.isLoading = true;
    try {
      await this.dataService.fetchKnockouts({ competitionId: Number(competitionId), force: true });
    } catch (error) {
      console.error('Failed to generate knockout stage:', error);
      this.isLoading = false;
    }
  }

  get canGenerateKnockouts(): boolean {
    return !this.readonly && this.competition?.id != null && this.areGroupsComplete;
  }

  get showGenerateHint(): boolean {
    if (this.readonly || this.isLoading || this.competition?.id == null) {
      return false;
    }

    return !this.areGroupsComplete;
  }

  get hasRounds(): boolean {
    return Array.isArray(this.rounds) && this.rounds.length > 0;
  }

  private get areGroupsComplete(): boolean {
    if (!this.groups?.length) {
      return false;
    }

    return this.groups.every(group => this.isGroupComplete(group));
  }

  private isGroupComplete(group: Group): boolean {
    const players = group?.players ?? [];
    if (players.length <= 1) {
      return false;
    }

    const expectedMatches = players.length - 1;
    return players.every(player => this.hasCompletedMatches(player, expectedMatches));
  }

  private hasCompletedMatches(player: GroupPlayer, expectedMatches: number): boolean {
    const remaining = this.resolveRemainingMatches(player);
    if (remaining > 0) {
      return false;
    }

    const matchesPlayed = Number.isFinite(player.matchesPlayed) ? Number(player.matchesPlayed) : NaN;
    const winsLosses = (Number.isFinite(player.wins) ? Number(player.wins) : 0) +
      (Number.isFinite(player.losses) ? Number(player.losses) : 0);
    const played = Number.isFinite(matchesPlayed) ? matchesPlayed : winsLosses;

    if (!Number.isFinite(played)) {
      return false;
    }

    return played >= expectedMatches && expectedMatches > 0;
  }

  private resolveRemainingMatches(player: GroupPlayer): number {
    const candidates = [
      (player as any)?.matchesToPlay,
      (player as any)?.matchesRemaining,
      (player as any)?.matches_remaining,
      (player as any)?.remainingMatches,
    ];

    for (const value of candidates) {
      if (value == null) {
        continue;
      }
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }

    return 0;
  }
}
