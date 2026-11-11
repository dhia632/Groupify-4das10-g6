import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsApi } from '../../core/api/analytics-api.service';
import { CourseGroupApi } from '../../core/api/course-group-api.service';
import { MockDb } from '../../core/mock/mock-db';
import { Course, CourseEngagement } from '../../core/models';
import { SessionService } from '../../core/session.service';
import { HBarsComponent } from '../../shared/charts';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-teacher-home',
  imports: [RouterLink, DatePipe, MascotComponent, HBarsComponent],
  template: `
    <div class="page">
      <div class="row wrap">
        <h1>Bonjour {{ first() }} !</h1>
        <app-mascot [size]="58" />
        <div class="speech">{{ incomplete() }} profils sont encore incomplets : pensez à relancer vos étudiants avant la constitution.</div>
      </div>

      <div class="grid g-4">
        <div class="card yellow"><div class="stat-value">{{ courses().length }}</div><div class="stat-label">Modules</div><span class="corner">📚</span></div>
        <div class="card blue"><div class="stat-value">{{ students() }}</div><div class="stat-label">Étudiants inscrits</div><span class="corner">🎓</span></div>
        <div class="card green"><div class="stat-value">{{ publishedGroups() }}</div><div class="stat-label">Groupes publiés</div><span class="corner">👥</span></div>
        <div class="card pink"><div class="stat-value">{{ incomplete() }}</div><div class="stat-label">Profils incomplets</div><span class="corner">⏳</span></div>
      </div>

      <div class="grid g-3">
        <div class="card span-2">
          <div class="card-head"><h3><span class="mi">school</span> Mes modules</h3><a routerLink="/app/courses" class="btn sm">Tout voir</a></div>
          <div class="col">
            @for (c of courses(); track c.id) {
              <a class="course-row" [routerLink]="['/app/courses', c.id]">
                <span class="code">{{ c.code }}</span>
                <div class="grow"><b>{{ c.title }}</b><div class="small muted">{{ c.className }} · {{ c.enrolledIds.length }} étudiants</div></div>
                <span class="mi">chevron_right</span>
              </a>
            }
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3><span class="mi">bolt</span> Actions rapides</h3></div>
          <div class="col">
            <a routerLink="/app/grouping/1" class="btn primary"><span class="mi">auto_awesome</span> Constituer des groupes</a>
            <a routerLink="/app/imports" class="btn"><span class="mi">upload_file</span> Importer des profils</a>
            <a routerLink="/app/clustering" class="btn"><span class="mi">hub</span> Laboratoire ML</a>
            <a routerLink="/app/badges-admin" class="btn"><span class="mi">military_tech</span> Attribuer un badge</a>
          </div>
        </div>
      </div>

      @if (eng(); as e) {
        <div class="grid g-2">
          <div class="card">
            <div class="card-head"><h3><span class="mi">insights</span> Engagement des équipes · AWD</h3><a routerLink="/app/analytics" class="btn sm">Analytics</a></div>
            <app-hbars [items]="engBars()" unit=" %" [max]="100" />
          </div>
          <div class="card">
            <div class="card-head"><h3><span class="mi">history</span> Activité récente</h3></div>
            <div class="col">
              @for (c of recent(); track c.id) {
                <div class="row small"><span class="chip">{{ c.type }}</span><span class="grow">{{ nameOf(c.studentId) }} · {{ c.description }}</span><span class="muted">{{ c.recordedAt | date:'dd/MM HH:mm' }}</span></div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .corner{position:absolute;right:14px;bottom:10px;font-size:34px}
    .course-row{display:flex;align-items:center;gap:14px;padding:12px 14px;border:1.6px solid #1e1e1e;border-radius:14px}
    .course-row:hover{background:#fff3cf}
    .code{width:52px;height:52px;border-radius:14px;border:1.6px solid #1e1e1e;background:#fde3c8;display:flex;align-items:center;justify-content:center;font-weight:800}
  `],
})
export class TeacherHomePage {
  private api = inject(CourseGroupApi);
  private analytics = inject(AnalyticsApi);
  private db = inject(MockDb);
  private session = inject(SessionService);
  courses = signal<Course[]>([]);
  eng = signal<CourseEngagement | null>(null);
  first = computed(() => this.session.user()?.displayName.split(' ')[0]);
  students = computed(() => new Set(this.courses().flatMap((c) => c.enrolledIds)).size);
  incomplete = computed(() => [...new Set(this.courses().flatMap((c) => c.enrolledIds))].filter((id) => this.db.profile(id)?.status !== 'COMPLETE').length);
  publishedGroups = computed(() => this.db.groups.filter((g) => g.status === 'PUBLISHED').length);
  engBars = computed(() => (this.eng()?.teams ?? []).map((t) => ({ label: t.name, value: t.activeRate, color: '#1b998b' })));
  recent = computed(() => [...this.db.contributions].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)).slice(0, 6));

  constructor() {
    this.api.courses().subscribe((c) => this.courses.set(c));
    this.analytics.engagement(1).subscribe((e) => this.eng.set(e));
  }
  nameOf(id: string) { return this.db.name(id); }
}
