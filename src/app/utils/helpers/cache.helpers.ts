export class CachedFetcher<T> {
  private _data?: T;
  private _loaded = false;
  private _lastLoadedAt = 0;
  private _loadingPromise?: Promise<T>;

  constructor(
    private readonly fetchFn: () => Promise<T>, // funzione che fa la vera chiamata
    private readonly ttlMs: number = 0           // durata cache (0 = infinito finché non forzi)
  ) { }

  async get(force = false): Promise<T> {
    const now = Date.now();

    // cache valida
    if (!force && this._loaded) {
      if (this.ttlMs === 0 || (now - this._lastLoadedAt) < this.ttlMs) {
        return this._data!;
      }
    }

    // dedup delle chiamate
    if (this._loadingPromise) return this._loadingPromise;

    this._loadingPromise = (async () => {
      const res = await this.fetchFn();
      this._data = res;
      this._loaded = true;
      this._lastLoadedAt = Date.now();
      this._loadingPromise = undefined;
      return res;
    })();

    return this._loadingPromise;
  }

  clear() {
    this._loaded = false;
    this._data = undefined;
  }
}
