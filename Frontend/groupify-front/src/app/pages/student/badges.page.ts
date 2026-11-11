import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { GamificationApi } from '../../core/api/gamification-api.service';
import { BadgeAwardDTO, BadgeDTO, PlayerDTO, PointTransactionDTO } from '../../core/models';
import { ColumnsComponent } from '../../shared/charts';
import { EmojiPipe, EventLabelPipe } from '../../shared/visuals';

@Component({
  selector: 'app-badges',
  imports: [DatePipe, EmojiPipe, EventLabelPipe, ColumnsComponent],
  template: `
    <div class="page">
      <div class="grid g-4">
        <div class="card yellow"><div class="stat-value">{{ player()?.totalPoints ?? 0 }} XP</div><div class="stat-label">Total de points</div></div>
        <div class="card blue"><div class="stat-value">{{ mine().length }} / {{ all().length }}</div><div class="stat-label">Badges obtenus</div></div>
        <div class="card green"><div class="stat-value">{{ bonus() }} XP</div><div class="stat-label">Bonus de badges</div></div>
        <div class="card pink"><div class="stat-value">{{ history().length }}</div><div class="stat-label">Gains enregistrés</div></div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3><span class="mi">military_tech</span> Mur de badges</h3>
          <div class="tabs">
            @for (c of categories; track c.code) {
              <button [class.active]="cat() === c.code" (click)="cat.set(c.code)">{{ c.label }}</button>
            }
          </div>
        </div>
        <div class="wall">
          @for (b of filtered(); track b.id) {
            <div class="badge-card" [class.locked]="!owned(b.code)">
              <span class="medal">{{ b.code | emoji:'badge' }}</span>
              <strong>{{ b.name }}</strong>
              <span class="small muted">{{ b.description }}</span>
              <div class="row" style="justify-content:center">
                <span class="chip">{{ b.category }}</span>
                <span class="chip orange">+{{ b.rewardPoints }} XP</span>
              </div>
              @if (owned(b.code); as a) {
                <span class="small bold" style="color:var(--green)">✓ Obtenu le {{ a.awardedAt | date:'dd/MM/yyyy' }} {{ a.manual ? '(enseignant)' : '' }}</span>
              } @else {
                <span class="small muted">🔒 {{ ruleText(b) }}</span>
              }
            </div>
          }
        </div>
      </div>

      <div class="grid g-2">
        <div class="card">
          <div class="card-head"><h3><span class="mi">bar_chart</span> Points par semaine</h3></div>
          <app-columns [values]="weekly()" [labels]="['S-3', 'S-2', 'S-1', 'Cette sem.']" color="#f07b1a" />
        </div>
        <div class="card">
          <div class="card-head"><h3><span class="mi">receipt_long</span> Historique des points</h3><span class="card-sub">GET /players/me/points-history</span></div>
          <div class="hist">
            @for (h of history().slice(0, 30); track $index) {
              <div class="hist-row">
                <span class="pts" [class.zero]="h.points === 0">+{{ h.points }}</span>
                <span class="grow">{{ h.reason | eventLabel }}</span>
                <span class="small muted">{{ h.createdAt | date:'dd/MM HH:mm' }}</span>
              </div>
            } @empty { <p class="empty">Aucun point pour l'instant.</p> }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wall{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px}
    .badge-card{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:16px 12px;border:1.6px solid #1e1e1e;border-radius:18px;background:#fffdf7}
    .medal{width:74px;height:74px;border-radius:50%;border:1.6px solid #1e1e1e;background:#fff3cf;display:flex;align-items:center;justify-content:center;font-size:38px;box-shadow:0 3px 0 #1e1e1e}
    .hist{display:flex;flex-direction:column;gap:6px;max-height:300px;overflow:auto}
    .hist-row{display:flex;align-items:center;gap:10px;padding:6px 4px;border-bottom:1px dashed #e0d9cb;font-size:13px}
    .pts{min-width:46px;font-weight:800;color:var(--green)}.pts.zero{color:var(--muted)}
  `],
})
export class BadgesPage {
  private api = inject(GamificationApi);
  player = signal<PlayerDTO | null>(null);
  all = signal<BadgeDTO[]>([]);
  mine = signal<BadgeAwardDTO[]>([]);
  history = signal<PointTransactionDTO[]>([]);
  cat = signal<string>('ALL');
  categories = [
    { code: 'ALL', label: 'Tous' }, { code: 'PARTICIPATION', label: 'Participation' }, { code: 'COOPERATION', label: 'Coopération' },
    { code: 'REGULARITY', label: 'Régularité' }, { code: 'DELIVERY', label: 'Livraison' },
  ];

  filtered = computed(() => this.all().filter((b) => this.cat() === 'ALL' || b.category === this.cat()));
  bonus = computed(() => this.history().filter((h) => h.reason === 'BADGE_REWARD').reduce((s, h) => s + h.points, 0));
  weekly = computed(() => [3, 2, 1, 0].map((w) => this.history()
    .filter((h) => Math.floor((Date.now() - new Date(h.createdAt).getTime()) / (7 * 864e5)) === w)
    .reduce((s, h) => s + h.points, 0)));

  constructor() {
    this.api.me().subscribe((p) => this.player.set(p));
    this.api.badges().subscribe((b) => this.all.set(b));
    this.api.myBadges().subscribe((b) => this.mine.set(b));
    this.api.history(0, 200).subscribe((h) => this.history.set(h.content));
  }

  owned(code: string) { return this.mine().find((m) => m.badge.code === code) ?? null; }

  ruleText(b: BadgeDTO) {
    const r = b.rules[0];
    if (!r) return '';
    const who = r.scope === 'TEAM' ? "l'équipe" : 'toi';
    switch (r.conditionType) {
      case 'FIRST_OCCURRENCE': return `Première fois pour ${who}`;
      case 'COUNT_THRESHOLD': return `${r.threshold} fois pour ${who}`;
      case 'STREAK_DAYS': return `${r.threshold} jours d'affilée`;
      case 'ON_TIME': return `${r.threshold} livrable(s) à temps`;
    }
  }
}
