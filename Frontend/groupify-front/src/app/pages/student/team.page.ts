import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CourseGroupApi } from '../../core/api/course-group-api.service';
import { GamificationApi } from '../../core/api/gamification-api.service';
import { Contribution, EmblemDTO, KudosDTO, TeamDashboardDTO } from '../../core/models';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';
import { DonutComponent } from '../../shared/charts';
import { MascotComponent } from '../../shared/mascot.component';
import { EmojiPipe, InitialsPipe } from '../../shared/visuals';

@Component({
  selector: 'app-team',
  imports: [FormsModule, DatePipe, DecimalPipe, DonutComponent, MascotComponent, EmojiPipe, InitialsPipe],
  template: `
    @if (!dash()) {
      @if (loaded()) {
        <div class="card center col" style="align-items:center;padding:40px">
          <app-mascot [size]="90" [happy]="false" />
          <h2>Pas encore d'équipe</h2>
          <p class="muted">Ton enseignant n'a pas encore publié les groupes. Complète ton profil en attendant !</p>
        </div>
      } @else { <div class="skeleton" style="height:180px"></div> }
    } @else {
      <div class="page">
        <!-- identité -->
        <div class="card yellow lift">
          <div class="row wrap" style="gap:20px">
            <span class="emoji-avatar xl">{{ dash()!.team.emblem?.code | emoji:'emblem' }}</span>
            <div class="grow">
              <span class="chip">Équipe n° {{ dash()!.team.id }}</span>
              @if (!editing()) {
                <h1 class="mt-s">{{ dash()!.team.name }}</h1>
                <p class="muted">{{ dash()!.team.memberIds.length }} membres · {{ dash()!.team.totalPoints }} XP · projet à {{ dash()!.team.progressPercent | number:'1.0-0' }} %</p>
              } @else {
                <div class="row wrap mt-s">
                  <input class="input" style="max-width:320px" [(ngModel)]="newName" placeholder="Nom de l'équipe" />
                  @for (e of emblems(); track e.id) {
                    <button class="chip clickable" style="font-size:20px" [class.selected]="newEmblem === e.id" (click)="newEmblem = e.id">{{ e.code | emoji:'emblem' }}</button>
                  }
                </div>
              }
            </div>
            @if (!editing()) {
              <button class="btn" (click)="startEdit()"><span class="mi">edit</span> Modifier l'identité</button>
            } @else {
              <div class="row">
                <button class="btn ghost" (click)="editing.set(false)">Annuler</button>
                <button class="btn primary" [disabled]="newName.trim().length < 3" (click)="saveIdentity()">Enregistrer</button>
              </div>
            }
          </div>
        </div>

        <div class="grid g-3">
          <!-- membres -->
          <div class="card span-2">
            <div class="card-head"><h3><span class="mi">groups</span> Répartition des contributions</h3><span class="card-sub">Points apportés à l'équipe</span></div>
            <div class="col">
              @for (m of dash()!.contributions; track m.studentId) {
                <div class="row">
                  <span class="emoji-avatar">{{ m.displayName | initials }}</span>
                  <div class="grow">
                    <div class="row between"><span class="bold">{{ m.displayName }} @if (m.studentId === me()) { <span class="chip yellow">moi</span> }</span><span class="small bold">{{ m.points }} XP · {{ m.sharePercent | number:'1.0-0' }} %</span></div>
                    <div class="bar mt-s"><span [style.width.%]="m.sharePercent"></span></div>
                  </div>
                  @if (m.studentId !== me()) {
                    <button class="btn sm yellow" (click)="kudosTo.set(m.studentId); kudosName.set(m.displayName)">🤝 Kudos</button>
                  }
                </div>
              }
            </div>
            @if (kudosTo()) {
              <div class="card orange mt pop">
                <div class="bold">Remercier {{ kudosName() }}</div>
                <div class="row mt-s">
                  <input class="input grow" [(ngModel)]="kudosMsg" maxlength="280" placeholder="Merci pour ton aide sur…" />
                  <button class="btn ghost" (click)="kudosTo.set(null)">Annuler</button>
                  <button class="btn primary" (click)="sendKudos()">Envoyer</button>
                </div>
                <div class="small muted mt-s">3 kudos maximum par semaine · +5 XP pour ton coéquipier</div>
              </div>
            }
          </div>

          <!-- avancement -->
          <div class="card">
            <div class="card-head"><h3><span class="mi">flag</span> Avancement</h3></div>
            <div class="col" style="align-items:center">
              <app-donut [value]="dash()!.team.progressPercent" [size]="140" color="#2f9e5b" />
              <div class="small">{{ dash()!.deliverablesSubmitted }} / {{ dash()!.deliverablesTotal }} livrables · {{ dash()!.onTimeDeliveries }} à temps</div>
            </div>
            <div class="dashed-h"></div>
            <div class="small bold">Badges d'équipe</div>
            <div class="row wrap mt-s">
              @for (b of dash()!.teamBadges; track b.code) {
                <span class="chip yellow">{{ b.code | emoji:'badge' }} {{ b.name }}</span>
              } @empty { <span class="small muted">Aucun pour l'instant</span> }
            </div>
          </div>
        </div>

        <div class="grid g-2">
          <!-- contributions (Course / Group Service) -->
          <div class="card">
            <div class="card-head"><h3><span class="mi">commit</span> Journal des contributions</h3><span class="chip blue">Course / Group</span></div>
            <div class="row">
              <select class="input" style="width:150px" [(ngModel)]="contribType">
                <option value="COMMIT">Commit</option><option value="DOCUMENT">Document</option>
                <option value="MEETING">Réunion</option><option value="REVIEW">Revue</option>
              </select>
              <input class="input grow" [(ngModel)]="contribDesc" placeholder="Décris ta contribution" />
              <button class="btn primary" [disabled]="!contribDesc.trim()" (click)="addContribution()">Ajouter</button>
            </div>
            <div class="feed mt">
              @for (c of contributions().slice(0, 8); track c.id) {
                <div class="feed-row">
                  <span class="chip">{{ typeIcon[c.type] }} {{ c.type }}</span>
                  <span class="grow">{{ c.description }} · <span class="muted">{{ nameOf(c.studentId) }}</span></span>
                  <span class="small muted">{{ c.recordedAt | date:'dd/MM HH:mm' }}</span>
                </div>
              }
            </div>
          </div>

          <!-- kudos -->
          <div class="card">
            <div class="card-head"><h3><span class="mi">volunteer_activism</span> Kudos de l'équipe</h3><span class="chip yellow">Gamification</span></div>
            <div class="feed">
              @for (k of kudos(); track k.id) {
                <div class="feed-row">
                  <span>🤝</span>
                  <span class="grow"><b>{{ k.fromName }}</b> → <b>{{ k.toName }}</b> : « {{ k.message }} »</span>
                  <span class="small muted">{{ k.createdAt | date:'dd/MM' }}</span>
                </div>
              } @empty { <p class="empty">Aucun kudos pour l'instant.</p> }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .feed{display:flex;flex-direction:column;gap:8px;max-height:330px;overflow:auto}
    .feed-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1.2px dashed #d8d2c5;border-radius:12px;font-size:13px}
  `],
})
export class TeamPage {
  private gami = inject(GamificationApi);
  private courses = inject(CourseGroupApi);
  private toast = inject(ToastService);
  private session = inject(SessionService);

