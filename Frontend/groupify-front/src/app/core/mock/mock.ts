import { HttpErrorResponse } from '@angular/common/http';
import { Observable, defer, delay, of, throwError } from 'rxjs';

/** Réponse simulée : même forme qu'un appel HTTP, avec une petite latence réaliste. */
export function mock<T>(fn: () => T, latency = 250): Observable<T> {
  return defer(() => {
    try {
      return of(fn());
    } catch (e: any) {
      return throwError(() => e);
    }
  }).pipe(delay(latency));
}

/** Erreur simulée au format du backend (ApiError). */
export function apiError(status: number, message: string): never {
  throw new HttpErrorResponse({ status, error: { status, message }, statusText: message });
}
