import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { SessionService } from './session.service';

/**
 * Ajoute l'identité de l'utilisateur aux appels vers l'API Gateway :
 *  - mode keycloak : Authorization: Bearer <jwt>
 *  - mode local    : X-User-Id / X-User-Name / X-User-Roles (lus par le profil "local" du backend)
 */
export const userHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const user = inject(SessionService).user();
  if (!user || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  if (environment.auth.mode === 'keycloak' && user.token) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${user.token}` } }));
  }
  return next(req.clone({
    setHeaders: {
      'X-User-Id': user.id,
      'X-User-Name': user.displayName,
      'X-User-Roles': user.role,
    },
  }));
};
