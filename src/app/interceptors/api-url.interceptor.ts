import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const apiPrefixInterceptor: HttpInterceptorFn = (req, next) => {
  // URL assolute? non toccarle.
  if (/^https?:\/\//i.test(req.url)) {
    return next(req);
  }

  // Prefissa solo le chiamate API relative.
  if (req.url.startsWith('/api')) {
    const base = (environment.apiUrl || '').replace(/\/$/, '');   // niente slash finale
    const path = req.url.replace(/^\//, '');                      // niente slash iniziale
    const url  = base ? `${base}/${path}` : `/${path}`;           // in dev (base vuota) resta relativo
    return next(req.clone({ url }));
  }

  return next(req);
};
