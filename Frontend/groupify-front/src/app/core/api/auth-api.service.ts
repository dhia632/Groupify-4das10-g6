import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiError, mock } from '../mock/mock';
import { MockDb } from '../mock/mock-db';
import { RegisterRequest, Role, UserAccount } from '../models';

/** Auth Service – /api/auth, /api/users, /api/departments */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private http = inject(HttpClient);
  private db = inject(MockDb);
  private base = environment.apiUrl + '/api';
  private useMock = environment.mocks.auth;

  register(req: RegisterRequest): Observable<UserAccount> {
    if (!this.useMock) return this.http.post<UserAccount>(`${this.base}/auth/register`, req);
    return mock(() => {
      if (this.db.users.some((u) => u.username === req.username || u.email === req.email)) apiError(409, 'Nom d\'utilisateur ou e-mail déjà utilisé');
      const user: UserAccount = {
        id: req.username, username: req.username, email: req.email, firstName: req.firstName, lastName: req.lastName,
        role: req.role, status: 'ACTIVE', department: 'Informatique', promotion: '4DAS', createdAt: new Date().toISOString(),
      };
      this.db.users.push(user);
      if (req.role === 'STUDENT') {
        // événement user.registered -> le Profiling Service crée un profil vide
        this.db.profiles.push({
          studentId: user.id, displayName: `${user.firstName} ${user.lastName}`, gpa: 0, status: 'INCOMPLETE', completionRate: 0,
          skills: { PROGRAMMING: 3, DESIGN: 3, WRITING: 3, PROJECT_MANAGEMENT: 3, PUBLIC_SPEAKING: 3 },
          learningStyle: { activeReflective: 0, sensingIntuitive: 0, visualVerbal: 0, sequentialGlobal: 0 },
          interests: [], availability: [], updatedAt: new Date().toISOString(),
        });
      }
      return user;
    });
  }

  users(role?: Role): Observable<UserAccount[]> {
    if (!this.useMock) return this.http.get<UserAccount[]>(`${this.base}/users`, { params: role ? { role } : {} });
    return mock(() => this.db.users.filter((u) => !role || u.role === role));
  }

  user(id: string): Observable<UserAccount> {
    if (!this.useMock) return this.http.get<UserAccount>(`${this.base}/users/${id}`);
    return mock(() => this.db.user(id) ?? apiError(404, 'Compte introuvable'));
  }

  changeRole(id: string, role: Role): Observable<UserAccount> {
    if (!this.useMock) return this.http.patch<UserAccount>(`${this.base}/users/${id}/role`, { role });
    return mock(() => {
      const u = this.db.user(id) ?? apiError(404, 'Compte introuvable');
      u.role = role;
      return u;
    });
  }

  changeStatus(id: string, status: UserAccount['status']): Observable<UserAccount> {
    if (!this.useMock) return this.http.patch<UserAccount>(`${this.base}/users/${id}/status`, { status });
    return mock(() => {
      const u = this.db.user(id) ?? apiError(404, 'Compte introuvable');
      u.status = status;
      return u;
    });
  }
}
