import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiError, mock } from '../mock/mock';
import { MockDb } from '../mock/mock-db';
import {
  AvatarDTO, BadgeAwardDTO, BadgeDTO, BadgeRequest, EmblemDTO, EngagementDTO, KudosDTO, LeaderboardEntryDTO, LevelDTO,
  Page, PlayerDTO, PointTransactionDTO, TeamDashboardDTO, TeamDTO,
} from '../models';
import { SessionService } from '../session.service';
import { ToastService } from '../toast.service';

/**
 * Gamification Service – /api/gamification (backend réel, via l'API Gateway).
 * Si la Gateway ou le service ne répondent pas (erreur réseau ou 5xx), le front bascule
 * automatiquement sur les données de démonstration pour que l'interface reste utilisable.
 * Les erreurs métier (400, 403, 404, 409, 429) sont, elles, affichées telles quelles.
 */
@Injectable({ providedIn: 'root' })
export class GamificationApi {
  private http = inject(HttpClient);
  private db = inject(MockDb);
  private session = inject(SessionService);
  private toast = inject(ToastService);
  private base = environment.apiUrl + '/api/gamification';

  /** true quand les données affichées viennent de la démo (backend injoignable). */
  readonly demoMode = signal(environment.mocks.gamification);

  private me_() { return this.session.user()!.id; }

