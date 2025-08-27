import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectionStrategy, inject, OnInit, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { API_PATHS } from '../../../../api/api.config';
import { UpdateProfileResponse } from '../../../../api/apiResponses';
import { environment } from '../../../../environments/environment';
import { IUserState } from '../../../../services/interfaces/Interfaces';
import { LoaderService } from '../../../../services/loader.service';
import { SupabaseAuthService } from '../../../../services/supabase-auth.service';
import { UserService } from '../../../../services/user.service';
import { NavbarComponent } from '../../../common/navbar/navbar.component';
import { UserProgressStateEnum, MSG_TYPE } from '../../../utils/enum';
import { TranslatePipe } from '../../../utils/translate.pipe';



@Component({
  selector: 'complete-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent, TranslatePipe, FormsModule, ReactiveFormsModule],
  templateUrl: './complete-profile.component.html',
  styleUrls: ['./complete-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class CompleteProfileComponent implements OnInit {

  previewUrl: string | null = null;
  private userService = inject(UserService);
  public userState = toSignal<IUserState | null>(this.userService.userState$(), { initialValue: null });
  PROGRESS_STATE = UserProgressStateEnum;
  form: FormGroup;


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
    
    effect(() => {
      console.log('User state signal:', this.userState());
    });
    // Reindirizza se il profilo è già completo
    if (this.userState()?.state === UserProgressStateEnum.PROFILE_COMPLETED) {
      this.router.navigate(['/competition']);
    }
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
      let imageUrl: string | null = null;

      if (file) {
        // 1) utente autenticato
        const { data: sess } = await this.supabaseAuthService.getUserSession();
        const userId = sess?.session?.user?.id;
        if (!userId) throw new Error('Not authenticated');

        // 2) path coerente con RLS: "<uid>/avatar.<ext>"
        const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
        const filename = `avatar-${Date.now()}.${ext}`;
        const objectPath = `${userId}/${filename}`; // <-- niente "players-images/" qui

        // 3) upload
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
      }

      // 5) salva profilo
      await firstValueFrom(
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
