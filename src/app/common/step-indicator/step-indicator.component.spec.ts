import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StepIndicatorComponent } from './step-indicator.component';

describe('StepIndicatorComponent', () => {
  let component: StepIndicatorComponent;
  let fixture: ComponentFixture<StepIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepIndicatorComponent]
    }).overrideComponent(StepIndicatorComponent, {
      set: { template: '' }
    }).compileComponents();

    fixture = TestBed.createComponent(StepIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit stepClick when clickable and step is allowed', () => {
    const spy = jasmine.createSpy('stepClick');
    component.clickable = true;
    component.activeStep = 3;
    component.stepClick.subscribe(spy);

    component.onStepClick(2);

    expect(spy).toHaveBeenCalledOnceWith(2);
  });

  it('should not emit stepClick when step is not allowed', () => {
    const spy = jasmine.createSpy('stepClick');
    component.clickable = true;
    component.activeStep = 1;
    component.stepClick.subscribe(spy);

    component.onStepClick(2);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should create array for total steps', () => {
    component.totalSteps = 4;

    expect(component.stepsArray()).toEqual([1, 2, 3, 4]);
  });
});
