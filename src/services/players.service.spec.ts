import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlayersService } from './players.service';
import { environment } from '../environments/environment';
import { API_PATHS } from '../api/api.config';

const apiUrl = environment.apiUrl + API_PATHS.getPlayers;

describe('PlayersService', () => {
  let service: PlayersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(PlayersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request players list from API', () => {
    const mockPlayers = [{ id: 1, name: 'Alice' }];

    service.getPlayers().subscribe(players => {
      expect(players).toEqual(mockPlayers);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockPlayers);
  });
});
