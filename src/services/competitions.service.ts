import { Injectable, inject } from '@angular/core';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { EMPTY, firstValueFrom, Observable, of, throwError } from 'rxjs';
import { CompetitionStore } from '../stores/competition.store';
import { LoaderService } from '../services/loader.service';
import { MSG_TYPE } from '../app/utils/enum';
import { UserService } from '../services/user.service';
import { AddCompetitionDto, CompetitionApi, ICompetition } from '../api/competition.api';
import { CachedFetcher } from '../app/utils/helpers/cache.helpers';
import { IPlayer } from './players.service';
import { IUserState } from './interfaces/Interfaces';

@Injectable({ providedIn: 'root' })
export class CompetitionService {
  private readonly api = inject(CompetitionApi);
  private readonly store = inject(CompetitionStore);
  private readonly loader = inject(LoaderService, { optional: true });
  private readonly user = inject(UserService, { optional: true });

  // ------- SELECTORS -------
  list$ = this.store.list$;
  activeCompetition$ = this.store.activeCompetition$;   // <-- ora arriva dallo store
  snapshotList(): ICompetition[] {
    return this.store.snapshotList();
  }
  snapshotActive(): ICompetition | null {
    // 1. Se lo store ha già un active
    const storeActive = this.store.snapshotActive?.();
    if (storeActive) return storeActive;

    // 2. Altrimenti usa lo userState
    const state = this.user?.snapshot();
    if (state?.active_competition_id) {
      return this.store.snapshotById(state.active_competition_id) ?? null;
    }

    return null;
  }

  // ------- CACHE WRAPPER -------
  private competitionsFetcher = new CachedFetcher<ICompetition[]>(
    async () => {
      const res = await firstValueFrom(this.api.getList());
      this.store.setList(res?.competitions ?? []);
      return this.store.snapshotList();
    },
    60 * 1000 // TTL 1 min
  );

  /** Ottiene le competizioni con cache */
  async getCompetitions(force = false): Promise<ICompetition[]> {
    try {
      return await this.competitionsFetcher.get(force);
    } catch (err) {
      console.error('[CompetitionService] getCompetitions error:', err);
      this.loader?.showToast?.('Errore nel caricamento competizioni', MSG_TYPE.ERROR);
      return this.store.snapshotList();
    } finally {
      this.loader?.stopLittleLoader();
    }
  }

  clearCompetitionsCache() {
    this.competitionsFetcher.clear();
  }

  // ------- COMMANDS -------
  loadOne(id: number | string): Observable<ICompetition | undefined> {
    return this.api.getOne(id).pipe(
      tap(comp => this.store.upsertOne(comp)),
      catchError(err => {
        console.error('[CompetitionService] loadOne error:', err);
        this.loader?.showToast?.('Errore nel caricamento competizione', MSG_TYPE.ERROR);
        return EMPTY;
      }),
    );
  }

  add(dto: AddCompetitionDto): Observable<ICompetition> {
    return this.api.add(dto).pipe(
      tap(res => {
        if(res.players) {
          res.competition.players = res.players;
        }
        this.store.addOne(res.competition);
        if (res.userState && this.user) {
          this.user.setLocal(res.userState);
            this.store.setActive(res.competition.id);
        }
  
        this.loader?.showToast?.('Competizione creata!', MSG_TYPE.SUCCESS, 4000);
        this.clearCompetitionsCache();
      }),
      map(res => res.competition),
      catchError(err => {
        console.error('[CompetitionService] add error:', err);
        this.loader?.showToast?.('Errore creazione competizione', MSG_TYPE.ERROR);
        return throwError(() => err);
      }),
    );
  }

  update(id: number | string, patch: Partial<ICompetition>): Observable<ICompetition> {
    return this.api.update(id, patch).pipe(
      tap(updated => {
        this.store.upsertOne(updated);
        this.clearCompetitionsCache();
      }),
      map(updated => updated),
      catchError(err => {
        console.error('[CompetitionService] update error:', err);
        this.loader?.showToast?.('Errore aggiornamento competizione', MSG_TYPE.ERROR);
        return EMPTY;
      }),
    );
  }

