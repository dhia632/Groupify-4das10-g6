import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnalyticsApi } from '../../core/api/analytics-api.service';
import { AnalyticsReport, PromotionSummary } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { DonutComponent } from '../../shared/charts';

@Component({
  selector: 'app-promotion',
  imports: [FormsModule, DatePipe, DecimalPipe, DonutComponent],
  template: `
    <div class="page">
      @if (sum(); as s) {
        <div class="page-title">
          <div><h1>{{ s.label }}</h1><p>Analytics Service · GET /api/analytics/promotions/{{ s.promotionId }}/summary</p></div>
        </div>
        <div class="grid g-4">
          <div class="card yellow"><div class="stat-value">{{ s.students }}</div><div class="stat-label">Étudiants</div></div>
          <div class="card blue"><div class="stat-value">{{ s.courses }}</div><div class="stat-label">Modules</div></div>
          <div class="card green"><div class="stat-value">{{ s.groups }}</div><div class="stat-label">Groupes formés</div></div>
          <div class="card pink"><div class="stat-value">{{ s.avgGpaStdDev | number:'1.2-2' }}</div><div class="stat-label">Écart-type moyen des GPA</div></div>
        </div>
        <div class="grid g-3">
          <div class="card center"><div class="card-head"><h3>Engagement</h3></div><app-donut [value]="s.activeRate" [size]="150" color="#1b998b" /><p class="small muted mt-s">Étudiants actifs sur 7 jours</p></div>
          <div class="card center"><div class="card-head"><h3>Couverture des compétences</h3></div><app-donut [value]="s.avgSkillCoverage" [size]="150" color="#3b82f6" /><p class="small muted mt-s">Moyenne sur les groupes</p></div>
          <div class="card">
            <div class="card-head"><h3>Par classe</h3></div>
            <div class="col">
              @for (c of s.classes; track c.className) {
                <div class="cls">
                  <div class="row between"><b>{{ c.className }}</b><span class="chip">{{ c.groups }} groupes</span></div>
                  <div class="small muted">Écart-type GPA {{ c.gpaStdDev | number:'1.2-2' }} · actifs {{ c.activeRate }} %</div>
                  <div class="bar teal mt-s"><span [style.width.%]="c.activeRate"></span></div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <div class="card">
        <div class="card-head">
          <h3><span class="mi">summarize</span> Rapports</h3>
          <div class="row">
            <select class="input" style="width:150px" [(ngModel)]="scope">
              <option value="COURSE">Module</option><option value="CLASS">Classe</option><option value="PROMOTION">Promotion</option>
            </select>
            <input class="input" style="width:150px" [(ngModel)]="scopeId" placeholder="AWD, 4DAS1…" />
            <input class="input" style="width:170px" [(ngModel)]="period" placeholder="Période" />
            <button class="btn primary" (click)="generate()"><span class="mi">add_chart</span> Générer</button>
          </div>
        </div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>#</th><th>Portée</th><th>Période</th><th>Statut</th><th>Généré le</th><th></th></tr></thead>
            <tbody>
              @for (r of reports(); track r.id) {
                <tr>
                  <td>{{ r.id }}</td>
                  <td><span class="chip">{{ r.scope }}</span> {{ r.scopeId }}</td>
                  <td>{{ r.period }}</td>
                  <td><span class="chip" [class.green]="r.status === 'READY'" [class.yellow]="r.status === 'PENDING'">{{ r.status === 'PENDING' ? '⏳ En cours' : '✅ Prêt' }}</span></td>
                  <td>{{ r.generatedAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td><button class="btn sm" [disabled]="r.status !== 'READY'" (click)="download(r)"><span class="mi">download</span></button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`.cls{padding:10px 12px;border:1.4px dashed #cfc8b8;border-radius:12px}`],
})
export class PromotionPage {
  private api = inject(AnalyticsApi);
  private toast = inject(ToastService);
  sum = signal<PromotionSummary | null>(null);
  reports = signal<AnalyticsReport[]>([]);
  scope: AnalyticsReport['scope'] = 'COURSE';
  scopeId = 'AWD';
  period = 'Semaine 5';
  private poll: any;

  constructor() {
    this.api.promotion('4DAS').subscribe((s) => this.sum.set(s));
    this.loadReports();
  }
  loadReports() { this.api.reports().subscribe((r) => this.reports.set([...r])); }

  generate() {
    this.api.generateReport(this.scope, this.scopeId, this.period).subscribe({
      next: () => {
        this.toast.info('Génération lancée (202)…');
        this.loadReports();
        clearTimeout(this.poll);
        this.poll = setTimeout(() => { this.loadReports(); this.toast.success('Rapport prêt (report.generated)'); }, 2800);
      },
      error: (e) => this.toast.fromError(e),
    });
  }

  download(r: AnalyticsReport) {
    const s = this.sum();
    const csv = `rapport;${r.scope};${r.scopeId};${r.period}\nindicateur;valeur\nétudiants;${s?.students}\ngroupes;${s?.groups}\necart_type_gpa;${s?.avgGpaStdDev}\ncouverture;${s?.avgSkillCoverage}\nactifs;${s?.activeRate}\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_${r.id}_${r.scopeId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
