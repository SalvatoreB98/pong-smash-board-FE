import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../common/modal/modal.component';
import { ModalService } from '../../../services/modal.service';
import { INextMatch } from '../../interfaces/next-match.interface';
import { TranslatePipe } from '../../utils/translate.pipe';
import { DataService } from '../../../services/data.service';
import { LoaderService } from '../../../services/loader.service';
import { MSG_TYPE } from '../../utils/enum';

@Component({
  selector: 'app-show-next-match-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ReactiveFormsModule, TranslatePipe],
  templateUrl: './show-next-match-modal.component.html',
  styleUrl: './show-next-match-modal.component.scss'
})
export class ShowNextMatchModalComponent extends ModalComponent implements OnChanges {

  @Input() match: INextMatch | undefined;
  @Input() autoOpenScheduler = false;
  @Output() scheduleUpdated = new EventEmitter<INextMatch>();

  showScheduler = false;
  isSaving = false;

  scheduleForm!: FormGroup;

  constructor(
    modalService: ModalService,
    private fb: FormBuilder,
    private dataService: DataService,
    private loaderService: LoaderService,
  ) {
    super(modalService);
    this.scheduleForm = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
      note: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['match']) {
      this.prefillForm();
    }
    if (changes['autoOpenScheduler'] && this.autoOpenScheduler) {
      this.showScheduler = true;
    } else if (changes['autoOpenScheduler'] && !this.autoOpenScheduler) {
      this.showScheduler = false;
    }
  }

  get hasScheduledDate(): boolean {
    return !!this.getMatchDate();
  }

  getMatchDate(): Date | null {
    const rawDate = this.match?.date ?? this.match?.scheduled_at ?? this.match?.scheduledAt ?? null;
    if (!rawDate) {
      return null;
    }
    const parsed = new Date(rawDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  get scheduledDateLabel(): string {
    const matchDate = this.getMatchDate();
    if (!matchDate) {
      return 'Data da definire';
    }
    return matchDate.toLocaleString();
  }

  toggleScheduler(): void {
    this.showScheduler = !this.showScheduler;
    if (this.showScheduler) {
      this.prefillForm();
    }
  }

  async submitSchedule(): Promise<void> {
    if (this.scheduleForm.invalid || !this.match) {
      this.scheduleForm.markAllAsTouched();
      return;
    }

    const { date, time, note } = this.scheduleForm.value;
    if (!date || !time) {
      return;
    }

    const isoDate = this.combineDateAndTime(date, time);

    this.isSaving = true;
    try {
      const updatedMatch = await this.dataService.scheduleNextMatch(this.match.id, {
        scheduledAt: isoDate,
        note: note ?? undefined,
      });
      if (updatedMatch) {
        this.loaderService.showToast('Data del match aggiornata!', MSG_TYPE.SUCCESS, 3000);
        this.scheduleUpdated.emit(updatedMatch);
        this.match = updatedMatch;
        this.showScheduler = false;
      }
    } catch (error) {
      console.error('Failed to schedule match', error);
      this.loaderService.showToast('Errore durante la programmazione del match', MSG_TYPE.ERROR, 4000);
    } finally {
      this.isSaving = false;
    }
  }

  private prefillForm(): void {
    const matchDate = this.getMatchDate();
    const dateString = matchDate ? matchDate.toISOString().slice(0, 10) : '';
    const timeString = matchDate ? matchDate.toISOString().slice(11, 16) : '';

    this.scheduleForm.reset({
      date: dateString,
      time: timeString,
      note: this.match?.note ?? ''
    });
  }

  private combineDateAndTime(date: string, time: string): string {
    const combined = new Date(`${date}T${time}:00`);
    return combined.toISOString();
  }
}
