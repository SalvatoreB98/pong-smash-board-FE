import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointsPickerComponent } from './points-picker.component';

describe('PointsPickerComponent', () => {
  let component: PointsPickerComponent;
  let fixture: ComponentFixture<PointsPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PointsPickerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PointsPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
