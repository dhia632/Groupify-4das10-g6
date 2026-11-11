import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GamificationApi } from '../../core/api/gamification-api.service';
import { ProfilingApi } from '../../core/api/profiling-api.service';
import { PlayerDTO, SKILL_LABELS, SkillType, StudentProfile } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { RadarComponent } from '../../shared/charts';
import { EmojiPipe, InitialsPipe } from '../../shared/visuals';
import { STYLE_AXES } from '../student/profile.page';

@Component({
  selector: 'app-students',
  imports: [FormsModule, DecimalPipe, RadarComponent, InitialsPipe, EmojiPipe],
  template: `
    <div class="page">
      <div class="page-title">
        <div><h1>Profils étudiants</h1><p>Profiling Service · GET /api/profiles/{{ '{' }}studentId{{ '}' }} (enseignant)</p></div>
        <div class="row">
          <input class="input" style="width:240px" placeholder="Rechercher un étudiant" [(ngModel)]="query" (ngModelChange)="q.set($event)" />
          <div class="tabs">
            <button [class.active]="filter() === 'ALL'" (click)="filter.set('ALL')">Tous</button>
            <button [class.active]="filter() === 'INCOMPLETE'" (click)="filter.set('INCOMPLETE')">Incomplets</button>
          </div>
        </div>
      </div>

      <div class="layout">
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>Étudiant</th><th>GPA</th><th>Point fort</th><th>Profil</th></tr></thead>
            <tbody>
              @for (p of list(); track p.studentId) {
                <tr class="clickable" [class.active]="selected()?.studentId === p.studentId" (click)="select(p)">
                  <td><div class="row"><span class="emoji-avatar" style="width:32px;height:32px;font-size:12px;font-weight:700">{{ p.displayName | initials }}</span><b>{{ p.displayName }}</b></div></td>
                  <td>{{ p.gpa | number:'1.1-1' }}</td>
                  <td><span class="chip">{{ labels[best(p)] }}</span></td>
                  <td>
                    @if (p.status === 'COMPLETE') { <span class="chip green">Complet</span> }
                    @else { <span class="chip pink">{{ p.completionRate }} %</span> }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="card detail">
          @if (selected(); as s) {
            <div class="row">
              <span class="emoji-avatar lg">{{ player()?.avatar?.code | emoji:'avatar' }}</span>
              <div class="grow"><h2>{{ s.displayName }}</h2><span class="small muted">{{ s.studentId }} · GPA {{ s.gpa | number:'1.1-1' }}</span></div>
            </div>
            @if (player(); as pl) {
              <div class="row wrap mt-s">
                <span class="chip yellow">{{ pl.totalPoints }} XP</span>
                <span class="chip blue">{{ pl.level.name }}</span>
                <span class="chip">🏅 {{ pl.badgesCount }} badges</span>
              </div>
            }
            <div class="center mt"><app-radar [axes]="axes" [series]="series()" [size]="220" /></div>
            <div class="small bold mt">Ajuster les compétences (enseignant)</div>
            @for (k of skills; track k) {
              <div class="row small">
                <span style="width:130px">{{ labels[k] }}</span>
                <input type="range" min="1" max="5" [(ngModel)]="edit[k]" (ngModelChange)="v.set(v() + 1)" />
                <b style="width:20px">{{ edit[k] }}</b>
              </div>
            }
            <button class="btn primary sm mt-s" (click)="saveSkills(s)">Enregistrer l'ajustement</button>
            <div class="dashed-h"></div>
            <div class="small bold">Styles d'apprentissage</div>
            @for (a of styleAxes; track a.key) {
              <div class="row small mt-s"><span style="width:80px">{{ a.left }}</span><div class="bar grow"><span [style.width.%]="(s.learningStyle[a.key] + 5) * 10"></span></div><span style="width:70px;text-align:right">{{ a.right }}</span></div>
            }
            <div class="row wrap mt">
              @for (i of s.interests; track i) { <span class="chip purple">{{ i }}</span> }
            </div>
          } @else {
            <div class="empty">Sélectionnez un étudiant pour voir son profil.</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .layout{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:18px;align-items:start}
    .detail{position:sticky;top:90px}
    @media(max-width:1100px){.layout{grid-template-columns:1fr}}
  `],
})
export class StudentsPage {
  private api = inject(ProfilingApi);
  private gami = inject(GamificationApi);
  private toast = inject(ToastService);
  profiles = signal<StudentProfile[]>([]);
  selected = signal<StudentProfile | null>(null);
  player = signal<PlayerDTO | null>(null);
  filter = signal<'ALL' | 'INCOMPLETE'>('ALL');
  q = signal('');
  v = signal(0);
  query = '';
  labels = SKILL_LABELS;
  skills = Object.keys(SKILL_LABELS) as SkillType[];
  axes = ['Prog.', 'Conception', 'Rédaction', 'Gestion', 'Oral'];
  styleAxes = STYLE_AXES;
  edit = {} as Record<SkillType, number>;

  list = computed(() => this.profiles()
    .filter((p) => this.filter() === 'ALL' || p.status !== 'COMPLETE')
    .filter((p) => p.displayName.toLowerCase().includes(this.q().toLowerCase())));
  series = computed(() => {
    this.v();
    const s = this.selected();
    if (!s) return [];
    return [
      { values: this.skills.map((k) => s.skills[k]), color: '#9db8bc' },
      { values: this.skills.map((k) => Number(this.edit[k])), color: '#f07b1a' },
    ];
  });

  constructor() { this.api.all().subscribe((p) => this.profiles.set(p)); }

  best(p: StudentProfile): SkillType {
    return this.skills.reduce((a, b) => (p.skills[b] > p.skills[a] ? b : a), this.skills[0]);
  }

  select(p: StudentProfile) {
    this.selected.set(p);
    this.edit = { ...p.skills };
    this.v.set(this.v() + 1);
    this.player.set(null);
    this.gami.player(p.studentId).subscribe({ next: (pl) => this.player.set(pl), error: () => this.player.set(null) });
  }

  saveSkills(p: StudentProfile) {
    const skills = {} as Record<SkillType, number>;
    this.skills.forEach((k) => (skills[k] = Number(this.edit[k])));
    this.api.adjustSkills(p.studentId, skills).subscribe({
      next: (res) => { this.toast.success('Compétences ajustées'); this.selected.set({ ...res }); this.v.set(this.v() + 1); },
      error: (e) => this.toast.fromError(e),
    });
  }
}
