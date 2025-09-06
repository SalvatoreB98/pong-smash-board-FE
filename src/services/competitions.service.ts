import { Injectable, inject } from '@angular/core';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { combineLatest, EMPTY, firstValueFrom, Observable, of, throwError } from 'rxjs';
import { CompetitionStore } from '../stores/competition.store';
import { LoaderService } from '../services/loader.service';
import { MSG_TYPE } from '../app/utils/enum';
import { UserService } from '../services/user.service';
import { AddCompetitionDto, CompetitionApi, ICompetition, ICompetitionsResponse } from '../api/competition.api';
import { CachedFetcher } from '../app/utils/helpers/cache.helpers';

@Injectable({ providedIn: 'root' })
export class CompetitionService {
  private readonly api = inject(CompetitionApi);
  private readonly store = inject(CompetitionStore);
  private readonly loader = inject(LoaderService, { optional: true });
  private readonly user = inject(UserService, { optional: true });

  // ------- SELECTORS -------
  list$ = this.store.list$;
  snapshotList(): ICompetition[] {
    return this.store.snapshotList();
  }

  // ------- CACHE WRAPPER -------
  private competitionsFetcher = new CachedFetcher<ICompetition[]>(
    async () => {
      const res = await firstValueFrom(this.api.getList());
      this.store.setList(res?.competitions ?? []);
      return this.store.snapshotList();
    },
    60 * 1000 // TTL 1 min, cambialo se serve
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

  // ------- DERIVED SELECTORS -------
  userState$ = this.user?.userState$() ?? of(null);

  activeCompetition$ = combineLatest({
    state: this.userState$,
    competitions: this.list$
  }).pipe(
    map(({ state, competitions }) =>
      competitions.find(c => c.id === state?.active_competition_id) ?? null
    ),
    tap(c => console.log('[CompetitionService] activeCompetition:', c))
  );

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
        this.store.addOne(res.competition);
        if (res.userState && this.user) {
          this.user.setLocal(res.userState);
        }
        this.loader?.showToast?.('Competizione creata!', MSG_TYPE.SUCCESS, 4000);
        this.clearCompetitionsCache(); // invalidiamo cache
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

  clear(): void {
    this.store.clear();
    this.clearCompetitionsCache();
  }
}
