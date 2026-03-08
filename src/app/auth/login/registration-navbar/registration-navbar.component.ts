import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../../utils/translate.pipe';
import { TranslationService } from '../../../../services/translation.service';
import { CommonModule, Location } from '@angular/common';
import { SHARED_IMPORTS } from '../../../common/imports/shared.imports';
import { inject } from '@angular/core';

@Component({
  selector: 'app-registration-navbar',
  imports: [...SHARED_IMPORTS],
  templateUrl: './registration-navbar.component.html',
  styleUrl: './registration-navbar.component.scss'
})
export class RegistrationNavbarComponent {

  @Input() isLogin: boolean = false;
  languages: { code: string, label: string }[] = [];
  showDropdown = false;
  private location = inject(Location);

  constructor(public translateService: TranslationService) {
    this.languages = this.translateService.languages;

  }
  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  goBack() {
    this.location.back();
  }
}
