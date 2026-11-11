import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GamificationApi } from '../../core/api/gamification-api.service';
import { BadgeDTO, BadgeRequest } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { EmojiPipe } from '../../shared/visuals';

const EMPTY: BadgeRequest = {
  code: '', name: '', description: '', iconUrl: '', category: 'PARTICIPATION', rewardPoints: 10,
  rules: [{ triggerEvent: 'CONTRIBUTION_RECORDED', conditionType: 'COUNT_THRESHOLD', threshold: 5, scope: 'STUDENT' }],
};

@Component({
  selector: 'app-badges-admin',
  imports: [FormsModule, EmojiPipe],
  template: `
    <div class="page">
      <div class="page-title">
        <div><h1>Gestion des badges</h1><p>Gamification Service · règles paramétrables, sans toucher au code</p></div>
        <button class="btn primary" (click)="newBadge()"><span class="mi">add</span> Nouveau badge</button>
      </div>

      <div class="grid g-3">
        <div class="span-2 table-wrap">
          <table class="tbl">
            <thead><tr><th></th><th>Badge</th><th>Catégorie</th><th>Règle</th><th>Bonus</th><th></th></tr></thead>
            <tbody>
              @for (b of badges(); track b.id) {
                <tr>
                  <td style="font-size:26px">{{ b.code | emoji:'badge' }}</td>
                  <td><b>{{ b.name }}</b><div class="mono muted">{{ b.code }}</div></td>
                  <td><span class="chip">{{ b.category }}</span></td>
                  <td class="small">{{ b.rules?.[0]?.triggerEvent }}<br/>{{ b.rules?.[0]?.conditionType }} ≥ {{ b.rules?.[0]?.threshold }} · {{ b.rules?.[0]?.scope }}</td>
                  <td><span class="chip orange">+{{ b.rewardPoints }}</span></td>
                  <td>
                    <div class="row">
                      <button class="icon-btn" title="Modifier" (click)="editBadge(b)"><span class="mi">edit</span></button>
                      <button class="icon-btn" title="Désactiver" (click)="remove(b)"><span class="mi">delete</span></button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="small muted">{{ loading() ? 'Chargement…' : 'Aucun badge.' }}</td></tr>
              }
            </tbody>
          </table>
        </div>

        <div class="col">
          @if (form) {
            <div class="card yellow pop">
              <h3>{{ editingId ? 'Modifier le badge' : 'Créer un badge' }}</h3>
              <div class="col mt-s">
                <input class="input mono" [(ngModel)]="form.code" [disabled]="!!editingId" placeholder="CODE_BADGE" />
                <input class="input" [(ngModel)]="form.name" placeholder="Nom affiché" />
                <textarea class="input" [(ngModel)]="form.description" placeholder="Description"></textarea>
                <div class="row">
                  <select class="input" [(ngModel)]="form.category">
                    <option>PARTICIPATION</option><option>COOPERATION</option><option>REGULARITY</option><option>DELIVERY</option>
                  </select>
                  <input class="input" type="number" min="0" max="500" [(ngModel)]="form.rewardPoints" style="width:110px" title="Points bonus" />
                </div>
                <div class="small bold">Règle d'attribution</div>
                <select class="input" [(ngModel)]="form.rules[0].triggerEvent">
                  @for (e of events; track e) { <option [value]="e">{{ e }}</option> }
                </select>
                <div class="row">
                  <select class="input" [(ngModel)]="form.rules[0].conditionType">
                    <option>FIRST_OCCURRENCE</option><option>COUNT_THRESHOLD</option><option>STREAK_DAYS</option><option>ON_TIME</option>
                  </select>
                  <input class="input" type="number" min="1" [(ngModel)]="form.rules[0].threshold" style="width:90px" />
                </div>
                <select class="input" [(ngModel)]="form.rules[0].scope"><option value="STUDENT">Étudiant</option><option value="TEAM">Équipe</option></select>
                <div class="row">
                  <button class="btn ghost" (click)="form = null">Annuler</button>
                  <button class="btn primary grow" (click)="save()">Enregistrer</button>
                </div>
              </div>
            </div>
          }

          <div class="card">
            <h3><span class="mi">workspace_premium</span> Attribution manuelle</h3>
            <p class="small muted mt-s">POST /players/:studentId/badges/:badgeId · 201, 404 ou 409</p>
            <div class="col mt-s">
              <input class="input mono" [(ngModel)]="awardStudent" placeholder="Id de l'étudiant" />
              <select class="input" [(ngModel)]="awardBadge">
                <option [ngValue]="null">Badge…</option>
                @for (b of badges(); track b.id) { <option [ngValue]="b.id">{{ b.name }}</option> }
              </select>
              <button class="btn dark" [disabled]="!awardStudent?.trim() || !awardBadge" (click)="award()">Attribuer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class BadgesAdminPage {
  private api = inject(GamificationApi);
  demoMode = false;
  private toast = inject(ToastService);

  badges = signal<BadgeDTO[]>([]);
  loading = signal(true);
  form: BadgeRequest | null = null;
  editingId: number | null = null;
  awardStudent: string | null = null;
  awardBadge: number | null = null;
  events = ['PROFILE_COMPLETED', 'GROUP_JOINED', 'CONTRIBUTION_RECORDED', 'DELIVERABLE_SUBMITTED', 'KUDOS_RECEIVED', 'DAILY_ACTIVITY'];

  constructor() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.badges().subscribe({
      next: (b) => { this.badges.set(Array.isArray(b) ? b : []); this.loading.set(false); },
      error: (e) => { this.loading.set(false); this.toast.fromError(e); },
    });
  }

  newBadge() { this.editingId = null; this.form = JSON.parse(JSON.stringify(EMPTY)); }

  editBadge(b: BadgeDTO) {
    this.editingId = b.id;
    this.form = JSON.parse(JSON.stringify({
      code: b.code, name: b.name, description: b.description, iconUrl: b.iconUrl,
      category: b.category, rewardPoints: b.rewardPoints,
      rules: b.rules?.length ? b.rules : EMPTY.rules,
    }));
  }

  save() {
    if (!this.form) return;
    const req: BadgeRequest = {
      ...this.form,
      code: this.form.code.trim().toUpperCase(),
      rewardPoints: +this.form.rewardPoints,
      rules: this.form.rules.map((r) => ({ ...r, threshold: +r.threshold })),
    };
    const editing = this.editingId;
    const call = editing ? this.api.updateBadge(editing, req) : this.api.createBadge(req);
    call.subscribe({
      next: () => { this.toast.success(editing ? 'Badge modifié' : 'Badge créé (201)'); this.form = null; this.load(); },
      error: (e) => this.toast.fromError(e),
    });
  }

  remove(b: BadgeDTO) {
    this.api.deleteBadge(b.id).subscribe({
      next: () => { this.toast.success(`Badge ${b.name} désactivé (204)`); this.load(); },
      error: (e) => this.toast.fromError(e),
    });
  }

  award() {
    this.api.awardManually(this.awardStudent!.trim(), this.awardBadge!).subscribe({
      next: (a) => this.toast.success(`Badge « ${a.badge.name} » attribué`),
      error: (e) => this.toast.fromError(e),
    });
  }
}