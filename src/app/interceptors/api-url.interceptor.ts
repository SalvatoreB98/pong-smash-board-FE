import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable()
export class ApiPrefixInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // se è assoluta (http/https), non toccare
    if (/^https?:\/\//i.test(req.url)) return next.handle(req);

    // prefissa solo le rotte API
    if (req.url.startsWith('/api')) {
      const base = (environment.apiUrl || '').replace(/\/$/, '');
      const url  = `${base}/${req.url.replace(/^\//, '')}`;
      return next.handle(req.clone({ url }));
    }
    return next.handle(req);
  }
}
