import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { CompetitionMode, IMatch } from '../../interfaces/matchesInterfaces';
import { MSG_TYPE, KnockoutStage } from '../../utils/enum';
import { SHARED_IMPORTS } from '../imports/shared.imports';
import { LoaderService } from '../../../services/loader.service';
import { MatchService, SetMatchDateResponse } from '../../../services/match.service';
import { ModalService } from '../../../services/modal.service';
import { DataService } from '../../../services/data.service';

type MatchWithContext = IMatch & {
  competitionType?: CompetitionMode;
  competitionName?: string;
  roundName?: KnockoutStage | null;
  roundLabel?: KnockoutStage | string | null;
  id: number;
  group_id: string;
  group_name: string;
  date: string | number | null;
  player1: PlayerSummary;
  player2: PlayerSummary;
};
export interface PlayerSummary {
  id: number;
  name: string;
  img: string;
}

export interface MatchDto {

}
@Component({
  selector: 'app-set-match-date-modal',
  imports: [...SHARED_IMPORTS],
  templateUrl: './set-match-date-modal.component.html',
  styleUrl: './set-match-date-modal.component.scss'
})


export class SetMatchDateModalComponent implements OnChanges {
  @Input() match: MatchWithContext | undefined;

  private readonly fb = inject(FormBuilder);
  private readonly matchService = inject(MatchService);
  private readonly loader = inject(LoaderService);
  private readonly modalService = inject(ModalService);
  private readonly dataService = inject(DataService);

  readonly form = this.fb.nonNullable.group({
    date: ['', Validators.required],
  });

  readonly defaultAvatar = '/default-player.jpg';
  isSubmitting = false;
  attemptedSubmit = false;
  errorKey: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if ('match' in changes) {
      this.rebuildForm();
    }
  }

  get currentDateLabel(): string | null {
    const parsed = this.parseDate(this.match?.date ?? null);
    if (!parsed) {
      return null;
    }

    try {
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(parsed);
    } catch (error) {
      console.warn('[SetMatchDateModal] Failed to format date', error);
      return this.formatAsInputValue(parsed);
    }
  }

  onSubmit(event?: Event): Promise<void> {
    event?.preventDefault();
    this.attemptedSubmit = true;
    this.errorKey = null;

    if (!this.match?.id) {
      this.errorKey = 'set_match_date_unavailable';
      return Promise.resolve();
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return Promise.resolve();
    }

    return this.persistDate();
  }

  onCancel(): void {
    this.modalService.closeModal();
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.defaultAvatar;
  }

  private async persistDate(): Promise<void> {
    if (!this.match?.id) {
      return;
    }

    const dateValue = this.form.controls.date.value.trim();
    const payloadDate = dateValue.length ? dateValue : null;

    this.isSubmitting = true;
    this.loader.startLittleLoader();

    try {
      const response = await this.matchService.setMatchDate(this.match.id, payloadDate);
      this.applyResponse(response);
      this.loader.showToast('set_match_date_success', MSG_TYPE.SUCCESS, 3500);

      try {
        await this.dataService.refresh();
      } catch (refreshError) {
        console.warn('[SetMatchDateModal] Unable to refresh matches after date update:', refreshError);
      }

      this.modalService.closeModal();
    } catch (error) {
      console.error('[SetMatchDateModal] Failed to set match date:', error);
      this.errorKey = 'set_match_date_error';
      this.loader.showToast('set_match_date_error', MSG_TYPE.ERROR, 4000);
    } finally {
      this.isSubmitting = false;
      this.loader.stopLittleLoader();
    }
  }

  private rebuildForm(): void {
    const dateValue = this.formatInputValue(this.match?.date ?? null) || this.todayInputValue();
    this.form.patchValue({ date: dateValue }, { emitEvent: false });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.attemptedSubmit = false;
    this.errorKey = null;
  }

  private applyResponse(response: SetMatchDateResponse | null | undefined): void {
    if (!response?.match) {
      if (this.match && this.form.controls.date.value) {
        this.match = { ...this.match, date: this.form.controls.date.value };
      }
      return;
    }

    const updatedDate = this.formatInputValue(response.match.date ?? null);
    this.match = {
      ...this.match,
      ...response.match,
      date: updatedDate ?? response.match.date ?? this.form.controls.date.value,
    } as MatchWithContext;

    if (updatedDate) {
      this.form.patchValue({ date: updatedDate }, { emitEvent: false });
    }
  }

  private formatInputValue(value: string | number | Date | null | undefined): string {
    if (!value) {
      return '';
    }

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const parsed = this.parseDate(value);
    return parsed ? this.formatAsInputValue(parsed) : '';
  }

  private parseDate(raw: string | number | Date | null | undefined): Date | null {
    if (!raw) {
      return null;
    }

    if (raw instanceof Date) {
      return Number.isNaN(raw.getTime()) ? null : raw;
    }

    if (typeof raw === 'number') {
      const date = new Date(raw);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof raw === 'string') {
      if (!raw.trim()) {
        return null;
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const [year, month, day] = raw.split('-').map(part => Number(part));
        return new Date(year, (month ?? 1) - 1, day ?? 1);
      }

      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  private formatAsInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private todayInputValue(): string {
    return this.formatAsInputValue(new Date());
  }
}
