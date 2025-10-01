import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UserService } from './user.service';
import { UserApi } from '../api/user.api';
import { UserStore } from '../stores/user.store';
import { CompetitionStore } from '../stores/competition.store';
import { IUserState } from './interfaces/Interfaces';
import { BehaviorSubject } from 'rxjs';

class UserApiStub {
  getUserState = jasmine.createSpy('getUserState').and.returnValue(of());
  updateUserState = jasmine.createSpy('updateUserState').and.returnValue(of());
}

class UserStoreStub {
  private subject = new BehaviorSubject<IUserState | null>(null);
  state$ = this.subject.asObservable();
  setSpy = jasmine.createSpy('set');
  patchSpy = jasmine.createSpy('patch');
  clearSpy = jasmine.createSpy('clear');

  snapshot(): IUserState | null {
    return this.subject.getValue();
  }

  set(state: IUserState | null) {
    this.setSpy(state);
    this.subject.next(state ? { ...state } : null);
  }

  patch(patch: Partial<IUserState>) {
    this.patchSpy(patch);
    const current = this.subject.getValue();
    if (!current) return;
    this.subject.next({ ...current, ...patch });
  }

  clear() {
    this.clearSpy();
    this.subject.next(null);
  }
}

class CompetitionStoreStub {
  upsertOne = jasmine.createSpy('upsertOne');
  setActive = jasmine.createSpy('setActive');
}

describe('UserService', () => {
  let service: UserService;
  let api: UserApiStub;
  let store: UserStoreStub;
  let competitionStore: CompetitionStoreStub;

  const baseState: IUserState = {
    active_competition: { id: 1, name: 'Comp', type: 'league', setsType: 5, pointsType: 11, management: 'admin' } as any,
    user_state_id: 1,
    user_id: 'uuid',
    state: 'profile_completed',
    active_competition_id: 1,
    created_at: '2023-01-01',
    updated_at: '2023-01-02',
    nickname: 'Player',
    player_id: 10,
    image_url: null,
    email: 'player@example.com',
    name: 'Name',
    lastname: 'Last',
  } as IUserState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: UserApi, useClass: UserApiStub },
        { provide: UserStore, useClass: UserStoreStub },
        { provide: CompetitionStore, useClass: CompetitionStoreStub },
      ],
    });

    service = TestBed.inject(UserService);
    api = TestBed.inject(UserApi) as unknown as UserApiStub;
    store = TestBed.inject(UserStore) as unknown as UserStoreStub;
    competitionStore = TestBed.inject(CompetitionStore) as unknown as CompetitionStoreStub;
  });

  it('should return cached user state when available', (done) => {
    store.set(baseState);

    service.getState().subscribe(state => {
      expect(state).toEqual(baseState);
      expect(api.getUserState).not.toHaveBeenCalled();
      done();
    });
  });

  it('should fetch user state from API when forced', (done) => {
    const freshState = { ...baseState, nickname: 'Updated' };
    api.getUserState.and.returnValue(of(freshState));

    service.getState(true).subscribe(state => {
      expect(api.getUserState).toHaveBeenCalled();
      expect(state).toEqual(freshState);
      expect(store.setSpy).toHaveBeenCalledWith(freshState);
      expect(competitionStore.upsertOne).toHaveBeenCalled();
      expect(competitionStore.setActive).toHaveBeenCalledWith(freshState.active_competition.id ?? freshState.active_competition.competition_id);
      done();
    });
  });

  it('should update remote state and patch optimistically', (done) => {
    store.set(baseState);
    const serverState = { ...baseState, nickname: 'Remote' };
    api.updateUserState.and.returnValue(of(serverState));

    service.updateRemote({ nickname: 'Local' }).subscribe(state => {
      expect(api.updateUserState).toHaveBeenCalledWith({ nickname: 'Local' });
      expect(store.patchSpy).toHaveBeenCalledWith({ nickname: 'Local' });
      expect(store.setSpy).toHaveBeenCalledWith(serverState);
      expect(state).toEqual(serverState);
      done();
    });
  });

  it('should set active competition id locally and on store', () => {
    store.set(baseState);

    service.setActiveCompetitionId(5);
    expect(store.patchSpy).toHaveBeenCalledWith({ active_competition_id: 5 });
    expect(competitionStore.setActive).toHaveBeenCalledWith(5);

    store.patchSpy.calls.reset();
    service.setActiveCompetitionId(null);
    expect(store.patchSpy).toHaveBeenCalledWith({ active_competition_id: null });
    expect(competitionStore.setActive).toHaveBeenCalledWith(null);
  });

  it('should clear store on clear()', () => {
    service.clear();
    expect(store.clearSpy).toHaveBeenCalled();
  });
});
