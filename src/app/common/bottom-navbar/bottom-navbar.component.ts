import { Component, inject } from '@angular/core';
import { TranslatePipe } from '../../utils/translate.pipe';
import { ModalService } from '../../../services/modal.service';
import { SHARED_IMPORTS } from '../imports/shared.imports';
import { toSignal } from '@angular/core/rxjs-interop';
import { CompetitionService } from '../../../services/competitions.service';

@Component({
  selector: 'app-bottom-navbar',
  imports: [...SHARED_IMPORTS],
  templateUrl: './bottom-navbar.component.html',
  styleUrl: './bottom-navbar.component.scss'
})
export class BottomNavbarComponent {

  activeModal: boolean | undefined;
  private competitionService = inject(CompetitionService);
  activeCompetitionId: number | string | null = null;

  constructor(public modalService: ModalService) {}

  ngOnInit() {
    this.modalService.activeModal$.subscribe(modalName => {
      this.activeModal = modalName ? true : false;
    });
    this.competitionService.activeCompetition$.subscribe(comp => {
      this.activeCompetitionId = comp?.id ?? null;
    });
  }

  addMatchModal() {
    this.modalService.openModal(this.modalService.MODALS['ADD_MATCH'])
  }
  isActive(route: string): boolean {
    return window.location.href.includes(route);
  }
}
