import { Component, HostListener, inject } from '@angular/core';
import { TranslationService } from '../../../services/translation.service';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../utils/translate.pipe';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterOutlet } from '@angular/router';
import { UserProgressStateEnum } from '../../utils/enum';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from '../../../services/user.service';
import { SHARED_IMPORTS } from '../imports/shared.imports';
import { ICompetition } from '../../../api/competition.api';
import { CompetitionService } from '../../../services/competitions.service';

@Component({
  selector: 'app-navbar',
  imports: [...SHARED_IMPORTS],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  userService = inject(UserService);
  userState$ = this.userService.getState();

  isDropdownOpen: boolean = false;
  isMenuOpen: boolean = false;
  isMobile: boolean = window.innerWidth <= 768;
  PROGRESS_STATE = UserProgressStateEnum;
  activeCompetition: ICompetition | null = null;

  constructor(public translateService: TranslationService, public auth: AuthService, public router: Router, public competitionService: CompetitionService) {
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (target.closest('#menu-button') || target.classList.contains('fa-bars')) {
      return;
    }

    this.isMenuOpen = false;
  }

  ngOnInit() {
    this.competitionService.activeCompetition$.subscribe((activeCompetition: any) => {
      this.activeCompetition = activeCompetition;
    });
  }
  ngOnChanges() {
    this.auth.checkAuth()
  }
  langChange(e: any) {
    console.log(e)
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.router.navigate(['/login']);
    this.auth.logout();
  }

  trackByLang = (_: number, l: { code: string }) => l.code;
}
