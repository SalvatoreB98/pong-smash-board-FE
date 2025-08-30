// competition.store.ts
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ICompetition } from '../api/competition.api';
import { UserService } from '../services/user.service';

type Id = number | string;
type State = {
  entities: Record<string, ICompetition>;
  ids: Id[];
};

function toId(c: ICompetition): string {
  return String(c.id);
}

function sortIds(a: ICompetition, b: ICompetition): number {
  // Prova a ordinare per created_at DESC se esiste, altrimenti per id DESC
  const ca = (a as any).created_at ?? (a as any).createdAt ?? '';
  const cb = (b as any).created_at ?? (b as any).createdAt ?? '';
  if (ca && cb) return ca > cb ? -1 : ca < cb ? 1 : 0;
  return String(b.id).localeCompare(String(a.id));
}

@Injectable({ providedIn: 'root' })
export class CompetitionStore {

  private readonly _state$ = new BehaviorSubject<State>({ entities: {}, ids: [] });
  private userService = inject(UserService);
  // SELECTORS
  list$ = this._state$.pipe(
    map(s => s.ids.map(id => s.entities[String(id)]))
  );
  size$ = this._state$.pipe(map(s => s.ids.length));

  // SNAPSHOTS
  snapshotList(): ICompetition[] {
    const s = this._state$.getValue();
    return s.ids.map(id => s.entities[String(id)]);
  }
  
  snapshotById(id: Id): ICompetition | undefined {
    return this._state$.getValue().entities[String(id)];
  }

  // COMMANDS
  setList(list: ICompetition[]) {
    const clean = (list ?? []).filter(Boolean);
    // de-dup by id
    const uniqMap: Record<string, ICompetition> = {};
    for (const c of clean) uniqMap[toId(c)] = { ...c };
    const sorted = Object.values(uniqMap).sort(sortIds);
    const ids = sorted.map(c => toId(c));

    this._state$.next({ entities: Object.fromEntries(sorted.map(c => [toId(c), c])), ids });
    console.log('[CompetitionStore] 📋 setList', { count: ids.length });
  }

  addOne(comp: ICompetition) {
    // alias di upsert che mette in testa alla lista
    this.upsertOne(comp, { prepend: true });
  }

  upsertOne(comp: ICompetition, opts?: { prepend?: boolean }) {
    const id = toId(comp);
    const prev = this._state$.getValue();
    const exists = !!prev.entities[id];

    const entities = { ...prev.entities, [id]: { ...(prev.entities[id] ?? {}), ...comp } };

    let ids = prev.ids;
    if (!exists) {
      ids = opts?.prepend ? [id, ...ids] : [...ids, id];
    }
    this._state$.next({ entities, ids });
    console.log('[CompetitionStore] 🔄 upsertOne', { id, exists, total: ids.length });
  }

  updateFields(id: Id, patch: Partial<ICompetition>) {
    const sid = String(id);
    const prev = this._state$.getValue();
    if (!prev.entities[sid]) return;

    const entities = { ...prev.entities, [sid]: { ...prev.entities[sid], ...patch } };
    this._state$.next({ entities, ids: prev.ids });
    console.log('[CompetitionStore] ✏️ updateFields', { id: sid, patch });
  }

  removeOne(id: Id) {
    const sid = String(id);
    const prev = this._state$.getValue();
    if (!prev.entities[sid]) return;

    const { [sid]: _, ...rest } = prev.entities;
    const ids = prev.ids.filter(x => String(x) !== sid);
    this._state$.next({ entities: rest, ids });
    console.log('[CompetitionStore] 🗑️ removeOne', { id: sid, total: ids.length });
  }

  clear() {
    this._state$.next({ entities: {}, ids: [] });
    console.log('[CompetitionStore] 🚪 clear');
  }

}
