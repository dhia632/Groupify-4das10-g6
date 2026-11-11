import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnalyticsApi } from '../../core/api/analytics-api.service';
import { CourseGroupApi } from '../../core/api/course-group-api.service';
import { GamificationApi } from '../../core/api/gamification-api.service';
import { BalanceReport, Course, CourseEngagement, EngagementDTO } from '../../core/models';
import { ColumnsComponent, DonutComponent, HBarsComponent } from '../../shared/charts';

@Component({
  selector: 'app-analytics',
  imports: [FormsModule, DatePipe, DecimalPipe, HBarsComponent, DonutComponent, ColumnsComponent],
  template: `
    <div class="page">
      <div class="page-title">
        <div><h1>Analytics</h1><p>Analytics Service · équilibre des groupes et engagement des équipes</p></div>
        <select class="input" style="width:280px" [ngModel]="courseId()" (ngModelChange)="load($event)">
          @for (c of courses(); track c.id) { <option [ngValue]="c.id">{{ c.code }} · {{ c.title }}</option> }
        </select>
      </div>

      @if (balance(); as b) {
        <div class="grid g-4">
          <div class="card green">
            <div class="stat-value">{{ b.gpaStdDev | number:'1.2-2' }}</div>
            <div class="stat-label">Écart-type des GPA (hasard : {{ b.randomBaselineGpaStdDev | number:'1.2-2' }})</div>
          </div>
          <div class="card blue"><div class="stat-value">{{ b.skillCoverage }} %</div><div class="stat-label">Couverture des compétences</div></div>
          <div class="card purple"><div class="stat-value">{{ b.diversityIndex * 100 | number:'1.0-0' }} %</div><div class="stat-label">Diversité des profils</div></div>
          <div class="card yellow"><div class="stat-value">{{ gEng()?.badgesAwarded ?? '–' }}</div><div class="stat-label">Badges attribués (Gamification)</div></div>
        </div>

        <div class="grid g-2">
          <div class="card">
            <div class="card-head"><h3><span class="mi">balance</span> GPA moyen par groupe</h3><span class="card-sub">Calculé le {{ b.computedAt | date:'dd/MM HH:mm' }}</span></div>
            <app-hbars [items]="gpaBars()" [max]="20" />
          </div>
          <div class="card">
            <div class="card-head"><h3><span class="mi">construction</span> Couverture des compétences</h3></div>
            <app-hbars [items]="coverageBars()" [max]="100" unit=" %" />
          </div>
        </div>
      } @else if (error()) {
        <div class="card empty">{{ error() }}</div>
      }

      @if (eng(); as e) {
        <div class="grid g-3">
          <div class="card center">
            <div class="card-head"><h3>Étudiants actifs (7 j)</h3></div>
            <app-donut [value]="e.activeRate" [size]="150" color="#1b998b" />
            <p class="small muted mt-s">{{ e.contributionsLast7Days }} contributions cette semaine</p>
          </div>
          <div class="card center">
            <div class="card-head"><h3>Livrables à temps</h3></div>
            <app-donut [value]="e.deliverablesOnTimeRate" [size]="150" color="#2f9e5b" />
            <p class="small muted mt-s">Dernière échéance</p>
          </div>
          <div class="card">
            <div class="card-head"><h3>Points gagnés par semaine</h3></div>
            <app-columns [values]="weeklyTotal()" [labels]="['S-3', 'S-2', 'S-1', 'Cette sem.']" color="#ffd45e" />
          </div>
        </div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Équipe</th><th>Points</th><th>Badges</th><th>Membres actifs</th><th>Évolution (4 semaines)</th></tr></thead>
            <tbody>
              @for (t of e.teams; track t.teamId) {
                <tr>
                  <td><b>{{ t.name }}</b></td>
                  <td>{{ t.points }} XP</td>
                  <td>{{ t.badges }}</td>
                  <td><div class="row"><div class="bar teal" style="width:120px"><span [style.width.%]="t.activeRate"></span></div><span class="small">{{ t.activeRate }} %</span></div></td>
                  <td>
                    <div class="spark">
                      @for (w of t.weekly; track $index) { <span [style.height.%]="spark(w, t.weekly)"></span> }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .spark{display:flex;align-items:flex-end;gap:4px;height:32px}
    .spark span{width:14px;background:var(--orange);border:1.2px solid #1e1e1e;border-radius:4px 4px 2px 2px;min-height:3px}
  `],
})
export class AnalyticsPage {
  private api = inject(AnalyticsApi);
  private coursesApi = inject(CourseGroupApi);
  private gami = inject(GamificationApi);
  courses = signal<Course[]>([]);
  courseId = signal(1);
  balance = signal<BalanceReport | null>(null);
  eng = signal<CourseEngagement | null>(null);
  gEng = signal<EngagementDTO | null>(null);
  error = signal<string | null>(null);
  gpaBars = computed(() => (this.balance()?.groups ?? []).map((g) => ({ label: g.name, value: g.avgGpa, color: '#2f9e5b' })));
  coverageBars = computed(() => (this.balance()?.groups ?? []).map((g) => ({ label: g.name, value: g.skillCoverage, color: '#3b82f6' })));
  weeklyTotal = computed(() => [0, 1, 2, 3].map((i) => (this.eng()?.teams ?? []).reduce((s, t) => s + (t.weekly[i] ?? 0), 0)));

  constructor() {
    this.coursesApi.courses().subscribe((c) => this.courses.set(c));
    this.load(1);
  }

  load(id: number) {
    this.courseId.set(id);
    this.error.set(null);
    this.balance.set(null);
    this.api.balance(id).subscribe({ next: (b) => this.balance.set(b), error: (e) => this.error.set(e?.error?.message ?? 'Indicateurs indisponibles') });
    this.api.engagement(id).subscribe((e) => this.eng.set(e.teams.length ? e : null));
    this.gami.engagement(id).subscribe({ next: (g) => this.gEng.set(g), error: () => this.gEng.set(null) });
  }

  spark(v: number, all: number[]) { return Math.max(8, (v / Math.max(1, ...all)) * 100); }
}
