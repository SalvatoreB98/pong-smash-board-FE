import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';
import { ModalService } from '../../../services/modal.service';
import { AddPlayerModalComponent } from '../modals/add-player-modal/add-player-modal.component';
import { MODALS } from '../../utils/enum';

// Centralized match card component shared by league, next matches, and bracket views.
export type MatchCardVariant = 'standard' | 'bracket';

export interface MatchCardAction {
  label?: string | null;
  icon?: string | null;
  cssClass?: string | string[] | null;
  tooltip?: string | null;
  ariaLabel?: string | null;
  disabled?: boolean;
  visible?: boolean;
  event?: string | null;
  handler?: (() => void) | null;
}

export interface MatchCardSchedule {
  date?: string | Date | null;
  fallbackLabel?: string | null;
  action?: MatchCardAction | null;
  actions?: MatchCardAction[] | null;
  iconClass?: string | null;
  showTime?: boolean;
  dateFormat?: string;
  timeFormat?: string;
}

export type MatchCardPlayerState = 'player' | 'waiting' | 'empty';

export interface MatchCardPlayerSlot {
  id?: string | number | null;
  name?: string | null;
  nickname?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  score?: number | string | null;
  isWinner?: boolean;
  state?: MatchCardPlayerState;
  waitingLabel?: string | null;
  action?: MatchCardAction | null;
}

@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [CommonModule, NgClass, NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, ...SHARED_IMPORTS],
  templateUrl: './match-card.component.html',
  styleUrl: './match-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchCardComponent {
  @Input() variant: MatchCardVariant = 'standard';
  @Input() clickable = false;
  @Input() cardId?: string | number | null;
  @Input() headerLabel?: string | null;
  @Input() subHeaderLabel?: string | null;
  @Input() footerLabel?: string | null;
  @Input() players: MatchCardPlayerSlot[] = [];
  @Input() showScore = true;
  @Input() showVersus = false;
  @Input() versusLabel = 'vs';
  @Input() highlightWinners = true;
  @Input() readonly = false;
  @Input() bracketDate?: string | Date | null;
  @Input() bracketDateFallback?: string | null;
  @Input() setDateAction?: MatchCardAction | null;
  @Input() actions: MatchCardAction[] = [];
  @Input() schedule?: MatchCardSchedule | null;
  @Input() match?: unknown;
  @Input() isFirstRound = false;
  @Output() cardClick = new EventEmitter<void>();
  @Output() actionTriggered = new EventEmitter<MatchCardAction>();

  readonly defaultAvatar = '/default-player.jpg';
  private readonly modalService = inject(ModalService);

  onCardClick(): void {
    if (!this.clickable) {
      return;
    }
    this.cardClick.emit();
  }

  onAction(action: MatchCardAction | null | undefined, event?: MouseEvent): void {
    if (!action || action.visible === false || action.disabled) {
      return;
    }
    event?.stopPropagation();
    action.handler?.();
    this.actionTriggered.emit(action);
  }

  resolveDisplayName(slot: MatchCardPlayerSlot): string {
    return (
      slot.displayName ??
      slot.nickname ??
      slot.name ??
      ''
    );
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.defaultAvatar;
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByAction(index: number, action: MatchCardAction): string {
    return `${action.event ?? action.label ?? 'action'}-${index}`;
  }

  openAddPlayerModal(match: unknown, slotIndex?: number, event?: Event): void {
    if (this.readonly) {
      return;
    }

    event?.stopPropagation();
    this.modalService.openModal(AddPlayerModalComponent, {
      match,
      slotIndex,
    });
  }

  shouldShowScore(slot?: MatchCardPlayerSlot | null): boolean {
    if (this.variant !== 'bracket' || !slot) {
      return false;
    }
    return slot.state === 'player' && slot.score !== undefined && slot.score !== null && slot.score !== '';
  }

  isWinner(slot?: MatchCardPlayerSlot | null): boolean {
    return !!slot?.isWinner && this.highlightWinners;
  }

  hasActions(): boolean {
    return this.actions?.some(action => action && action.visible !== false) ?? false;
  }

  scheduleHasFallback(): boolean {
    if (!this.schedule) {
      return false;
    }

    const hasVisibleActions = this.getScheduleActions().length > 0;

    return !!this.schedule.fallbackLabel || !!this.schedule.action || hasVisibleActions;
  }

  getPlayer(index: number): MatchCardPlayerSlot {
    return this.players?.[index] ?? {};
  }

  getScoreValue(index: number): string | number {
    const slot = this.getPlayer(index);
    return slot?.score ?? '-';
  }

  getScheduleActions(): MatchCardAction[] {
    return (this.schedule?.actions ?? []).filter(
      action => !!action && action.visible !== false
    ) as MatchCardAction[];
  }

  formatLocalDateTime(dateStr: string | Date): string {
    let date: Date;
    if (typeof dateStr === 'string') {
      // Prova a creare la data partendo da un formato come "11/1/25 - 5:33 AM"
      // Aggiunge "20" all'anno se è a due cifre per evitare ambiguità
      const normalized = dateStr.replace(
        /(\d{1,2})\/(\d{1,2})\/(\d{2})/,
        (_, m, d, y) => `${m}/${d}/20${y}`
      );
      date = new Date(normalized);
    } else {
      date = dateStr;
    }

    // Controlla se la data creata è valida
    if (isNaN(date.getTime())) {
      return 'Data non valida';
    }

    // Utilizza toLocaleString con il fuso orario del browser.
    // Questo gestisce automaticamente l'ora legale (DST) per la data specificata.
    return date.toLocaleString('it-IT', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  onEditSchedule(event?: MouseEvent): void {
    const correctAction = {
      label: 'Edit Schedule',
      event: MODALS['SET_DATE'],
      handler: () => {
        this.modalService.openModal(MODALS['SET_DATE'], {
          match: this.match
        });
      }
    };
    
    this.onAction(correctAction, event);
  }
}
