import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RankingService } from './ranking.service';
import { environment } from '../environments/environment';
import { API_PATHS } from '../api/api.config';

const buildUrl = (competitionId: string) => `${environment.apiUrl}${API_PATHS.getRanking}?competition_id=${competitionId}`;

describe('RankingService', () => {
  let service: RankingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(RankingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch ranking and reuse cached response', async () => {
    const response = { ranking: [], generatedAt: new Date().toISOString() };
    const promise = service.getRanking('1');

    const req = httpMock.expectOne(buildUrl('1'));
    expect(req.request.method).toBe('GET');
    req.flush(response);

    await expectAsync(promise).toBeResolvedTo(response);

    const second = await service.getRanking('1');
    expect(second).toEqual(response);
    httpMock.expectNone(buildUrl('1'));
  });

  it('should clear cache per competition id', async () => {
    const response = { ranking: [], generatedAt: new Date().toISOString() };

    const first = service.getRanking('2');
    httpMock.expectOne(buildUrl('2')).flush(response);
    await expectAsync(first).toBeResolvedTo(response);

    service.clearRankingCache('2');

    const second = service.getRanking('2');
    httpMock.expectOne(buildUrl('2')).flush(response);
    await expectAsync(second).toBeResolvedTo(response);
  });

  it('should emit refresh notifications', () => {
    let emitted = false;
    service.refreshObs$.subscribe(() => (emitted = true));

    service.triggerRefresh();
    expect(emitted).toBeTrue();
  });
});
