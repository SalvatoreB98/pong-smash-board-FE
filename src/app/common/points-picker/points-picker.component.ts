import { Component, Input, forwardRef, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-points-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './points-picker.component.html',
  styleUrls: ['./points-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PointsPickerComponent),
      multi: true
    }
  ]
})
export class PointsPickerComponent implements ControlValueAccessor, AfterViewInit {
  @Input() max: number = 30;
  @Input() min: number = 0;

  numbers: number[] = [];
  @Input() value: number = 0;

  private onChange = (value: number) => { };
  private onTouched = () => { };

  @ViewChild('wheel') wheelRef!: ElementRef<HTMLDivElement>;

  ngAfterViewInit() {
    // posiziona inizialmente sulla value
    setTimeout(() => this.scrollToValue(this.value), 0);
  }

  ngOnInit() {
    this.numbers = Array.from({ length: this.max - this.min + 1 }, (_, i) => this.min + i);
  }

  // CVA
  writeValue(value: number): void {
    this.value = value ?? 0;
    this.scrollToValue(this.value);
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // Calcola valore selezionato in base allo scroll
  onScroll(event: Event) {
    const el = event.target as HTMLElement;
    const itemHeight = 40; // deve combaciare con CSS
    const index = Math.round(el.scrollTop / itemHeight);
    const newValue = this.numbers[index];
    if (newValue !== this.value) {
      this.value = newValue;
      this.onChange(this.value);
    }
  }

  private scrollToValue(value: number) {
    if (!this.wheelRef) return;
    const idx = this.numbers.indexOf(value);
    if (idx >= 0) {
      const itemHeight = 40;
      this.wheelRef.nativeElement.scrollTop = idx * itemHeight;
    }
  }
}
