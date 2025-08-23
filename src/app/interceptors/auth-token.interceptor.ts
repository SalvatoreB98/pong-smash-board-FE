import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SupabaseAuthService } from '../../services/supabase-auth.service';
import { from, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const isApi = req.url.startsWith('/api') || req.url.startsWith(environment.apiUrl);
  if (!isApi) return next(req);

  const sbAuth = inject(SupabaseAuthService);
  return from(sbAuth.getAccessToken()).pipe(
    switchMap(token => {
      const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
      return next(authReq);
    })
  );
};