  me = computed(() => this.session.user()?.id);
  loaded = signal(false);
  dash = signal<TeamDashboardDTO | null>(null);
  emblems = signal<EmblemDTO[]>([]);
  kudos = signal<KudosDTO[]>([]);
  contributions = signal<Contribution[]>([]);
  editing = signal(false);
  newName = '';
  newEmblem: number | null = null;
  kudosTo = signal<string | null>(null);
  kudosName = signal('');
  kudosMsg = '';
  contribType: Contribution['type'] = 'COMMIT';
  contribDesc = '';
  typeIcon: Record<string, string> = { COMMIT: '💻', DOCUMENT: '📄', MEETING: '🗣️', REVIEW: '🔍' };
  private groupId: number | null = null;

  constructor() {
    this.gami.emblems().subscribe((e) => this.emblems.set(e));
    this.gami.me().subscribe({
      next: (p) => {
        if (!p.teamId) { this.loaded.set(true); return; }
        this.reload(p.teamId);
      },
      error: () => this.loaded.set(true),
    });
    this.courses.myGroup().subscribe((g) => {
      if (g) { this.groupId = g.id; this.loadContributions(); }
    });
  }

  private reload(teamId: number) {
    this.gami.teamDashboard(teamId).subscribe((d) => { this.dash.set(d); this.loaded.set(true); });
    this.gami.teamKudos(teamId).subscribe((k) => this.kudos.set(k));
  }
  private loadContributions() {
    if (this.groupId) this.courses.contributions(this.groupId).subscribe((c) => this.contributions.set(c));
  }

  nameOf(id: string) { return this.dash()?.contributions.find((c) => c.studentId === id)?.displayName ?? id; }

  startEdit() {
    this.newName = this.dash()!.team.name;
    this.newEmblem = this.dash()!.team.emblem?.id ?? null;
    this.editing.set(true);
  }

  saveIdentity() {
    const t = this.dash()!.team;
    this.gami.updateIdentity(t.id, this.newName, this.newEmblem).subscribe({
      next: () => { this.toast.success('Identité de l\'équipe mise à jour'); this.editing.set(false); this.reload(t.id); },
      error: (e) => this.toast.fromError(e),
    });
  }

  sendKudos() {
    const to = this.kudosTo();
    if (!to) return;
    this.gami.sendKudos(to, this.kudosMsg || 'Merci !').subscribe({
      next: () => { this.toast.success(`Kudos envoyé à ${this.kudosName()} 🤝`); this.kudosTo.set(null); this.kudosMsg = ''; this.reload(this.dash()!.team.id); },
      error: (e) => this.toast.fromError(e),
    });
  }

  addContribution() {
    if (!this.groupId) return;
    this.courses.addContribution(this.groupId, this.contribType, this.contribDesc.trim()).subscribe({
      next: () => {
        this.toast.success('Contribution enregistrée (+5 XP)');
        this.contribDesc = '';
        this.loadContributions();
        this.reload(this.dash()!.team.id);
      },
      error: (e) => this.toast.fromError(e),
    });
  }
}
