import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DataService } from './data.service';
import { LoaderService } from './loader.service';
import { UserService } from './user.service';
import { RankingService } from './ranking.service';
import { API_PATHS } from '../api/api.config';
import { of } from 'rxjs';

class LoaderServiceStub {
  showToast = jasmine.createSpy('showToast');
  stopLittleLoader = jasmine.createSpy('stopLittleLoader');
  startLittleLoader = jasmine.createSpy('startLittleLoader');
  addSpinnerToButton = jasmine.createSpy('addSpinnerToButton');
  removeSpinnerFromButton = jasmine.createSpy('removeSpinnerFromButton');
}

class UserServiceStub {
  private state: any = { active_competition_id: 1 };
  snapshot() {
    return this.state;
  }
  setState(state: any) {
    this.state = state;
  }
  getState = jasmine.createSpy('getState').and.callFake(() => of(this.state));
}

class RankingServiceStub {
  triggerRefresh = jasmine.createSpy('triggerRefresh');
}

describe('DataService', () => {
  let service: DataService;
  let httpMock: HttpTestingController;
  let userService: UserServiceStub;

  const mockResponse = {
    matches: [{ id: 1, player1: 'A', player2: 'B', date: '2023-01-01' }],
    wins: {},
    totPlayed: {},
    points: {},
    players: [],
    matchesElimination: [],
    monthlyWinRates: {},
    badges: {},
    giocatore1Score: 0,
    giocatore2Score: 0,
  } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DataService,
        { provide: LoaderService, useClass: LoaderServiceStub },
        { provide: UserService, useClass: UserServiceStub },
        { provide: RankingService, useClass: RankingServiceStub },
      ],
    });

    service = TestBed.inject(DataService);
    httpMock = TestBed.inject(HttpTestingController);
    userService = TestBed.inject(UserService) as unknown as UserServiceStub;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch matches and reuse cached data when called twice', async () => {
    const firstPromise = service.fetchMatches();
    const req = httpMock.expectOne(r => r.url === API_PATHS.getMatches);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('competitionId')).toBe('1');
    req.flush(mockResponse);

    await expectAsync(firstPromise).toBeResolved();

    const second = await service.fetchMatches();
    expect(second.matches).toEqual(mockResponse.matches);
    httpMock.expectNone(req => req.url === API_PATHS.getMatches);
  });

  it('should refetch when active competition changes', async () => {
    const first = service.fetchMatches();
    httpMock.expectOne(r => r.url === API_PATHS.getMatches).flush(mockResponse);
    await expectAsync(first).toBeResolved();

    userService.setState({ active_competition_id: 2 });

    const secondPromise = service.fetchMatches();
    const req = httpMock.expectOne(r => r.url === API_PATHS.getMatches);
    expect(req.request.params.get('competitionId')).toBe('2');
    req.flush(mockResponse);
    await expectAsync(secondPromise).toBeResolved();
  });

  it('should reject addMatch when scores missing', async () => {
    await expectAsync(service.addMatch({ p1Score: null as any, p2Score: null as any })).toBeRejectedWith('Invalid data');
  });

  it('should return empty groups when no competition selected', async () => {
    userService.setState({ active_competition_id: null });
    const groups = await service.fetchGroups();
    expect(groups).toEqual({ groups: [] });
  });
});
