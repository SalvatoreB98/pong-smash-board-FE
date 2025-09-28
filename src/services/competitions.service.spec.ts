import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CompetitionService } from './competitions.service';
import { CompetitionApi, ICompetition } from '../api/competition.api';
import { CompetitionStore } from '../stores/competition.store';
import { LoaderService } from './loader.service';
import { MSG_TYPE } from '../app/utils/enum';
import { UserService } from './user.service';

class CompetitionApiStub {
  getList = jasmine.createSpy('getList').and.returnValue(of({ competitions: [] }));
  join = jasmine.createSpy('join').and.returnValue(of({ competition: null, user_state: null }));
}

class CompetitionStoreStub {
  list$ = of([]);
  activeCompetition$ = of(null);
  private list: ICompetition[] = [];
  private activeId: string | null = null;

  snapshotList(): ICompetition[] {
    return [...this.list];
  }

  snapshotActive(): ICompetition | null {
    if (!this.activeId) return null;
    return this.list.find(c => String(c.id) === this.activeId) ?? null;
  }

  snapshotById(id: number | string): ICompetition | undefined {
    return this.list.find(c => String(c.id) === String(id));
  }

  setList(list: ICompetition[]) {
    this.list = [...list];
  }

  addOne(comp: ICompetition) {
    this.upsertOne(comp, { prepend: true });
  }

  upsertOne(comp: ICompetition, opts?: { prepend?: boolean }) {
    const idx = this.list.findIndex(c => String(c.id) === String(comp.id));
    if (idx >= 0) {
      this.list[idx] = { ...this.list[idx], ...comp };
    } else if (opts?.prepend) {
      this.list = [comp, ...this.list];
    } else {
      this.list = [...this.list, comp];
    }
  }

  removeOne(id: number | string) {
    const strId = String(id);
    this.list = this.list.filter(c => String(c.id) !== strId);
    if (this.activeId === strId) {
      this.activeId = null;
    }
  }

  clear() {
    this.list = [];
    this.activeId = null;
  }

  setActive(id: number | string | null) {
    this.activeId = id !== null ? String(id) : null;
  }
}

class LoaderServiceStub {
  startLittleLoader = jasmine.createSpy('startLittleLoader');
  stopLittleLoader = jasmine.createSpy('stopLittleLoader');
  showToast = jasmine.createSpy('showToast');
}

class UserServiceStub {
  private state: any = null;
  snapshot() {
    return this.state;
  }
  setLocal = jasmine.createSpy('setLocal').and.callFake((state: any) => {
    this.state = state;
  });
  setActiveCompetitionId = jasmine.createSpy('setActiveCompetitionId');
}

describe('CompetitionService', () => {
  let service: CompetitionService;
  let api: CompetitionApiStub;
  let store: CompetitionStoreStub;
  let loader: LoaderServiceStub;
  let user: UserServiceStub;

  const mockCompetition: ICompetition = {
    id: 1,
    name: 'Test Cup',
    type: 'league',
    setsType: 5,
    pointsType: 11,
    management: 'admin',
  } as ICompetition;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CompetitionService,
        { provide: CompetitionApi, useClass: CompetitionApiStub },
        { provide: CompetitionStore, useClass: CompetitionStoreStub },
        { provide: LoaderService, useClass: LoaderServiceStub },
        { provide: UserService, useClass: UserServiceStub },
      ],
    });

    service = TestBed.inject(CompetitionService);
    api = TestBed.inject(CompetitionApi) as unknown as CompetitionApiStub;
    store = TestBed.inject(CompetitionStore) as unknown as CompetitionStoreStub;
    loader = TestBed.inject(LoaderService) as unknown as LoaderServiceStub;
    user = TestBed.inject(UserService) as unknown as UserServiceStub;
  });

  it('should fetch competitions and cache the result', async () => {
    api.getList.and.returnValue(of({ competitions: [mockCompetition] }));

    const firstCall = await service.getCompetitions();
    expect(firstCall).toEqual([mockCompetition]);
    expect(store.snapshotList()).toEqual([mockCompetition]);
    expect(loader.stopLittleLoader).toHaveBeenCalled();

    const callsAfterFirst = api.getList.calls.count();
    const secondCall = await service.getCompetitions();
    expect(secondCall).toEqual([mockCompetition]);
    expect(api.getList.calls.count()).toBe(callsAfterFirst);
  });

  it('should return existing competitions when fetch fails', async () => {
    store.setList([mockCompetition]);
    api.getList.and.returnValue(throwError(() => new Error('network')));

    const result = await service.getCompetitions(true);
    expect(result).toEqual([mockCompetition]);
    expect(loader.showToast).toHaveBeenCalledWith('Errore nel caricamento competizioni', MSG_TYPE.ERROR);
    expect(loader.stopLittleLoader).toHaveBeenCalled();
  });

  it('should resolve active competition from user when store empty', () => {
    store.setList([mockCompetition]);
    user.setLocal({ active_competition_id: mockCompetition.id });
    store.setActive(null);

    const active = service.snapshotActive();
    expect(active).toEqual(mockCompetition);
  });

  it('should reject join when user id is undefined', async () => {
    user.setLocal({ user_id: undefined });

    await expectAsync(service.joinCompetition('ABC')).toBeRejectedWithError('User ID is undefined');
    expect(loader.startLittleLoader).not.toHaveBeenCalled();
  });
});
