import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../utils/translate.pipe';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-indicator',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './step-indicator.component.html',
  styleUrl: './step-indicator.component.scss'
})
export class StepIndicatorComponent {
  @Input() activeStep: number = 1;
  @Input() totalSteps: number = 1;
}
