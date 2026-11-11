import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../core/toast.service';

const API = { modules: '/api/modules', projects: '/api/projects' };

interface ModuleDto {
  id: number;
  code: string;
  intitule?: string;
  semestre?: string | number;
}

interface ProjectDto {
  id: number;
  titre: string;
  dateDebut?: string;
  dateLimite?: string;
  tailleMin?: number;
  tailleMax?: number;
  classeId?: number;
  moduleId?: number;
  // Formes alternatives possibles selon la sérialisation du back
  module_id?: number;
  module?: { id: number };
  classe_id?: number;
  classe?: { id: number };
}

@Component({
  selector: 'app-course-detail',
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    @if (module(); as m) {
      <div class="page">
        <div class="page-title">
          <div>
            <a routerLink="/app/courses" class="small muted"><span class="mi" style="font-size:16px">arrow_back</span> Modules</a>
            <h1>{{ m.code }} · {{ m.intitule }}</h1>
            <p>Semestre {{ m.semestre }} · {{ projects().length }} projet(s)</p>
          </div>
        </div>

        <div class="grid g-2">
          @for (p of projects(); track p.id) {
            <div class="card lift">
              <div class="row between">
                <h2>{{ p.titre }}</h2>
                <span class="chip">{{ p.tailleMin }} à {{ p.tailleMax }} / groupe</span>
              </div>
              <div class="row wrap mt-s small">
                <span>🚀 Début {{ p.dateDebut ? (p.dateDebut | date:'dd/MM/yyyy') : '—' }}</span>
                <span>📅 Échéance {{ p.dateLimite ? (p.dateLimite | date:'dd/MM/yyyy') : '—' }}</span>
                @if (classeIdOf(p); as cid) { <span>🎓 Classe n° {{ cid }}</span> }
              </div>
            </div>
          } @empty {
            <div class="card empty">Aucun projet pour ce module.</div>
          }

          <div class="card yellow">
            <h3>Nouveau projet</h3>
            <div class="col mt-s">
              <input class="input" [(ngModel)]="np.titre" placeholder="Titre du projet" />
              <div class="row">
                <div class="field grow"><label>Date de début</label><input class="input" type="date" [(ngModel)]="np.dateDebut" /></div>
                <div class="field grow"><label>Date limite</label><input class="input" type="date" [(ngModel)]="np.dateLimite" /></div>
              </div>
              <div class="row">
                <div class="field" style="width:120px"><label>Taille min</label><input class="input" type="number" min="1" max="10" [(ngModel)]="np.tailleMin" /></div>
                <div class="field" style="width:120px"><label>Taille max</label><input class="input" type="number" min="1" max="10" [(ngModel)]="np.tailleMax" /></div>
                <div class="field grow"><label>Id de la classe</label><input class="input" type="number" [(ngModel)]="np.classeId" /></div>
              </div>
              <button class="btn primary"
                      [disabled]="!np.titre || !np.classeId || np.tailleMin > np.tailleMax"
                      (click)="createProject(m)">Créer le projet</button>            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="page"><div class="card empty">Chargement du module…</div></div>
    }
  `,
})
export class CourseDetailPage implements OnInit {
  id = input.required<string>();
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  module = signal<ModuleDto | null>(null);
  projects = signal<ProjectDto[]>([]);
  np = { titre: '', dateDebut: '', dateLimite: '', tailleMin: 2, tailleMax: 4, classeId: null as number | null };

  ngOnInit() { this.load(); }

  load() {
    const id = Number(this.id());

    this.http.get<unknown>(API.modules).subscribe({
      next: (res) =>
          this.module.set(this.toList<ModuleDto>(res).find((m) => Number(m.id) === id) ?? null),
      error: (e) => this.toast.fromError(e),
    });

    this.http.get<unknown>(API.projects).subscribe({
      next: (res) => {
        const all = this.toList<ProjectDto>(res);
        console.log('projets reçus :', all); // à retirer une fois le problème confirmé résolu
        this.projects.set(all.filter((p) => this.moduleIdOf(p) === id));
      },
      error: (e) => this.toast.fromError(e),
    });
  }

  createProject(m: ModuleDto) {

    const body = {
      titre: this.np.titre,
      dateDebut: this.np.dateDebut || null,
      dateLimite: this.np.dateLimite || null,
      tailleMin: +this.np.tailleMin,
      tailleMax: +this.np.tailleMax,
      classeId: this.np.classeId,
      moduleId: m.id,
      module: { id: m.id },
      classe: this.np.classeId ? { id: this.np.classeId } : null,
    };
    this.http.post(API.projects, body).subscribe({
      next: () => {
        this.toast.success('Projet créé');
        this.np = { titre: '', dateDebut: '', dateLimite: '', tailleMin: 2, tailleMax: 4, classeId: null };
        this.load();
      },
      error: (e) => this.toast.fromError(e),
    });
  }

  /** Récupère l'id du module quelle que soit la forme du JSON (moduleId, module_id ou module.id). */
  moduleIdOf(p: ProjectDto): number | undefined {
    const v = p.moduleId ?? p.module_id ?? p.module?.id;
    return v == null ? undefined : Number(v);
  }

  /** Idem pour la classe. */
  classeIdOf(p: ProjectDto): number | undefined {
    const v = p.classeId ?? p.classe_id ?? p.classe?.id;
    return v == null ? undefined : Number(v);
  }

  private toList<T>(res: unknown): T[] {
    if (Array.isArray(res)) return res as T[];
    const content = (res as { content?: unknown })?.content;
    return Array.isArray(content) ? (content as T[]) : [];
  }
}