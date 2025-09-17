import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';


import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { API_PATHS } from '../../../../api/api.config';
import { UpdateProfileResponse } from '../../../../api/apiResponses';
import { environment } from '../../../../environments/environment';
import { IUserState } from '../../../../services/interfaces/Interfaces';
import { LoaderService } from '../../../../services/loader.service';
import { SupabaseAuthService } from '../../../../services/supabase-auth.service';
import { UserService } from '../../../../services/user.service';
import { NavbarComponent } from '../../../common/navbar/navbar.component';
import { MSG_TYPE } from '../../../utils/enum';
import { TranslatePipe } from '../../../utils/translate.pipe';
import { BottomNavbarComponent } from '../../../common/bottom-navbar/bottom-navbar.component';
import { PlayerDetailComponent } from './player-detail/player-detail.component';
import { BadgeComponent } from '../../../common/badge/badge.component';
import { LoadingButtonComponent } from '../../../common/loading-button/loading-button.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent, TranslatePipe, BottomNavbarComponent, PlayerDetailComponent, BadgeComponent, LoadingButtonComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private supabaseAuthService = inject(SupabaseAuthService);
  private loader = inject(LoaderService);

  private sb: SupabaseClient = createClient(environment.supabase.url, environment.supabase.ANON);

  form: FormGroup = this.fb.group({
    nickname: new FormControl<string | null>('', [Validators.required, Validators.minLength(3)]),
    avatar: this.fb.control<File | null>(null),
  });

  previewUrl: string | null = null;
  private currentImageUrl: string | null = null;

  // Stato utente (reactive signal)
  userState = toSignal<IUserState | null>(this.userService.getState(), { initialValue: null });
  userState$ = this.userService.getState();
  constructor() {
    // Precompila nickname e imageUrl quando lo stato cambia
    effect(() => {
      const state = this.userState();
      const existingNick = state?.nickname ?? '';
      const existingImg = state?.image_url ?? null;

      if (existingNick && !this.form.get('nickname')?.value) {
        this.form.get('nickname')?.setValue(existingNick);
      }
      if (existingImg && !this.previewUrl) {
        this.currentImageUrl = existingImg;
        this.previewUrl = existingImg;
      }
    });
  }

  async ngOnInit() {
    // Assicurati di avere lo stato aggiornato
    await firstValueFrom(this.userService.getState());
    // Prova a recuperare l’ultimo avatar dal bucket dell’utente
    await this.loadLatestAvatarFromSupabase();
  }

  ngOnDestroy() {
    if (this.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(this.previewUrl);
  }

  private async loadLatestAvatarFromSupabase() {
    try {
      const { data: sess } = await this.supabaseAuthService.getUserSession();
      const userId = sess?.session?.user?.id;
      if (!userId) return;

      const { data: files, error } = await this.sb.storage
        .from('players-images')
        .list(userId, { limit: 1, sortBy: { column: 'updated_at', order: 'desc' } });

      if (error || !files || files.length === 0) return;

      const objectPath = `${userId}/${files[0].name}`;
      const { data: pub } = this.sb.storage.from('players-images').getPublicUrl(objectPath);
      const url = pub?.publicUrl ?? null;

      if (url) {
        this.currentImageUrl = url;
        if (!this.previewUrl || !this.previewUrl.startsWith('blob:')) {
          this.previewUrl = url;
        }
      }
    } catch (e) {
      console.warn('Avatar fetch failed:', e);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Seleziona un file immagine valido.');
      input.value = '';
      return;
    }
    const maxSizeMB = 4;
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`L'immagine supera ${maxSizeMB}MB.`);
      input.value = '';
      return;
    }

    this.form.patchValue({ avatar: file });

    if (this.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = URL.createObjectURL(file);
  }

  async saveProfile() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const nickname = (this.form.value.nickname || '').trim();
    const file: File | null = this.form.value.avatar ?? null;

    this.loader.startLittleLoader();
    try {
      let imageUrl = this.currentImageUrl;

      if (file) {
        const { data: sess } = await this.supabaseAuthService.getUserSession();
        const userId = sess?.session?.user?.id;
        if (!userId) throw new Error('Not authenticated');

        const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
        const objectPath = `${userId}/avatar-${Date.now()}.${ext}`;

        const { error: upErr } = await this.sb
          .storage.from('players-images')
          .upload(objectPath, file, {
            upsert: true,
            contentType: file.type || 'image/jpeg',
            cacheControl: '3600',
          });
        if (upErr) throw upErr;

        const { data: pub } = this.sb.storage.from('players-images').getPublicUrl(objectPath);
        imageUrl = pub?.publicUrl ?? null;

        if (imageUrl) {
          this.currentImageUrl = imageUrl;
          if (this.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(this.previewUrl);
          this.previewUrl = imageUrl;
        }
      }

      await firstValueFrom(
        this.http.post<UpdateProfileResponse>(API_PATHS.updateProfile, { nickname, imageUrl })
      );

      this.loader.showToast('Profilo aggiornato!', MSG_TYPE.SUCCESS, 3000);
    } catch (err) {
      console.error(err);
      this.loader.showToast('Errore aggiornando il profilo', MSG_TYPE.ERROR, 4000);
    } finally {
      this.loader.stopLittleLoader();
    }
  }
}
