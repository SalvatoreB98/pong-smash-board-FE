import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../utils/translate.pipe';

export const SHARED_IMPORTS = [CommonModule, RouterModule, TranslatePipe];