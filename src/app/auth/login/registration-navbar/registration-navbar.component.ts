import { Component } from '@angular/core';
import { TranslatePipe } from '../../../utils/translate.pipe';
import { TranslationService } from '../../../../services/translation.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registration-navbar',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './registration-navbar.component.html',
  styleUrl: './registration-navbar.component.scss'
})
export class RegistrationNavbarComponent {
  languages: { code: string, label: string }[] = [];
  constructor(public translateService: TranslationService) {
    this.languages = this.translateService.languages;

  }

}
