import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetMatchDateModalComponent } from './set-match-date-modal.component';

describe('SetMatchDateModalComponent', () => {
  let component: SetMatchDateModalComponent;
  let fixture: ComponentFixture<SetMatchDateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetMatchDateModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetMatchDateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
