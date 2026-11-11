import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfilingApi } from '../../core/api/profiling-api.service';
import { SKILL_LABELS, SkillType, StudentProfile } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { DonutComponent, RadarComponent } from '../../shared/charts';

export const STYLE_AXES: { key: 'activeReflective' | 'sensingIntuitive' | 'visualVerbal' | 'sequentialGlobal'; left: string; right: string }[] = [
  { key: 'activeReflective', left: 'Actif', right: 'Réfléchi' },
  { key: 'sensingIntuitive', left: 'Concret', right: 'Intuitif' },
  { key: 'visualVerbal', left: 'Visuel', right: 'Verbal' },
  { key: 'sequentialGlobal', left: 'Séquentiel', right: 'Global' },
];

@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink, DatePipe, RadarComponent, DonutComponent],
  template: `
    @if (p(); as prof) {
      <div class="page">
        <div class="card yellow lift row wrap" style="gap:20px">
          <app-donut [value]="prof.completionRate" [size]="96" [stroke]="11" />
          <div class="grow">
            <span class="chip">{{ prof.status === 'COMPLETE' ? '✅ Profil complet' : '⏳ Profil incomplet' }}</span>
            <h1 class="mt-s">Mon profil d'apprentissage</h1>
            <p class="muted">Il sert uniquement à former des groupes équilibrés · mis à jour le {{ prof.updatedAt | date:'dd/MM/yyyy' }}</p>
          </div>
          <button class="btn primary" [disabled]="saving()" (click)="save()"><span class="mi">save</span> Enregistrer</button>
        </div>

        <div class="grid g-3">
          <div class="card span-2">
            <div class="card-head"><h3><span class="mi">school</span> Résultats et compétences</h3><span class="card-sub">Échelle de 1 à 5, auto-évaluée</span></div>
            <div class="field" style="max-width:240px">
              <label>Moyenne générale (GPA / 20)</label>
              <input class="input" type="number" min="0" max="20" step="0.1" [(ngModel)]="prof.gpa" />
            </div>
            <div class="skills mt">
              @for (s of skills; track s) {
                <div class="skill">
                  <div class="row between"><span class="bold">{{ labels[s] }}</span><span class="chip orange">{{ prof.skills[s] }} / 5</span></div>
                  <input type="range" min="1" max="5" step="1" [(ngModel)]="prof.skills[s]" (ngModelChange)="tick()" />
                </div>
              }
            </div>
          </div>
          <div class="card center">
            <div class="card-head"><h3>Aperçu radar</h3></div>
            <app-radar [axes]="radarAxes" [series]="radarSeries()" [size]="230" />
          </div>
        </div>

        <div class="grid g-2">
          <div class="card">
            <div class="card-head">
              <h3><span class="mi">psychology</span> Styles d'apprentissage</h3>
              <a routerLink="/app/questionnaire" class="btn sm yellow">Refaire le questionnaire</a>
            </div>
            <p class="small muted">Critère optionnel et pondérable : il sert à <b>diversifier</b> les groupes, pas à adapter l'enseignement.</p>
            <div class="col mt">
              @for (a of styleAxes; track a.key) {
                <div class="style-row">
                  <span class="small bold">{{ a.left }}</span>
                  <div class="scale"><span class="cursor" [style.left.%]="(prof.learningStyle[a.key] + 5) * 10"></span></div>
                  <span class="small bold">{{ a.right }}</span>
                </div>
              }
            </div>
          </div>
          <div class="card">
            <div class="card-head"><h3><span class="mi">interests</span> Centres d'intérêt</h3><span class="card-sub">4 au maximum</span></div>
            <div class="row wrap">
              @for (i of interests; track i) {
                <button class="chip clickable" [class.selected]="prof.interests.includes(i)" (click)="toggle(prof.interests, i, 4)">{{ i }}</button>
              }
            </div>
            <div class="dashed-h"></div>
            <div class="small bold">Disponibilités pour travailler en équipe</div>
            <div class="row wrap mt-s">
              @for (d of slots; track d) {
                <button class="chip clickable" [class.selected]="prof.availability.includes(d)" (click)="toggle(prof.availability, d, 9)">{{ d }}</button>
              }
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="skeleton" style="height:200px"></div>
    }
  `,
  styles: [`
    .skills{display:grid;grid-template-columns:1fr 1fr;gap:16px 28px}
    .style-row{display:grid;grid-template-columns:80px 1fr 80px;align-items:center;gap:10px}
    .style-row span:last-child{text-align:right}
    .scale{position:relative;height:10px;border-radius:999px;border:1.3px solid #1e1e1e;background:linear-gradient(90deg,#dcebff,#fff3cf,#fde3c8)}
    .cursor{position:absolute;top:50%;width:18px;height:18px;border-radius:50%;background:var(--orange);border:1.6px solid #1e1e1e;transform:translate(-50%,-50%)}
    @media(max-width:700px){.skills{grid-template-columns:1fr}}
  `],
})
export class ProfilePage {
  private api = inject(ProfilingApi);
  private toast = inject(ToastService);
  p = signal<StudentProfile | null>(null);
  version = signal(0);
  saving = signal(false);
  skills = Object.keys(SKILL_LABELS) as SkillType[];
  labels = SKILL_LABELS;
  radarAxes = ['Prog.', 'Conception', 'Rédaction', 'Gestion', 'Oral'];
  styleAxes = STYLE_AXES;
  interests = ['Web', 'IA / Data', 'Mobile', 'Cybersécurité', 'Cloud', 'UX / UI', 'Jeux vidéo', 'DevOps', 'IoT', 'Entrepreneuriat'];
  slots = ['Lundi soir', 'Mardi soir', 'Mercredi après-midi', 'Jeudi soir', 'Samedi matin', 'Dimanche'];
  radarSeries = computed(() => {
    this.version();
    const prof = this.p();
    return prof ? [{ values: this.skills.map((s) => Number(prof.skills[s])), color: '#f07b1a' }] : [];
  });

  constructor() {
    this.api.me().subscribe({
      next: (p) => this.p.set(JSON.parse(JSON.stringify(p))),
      error: (e) => this.toast.fromError(e),
    });
  }

  tick() { this.version.update((v) => v + 1); }

  toggle(list: string[], v: string, max: number) {
    const i = list.indexOf(v);
    if (i >= 0) list.splice(i, 1);
    else if (list.length < max) list.push(v);
    else this.toast.info(`${max} choix maximum`);
  }

  save() {
    const prof = this.p();
    if (!prof) return;
    this.skills.forEach((s) => (prof.skills[s] = Number(prof.skills[s])));
    this.saving.set(true);
    this.api.updateMe(prof).subscribe({
      next: (res) => {
        const before = prof.status;
        this.p.set(JSON.parse(JSON.stringify(res)));
        this.saving.set(false);
        this.toast.success(res.status === 'COMPLETE' && before !== 'COMPLETE' ? 'Profil complété : badge « Profil complété » débloqué 🎉' : 'Profil enregistré');
      },
      error: (e) => { this.saving.set(false); this.toast.fromError(e); },
    });
  }
}
