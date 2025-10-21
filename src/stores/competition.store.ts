// competition.store.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ICompetition } from '../api/competition.api';

type Id = number | string;
type State = {
  entities: Record<string, ICompetition>;
  ids: Id[];
  activeId: Id | null;
};

function toId(c: ICompetition): string {
  return String(c?.id) || '';
}

function sortIds(a: ICompetition, b: ICompetition): number {
  // Prova a ordinare per created DESC se esiste, altrimenti per id DESC
  const ca = (a as any).created ?? (a as any).createdAt ?? '';
  const cb = (b as any).created ?? (b as any).createdAt ?? '';
  if (ca && cb) return ca > cb ? -1 : ca < cb ? 1 : 0;
  return String(b.id).localeCompare(String(a.id));
}

@Injectable({ providedIn: 'root' })
export class CompetitionStore {
  private readonly _state$ = new BehaviorSubject<State>({
    entities: {},
    ids: [],
    activeId: null,
  });

  // ---------- SELECTORS ----------
  list$ = this._state$.pipe(
    map(s => s.ids.map(id => s.entities[String(id)]))
  );
  size$ = this._state$.pipe(map(s => s.ids.length));

  activeCompetition$ = this._state$.pipe(
    map(s => {
      console.log('[CompetitionStore] ⭐ activeCompetition$ recomputed', s.activeId ? s.entities[String(s.activeId)] ?? null : null);
      return (s.activeId ? s.entities[String(s.activeId)] ?? null : null)
    })
  );

  // ---------- SNAPSHOTS ----------
  snapshotList(): ICompetition[] {
    const s = this._state$.getValue();
    return s.ids.map(id => s.entities[String(id)]);
  }

  snapshotById(id: Id): ICompetition | undefined {
    return this._state$.getValue().entities[String(id)];
  }

  snapshotActive(): ICompetition | null {
    const s = this._state$.getValue();
    return s.activeId ? s.entities[String(s.activeId)] ?? null : null;
  }

  // ---------- COMMANDS ----------
  setList(list: ICompetition[]) {
    const clean = (list ?? []).filter(Boolean);
    // de-dup by id
    const uniqMap: Record<string, ICompetition> = {};
    for (const c of clean) uniqMap[toId(c)] = { ...c };
    const sorted = Object.values(uniqMap).sort(sortIds);
    const ids = sorted.map(c => toId(c));

    const prev = this._state$.getValue();
    this._state$.next({
      entities: Object.fromEntries(sorted.map(c => [toId(c), c])),
      ids,
      activeId: prev.activeId, // non resettare l'attivo
    });
    console.log('[CompetitionStore] 📋 setList', { count: ids.length });
  }

  addOne(comp: ICompetition) {
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

    this._state$.next({ entities, ids, activeId: prev.activeId });
    console.log('[CompetitionStore] 🔄 upsertOne', { id, exists, total: ids.length });
  }

  updateFields(id: Id, patch: Partial<ICompetition>) {
    const sid = String(id);
    const prev = this._state$.getValue();
    if (!prev.entities[sid]) return;

    const entities = { ...prev.entities, [sid]: { ...prev.entities[sid], ...patch } };
    this._state$.next({ entities, ids: prev.ids, activeId: prev.activeId });
    console.log('[CompetitionStore] ✏️ updateFields', { id: sid, patch });
  }

  setActive(id: Id | null) {
    const prev = this._state$.getValue();
    this._state$.next({ ...prev, activeId: id ? String(id) : null });
    console.log('[CompetitionStore] ⭐ setActive', { id });
  }

  removeOne(id: Id) {
    const sid = String(id);
    const prev = this._state$.getValue();
    if (!prev.entities[sid]) return;

    const { [sid]: _, ...rest } = prev.entities;
    const ids = prev.ids.filter(x => String(x) !== sid);
    const activeId = prev.activeId === sid ? null : prev.activeId;

    this._state$.next({ entities: rest, ids, activeId });
    console.log('[CompetitionStore] 🗑️ removeOne', { id: sid, total: ids.length });
  }

  clear() {
    this._state$.next({ entities: {}, ids: [], activeId: null });
    console.log('[CompetitionStore] 🚪 clear');
  }
}
