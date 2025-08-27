import { Injectable, inject } from '@angular/core';
import { catchError, map, tap } from 'rxjs/operators';
import { EMPTY, firstValueFrom, Observable, of } from 'rxjs';
import { CompetitionStore } from '../stores/competition.store'; // adatta il path
import { LoaderService } from '../services/loader.service';     // opzionale
import { MSG_TYPE } from '../app/utils/enum';                   // opzionale
import { UserService } from '../services/user.service';         // per setLocal(userState) se torna dal BE
import { AddCompetitionDto, CompetitionApi, ICompetition, ICompetitionsResponse } from '../api/competition.api';

@Injectable({ providedIn: 'root' })
export class CompetitionService {
  private readonly api = inject(CompetitionApi);
  private readonly store = inject(CompetitionStore);
  private readonly loader = inject(LoaderService, { optional: true });
  private readonly user = inject(UserService, { optional: true });

  // ------- SELECTORS -------
  list$ = this.store.list$;
  snapshotList(): ICompetition[] { return this.store.snapshotList(); }

  // ------- QUERIES -------
  /** Carica la lista dal BE e aggiorna lo store */
  load(): Observable<ICompetition[]> {
    this.loader?.startLittleLoader();
    return this.api.getList().pipe(
      tap((res: ICompetitionsResponse) => {
        this.store.setList(res?.competitions ?? []);
      }),
      map(() => this.store.snapshotList()),
      catchError(err => {
        console.error('[CompetitionService] load error:', err);
        this.loader?.showToast?.('Errore nel caricamento competizioni', MSG_TYPE.ERROR);
        return of(this.store.snapshotList()); // restituisco ciò che ho
      }),
      tap(() => this.loader?.stopLittleLoader())
    );
  }

  /** Carica una singola competizione (e aggiorna/upserta nello store) */
  loadOne(id: number | string): Observable<ICompetition | undefined> {
    this.loader?.startLittleLoader();
    return this.api.getOne(id).pipe(
      tap(comp => this.store.upsertOne(comp)),
      catchError(err => {
        console.error('[CompetitionService] loadOne error:', err);
        this.loader?.showToast?.('Errore nel caricamento competizione', MSG_TYPE.ERROR);
        return EMPTY;
      }),
      tap(() => this.loader?.stopLittleLoader())
    );
  }

  // ------- COMMANDS -------
  /** Crea competizione: aggiorna store e (se presente) lo stato utente */
  add(dto: AddCompetitionDto): Observable<ICompetition> {
    this.loader?.startLittleLoader();
    return this.api.add(dto).pipe(
      tap(res => {
        // Aggiorno store con la competizione canonicamente ritornata dal BE
        this.store.addOne(res.competition);
        // Se il BE rimanda userState aggiornato (active_competition_id, ecc.)
        if (res.userState && this.user) {
          this.user.setLocal(res.userState);
        }
        this.loader?.showToast?.('Competizione creata!', MSG_TYPE.SUCCESS, 4000);
      }),
      map(res => res.competition),
      catchError(err => {
        console.error('[CompetitionService] add error:', err);
        this.loader?.showToast?.('Errore creazione competizione', MSG_TYPE.ERROR);
        return EMPTY;
      }),
      tap(() => this.loader?.stopLittleLoader())
    );
  }

  /** Aggiorna parzialmente una competizione e sincronizza lo store */
  update(id: number | string, patch: Partial<ICompetition>): Observable<ICompetition> {
    this.loader?.startLittleLoader();
    return this.api.update(id, patch).pipe(
      tap(updated => this.store.upsertOne(updated)),
      map(updated => updated),
      catchError(err => {
        console.error('[CompetitionService] update error:', err);
        this.loader?.showToast?.('Errore aggiornamento competizione', MSG_TYPE.ERROR);
        return EMPTY;
      }),
      tap(() => this.loader?.stopLittleLoader())
    );
  }

  /** Elimina competizione e aggiorna store */
  remove(id: number | string): Observable<void> {
    this.loader?.startLittleLoader();
    return this.api.remove(id).pipe(
      tap(() => {
        this.store.removeOne(id);
        this.loader?.showToast?.('Competizione eliminata', MSG_TYPE.SUCCESS, 3000);
      }),
      map(() => void 0),
      catchError(err => {
        console.error('[CompetitionService] remove error:', err);
        this.loader?.showToast?.('Errore eliminazione competizione', MSG_TYPE.ERROR);
        return EMPTY;
      }),
      tap(() => this.loader?.stopLittleLoader())
    );
  }

  /** Pulizia totale store (es. logout) */
  clear(): void {
    this.store.clear();
  }
  // ------- wrapper -------
  getCompetitions(): Promise<ICompetition[]> {
    return firstValueFrom(this.load());
  }
  
  addCompetition(dto: AddCompetitionDto): Promise<ICompetition> {
    return firstValueFrom(this.add(dto));
  }
}
