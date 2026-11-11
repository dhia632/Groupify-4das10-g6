import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { GamificationApi } from '../../core/api/gamification-api.service';
import { BadgeAwardDTO, BadgeDTO, LeaderboardEntryDTO, PlayerDTO, PointTransactionDTO, TeamDashboardDTO } from '../../core/models';
import { SessionService } from '../../core/session.service';
import { ActivityCalendarComponent } from '../../shared/activity-calendar.component';
import { DonutComponent } from '../../shared/charts';
import { MascotComponent } from '../../shared/mascot.component';
import { EmojiPipe } from '../../shared/visuals';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DecimalPipe, DatePipe, MascotComponent, DonutComponent, ActivityCalendarComponent, EmojiPipe],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage {
  private api = inject(GamificationApi);
  session = inject(SessionService);

  today = new Date();
  loading = signal(true);
  player = signal<PlayerDTO | null>(null);
  history = signal<PointTransactionDTO[]>([]);
  myBadges = signal<BadgeAwardDTO[]>([]);
  allBadges = signal<BadgeDTO[]>([]);
  team = signal<TeamDashboardDTO | null>(null);
  board = signal<LeaderboardEntryDTO[]>([]);

  firstName = computed(() => (this.player()?.displayName || this.session.user()?.displayName || '').split(' ')[0]);
  myRank = computed(() => this.board().find((b) => b.teamId === this.team()?.team.id)?.rank ?? null);
  podium = computed(() => {
    const b = this.board();
    return [b[1], b[0], b[2]].filter(Boolean); // 2e, 1er, 3e
  });
  rest = computed(() => this.board().slice(3));
  myShare = computed(() => this.team()?.contributions.find((c) => c.studentId === this.player()?.studentId)?.sharePercent ?? 0);
  pointsToNext = computed(() => {
    const p = this.player();
    return p?.nextLevel ? p.nextLevel.minPoints - p.totalPoints : 0;
  });
  activeDays = computed(() => {
    const now = new Date();
    return [...new Set(this.history()
      .map((h) => new Date(h.createdAt))
      .filter((d) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
      .map((d) => d.getDate()))];
  });
  countOf = (reason: string) => this.history().filter((h) => h.reason === reason).length;

  /** Badge non obtenu le plus proche, avec sa progression. */
  nextBadge = computed(() => {
    const owned = new Set(this.myBadges().map((b) => b.badge.code));
    const p = this.player();
    const candidates = this.allBadges().filter((b) => !owned.has(b.code)).map((b) => {
      const rule = b.rules[0];
      let current = 0;
      if (rule.conditionType === 'STREAK_DAYS') current = p?.currentStreakDays ?? 0;
      else if (rule.conditionType === 'ON_TIME') current = this.team()?.onTimeDeliveries ?? 0;
      else current = this.countOf(rule.triggerEvent);
      const target = rule.conditionType === 'FIRST_OCCURRENCE' ? 1 : rule.threshold;
      return { badge: b, current: Math.min(current, target), target, ratio: Math.min(1, current / target) };
    });
    return candidates.sort((a, b) => b.ratio - a.ratio)[0] ?? null;
  });

  constructor() {
    forkJoin({ player: this.api.me(), history: this.api.history(0, 200), mine: this.api.myBadges(), badges: this.api.badges() })
      .pipe(
        switchMap((r) => {
          this.player.set(r.player);
          this.history.set(r.history.content);
          this.myBadges.set(r.mine);
          this.allBadges.set(r.badges);
          if (!r.player.teamId) return of(null);
          return this.api.teamDashboard(r.player.teamId).pipe(
            switchMap((t) => {
              this.team.set(t);
              return this.api.leaderboard(t.team.courseId);
            }),
          );
        }),
      )
      .subscribe({
        next: (board) => {
          if (board) this.board.set(board);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
