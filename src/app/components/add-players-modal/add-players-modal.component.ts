import { Component, inject } from '@angular/core';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';
import { CompetitionService } from '../../../services/competitions.service';
import { UserService } from '../../../services/user.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { API_PATHS } from '../../../api/api.config';
import { LoaderService } from '../../../services/loader.service';
import { MSG_TYPE } from '../../utils/enum';
import { firstValueFrom } from 'rxjs';
import { ModalComponent } from '../../common/modal/modal.component';
import { DataService } from '../../../services/data.service';
import { TranslationService } from '../../../services/translation.service';

export interface IPlayerToAdd {
  name: string;
  surname: string;
  nickname: string;
  file: File | null;
  previewUrl: string | null;
}

@Component({
  selector: 'app-add-players-modal',
  imports: [...SHARED_IMPORTS, FormsModule, ReactiveFormsModule],
  templateUrl: './add-players-modal.component.html',
  styleUrls: ['./add-players-modal.component.scss']
})
export class AddPlayersModalComponent extends ModalComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private loader = inject(LoaderService);
  private userService = inject(UserService);
  private competitionService = inject(CompetitionService);
  private dataService = inject(DataService);
  private translateService = inject(TranslationService);
  copied = false;

  addPlayerForm: FormGroup = this.fb.group({
    name: [''],
    surname: [''],
    nickname: [''],
    file: [null],
    email: ['', { validators: [Validators.email], updateOn: 'blur' }],
  });

  playersToAdd: IPlayerToAdd[] = [];
  activeCompetition$ = this.competitionService.activeCompetition$;

  private sb: SupabaseClient = createClient(environment.supabase.url, environment.supabase.ANON);

  addPlayer() {
    if (this.addPlayerForm.valid) {
      const { name, surname, nickname, file } = this.addPlayerForm.value;
      const previewUrl = file ? URL.createObjectURL(file) : null;

      this.playersToAdd.push({ name, surname, nickname, file, previewUrl });
      this.addPlayerForm.reset();
    }
  }

  removePlayer(index: number) {
    const preview = this.playersToAdd[index].previewUrl;
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    this.playersToAdd.splice(index, 1);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    this.addPlayerForm.patchValue({ file });
  }

  async addPlayers() {
    this.loader.startLittleLoader();

    try {
      const userState = await firstValueFrom(this.userService.getState());
      const competitionId = userState?.active_competition_id;
      if (!competitionId) {
        this.loader.showToast('No active competition.', MSG_TYPE.ERROR);
        return;
      }

      const playersWithUrls = [];
      for (const p of this.playersToAdd) {
        let imageUrl: string | null = null;

        if (p.file) {
          const ext = (p.file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
          const filename = `player-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
          const objectPath = `${userState?.user_id}/${filename}`;

          const { error: upErr } = await this.sb.storage
            .from('players-images')   // ✅ bucket name
            .upload(objectPath, p.file, {
              contentType: p.file.type,
              upsert: false,
            });

          if (upErr) throw upErr;

          const { data: pub } = this.sb.storage
            .from('players-images')
            .getPublicUrl(objectPath);

          imageUrl = pub?.publicUrl ?? null;
        }


        playersWithUrls.push({
          name: p.name,
          surname: p.surname,
          nickname: p.nickname,
          imageUrl,
        });
      }

      await firstValueFrom(
        this.http.post(API_PATHS.addPlayers, { players: playersWithUrls, competitionId })
      );
      // refresh dati locali (players, matches, ecc.)
      await this.dataService.refresh();
      for (const player of playersWithUrls) {

        this.competitionService.addPlayerToLocal(competitionId, {
          id: 0,
          name: player.name,
          nickname: player.nickname,
          image_url: player.imageUrl ?? ''
        });
      }
      this.modalService.closeModal();
      this.loader.showToast('Players added successfully!', MSG_TYPE.SUCCESS);
      this.playersToAdd = [];
    } catch (err) {
      console.error(err);
      this.loader.showToast('Failed to add players.', MSG_TYPE.ERROR);
    } finally {
      this.loader.stopLittleLoader();
    }
  }

  copyCode() {
    this.activeCompetition$.subscribe(comp => {
      console.log(comp);
      if (comp?.['code']) {
        navigator.clipboard.writeText(comp['code'])
          .then(() => {
            this.loader.showToast(this.translateService.translate('code_copied'), MSG_TYPE.SUCCESS);
            setTimeout(() => this.copied = false, 2000); // reset messaggio dopo 2s
          })
          .catch(() => {
            this.loader.showToast(this.translateService.translate('code_copy_failed'), MSG_TYPE.ERROR);
          });
      } else {
        this.loader.showToast(this.translateService.translate('code_not_available'), MSG_TYPE.ERROR);
      }
    });
  }
}