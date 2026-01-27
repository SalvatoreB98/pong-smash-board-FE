import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCompetitionModalComponent } from './add-competition-modal.component';
import { ModalService } from '../../../../services/modal.service';
import { CompetitionService } from '../../../../services/competitions.service';
import { LoaderService } from '../../../../services/loader.service';
import { UserService } from '../../../../services/user.service';

describe('AddCompetitionModalComponent', () => {
  let component: AddCompetitionModalComponent;
  let fixture: ComponentFixture<AddCompetitionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCompetitionModalComponent],
      providers: [
        { provide: ModalService, useValue: { closeModal: () => {} } },
        { provide: CompetitionService, useValue: { addCompetition: () => Promise.resolve() } },
        { provide: LoaderService, useValue: {} },
        { provide: UserService, useValue: {} },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCompetitionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('enables freeSetsCtrl and applies validation when free sets are selected', () => {
    component.setsCtrl.setValue(component.freeSetsSentinel);

    expect(component.freeSetsCtrl.enabled).toBeTrue();
    expect(component.freeSetsCtrl.invalid).toBeTrue();

    component.freeSetsCtrl.setValue(0);
    expect(component.freeSetsCtrl.invalid).toBeTrue();

    component.freeSetsCtrl.setValue(10);
    expect(component.freeSetsCtrl.valid).toBeTrue();
  });

  it('disables and clears freeSetsCtrl when switching back to standard sets', () => {
    component.setsCtrl.setValue(component.freeSetsSentinel);
    component.freeSetsCtrl.setValue(8);

    component.setsCtrl.setValue(3);

    expect(component.freeSetsCtrl.disabled).toBeTrue();
    expect(component.freeSetsCtrl.value).toBeNull();
  });

  it('returns effective sets based on selected mode', () => {
    component.setsCtrl.setValue(component.freeSetsSentinel);
    component.freeSetsCtrl.setValue(7);
    expect(component.effectiveSets).toBe(7);

    component.setsCtrl.setValue(5);
    expect(component.effectiveSets).toBe(5);
  });
});
