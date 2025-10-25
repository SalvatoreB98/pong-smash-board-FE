import { Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';
import { ModalComponent } from '../../../common/modal/modal.component';
import { CompetitionService } from '../../../../services/competitions.service';
import { UserService } from '../../../../services/user.service';
import { LoaderService } from '../../../../services/loader.service';
import { DataService } from '../../../../services/data.service';
import { MSG_TYPE } from '../../../utils/enum';
import { environment } from '../../../../environments/environment';
import { API_PATHS } from '../../../../api/api.config';
import { ModalService } from '../../../../services/modal.service';

interface AddPlayerModalContext {
  match?: unknown;
}

@Component({
  selector: 'app-add-player-modal',
  standalone: true,
  imports: [...SHARED_IMPORTS, FormsModule, ReactiveFormsModule],
  templateUrl: './add-player-modal.component.html',
  styleUrl: './add-player-modal.component.scss'
})
export class AddPlayerModalComponent extends ModalComponent implements OnDestroy {
  static readonly modalName = 'addPlayerModal';

  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly loader = inject(LoaderService);
  private readonly userService = inject(UserService);
  private readonly competitionService = inject(CompetitionService);
  private readonly dataService = inject(DataService);

  private readonly supabase: SupabaseClient = createClient(environment.supabase.url, environment.supabase.ANON);

  readonly addPlayerForm: FormGroup = this.fb.group({
    name: [''],
    surname: [''],
    nickname: ['', { validators: [Validators.required], updateOn: 'change' }],
    email: ['', { validators: [Validators.email], updateOn: 'change' }],
    file: [null],
  });

  previewUrl: string | null = null;
  isSubmitting = false;
  context: AddPlayerModalContext | null = null;

  constructor(public override modalService: ModalService) {
    super(modalService);
  }

  ngOnInit(): void {
    this.context = this.modalService.getContext<AddPlayerModalContext>() ?? null;
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    if (!file) {
      return;
    }

    this.addPlayerForm.patchValue({ file });
    this.rebuildPreview(file);
  }

  removeFile(): void {
    this.resetFile();
  }

  resetFile(): void {
    this.addPlayerForm.patchValue({ file: null });
    const fileInput = document.querySelector('#add-player-upload') as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = '';
    }
    this.revokePreview();
  }

  async savePlayer(event?: Event): Promise<void> {
    if (this.isSubmitting) {
      console.warn('⚠️ savePlayer already in progress, skipping duplicate call.');
      return;
    }

    if (this.addPlayerForm.invalid) {
      this.addPlayerForm.markAllAsTouched();
      return;
    }

    const button = this.resolveButton(event);
    if (button) {
      button.disabled = true;
      this.loader.addSpinnerToButton(button);
    }

    this.isSubmitting = true;
    this.loader.startLittleLoader();

    try {
      const userState = await firstValueFrom(this.userService.getState());
      const competitionId = userState?.active_competition_id;
      const user_id = userState?.user_id;

      if (!competitionId) {
        this.loader.showToast('No active competition.', MSG_TYPE.ERROR);
        return;
      }

      const { name, surname, nickname, email, file } = this.addPlayerForm.value;

      let imageUrl: string | null = null;
      if (file) {
        imageUrl = await this.uploadImage(file, user_id);
      }

      const payload = {
        name,
        surname,
        nickname,
        email,
        imageUrl,
      };

      await firstValueFrom(
        this.http.post(API_PATHS.addPlayers, {
          players: [payload],
          competitionId,
          user_id,
        }).pipe(
          tap(() => {
            this.userService.setActiveCompetitionId(competitionId);
          })
        )
      );

      await this.dataService.refresh();

      this.competitionService.addPlayerToLocal(competitionId, {
        id: 0,
        name: name ?? '',
        nickname: nickname ?? '',
        image_url: imageUrl ?? '',
      });

      this.modalService.closeModal();
      this.loader.showToast('Player added successfully!', MSG_TYPE.SUCCESS);
      this.addPlayerForm.reset();
      this.resetFile();
    } catch (error) {
      console.error('[AddPlayerModal] Failed to add player:', error);
      this.loader.showToast('Failed to add player.', MSG_TYPE.ERROR);
    } finally {
      if (button) {
        button.disabled = false;
        this.loader.removeSpinnerFromButton(button);
      }
      this.isSubmitting = false;
      this.loader.stopLittleLoader();
    }
  }

  private async uploadImage(file: File, userId?: string | number | null): Promise<string | null> {
    const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const filename = `player-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const objectPath = `${userId ?? 'anonymous'}/${filename}`;

    const { error } = await this.supabase.storage
      .from('players-images')
      .upload(objectPath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data } = this.supabase.storage.from('players-images').getPublicUrl(objectPath);
    return data?.publicUrl ?? null;
  }

  private rebuildPreview(file: File): void {
    this.revokePreview();
    this.previewUrl = URL.createObjectURL(file);
  }

  private revokePreview(): void {
    if (this.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewUrl = null;
  }

  private resolveButton(event?: Event): HTMLButtonElement | null {
    if (!event) {
      return null;
    }

    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | undefined;
    if (submitter) {
      return submitter;
    }

    const target = event.target as HTMLElement | null;
    if (target instanceof HTMLButtonElement) {
      return target;
    }

    return target?.closest('button') as HTMLButtonElement | null;
  }
}
