import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompetitionStartComponent } from './competition-start.component';

describe('CompetitionStartComponent', () => {
  let component: CompetitionStartComponent;
  let fixture: ComponentFixture<CompetitionStartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompetitionStartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompetitionStartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
