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
import { MatchCardAction, MatchCardComponent, MatchCardPlayerSlot } from '../match-card/match-card.component';
import { TranslationService } from '../../../services/translation.service';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';
import { ModalComponent } from '../../common/modal/modal.component';
import { BracketModalComponent } from './bracket-modal/bracket-modal.component';

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
  imports: [...SHARED_IMPORTS, CommonModule, TranslatePipe, MatchCardComponent, ModalComponent, BracketModalComponent],
  templateUrl: './elimination-bracket.component.html',
  styleUrl: './elimination-bracket.component.scss'
})
export class EliminationBracketComponent implements OnInit, OnDestroy, OnChanges {
  @Input() competition: ICompetition | null = null;
  @Input() rounds: EliminationRound[] = [];
  @Input() readonly = false;
  modalService = inject(ModalService);
  dataService = inject(DataService);
  private translationService = inject(TranslationService);
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
      console.log('Updated rounds from knockout subscription:', this.rounds);
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
      console.log('Updated rounds from knockout subscription:', this.rounds);

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

  getScore(match: any, slotIndex: number): number | null {
    return slotIndex === 0 ? match.player1Score ?? '' : match.player2Score ?? '';
  }

  getRoundName(round: any, match: any): string {
    // Restituisce il nome tecnico del round (es. "semifinals", "quarterfinals", ecc.)
    return match.roundKey ?? round.stage ?? round.name ?? '';
  }

  getRoundLabel(round: any, match: any): string {
    // Restituisce l’etichetta visibile del round (può coincidere col nome)
    return match.roundLabel ?? round.stage ?? round.name ?? '';
  }

  buildBracketPlayers(match: any, roundIndex: number): MatchCardPlayerSlot[] {
    // Repackages bracket slots so the shared card can render the admin/read-only states.
    return (match?.slots ?? []).map((slot: EliminationMatchSlot, slotIndex: number) => {
      if (slot?.player) {
        return {
          id: slot.player.id ?? null,
          displayName: slot.player.nickname || slot.player.name || '',
          avatarUrl: slot.player.image_url || null,
          score: this.getScore(match, slotIndex) ?? '',
          isWinner: this.isSlotWinner(slot, match.winnerId),
          state: 'player',
        } satisfies MatchCardPlayerSlot;
      }

      const waitingLabel = this.translationService.translate('elimination_waiting_player');
      if (roundIndex === 0 && !this.readonly) {
        return {
          state: 'empty',
          action: {
            icon: '<i class="fa fa-plus" aria-hidden="true"></i>',
            cssClass: 'tertiary',
            handler: null,
            ariaLabel: this.translationService.translate('add_player'),
          },
        } satisfies MatchCardPlayerSlot;
      }

      return {
        state: 'waiting',
        waitingLabel,
      } satisfies MatchCardPlayerSlot;
    });
  }

  buildSetDateAction(match: any): MatchCardAction | null {
    if (this.readonly || match?.matchData?.created) {
      return null;
    }

    return {
      label: this.translationService.translate('set_date'),
      icon: '<i class="fa fa-calendar-plus-o ms-2" aria-hidden="true"></i>',
      handler: null,
    };
  }

  buildBracketActions(match: any, round: any): MatchCardAction[] {
    if (this.readonly) {
      return [];
    }

    const actions: MatchCardAction[] = [];
    actions.push({
      icon: '<i class="fa fa-info-circle" aria-hidden="true"></i>',
      cssClass: ['other', 'ps-2', 'pe-2', 'tertiary', match?.winnerId !== null ? 'free' : ''],
      handler: () => this.openModal('SHOW_MATCH', {
        match: match.matchData,
        roundName: this.getRoundName(round, match),
        roundLabel: this.getRoundLabel(round, match),
      }),
      ariaLabel: this.translationService.translate('match_details'),
      tooltip: this.translationService.translate('match_details'),
    });

    if (match?.winnerId === null) {
      actions.push({
        label: this.translationService.translate('add_match'),
        icon: '<i class="fa fa-file-text-o ms-1" aria-hidden="true"></i>',
        handler: () => this.openModal('ADD_MATCH', {
          player1: match.slots?.[0]?.player ?? null,
          player2: match.slots?.[1]?.player ?? null,
          roundName: round.stage ?? round.name,
          roundLabel: match.roundLabel ?? round.stage ?? round.name,
        }),
      });

      actions.push({
        label: this.translationService.translate('live'),
        cssClass: ['bg-secondary', 'position-relative'],
        icon: '<div class="circle-live"></div>',
        handler: () => this.openModal('MANUAL_POINTS', {
          player1: match.slots?.[0]?.player ?? null,
          player2: match.slots?.[1]?.player ?? null,
        }),
      });
    }

    return actions;
  }
}
