import { Component, inject } from '@angular/core';
import { CompetitionService } from '../services/competitions.service';
import { DataService } from '../services/data.service';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { SHARED_IMPORTS } from '../app/common/imports/shared.imports';
import { CommonModule } from '@angular/common';
import { env } from 'process';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-debug-overlay',
  imports: [...SHARED_IMPORTS, CommonModule],
  templateUrl: './debug-overlay.component.html',
  styleUrl: './debug-overlay.component.scss'
})
export class DebugOverlayComponent {
  private comp = inject(CompetitionService);
  private user = inject(UserService);
  private auth = inject(AuthService, { optional: true });

  // stream principali
  list$ = this.comp.list$;
  active$ = this.comp.activeCompetition$;
  userState$ = this.user.userState$();         // suppongo ritorni observable
  isLoggedIn$ = this.auth?.isLoggedIn$ ?? null;
  activeCompetition$ = this.comp.activeCompetition$;
  isProd = environment.production;
  isVisible = true;

  close() {
    this.isVisible = false;
  }
  open() {
    this.isVisible = true;
  }
}