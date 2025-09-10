import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../utils/translate.pipe';

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './step-indicator.component.html',
  styleUrls: ['./step-indicator.component.scss']
})
export class StepIndicatorComponent {
  @Input() activeStep: number = 1;
  @Input() totalSteps: number = 1;
  @Input() clickable: boolean = false;

  @Output() stepClick = new EventEmitter<number>();

  onStepClick(step: number) {
    if (this.clickable && step <= this.activeStep) {
      this.stepClick.emit(step);
    }
  }

  stepsArray(): number[] {
    return Array.from({ length: this.totalSteps }, (_, i) => i + 1);
  }
}
