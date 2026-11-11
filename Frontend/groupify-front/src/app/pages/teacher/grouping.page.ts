import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClusteringApi } from '../../core/api/clustering-api.service';
import { CourseGroupApi } from '../../core/api/course-group-api.service';
import { MockDb } from '../../core/mock/mock-db';
import { AlgorithmInfo, ClusteringJob, Criteria, GroupingRequest, Project, StudyGroup } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { ScatterComponent } from '../../shared/charts';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-grouping',
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe, ScatterComponent, MascotComponent],
  templateUrl: './grouping.page.html',
  styleUrl: './grouping.page.css',
})
export class GroupingPage implements OnDestroy {
  /** Paramètre de route :projectId (withComponentInputBinding). */
  projectId = input.required<string>();

  private api = inject(CourseGroupApi);
  private ml = inject(ClusteringApi);
  private toast = inject(ToastService);
  private db = inject(MockDb);

  project = signal<Project | null>(null);
  algorithms = signal<AlgorithmInfo[]>([]);
  request = signal<GroupingRequest | null>(null);
  job = signal<ClusteringJob | null>(null);
  groups = signal<StudyGroup[]>([]);
  launching = signal(false);
  highlight = signal<string | null>(null);

  weights: Criteria = { gpa: 40, skills: 30, styles: 15, interests: 15 };
  algorithm = 'KMEANS_STRATIFIED';
  groupSize = 4;
  moveTarget: Record<string, number> = {};
  private timer: any;

  totalWeight = () => Number(this.weights.gpa) + Number(this.weights.skills) + Number(this.weights.styles) + Number(this.weights.interests);
  published = computed(() => this.request()?.status === 'PUBLISHED');
  running = computed(() => this.request()?.status === 'RUNNING' || this.request()?.status === 'PENDING');
  clusterColor = computed(() => {
    const map: Record<string, { color: string; label: string }> = {};
    const j = this.job();
    if (j) j.points.forEach((p) => (map[p.studentId] = { color: j.clusters[p.clusterId].color, label: j.clusters[p.clusterId].label }));
    return map;
  });
  points = computed(() => {
    const j = this.job();
    if (!j) return [];
    return j.points.map((p) => ({
      x: p.x, y: p.y, color: j.clusters[p.clusterId].color, label: `${this.nameOf(p.studentId)} · ${j.clusters[p.clusterId].label}`,
      highlight: this.highlight() === p.studentId,
    }));
  });

  ngOnInit() {
    const id = Number(this.projectId());
    this.project.set(this.db.projects.find((p) => p.id === id) ?? null);
    if (this.project()) this.groupSize = this.project()!.groupSize;
    this.ml.algorithms().subscribe((a) => this.algorithms.set(a));
    this.api.requests(id).subscribe((list) => {
      const last = list[0];
      if (last) this.track(last);
    });
  }

  ngOnDestroy() { clearInterval(this.timer); }

  nameOf(id: string) { return this.db.name(id); }
  gpaOf(id: string) { return this.db.profile(id)?.gpa ?? 0; }
  avgGpa(g: StudyGroup) { return g.memberIds.reduce((s, id) => s + this.gpaOf(id), 0) / Math.max(1, g.memberIds.length); }
  clustersIn(g: StudyGroup) { return new Set(g.memberIds.map((m) => this.clusterColor()[m]?.label)).size; }

  launch() {
    if (this.totalWeight() !== 100) { this.toast.error('La somme des poids doit faire 100 %'); return; }
    this.launching.set(true);
    const w: Criteria = { gpa: +this.weights.gpa, skills: +this.weights.skills, styles: +this.weights.styles, interests: +this.weights.interests };
    this.api.launchGrouping(Number(this.projectId()), w, this.algorithm, +this.groupSize).subscribe({
      next: (r) => {
        this.launching.set(false);
        this.toast.info('Demande acceptée (202) : le ML Clustering Engine calcule les groupes…');
        this.job.set(null);
        this.groups.set([]);
        this.track(r);
      },
      error: (e) => { this.launching.set(false); this.toast.fromError(e); },
    });
  }

  /** Suit la demande : interroge l'état toutes les secondes tant que le calcul tourne. */
  private track(r: GroupingRequest) {
    this.request.set({ ...r });
    clearInterval(this.timer);
    const refresh = () => this.api.request(r.id).subscribe((cur) => {
      this.request.set({ ...cur });
      if (cur.status !== 'RUNNING' && cur.status !== 'PENDING') {
        clearInterval(this.timer);
        this.loadResult(cur);
      }
    });
    if (r.status === 'RUNNING' || r.status === 'PENDING') this.timer = setInterval(refresh, 1000);
    else this.loadResult(r);
  }

  private loadResult(r: GroupingRequest) {
    if (r.jobId) this.ml.job(r.jobId).subscribe((j) => this.job.set(j));
    this.api.groupsOfProject(r.projectId).subscribe((g) => this.groups.set(g.filter((x) => x.requestId === r.id)));
    if (r.status === 'PROPOSED') this.toast.success('Groupes proposés : vérifiez, ajustez puis publiez');
  }

  move(from: StudyGroup, studentId: string) {
    const to = Number(this.moveTarget[studentId]);
    if (!to || to === from.id) return;
    this.api.moveMember(from.id, to, studentId).subscribe({
      next: () => {
        this.groups.update((list) => [...list]);
        const j = this.job();
        if (j) j.metrics = { ...j.metrics, ...this.db.metrics(this.groups().map((g) => g.memberIds), 4) };
        this.job.set(j ? { ...j } : null);
        this.toast.info(`${this.nameOf(studentId)} déplacé·e`);
        delete this.moveTarget[studentId];
      },
      error: (e) => this.toast.fromError(e),
    });
  }

  publish() {
    const r = this.request();
    if (!r) return;
    this.api.publish(r.projectId, r.id).subscribe({
      next: (groups) => {
        this.request.set({ ...r, status: 'PUBLISHED' });
        this.groups.set(groups);
        this.toast.success('Groupes publiés (groups.published) : les étudiants découvrent leur équipe 🎉');
      },
      error: (e) => this.toast.fromError(e),
    });
  }
}
