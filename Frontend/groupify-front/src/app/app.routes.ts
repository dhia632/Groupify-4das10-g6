import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', loadComponent: () => import('./pages/auth/login.page').then((m) => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./pages/auth/register.page').then((m) => m.RegisterPage) },
  {
    path: 'app',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      // ---------------------------------------------------------- Étudiant
      { path: 'dashboard', canActivate: [roleGuard('STUDENT')], title: 'Tableau de bord', loadComponent: () => import('./pages/student/dashboard.page').then((m) => m.DashboardPage) },
      { path: 'profile', canActivate: [roleGuard('STUDENT')], title: 'Mon profil', loadComponent: () => import('./pages/student/profile.page').then((m) => m.ProfilePage) },
      { path: 'questionnaire', canActivate: [roleGuard('STUDENT')], title: 'Questionnaire', loadComponent: () => import('./pages/student/questionnaire.page').then((m) => m.QuestionnairePage) },
      { path: 'team', canActivate: [roleGuard('STUDENT')], title: 'Mon équipe', loadComponent: () => import('./pages/student/team.page').then((m) => m.TeamPage) },
      { path: 'projects', canActivate: [roleGuard('STUDENT')], title: 'Livrables', loadComponent: () => import('./pages/student/projects.page').then((m) => m.ProjectsPage) },
      { path: 'badges', canActivate: [roleGuard('STUDENT')], title: 'Badges et points', loadComponent: () => import('./pages/student/badges.page').then((m) => m.BadgesPage) },
      { path: 'avatar', canActivate: [roleGuard('STUDENT')], title: 'Avatar et niveaux', loadComponent: () => import('./pages/student/avatar.page').then((m) => m.AvatarPage) },
      { path: 'leaderboard', canActivate: [roleGuard('STUDENT', 'TEACHER')], title: 'Classement', loadComponent: () => import('./pages/student/leaderboard.page').then((m) => m.LeaderboardPage) },
      // ---------------------------------------------------------- Enseignant
      { path: 'teacher', canActivate: [roleGuard('TEACHER')], title: 'Accueil enseignant', loadComponent: () => import('./pages/teacher/teacher-home.page').then((m) => m.TeacherHomePage) },
      { path: 'courses', canActivate: [roleGuard('TEACHER')], title: 'Modules', loadComponent: () => import('./pages/teacher/courses.page').then((m) => m.CoursesPage) },
      { path: 'courses/:id', canActivate: [roleGuard('TEACHER')], title: 'Module', loadComponent: () => import('./pages/teacher/course-detail.page').then((m) => m.CourseDetailPage) },
      { path: 'grouping/:projectId', canActivate: [roleGuard('TEACHER')], title: 'Constitution des groupes', loadComponent: () => import('./pages/teacher/grouping.page').then((m) => m.GroupingPage) },
      { path: 'students', canActivate: [roleGuard('TEACHER')], title: 'Profils étudiants', loadComponent: () => import('./pages/teacher/students.page').then((m) => m.StudentsPage) },
      { path: 'imports', canActivate: [roleGuard('TEACHER')], title: 'Import CSV', loadComponent: () => import('./pages/teacher/imports.page').then((m) => m.ImportsPage) },
      { path: 'clustering', canActivate: [roleGuard('TEACHER')], title: 'Laboratoire ML', loadComponent: () => import('./pages/teacher/clustering-lab.page').then((m) => m.ClusteringLabPage) },
      { path: 'badges-admin', canActivate: [roleGuard('TEACHER', 'ADMIN')], title: 'Gestion des badges', loadComponent: () => import('./pages/teacher/badges-admin.page').then((m) => m.BadgesAdminPage) },
      { path: 'analytics', canActivate: [roleGuard('TEACHER', 'ADMIN')], title: 'Analytics', loadComponent: () => import('./pages/teacher/analytics.page').then((m) => m.AnalyticsPage) },
      // ---------------------------------------------------------- Administration
      { path: 'admin/users', canActivate: [roleGuard('ADMIN')], title: 'Comptes et rôles', loadComponent: () => import('./pages/admin/users.page').then((m) => m.UsersPage) },
      { path: 'admin/promotion', canActivate: [roleGuard('ADMIN')], title: 'Promotion et rapports', loadComponent: () => import('./pages/admin/promotion.page').then((m) => m.PromotionPage) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
