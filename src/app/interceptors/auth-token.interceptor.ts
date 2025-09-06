import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { SupabaseAuthService } from '../../services/supabase-auth.service';
import { LoaderService } from '../../services/loader.service';
import { from, switchMap, tap, finalize } from 'rxjs';
import { findApiConfig } from '../../api/api.config';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'OPTIONS') return next(req);

  const apiCfg = findApiConfig(req.url, req.method);
  if (!apiCfg || !apiCfg.needsAuth) return next(req);

  const sbAuth = inject(SupabaseAuthService);
  const loader = inject(LoaderService);

  loader.startLittleLoader();
 
  return from(sbAuth.getAccessToken()).pipe(
    switchMap(token => {
      const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;
      return next(authReq).pipe(
        tap({
          next: (event) => {
            if (event instanceof HttpResponse) {
              // risposta ok
            }
          },
          error: (error: HttpErrorResponse) => {
            console.error('[authTokenInterceptor] HTTP error', error);
          }
        }),
        finalize(() => {
          loader.stopLittleLoader();
        })
      );
    })
  );
};
