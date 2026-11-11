import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../environments/environment';
import { GamificationApi } from '../core/api/gamification-api.service';
import { Role } from '../core/models';
import { SessionService } from '../core/session.service';
import { MascotComponent } from '../shared/mascot.component';
import { EmojiPipe, InitialsPipe } from '../shared/visuals';

interface NavItem { icon: string; label: string; link: string; service: string; }
interface NavSection { title: string; items: NavItem[]; }

const NAV: Record<Role, NavSection[]> = {
  STUDENT: [
    { title: 'Apprentissage', items: [
      { icon: 'space_dashboard', label: 'Tableau de bord', link: '/app/dashboard', service: 'Gamification' },
      { icon: 'groups', label: 'Mon équipe', link: '/app/team', service: 'Course / Group · Gamification' },
      { icon: 'assignment', label: 'Livrables', link: '/app/projects', service: 'Course / Group' },
      { icon: 'leaderboard', label: 'Classement', link: '/app/leaderboard', service: 'Gamification' },
    ] },
    { title: 'Récompenses', items: [
      { icon: 'military_tech', label: 'Badges et points', link: '/app/badges', service: 'Gamification' },
      { icon: 'face', label: 'Avatar et niveaux', link: '/app/avatar', service: 'Gamification' },
    ] },
    { title: 'Compte', items: [
      { icon: 'person', label: 'Mon profil', link: '/app/profile', service: 'Profiling' },
      { icon: 'quiz', label: 'Questionnaire', link: '/app/questionnaire', service: 'Profiling' },
    ] },
  ],
  TEACHER: [
    { title: 'Pédagogie', items: [
      { icon: 'home', label: 'Accueil', link: '/app/teacher', service: 'Course / Group' },
      { icon: 'school', label: 'Modules et projets', link: '/app/courses', service: 'Course / Group' },
      { icon: 'badge', label: 'Profils étudiants', link: '/app/students', service: 'Profiling' },
      { icon: 'upload_file', label: 'Import CSV', link: '/app/imports', service: 'Profiling' },
    ] },
    { title: 'Intelligence', items: [
      { icon: 'hub', label: 'Laboratoire ML', link: '/app/clustering', service: 'ML Clustering' },
      { icon: 'insights', label: 'Analytics', link: '/app/analytics', service: 'Analytics' },
    ] },
    { title: 'Motivation', items: [
      { icon: 'military_tech', label: 'Gestion des badges', link: '/app/badges-admin', service: 'Gamification' },
      { icon: 'leaderboard', label: 'Classement', link: '/app/leaderboard', service: 'Gamification' },
    ] },
  ],
  ADMIN: [
    { title: 'Administration', items: [
      { icon: 'manage_accounts', label: 'Comptes et rôles', link: '/app/admin/users', service: 'Auth' },
      { icon: 'account_balance', label: 'Promotion et rapports', link: '/app/admin/promotion', service: 'Analytics' },
      { icon: 'insights', label: 'Indicateurs par module', link: '/app/analytics', service: 'Analytics' },
      { icon: 'military_tech', label: 'Gestion des badges', link: '/app/badges-admin', service: 'Gamification' },
    ] },
  ],
};

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MascotComponent, InitialsPipe, EmojiPipe],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  session = inject(SessionService);
  gamification = inject(GamificationApi);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  title = signal('');
  service = signal('');
  menuOpen = signal(false);
  sidebarOpen = signal(false);
  localMode = environment.auth.mode === 'local';
  avatarCode = signal<string | null>(null);

  nav = computed(() => NAV[this.session.role() ?? 'STUDENT']);
  roleLabel = computed(() => ({ STUDENT: 'Étudiant·e', TEACHER: 'Enseignant·e', ADMIN: 'Administration' })[this.session.role() ?? 'STUDENT']);
  demoAccounts = [
    { username: 'student1', label: 'Sara · étudiante' },
    { username: 'student2', label: 'Youssef · étudiant' },
    { username: 'teacher1', label: 'Amel · enseignante' },
    { username: 'admin1', label: 'Administration' },
  ];

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.updateTitle());
    this.updateTitle();
    if (this.session.role() === 'STUDENT') {
      this.gamification.me().subscribe({ next: (p) => this.avatarCode.set(p.avatar?.code ?? null), error: () => undefined });
    }
  }

  private updateTitle() {
    let r = this.route.snapshot;
    while (r.firstChild) r = r.firstChild;
    this.title.set(r.title ?? 'Groupify');
    const item = this.nav().flatMap((s) => s.items).find((i) => this.router.url.startsWith(i.link));
    this.service.set(item?.service ?? '');
    this.sidebarOpen.set(false);
  }

  switchTo(username: string) {
    this.menuOpen.set(false);
    this.session.loginAs(username).subscribe((u) => {
      this.router.navigateByUrl(this.session.homeFor(u.role)).then(() => location.reload());
    });
  }
}
