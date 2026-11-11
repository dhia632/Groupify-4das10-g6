import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthApi } from '../../core/api/auth-api.service';
import { Role, UserAccount } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { InitialsPipe } from '../../shared/visuals';

@Component({
  selector: 'app-users',
  imports: [FormsModule, DatePipe, InitialsPipe],
  template: `
    <div class="page">
      <div class="page-title">
        <div><h1>Comptes et rôles</h1><p>Auth Service · GET /api/users · PATCH /api/users/:id/role · PATCH /api/users/:id/status</p></div>
      </div>

      <div class="grid g-4">
        <div class="card yellow"><div class="stat-value">{{ users().length }}</div><div class="stat-label">Comptes</div></div>
        <div class="card blue"><div class="stat-value">{{ count('STUDENT') }}</div><div class="stat-label">Étudiants</div></div>
        <div class="card green"><div class="stat-value">{{ count('TEACHER') }}</div><div class="stat-label">Enseignants</div></div>
        <div class="card pink"><div class="stat-value">{{ pending() }}</div><div class="stat-label">En attente / désactivés</div></div>
      </div>

      <div class="row wrap">
        <input class="input" style="width:280px" placeholder="Nom, e-mail, identifiant…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
        <div class="tabs">
          @for (f of filters; track f.code) { <button [class.active]="role() === f.code" (click)="role.set(f.code)">{{ f.label }}</button> }
        </div>
      </div>

      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Utilisateur</th><th>E-mail</th><th>Département / promotion</th><th>Rôle</th><th>Statut</th><th>Créé le</th></tr></thead>
          <tbody>
            @for (u of list(); track u.id) {
              <tr>
                <td><div class="row"><span class="emoji-avatar" style="width:34px;height:34px;font-size:12px;font-weight:700">{{ u.firstName + ' ' + u.lastName | initials }}</span><div><b>{{ u.firstName }} {{ u.lastName }}</b><div class="mono muted">{{ u.username }}</div></div></div></td>
                <td class="small">{{ u.email }}</td>
                <td class="small">{{ u.department }} · {{ u.promotion }}</td>
                <td>
                  <select class="input" style="width:150px;padding:6px 10px" [ngModel]="u.role" (ngModelChange)="changeRole(u, $event)">
                    <option value="STUDENT">Étudiant</option><option value="TEACHER">Enseignant</option><option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td>
                  <button class="chip clickable" [class.green]="u.status === 'ACTIVE'" [class.yellow]="u.status === 'PENDING'" [class.pink]="u.status === 'DISABLED'" (click)="toggle(u)" title="Cliquer pour changer">
                    {{ u.status === 'ACTIVE' ? '● Actif' : u.status === 'PENDING' ? '◌ En attente' : '○ Désactivé' }}
                  </button>
                </td>
                <td class="small">{{ u.createdAt | date:'dd/MM/yyyy' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class UsersPage {
  private api = inject(AuthApi);
  private toast = inject(ToastService);
  users = signal<UserAccount[]>([]);
  q = signal('');
  role = signal<Role | 'ALL'>('ALL');
  filters: { code: Role | 'ALL'; label: string }[] = [
    { code: 'ALL', label: 'Tous' }, { code: 'STUDENT', label: 'Étudiants' }, { code: 'TEACHER', label: 'Enseignants' }, { code: 'ADMIN', label: 'Admins' },
  ];
  list = computed(() => this.users()
    .filter((u) => this.role() === 'ALL' || u.role === this.role())
    .filter((u) => `${u.firstName} ${u.lastName} ${u.email} ${u.username}`.toLowerCase().includes(this.q().toLowerCase())));
  pending = computed(() => this.users().filter((u) => u.status !== 'ACTIVE').length);

  constructor() { this.load(); }
  load() { this.api.users().subscribe((u) => this.users.set([...u])); }
  count(r: Role) { return this.users().filter((u) => u.role === r).length; }

  changeRole(u: UserAccount, role: Role) {
    this.api.changeRole(u.id, role).subscribe({
      next: () => { this.toast.success(`Rôle de ${u.firstName} : ${role} (user.role.changed publié)`); this.load(); },
      error: (e) => this.toast.fromError(e),
    });
  }

  toggle(u: UserAccount) {
    const next = u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    this.api.changeStatus(u.id, next).subscribe({
      next: () => { this.toast.success(`Compte ${next === 'ACTIVE' ? 'activé' : 'désactivé'}`); this.load(); },
      error: (e) => this.toast.fromError(e),
    });
  }
}
