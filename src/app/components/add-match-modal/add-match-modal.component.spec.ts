import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AddMatchModalComponent } from './add-match-modal.component';
import { ModalService } from '../../../services/modal.service';
import { DataService } from '../../../services/data.service';
import { LoaderService } from '../../../services/loader.service';
import { TranslationService } from '../../../services/translation.service';
import { CompetitionService } from '../../../services/competitions.service';
import { BehaviorSubject } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { MSG_TYPE } from '../../utils/enum';

class ModalServiceStub {
  closeModal = jasmine.createSpy('closeModal');
  openManualPointsEvent = jasmine.createSpy('openManualPointsEvent');
}

class DataServiceStub {
  addMatch = jasmine.createSpy('addMatch').and.returnValue(Promise.resolve());
  getLoggedInPlayerId = jasmine.createSpy('getLoggedInPlayerId').and.returnValue(99);
}

class LoaderServiceStub {
  showToast = jasmine.createSpy('showToast');
  addSpinnerToButton = jasmine.createSpy('addSpinnerToButton');
  removeSpinnerFromButton = jasmine.createSpy('removeSpinnerFromButton');
}

class TranslationServiceStub {
  translate(key: string) {
    return `translated:${key}`;
  }
}

class CompetitionServiceStub {
  activeCompetition$ = new BehaviorSubject<any>(null);
}

describe('AddMatchModalComponent', () => {
  let component: AddMatchModalComponent;
  let fixture: ComponentFixture<AddMatchModalComponent>;
  let dataService: DataServiceStub;
  let loaderService: LoaderServiceStub;
  let competitionService: CompetitionServiceStub;
  let modalService: ModalServiceStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddMatchModalComponent],
      providers: [
        { provide: ModalService, useClass: ModalServiceStub },
        { provide: DataService, useClass: DataServiceStub },
        { provide: LoaderService, useClass: LoaderServiceStub },
        { provide: TranslationService, useClass: TranslationServiceStub },
        { provide: CompetitionService, useClass: CompetitionServiceStub },
        FormBuilder,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddMatchModalComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService) as unknown as DataServiceStub;
    loaderService = TestBed.inject(LoaderService) as unknown as LoaderServiceStub;
    competitionService = TestBed.inject(CompetitionService) as unknown as CompetitionServiceStub;
    modalService = TestBed.inject(ModalService) as unknown as ModalServiceStub;
  });

  function initComponent(playersCount = 2) {
    component.players = Array.from({ length: playersCount }, (_, i) => ({ id: i + 1, name: `Player ${i + 1}` })) as any;
    component.ngOnInit();
  }

  it('should warn and close when there are not enough players', () => {
    initComponent(1);
    expect(loaderService.showToast).toHaveBeenCalledWith('translated:not_enough_players', MSG_TYPE.WARNING);
    expect(modalService.closeModal).toHaveBeenCalled();
  });

  it('should sanitize set scores respecting limits and avoiding duplicates', () => {
    initComponent();
    component.competition = { sets_type: 3 } as any;
    component.matchForm.get('p2Score')?.setValue(3);
    component.matchForm.get('p1Score')?.setValue('99');

    component.sanitizeInput('p1Score');
    expect(component.matchForm.get('p1Score')?.value).toBe(2);
    expect(component.errorsOfSets).toContain('number_maximum 3');
    expect(component.errorsOfSets).toContain('number_equal');
  });

  it('should validate points per set and clamp invalid values', () => {
    initComponent();
    component.competition = { points_type: 11 } as any;
    const fb = component['fb'] as FormBuilder;
    component.setsPoints.push(fb.group({ player1Points: -1, player2Points: 25 }));

    component.checkPointsError();
    expect(component.errorsOfPoints).toContain('set 1: number_positive_p1');
    expect(component.errorsOfPoints).toContain('set 1: number_maximum_p2 11');
    const setGroup = component.getSetFormGroup(0);
    expect(setGroup.value.player1Points).toBe(0);
    expect(setGroup.value.player2Points).toBe(11);
  });

  it('should filter available players based on group selection and logged user', () => {
    initComponent();
    component.groups = [{ id: 'g1', players: [{ id: 2 }, { id: 3 }] }] as any;
    component.competition = { type: 'group_knockout' } as any;
    component.matchForm.patchValue({ player1: 2, player2: 3 });
    component.matchForm.get('groupId')?.setValue('g1');
    dataService.getLoggedInPlayerId.and.returnValue(1);

    const players = component.getPlayers(1);
    expect(players.map(p => p.id)).toEqual([2]);
  });

  it('should update form when competition configuration changes', () => {
    initComponent();
    competitionService.activeCompetition$.next({ id: 1, type: 'group_knockout', points_type: 21, sets_type: 7 } as any);
    expect(component.maxPoints).toBe(21);
    expect(component.maxSets).toBe(7);
    expect(component.matchForm.get('groupId')?.hasError('required')).toBeTrue();

    competitionService.activeCompetition$.next({ id: 1, type: 'league', points_type: 11, sets_type: 5 } as any);
    expect(component.matchForm.get('groupId')?.hasError('required')).toBeFalse();
  });

  it('should prevent match with identical players', fakeAsync(() => {
    initComponent();
    spyOn(window, 'alert');
    component.matchForm.patchValue({ player1: 2, player2: 2, p1Score: 1, p2Score: 0 });

    component.addMatch();
    tick();

    expect(window.alert).toHaveBeenCalled();
    expect(dataService.addMatch).not.toHaveBeenCalled();
  }));

  it('should submit match data and close modal', async () => {
    initComponent();
    competitionService.activeCompetition$.next({ id: 1, type: 'league', points_type: 11, sets_type: 5 } as any);
    component.matchForm.patchValue({ player1: 1, player2: 2, p1Score: 2, p2Score: 1 });

    await component.addMatch();

    expect(dataService.addMatch).toHaveBeenCalled();
    const payload = dataService.addMatch.calls.mostRecent().args[0];
    expect(payload.player1).toBe(1);
    expect(payload.player2).toBe(2);
    expect(payload.setsPoints).toEqual([]);
    expect(modalService.closeModal).toHaveBeenCalled();
  });
});
