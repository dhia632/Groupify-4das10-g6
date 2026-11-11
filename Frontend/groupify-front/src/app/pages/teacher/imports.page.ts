import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ProfilingApi } from '../../core/api/profiling-api.service';
import { CsvImport } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-imports',
  imports: [DatePipe],
  template: `
    <div class="page">
      <div class="page-title">
        <div><h1>Import CSV de profils</h1><p>Profiling Service · POST /api/imports → 202 (traitement en tâche de fond)</p></div>
        <button class="btn" (click)="downloadTemplate()"><span class="mi">download</span> Modèle CSV</button>
      </div>

      <div class="grid g-3">
        <label class="card drop span-2" [class.over]="over()" (dragover)="$event.preventDefault(); over.set(true)" (dragleave)="over.set(false)" (drop)="onDrop($event)">
          <input type="file" accept=".csv" hidden (change)="onPick($event)" />
          <span class="mi big">cloud_upload</span>
          <h2>{{ uploading() ? 'Import en cours…' : 'Déposez un fichier CSV ici' }}</h2>
          <p class="muted">ou cliquez pour choisir un fichier · données publiques anonymisées ou synthétiques uniquement</p>
        </label>
        <div class="card yellow">
          <h3><span class="mi">gavel</span> Rappels</h3>
          <ul class="small">
            <li>Jeux CC BY 4.0 : citer l'auteur et le jeu de données dans le README.</li>
            <li>Jamais de données réelles de vos camarades.</li>
            <li>Données synthétiques : graine fixe pour des démos reproductibles.</li>
            <li>Colonnes : studentId, gpa, compétences 1 à 5, intérêts.</li>
          </ul>
        </div>
      </div>

      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Fichier</th><th>Lignes importées</th><th>Rejetées</th><th>Statut</th><th>Date</th><th>Par</th></tr></thead>
          <tbody>
            @for (i of imports(); track i.id) {
              <tr>
                <td><span class="mi">description</span> <b>{{ i.fileName }}</b></td>
                <td>{{ i.rowsImported }}</td>
                <td>{{ i.rowsRejected }}</td>
                <td><span class="chip" [class.green]="i.status === 'DONE'" [class.yellow]="i.status === 'PENDING'" [class.pink]="i.status === 'FAILED'">{{ i.status }}</span></td>
                <td>{{ i.importedAt | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ i.importedBy }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:220px;border-style:dashed;cursor:pointer;text-align:center;background:#fffdf7}
    .drop.over{background:var(--yellow-soft)}
    .big{font-size:56px;color:var(--orange)}
    ul{padding-left:18px;display:flex;flex-direction:column;gap:8px}
  `],
})
export class ImportsPage {
  private api = inject(ProfilingApi);
  private toast = inject(ToastService);
  imports = signal<CsvImport[]>([]);
  over = signal(false);
  uploading = signal(false);

  constructor() { this.load(); }
  load() { this.api.imports().subscribe((i) => this.imports.set(i)); }

  onPick(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.upload(file);
  }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.over.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.upload(file);
  }

  upload(file: File) {
    this.uploading.set(true);
    this.api.upload(file).subscribe({
      next: (i) => { this.uploading.set(false); this.toast.success(`${i.rowsImported} profils importés depuis ${i.fileName}`); this.load(); },
      error: (e) => { this.uploading.set(false); this.toast.fromError(e); },
    });
  }

  downloadTemplate() {
    const csv = 'studentId;firstName;lastName;gpa;programming;design;writing;projectManagement;publicSpeaking;interests\n'
      + 'student101;Lina;Exemple;14.5;4;3;2;3;2;Web|Cloud\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modele_profils_groupify.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
