import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { CourseGroupApi } from '../../core/api/course-group-api.service';
import { Deliverable, Project, StudyGroup, Submission } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { MascotComponent } from '../../shared/mascot.component';
import { InitialsPipe } from '../../shared/visuals';
import { MockDb } from '../../core/mock/mock-db';

@Component({
  selector: 'app-projects',
  imports: [DatePipe, MascotComponent, InitialsPipe],
  template: `
    <div class="page">
      @if (group(); as g) {
        <div class="card blue lift row wrap" style="gap:18px">
          <app-mascot [size]="70" />
          <div class="grow">
            <span class="chip">Course / Group Service</span>
            <h1 class="mt-s">{{ project()?.title }}</h1>
            <p class="muted">{{ project()?.description }}</p>
          </div>
          <div class="col" style="align-items:flex-end">
            <span class="small muted">Échéance finale</span>
            <strong>{{ project()?.deadline | date:'d MMMM y' }}</strong>
            <div class="row">
              @for (m of g.memberIds; track m) { <span class="emoji-avatar" [title]="nameOf(m)" style="width:32px;height:32px;font-size:12px;font-weight:700">{{ nameOf(m) | initials }}</span> }
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3><span class="mi">assignment</span> Livrables de {{ g.name }}</h3><span class="card-sub">Rendre un livrable publie l'événement deliverable.submitted</span></div>
          <div class="timeline">
            @for (d of deliverables(); track d.id; let i = $index) {
              <div class="tl-item" [class.done]="!!submissionOf(d.id)" [class.late]="!submissionOf(d.id) && isPast(d.dueDate)">
                <span class="tl-dot">{{ submissionOf(d.id) ? '✓' : i + 1 }}</span>
                <div class="grow">
                  <div class="bold">{{ d.title }}</div>
                  <div class="small muted">Échéance : {{ d.dueDate | date:'EEEE d MMMM, HH:mm' }}</div>
                </div>
                @if (submissionOf(d.id); as s) {
                  <span class="chip green">Rendu le {{ s.submittedAt | date:'dd/MM HH:mm' }}</span>
                } @else {
                  @if (isPast(d.dueDate)) { <span class="chip pink">En retard</span> }
                  <button class="btn primary sm" (click)="submit(d)"><span class="mi">upload</span> Rendre</button>
                }
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="card center col" style="align-items:center;padding:40px">
          <app-mascot [size]="90" [happy]="false" />
          <h2>Aucun projet en équipe</h2>
          <p class="muted">Les livrables apparaîtront quand ton groupe sera publié.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .timeline{display:flex;flex-direction:column;gap:12px}
    .tl-item{display:flex;align-items:center;gap:14px;padding:14px 16px;border:1.6px solid #1e1e1e;border-radius:16px;background:#fff}
    .tl-item.done{background:#dcf3e3}.tl-item.late{background:#ffd9d9}
    .tl-dot{width:34px;height:34px;border-radius:50%;border:1.6px solid #1e1e1e;display:flex;align-items:center;justify-content:center;font-weight:800;background:#fff3cf}
  `],
})
export class ProjectsPage {
  private api = inject(CourseGroupApi);
  private toast = inject(ToastService);
  private db = inject(MockDb);
  group = signal<StudyGroup | null>(null);
  project = signal<Project | null>(null);
  deliverables = signal<Deliverable[]>([]);
  submissions = signal<Submission[]>([]);
  now = Date.now();

  constructor() {
    this.api.myGroup().subscribe((g) => {
      this.group.set(g);
      if (!g) return;
      this.api.deliverables(g.projectId).subscribe((d) => this.deliverables.set(d));
      this.api.submissions(g.id).subscribe((s) => this.submissions.set(s));
      this.project.set(this.db.projects.find((p) => p.id === g.projectId) ?? null);
    });
  }

  submissionOf(id: number) { return this.submissions().find((s) => s.deliverableId === id); }
  isPast(date: string) { return new Date(date).getTime() < this.now; }
  nameOf(id: string) { return this.db.name(id); }

  submit(d: Deliverable) {
    const g = this.group();
    if (!g) return;
    this.api.submit(d.id, g.id).subscribe({
      next: (s) => {
        this.submissions.update((list) => [...list, s]);
        const onTime = new Date(s.submittedAt) <= new Date(d.dueDate);
        this.toast.success(onTime ? 'Livrable rendu à temps : +30 XP pour chaque membre ⏰' : 'Livrable rendu (en retard) : +10 XP');
      },
      error: (e) => this.toast.fromError(e),
    });
  }
}