  remove(id: number | string): Observable<void> {
    return this.api.remove(id).pipe(
      tap(() => {
        this.store.removeOne(id);
        this.loader?.showToast?.('Competizione eliminata', MSG_TYPE.SUCCESS, 3000);
        this.clearCompetitionsCache();
      }),
      map(() => void 0),
      catchError(err => {
        console.error('[CompetitionService] remove error:', err);
        this.loader?.showToast?.('Errore eliminazione competizione', MSG_TYPE.ERROR);
        return EMPTY;
      }),
    );
  }

  updateActiveCompetition(competitionId: number | string): Observable<void> {
    const currentActive = this.snapshotActive();
    if (currentActive && String(currentActive.id) === String(competitionId)) {
      // Already active, do nothing
      return of(void 0);
    }
    return this.api.updateActiveCompetition(competitionId).pipe(
      tap((res: { userState?: IUserState } | any) => {
        this.store.setActive(competitionId);
        if (this.user) {
          if (res?.userState) {
            this.user.setLocal(res.userState);
          } else {
            this.user.setActiveCompetitionId?.(competitionId);
          }
        }
        this.loader?.showToast?.('Competizione attiva aggiornata', MSG_TYPE.SUCCESS, 3000);
      }),
      map(() => void 0),
      catchError(err => {
        console.error('[CompetitionService] updateActiveCompetition error:', err);
        this.loader?.showToast?.('Errore aggiornamento competizione attiva', MSG_TYPE.ERROR);
        return EMPTY;
      }),
    );
  }

  deletePlayer(competitionId: number | string, userId: number | string): Observable<void> {
    return this.api.deletePlayer(competitionId, userId).pipe(
      tap(() => {
        const competition = this.store.snapshotById?.(competitionId);
        if (competition) {
          const filteredPlayers = (competition.players ?? []).filter(player => String(player.id) !== String(userId));
          this.store.upsertOne({ ...competition, players: filteredPlayers });
        }
        this.loader?.showToast?.('Giocatore rimosso dalla competizione', MSG_TYPE.SUCCESS, 3000);
      }),
      map(() => void 0),
      catchError(err => {
        console.error('[CompetitionService] deletePlayer error:', err);
        this.loader?.showToast?.('Errore rimozione giocatore', MSG_TYPE.ERROR);
        return EMPTY;
      }),
    );
  }

  joinCompetition(code: string): Promise<ICompetition> {
    const userId = this.user?.snapshot()?.user_id;
    if (userId === undefined) {
      return Promise.reject(new Error('User ID is undefined'));
    }
    this.loader?.startLittleLoader();
    return firstValueFrom(
      this.api.join(code, userId).pipe(
        tap(res => {
          if (res.competition) {
            this.setLocal(res.competition);
          }
          if (res.user_state && this.user) {
            this.user.setLocal(res.user_state);
          }
          this.loader?.showToast?.('Unito alla competizione!', MSG_TYPE.SUCCESS, 3000);
          this.clearCompetitionsCache();
        }),
        map(res => res.competition),
        catchError(err => {
          console.error('[CompetitionService] joinCompetition error:', err);
          this.loader?.showToast?.('Errore join competizione', MSG_TYPE.ERROR);
          return throwError(() => err);
        }),
        finalize(() => this.loader?.stopLittleLoader())
      )
    );
  }

  addCompetition(dto: AddCompetitionDto): Promise<ICompetition> {
    return firstValueFrom(this.add(dto));
  }

  // ------- LOCAL STORE OPS -------
  setLocal(comp: ICompetition) {
    this.store.upsertOne(comp, { prepend: true });
  }

  addPlayerToLocal(competitionId: number | string, player: IPlayer) {
    const competitions = this.store.snapshotList();
    const index = competitions.findIndex(c => c.id === competitionId);
    if (index === -1) return;

    const updatedCompetition = {
      ...competitions[index],
      players: [
        ...(competitions[index].players ?? []).map(p => ({
          id: p.id,
          name: p.name,
          image_url: p.image_url ?? '',
          nickname: p.nickname ?? ''
        })),
        {
          id: player.id,
          name: player.name,
          image_url: player.image_url ?? '',
          nickname: player.nickname ?? ''
        }
      ]
    };

    this.store.upsertOne(updatedCompetition);
  }

  removeLocal(id: number | string) {
    this.store.removeOne(id);
  }

  clear(): void {
    this.store.clear();
    this.clearCompetitionsCache();
  }
  removePlayerFromCompetition(competitionId: number | string, playerId: number | string): Observable<void> {
    return this.api.deletePlayer(competitionId, playerId);
  }
}
