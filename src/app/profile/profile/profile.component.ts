import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

import { NavbarComponent } from '../../common/navbar/navbar.component';
import { TranslatePipe } from '../../utils/translate.pipe';
import { UserService } from '../../../services/user.service';
import { IUserState } from '../../../services/interfaces/Interfaces';
import { UserProgressStateEnum } from '../../../services/interfaces/Interfaces'; // Ensure UserProgressState is an enum or object
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LoaderService } from '../../../services/loader.service';
import { MSG_TYPE } from '../../utils/enum';
import { API_PATHS } from '../../../api/api.config';
import { UpdateProfileResponse } from '../../../api/apiResponses';
import { Router } from '@angular/router';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent, TranslatePipe, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class ProfileComponent implements OnInit {

  previewUrl: string | null = null;
  private userService = inject(UserService);
  PROGRESS_STATE = UserProgressStateEnum;
  form: FormGroup;

  public userState = toSignal<IUserState | null>(this.userService.userState$(), { initialValue: null });

  private sb: SupabaseClient = createClient(
    environment.supabase.url,
    environment.supabase.ANON,
  );

  constructor(private fb: FormBuilder,
    private http: HttpClient,
    private loaderService: LoaderService,
    private router: Router,
    private supabaseAuthService: SupabaseAuthService
  ) {
    this.form = this.fb.group({
      nickname: new FormControl<string | null>(''),
      avatar: this.fb.control<File | null>(null),
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : null;

    if (!file) return;

    // opzionale: validazioni base
    const isImage = file.type.startsWith('image/');
    const maxSizeMB = 4;
    if (!isImage) {
      alert('Seleziona un file immagine valido.');
      input.value = '';
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`L'immagine supera ${maxSizeMB}MB.`);
      input.value = '';
      return;
    }

    // aggiorna form control
    this.form.patchValue({ avatar: file });

    // genera preview
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = URL.createObjectURL(file);
  }

  ngOnDestroy() {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
  }

  async ngOnInit() {
    // Garantisce il primo fetch se non già in cache (idempotente)
    await firstValueFrom(this.userService.getUserState());
    console.log('User state fetched:', this.userState());
  }

  async saveProfile() {
    const nickname = (this.form.value.nickname || '').trim();
    const file: File | null = this.form.value.avatar || null;

    if (nickname.length < 3) {
      this.form.get('nickname')?.markAsTouched();
      return;
    }

    this.loaderService.startLittleLoader();
    try {
      // 1) (facoltativo) upload avatar su Supabase Storage
      let imageUrl: string | null = null;
      if (file) {
        const session = await this.supabaseAuthService.getUserSession();
        const userId = session?.data.session?.user?.id;
        if (!userId) throw new Error('Not authenticated');

        const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
        const path = `avatars/${userId}.${ext}`;

        const { error: upErr } = await this.sb
          .storage.from('avatars')
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) throw upErr;

        const { data: pub } = this.sb.storage.from('avatars').getPublicUrl(path);
        imageUrl = pub?.publicUrl || null; // se il bucket non è pubblico, usa URL firmati
      }



      const res = await firstValueFrom(
        this.http.post<UpdateProfileResponse>(API_PATHS.updateProfile, { nickname, imageUrl })
      );

      this.loaderService?.showToast('Profilo aggiornato!', MSG_TYPE.SUCCESS, 3000);
      this.router.navigate(['/competitions']);
    } catch (err) {
      console.error(err);
      this.loaderService?.showToast('Errore aggiornando il profilo', MSG_TYPE.ERROR, 4000);
    } finally {
      this.loaderService.stopLittleLoader();
    }
  }
}
