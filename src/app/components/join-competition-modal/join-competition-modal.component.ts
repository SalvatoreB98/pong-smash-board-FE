import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { SHARED_IMPORTS } from '../../common/imports/shared.imports';
import { FormsModule } from '@angular/forms';
import { CompetitionService } from '../../../services/competitions.service';
import { LoaderService } from '../../../services/loader.service';
import { MSG_TYPE } from '../../utils/enum';
import { TranslatePipe } from '../../utils/translate.pipe';
import { UserService } from '../../../services/user.service';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-join-competition-modal',
  imports: [CommonModule, ...SHARED_IMPORTS, FormsModule],
  templateUrl: './join-competition-modal.component.html',
  styleUrl: './join-competition-modal.component.scss'
})

export class JoinCompetitionModalComponent {

  competitionCode: string = '';
  showInstructions: boolean = false;

  constructor(private competitionService: CompetitionService, private loaderService: LoaderService, private translation: TranslatePipe, private userService: UserService, private modalService: ModalService) { }

  onWhereClick() {
    this.showInstructions = !this.showInstructions;
  }

  async onSubmit(event: Event) {
    const button = this.resolveButton(event);
    if (button) {
      button.disabled = true;
      this.loaderService.addSpinnerToButton(button);
    }

    this.loaderService.startLittleLoader();
    try {
      const res = await this.competitionService.joinCompetition(this.competitionCode);
      this.loaderService.showToast('Successfully joined competition ' + res, MSG_TYPE.SUCCESS);
      this.modalService.closeModal();
    } catch (error: any) {
      console.error(error);
      if (error?.error?.code?.includes('admin-managed')) {
        this.loaderService.showToast(this.translation.transform('admin_managed_error'), MSG_TYPE.ERROR);
      } else {
        this.loaderService.showToast(this.translation.transform('competition_error'), MSG_TYPE.ERROR);
      }
    } finally {
      if (button) {
        button.disabled = false;
        this.loaderService.removeSpinnerFromButton(button);
      }
      this.loaderService.stopLittleLoader();
    }
  }

  private resolveButton(event?: Event): HTMLButtonElement | null {
    if (!event) return null;
    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | undefined;
    if (submitter) return submitter;

    const target = event.target as HTMLElement | null;
    if (target instanceof HTMLButtonElement) return target;
    return target?.closest('button') as HTMLButtonElement | null;
  }

}
