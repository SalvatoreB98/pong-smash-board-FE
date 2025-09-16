import { HttpInterceptorFn } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize, shareReplay } from 'rxjs/operators';

const pending = new Map<string, Observable<any>>();

export const preventDuplicateInterceptor: HttpInterceptorFn = (req, next) => {
  const key = req.url + '::' + JSON.stringify(req.body || {});
  if (pending.has(key)) {
    return pending.get(key)!; // ritorno lo stesso observable
  }

  const request$ = next(req).pipe(
    shareReplay(1),           // condividi la risposta con più subscriber
    finalize(() => pending.delete(key))
  );

  pending.set(key, request$);
  return request$;
};
