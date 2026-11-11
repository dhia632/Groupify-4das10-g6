import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../core/toast.service';

const API = { modules: '/api/modules' };

interface ModuleDto {
  id: number;
  code: string;
  intitule?: string;
  semestre?: string | number;
}

@Component({
  selector: 'app-courses',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-title">
        <div><h1>Modules</h1><p>Course / Group Service · GET /api/modules</p></div>
        <button class="btn primary" (click)="showForm.set(!showForm())"><span class="mi">add</span> Nouveau module</button>
      </div>

      @if (showForm()) {
        <div class="card yellow pop">
          <div class="row wrap">
            <div class="field" style="width:140px"><label>Code</label><input class="input" [(ngModel)]="form.code" placeholder="AWD" /></div>
            <div class="field grow"><label>Intitulé</label><input class="input" [(ngModel)]="form.intitule" placeholder="Applications Web Distribuées" /></div>
            <div class="field" style="width:140px"><label>Semestre</label><input class="input" [(ngModel)]="form.semestre" placeholder="1" /></div>
            <button class="btn primary" style="align-self:flex-end" (click)="create()">Créer</button>
          </div>
        </div>
      }

      <div class="grid g-3">
        @for (c of courses(); track c.id; let i = $index) {
          <a class="card lift course" [routerLink]="['/app/courses', c.id]" [class]="'card lift course ' + colors[i % colors.length]">
            <div class="row between">
              <span class="chip dark">{{ c.code }}</span>
              <span class="chip">Semestre {{ c.semestre }}</span>
            </div>
            <h2 class="mt-s">{{ c.intitule }}</h2>
            <span class="btn sm mt" style="align-self:flex-start">Ouvrir <span class="mi">arrow_forward</span></span>
          </a>
        } @empty { <div class="card empty">Aucun module.</div> }
      </div>
    </div>
  `,
  styles: [`.course{display:flex;flex-direction:column;min-height:150px}.course:hover{transform:translateY(-2px)}`],
})
export class CoursesPage {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  courses = signal<ModuleDto[]>([]);
  showForm = signal(false);
  form = { code: '', intitule: '', semestre: '' };
  colors = ['yellow', 'blue', 'green', 'pink', 'purple', 'orange'];

  constructor() { this.load(); }

  load() {
    this.http.get<unknown>(API.modules).subscribe({
      next: (res) => {
        console.log('modules reçus :', res);
        const list = Array.isArray(res) ? res : ((res as { content?: ModuleDto[] }).content ?? []);
        this.courses.set(list as ModuleDto[]);
      },
      error: (e) => this.toast.fromError(e),
    });
  }

  create() {
    this.http.post(API.modules, { ...this.form }).subscribe({
      next: () => {
        this.toast.success('Module créé (201)');
        this.showForm.set(false);
        this.form = { code: '', intitule: '', semestre: '' };
        this.load();
      },
      error: (e) => this.toast.fromError(e),
    });
  }
}