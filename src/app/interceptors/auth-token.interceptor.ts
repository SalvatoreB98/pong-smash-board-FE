// auth-token.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SupabaseAuthService } from '../../services/supabase-auth.service';
import { from, switchMap } from 'rxjs';
import { findApiConfig } from '../../api/api.config';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'OPTIONS') return next(req);

  const apiCfg = findApiConfig(req.url, req.method);
  if (!apiCfg || !apiCfg.needsAuth) return next(req);

  const sbAuth = inject(SupabaseAuthService);
  return from(sbAuth.getAccessToken()).pipe(
    switchMap(token => {
      const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;
      return next(authReq); 
    })
  );
};
