import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { MockDb } from './mock/mock-db';
import { Role, SessionUser } from './models';

const STORAGE_KEY = 'groupify.session';

/**
 * Utilisateur connecté.
 *  - mode "local"    : connexion de démonstration (mot de passe = nom d'utilisateur, comme le realm Keycloak de test) ;
 *                      l'identité est transmise au backend par les en-têtes X-User-* (profil "local").
 *  - mode "keycloak" : jeton obtenu auprès de Keycloak (client angular-frontend), envoyé en Bearer.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private db = inject(MockDb);

  readonly user = signal<SessionUser | null>(this.restore());
  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly role = computed<Role | null>(() => this.user()?.role ?? null);

  login(username: string, password: string): Observable<SessionUser> {
    if (environment.auth.mode === 'keycloak') {
      const url = `${environment.auth.keycloakUrl}/realms/${environment.auth.realm}/protocol/openid-connect/token`;
      const body = new HttpParams()
        .set('grant_type', 'password')
        .set('client_id', environment.auth.clientId)
        .set('username', username)
        .set('password', password);
      return this.http.post<{ access_token: string }>(url, body).pipe(map((res) => this.fromToken(res.access_token)), map((u) => this.store(u)));
    }
    const account = this.db.users.find((u) => u.username === username.trim().toLowerCase());
    if (!account || password !== account.username) {
      return throwError(() => new Error('Identifiants invalides (démo : le mot de passe est le nom d\'utilisateur)'));
    }
    if (account.status === 'DISABLED') return throwError(() => new Error('Compte désactivé'));
    return of(this.store({ id: account.id, username: account.username, displayName: `${account.firstName} ${account.lastName}`, role: account.role }));
  }

  loginAs(username: string) {
    return this.login(username, username);
  }

  logout() {
    localStorage.removeItem(STORAGE_KEY);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  homeFor(role: Role | null): string {
    return role === 'TEACHER' ? '/app/teacher' : role === 'ADMIN' ? '/app/admin/users' : '/app/dashboard';
  }

  private store(u: SessionUser): SessionUser {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    this.user.set(u);
    return u;
  }

  private restore(): SessionUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  }

  private fromToken(token: string): SessionUser {
    const payload = JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))));
    const roles: string[] = payload?.realm_access?.roles ?? [];
    const role: Role = roles.includes('ADMIN') ? 'ADMIN' : roles.includes('TEACHER') ? 'TEACHER' : 'STUDENT';
    return { id: payload.sub, username: payload.preferred_username, displayName: payload.name ?? payload.preferred_username, role, token };
  }
}
