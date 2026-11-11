import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApi } from '../../core/api/auth-api.service';
import { RegisterRequest } from '../../core/models';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, MascotComponent],
  styleUrl: './auth.css',
  template: `
    <div class="auth">
      <section class="hero">
        <span class="blob b1"></span><span class="blob b2"></span>
        <div class="brand"><app-mascot [size]="46" /> Groupify</div>
        <div style="position:relative;z-index:1">
          <h1>Rejoignez votre promotion.</h1>
          <p>Après l'inscription, votre profil d'apprentissage est créé automatiquement (événement <b>user.registered</b>). Complétez-le pour être placé dans un groupe.</p>
        </div>
        <div class="features">
          <div class="feature"><span class="mi">how_to_reg</span>1. Inscription</div>
          <div class="feature"><span class="mi">edit_note</span>2. Profil</div>
          <div class="feature"><span class="mi">groups</span>3. Équipe</div>
        </div>
      </section>
      <section class="form-side">
        <form class="card form-card" (ngSubmit)="submit()" #f="ngForm">
          <div>
            <h1>Créer un compte</h1>
            <p class="muted mt-s">Auth Service · POST /api/auth/register</p>
          </div>
          @if (error()) { <div class="err">{{ error() }}</div> }
          <div class="grid g-2" style="gap:12px">
            <div class="field"><label>Prénom</label><input class="input" name="firstName" [(ngModel)]="req.firstName" required /></div>
            <div class="field"><label>Nom</label><input class="input" name="lastName" [(ngModel)]="req.lastName" required /></div>
          </div>
          <div class="field"><label>E-mail</label><input class="input" type="email" name="email" [(ngModel)]="req.email" required email /></div>
          <div class="field"><label>Nom d'utilisateur</label><input class="input" name="username" [(ngModel)]="req.username" required minlength="3" /></div>
          <div class="field"><label>Mot de passe</label><input class="input" type="password" name="password" [(ngModel)]="req.password" required minlength="4" /></div>
          <div class="field">
            <label>Je suis</label>
            <div class="row">
              <button type="button" class="chip clickable" [class.selected]="req.role === 'STUDENT'" (click)="req.role = 'STUDENT'">🎓 Étudiant·e</button>
              <button type="button" class="chip clickable" [class.selected]="req.role === 'TEACHER'" (click)="req.role = 'TEACHER'">👩‍🏫 Enseignant·e</button>
            </div>
          </div>
          <button class="btn primary" type="submit" [disabled]="f.invalid || loading()"><span class="mi">how_to_reg</span> Créer mon compte</button>
          <p class="small muted center">Déjà inscrit·e ? <a routerLink="/login" class="bold" style="color:var(--orange-dark)">Se connecter</a></p>
        </form>
      </section>
    </div>
  `,
})
export class RegisterPage {
  private api = inject(AuthApi);
  private session = inject(SessionService);
  private toast = inject(ToastService);
  private router = inject(Router);
  req: RegisterRequest = { firstName: '', lastName: '', email: '', username: '', password: '', role: 'STUDENT' };
  loading = signal(false);
  error = signal<string | null>(null);

  submit() {
    this.loading.set(true);
    this.error.set(null);
    this.req.username = this.req.username.trim().toLowerCase();
    this.api.register(this.req).subscribe({
      next: (u) => {
        this.toast.success('Compte créé : bienvenue sur Groupify !');
        this.session.login(u.username, u.username).subscribe({
          next: (s) => this.router.navigateByUrl(s.role === 'STUDENT' ? '/app/profile' : this.session.homeFor(s.role)),
          error: () => this.router.navigateByUrl('/login'),
        });
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Inscription impossible');
      },
    });
  }
}
