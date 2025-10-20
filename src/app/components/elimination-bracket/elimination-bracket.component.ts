import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, OnInit, SimpleChanges, inject } from '@angular/core';
import { ICompetition } from '../../../api/competition.api';
import { TranslatePipe } from '../../utils/translate.pipe';
import { EliminationMatchSlot, EliminationRound } from '../../interfaces/elimination-bracket.interface';
import { ModalService } from '../../../services/modal.service';
import { IPlayer } from '../../../services/players.service';
import { IMatch } from '../../interfaces/matchesInterfaces';
import { DataService } from '../../../services/data.service';
import { mapKnockoutResponse } from '../../interfaces/knockout.interface';
import { KnockoutStage, toKnockoutStage } from '../../utils/enum';
import { Subscription } from 'rxjs';

export interface EliminationModalEvent {
  modalName: string;
  player1: IPlayer | null;
  player2: IPlayer | null;
  match?: IMatch | null;
  roundName?: KnockoutStage | null;
  roundLabel?: KnockoutStage | string | null;
}

@Component({
  selector: 'app-elimination-bracket',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './elimination-bracket.component.html',
  styleUrl: './elimination-bracket.component.scss'
})
export class EliminationBracketComponent implements OnInit, OnDestroy, OnChanges {
  @Input() competition: ICompetition | null = null;
  @Input() rounds: EliminationRound[] = [];
  @Input() readonly = false;
  modalService = inject(ModalService);
  dataService = inject(DataService);
  @Output() matchRoundClicked = new EventEmitter<EliminationModalEvent>();
  private knockoutSubscription?: Subscription;

  ngOnInit() {
    this.knockoutSubscription = this.dataService.knockoutObs.subscribe(knockout => {
      if (!knockout) {
        this.rounds = [];
        return;
      }

      if (this.competition?.id != null && knockout.competitionId != null) {
        const knockoutCompetitionId = Number(knockout.competitionId);
        if (Number.isFinite(knockoutCompetitionId) && Number(knockoutCompetitionId) !== Number(this.competition.id)) {
          return;
        }
      }

      this.rounds = mapKnockoutResponse(knockout);
    });

    this.ensureKnockoutData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['competition'] && !changes['competition'].firstChange) {
      this.ensureKnockoutData(true);
    }
  }

  ngOnDestroy(): void {
    this.knockoutSubscription?.unsubscribe();
  }

  private ensureKnockoutData(force = false) {
    const competitionId = this.competition?.id;
    if (!competitionId) {
      this.rounds = [];
      return;
    }

    const cached = this.dataService.knockoutStage;
    const cachedCompetitionRaw = cached?.competitionId ?? null;
    const competitionNumeric = Number(competitionId);
    const cachedNumeric = cachedCompetitionRaw != null ? Number(cachedCompetitionRaw) : null;
    const matchesCompetition =
      !!cached && cachedCompetitionRaw != null && (
        Number.isFinite(cachedNumeric) && Number.isFinite(competitionNumeric)
          ? Number(cachedNumeric) === Number(competitionNumeric)
          : String(cachedCompetitionRaw) === String(competitionId)
      );

    if (matchesCompetition && !force) {
      this.rounds = mapKnockoutResponse(cached);
      return;
    }

    this.dataService.fetchKnockouts({ competitionId: Number(competitionId), force: true }).catch(error => {
      console.error('Failed to fetch knockouts for bracket:', error);
    });
  }

  trackByRound(index: number, round: EliminationRound) {
    return `${round.name}-${index}`;
  }

  trackByMatch(index: number, _match: unknown) {
    return index;
  }
  openModal(modalName: string, options: {
    player1?: IPlayer | null;
    player2?: IPlayer | null;
    match?: IMatch | null;
    roundName?: KnockoutStage | string | null;
    roundLabel?: KnockoutStage | string | null;
  } = {}) {
    if (this.readonly) {
      return;
    }
    console.log('openModal called with:', modalName, options);
    const stage = toKnockoutStage(options.roundName ?? options.roundLabel ?? null);
    const roundLabel = options.roundLabel ?? stage ?? null;
    this.matchRoundClicked.emit({
      modalName,
      player1: options.player1 ?? null,
      player2: options.player2 ?? null,
      match: options.match ?? null,
      roundName: stage ?? undefined,
      roundLabel: roundLabel ?? undefined,
    });
  }

  isSlotWinner(slot: EliminationMatchSlot, winnerId: number | string | null | undefined): boolean {
    if (!slot?.player || winnerId == null) {
      return false;
    }

    return String(slot.player.id) === String(winnerId);
  }

}