  private call<T>(real: () => Observable<T>, fake: () => T, latency = 250): Observable<T> {
    if (this.demoMode()) return mock(fake, latency);
    return real().pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 0 || err.status >= 500) {
          if (!this.demoMode()) {
            this.demoMode.set(true);
            this.toast.info('Gamification Service injoignable : affichage des données de démonstration');
          }
          return mock(fake, 0);
        }
        return throwError(() => err);
      }),
    );
  }

  /** Repasser en mode réel (bouton "Réessayer"). */
  retryBackend() { this.demoMode.set(false); }

  // ---------------------------------------------------------------- joueur
  me(): Observable<PlayerDTO> {
    return this.call(() => this.http.get<PlayerDTO>(`${this.base}/players/me`), () => this.db.playerDto(this.me_()));
  }

  player(studentId: string): Observable<PlayerDTO> {
    return this.call(() => this.http.get<PlayerDTO>(`${this.base}/players/${studentId}`),
      () => (this.db.user(studentId) ? this.db.playerDto(studentId) : apiError(404, `Aucun profil de jeu pour l'étudiant ${studentId}`)));
  }

  myBadges(): Observable<BadgeAwardDTO[]> {
    return this.call(() => this.http.get<BadgeAwardDTO[]>(`${this.base}/players/me/badges`), () => this.db.myBadges(this.me_()));
  }

  history(page = 0, size = 100): Observable<Page<PointTransactionDTO>> {
    return this.call(
      () => this.http.get<Page<PointTransactionDTO>>(`${this.base}/players/me/points-history`, { params: { page, size } }),
      () => {
        const all = this.db.historyOf(this.me_());
        return { content: all.slice(page * size, (page + 1) * size), page: { size, number: page, totalElements: all.length, totalPages: Math.ceil(all.length / size) } };
      });
  }

  chooseAvatar(avatarId: number): Observable<PlayerDTO> {
    return this.call(() => this.http.put<PlayerDTO>(`${this.base}/players/me/avatar`, { avatarId }), () => {
      const avatar = this.db.avatars.find((a) => a.id === avatarId) ?? apiError(404, 'Avatar introuvable');
      const p = this.db.playerDto(this.me_());
      if (p.level.rank < avatar.requiredLevel) apiError(403, `Avatar verrouillé : niveau ${avatar.requiredLevel} requis`);
      this.db.playerAvatar[this.me_()] = avatarId;
      return this.db.playerDto(this.me_());
    });
  }

  // ---------------------------------------------------------------- catalogues
  avatars(): Observable<AvatarDTO[]> {
    return this.call(() => this.http.get<AvatarDTO[]>(`${this.base}/avatars`), () => this.db.avatars);
  }
  emblems(): Observable<EmblemDTO[]> {
    return this.call(() => this.http.get<EmblemDTO[]>(`${this.base}/emblems`), () => this.db.emblems);
  }
  levels(): Observable<LevelDTO[]> {
    return this.call(() => this.http.get<LevelDTO[]>(`${this.base}/levels`), () => this.db.levels);
  }

  // ---------------------------------------------------------------- badges
  badges(): Observable<BadgeDTO[]> {
    return this.call(() => this.http.get<BadgeDTO[]>(`${this.base}/badges`), () => this.db.badges.filter((b) => b.active));
  }

  createBadge(req: BadgeRequest): Observable<BadgeDTO> {
    return this.call(() => this.http.post<BadgeDTO>(`${this.base}/badges`, req), () => {
      if (this.db.badges.some((b) => b.code === req.code)) apiError(409, `Un badge avec le code ${req.code} existe déjà`);
      const b: BadgeDTO = { ...req, id: Math.max(...this.db.badges.map((x) => x.id)) + 1, active: true };
      this.db.badges.push(b);
      return b;
    });
  }

  updateBadge(id: number, req: BadgeRequest): Observable<BadgeDTO> {
    return this.call(() => this.http.put<BadgeDTO>(`${this.base}/badges/${id}`, req), () => {
      const b = this.db.badges.find((x) => x.id === id) ?? apiError(404, 'Badge introuvable');
      Object.assign(b, req);
      return b;
    });
  }

  deleteBadge(id: number): Observable<void> {
    return this.call(() => this.http.delete<void>(`${this.base}/badges/${id}`), () => {
      const b = this.db.badges.find((x) => x.id === id) ?? apiError(404, 'Badge introuvable');
      b.active = false;
    });
  }

  awardManually(studentId: string, badgeId: number): Observable<BadgeAwardDTO> {
    return this.call(() => this.http.post<BadgeAwardDTO>(`${this.base}/players/${studentId}/badges/${badgeId}`, {}), () => {
      if (!this.db.user(studentId)) apiError(404, `Aucun profil de jeu pour l'étudiant ${studentId}`);
      const badge = this.db.badges.find((b) => b.id === badgeId) ?? apiError(404, 'Badge introuvable');
      if (!this.db.award(studentId, badgeId, new Date(), true)) apiError(409, 'L\'étudiant possède déjà ce badge');
      return { badge, awardedAt: new Date().toISOString(), manual: true };
    });
  }

  // ---------------------------------------------------------------- équipes
  team(teamId: number): Observable<TeamDTO> {
    return this.call(() => this.http.get<TeamDTO>(`${this.base}/teams/${teamId}`), () => this.db.teamDto(teamId));
  }

  teamDashboard(teamId: number): Observable<TeamDashboardDTO> {
    return this.call(() => this.http.get<TeamDashboardDTO>(`${this.base}/teams/${teamId}/dashboard`), () => this.db.teamDashboard(teamId));
  }

  updateIdentity(teamId: number, name: string, emblemId: number | null): Observable<TeamDTO> {
    return this.call(() => this.http.patch<TeamDTO>(`${this.base}/teams/${teamId}/identity`, { name, emblemId }), () => {
      const team = this.db.teamDto(teamId);
      if (!team.memberIds.includes(this.me_())) apiError(403, 'Seuls les membres de l\'équipe peuvent modifier son identité');
      const taken = this.db.leaderboard(team.courseId).some((t) => t.teamId !== teamId && t.name.toLowerCase() === name.trim().toLowerCase());
      if (taken) apiError(409, `Le nom '${name}' est déjà utilisé dans ce module`);
      this.db.teamNameOverride[teamId] = name.trim();
      if (emblemId) this.db.teamEmblem[teamId] = emblemId;
      return this.db.teamDto(teamId);
    });
  }

  leaderboard(courseId: number): Observable<LeaderboardEntryDTO[]> {
    return this.call(() => this.http.get<LeaderboardEntryDTO[]>(`${this.base}/courses/${courseId}/leaderboard`), () => this.db.leaderboard(courseId));
  }

  engagement(courseId: number): Observable<EngagementDTO> {
    return this.call(() => this.http.get<EngagementDTO>(`${this.base}/courses/${courseId}/engagement`), () => {
      const board = this.db.leaderboard(courseId);
      return {
        courseId, teamsCount: board.length, playersCount: board.length * 4, activePlayersLast7Days: Math.round(board.length * 3.2),
        averageTeamPoints: Math.round(board.reduce((s, b) => s + b.totalPoints, 0) / Math.max(1, board.length)),
        badgesAwarded: this.db.awards.length,
      };
    });
  }

  // ---------------------------------------------------------------- kudos
  sendKudos(toStudentId: string, message: string): Observable<KudosDTO> {
    return this.call(() => this.http.post<KudosDTO>(`${this.base}/kudos`, { toStudentId, message }), () => {
      const me = this.me_();
      if (me === toStudentId) apiError(400, 'Impossible de s\'envoyer un kudos à soi-même');
      const team = this.db.teamOf(me);
      if (!team || !team.memberIds.includes(toStudentId)) apiError(403, 'Un kudos ne peut être envoyé qu\'à un membre de votre équipe');
      const week = this.db.kudos.filter((k) => k.fromStudentId === me && Date.now() - new Date(k.createdAt).getTime() < 7 * 864e5).length;
      if (week >= 3) apiError(429, 'Quota atteint : 3 kudos par semaine');
      const k: KudosDTO = {
        id: this.db.kudos.length + 1, fromStudentId: me, fromName: this.db.name(me), toStudentId, toName: this.db.name(toStudentId),
        message, createdAt: new Date().toISOString(),
      };
      this.db.kudos.push(k);
      this.db.credit(toStudentId, team.id, 5, 'KUDOS_RECEIVED', `kudos:${k.id}`);
      return k;
    });
  }

  teamKudos(teamId: number): Observable<KudosDTO[]> {
    return this.call(() => this.http.get<KudosDTO[]>(`${this.base}/teams/${teamId}/kudos`), () => {
      const members = this.db.teamDto(teamId).memberIds;
      return this.db.kudos.filter((k) => members.includes(k.toStudentId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
  }
}
