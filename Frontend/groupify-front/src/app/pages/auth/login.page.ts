import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessionService } from '../../core/session.service';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, MascotComponent],
  styleUrl: './auth.css',
  template: `
    <div class="auth">
      <section class="hero">
        <span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span>
        <div class="brand"><app-mascot [size]="46" /> Groupify</div>
        <div style="position:relative;z-index:1">
          <h1>Des groupes équilibrés, une équipe motivée.</h1>
          <p>Profils multi-critères, constitution automatique par apprentissage non supervisé, suivi des projets et gamification responsable.</p>
        </div>
        <div class="features">
          <div class="feature"><span class="mi">person_search</span>Profil multi-critères</div>
          <div class="feature"><span class="mi">hub</span>Groupes hétérogènes</div>
          <div class="feature"><span class="mi">emoji_events</span>Badges d'équipe</div>
        </div>
      </section>

      <section class="form-side">
        <form class="card form-card" (ngSubmit)="submit()">
          <div>
            <h1>Connexion</h1>
            <p class="muted mt-s">
              @if (keycloak) { Authentification Keycloak (realm groupify). }
              @else { Mode démo : le mot de passe est identique au nom d'utilisateur. }
            </p>
          </div>
          @if (error()) { <div class="err">{{ error() }}</div> }
          <div class="field">
            <label for="u">Nom d'utilisateur</label>
            <input id="u" class="input" name="username" [(ngModel)]="username" autocomplete="username" required />
          </div>
          <div class="field">
            <label for="p">Mot de passe</label>
            <input id="p" class="input" type="password" name="password" [(ngModel)]="password" autocomplete="current-password" required />
          </div>
          <button class="btn primary" type="submit" [disabled]="loading()">
            <span class="mi">login</span> {{ loading() ? 'Connexion…' : 'Se connecter' }}
          </button>

          <div class="dashed-h"></div>
          <div class="small bold">Comptes de démonstration</div>
          <div class="demo">
            <button type="button" class="btn sm" (click)="quick('student1')">🦊 Sara · étudiante</button>
            <button type="button" class="btn sm" (click)="quick('student2')">🦉 Youssef · étudiant</button>
            <button type="button" class="btn sm" (click)="quick('teacher1')">👩‍🏫 Amel · enseignante</button>
            <button type="button" class="btn sm" (click)="quick('admin1')">🏛️ Administration</button>
          </div>
          <p class="small muted center">Pas encore de compte ? <a routerLink="/register" class="bold" style="color:var(--orange-dark)">Créer un compte</a></p>
        </form>
      </section>
    </div>
  `,
})
export class LoginPage {
  private session = inject(SessionService);
  private router = inject(Router);
  keycloak = environment.auth.mode === 'keycloak';
  username = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  quick(u: string) {
    this.username = u;
    this.password = u;
    this.submit();
  }

  submit() {
    this.loading.set(true);
    this.error.set(null);
    this.session.login(this.username, this.password).subscribe({
      next: (u) => this.router.navigateByUrl(this.session.homeFor(u.role)),
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.error_description ?? e?.message ?? 'Connexion impossible');
      },
    });
  }
}
