import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../utils/translate.pipe';
import { TranslationService } from '../../../../services/translation.service';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';

@Component({
  selector: 'app-registration-navbar',
  imports: [...SHARED_IMPORTS],
  templateUrl: './registration-navbar.component.html',
  styleUrl: './registration-navbar.component.scss'
})
export class RegistrationNavbarComponent {

  @Input() isLogin: boolean = false;
  languages: { code: string, label: string }[] = [];
  constructor(public translateService: TranslationService) {
    this.languages = this.translateService.languages;

  }

}
