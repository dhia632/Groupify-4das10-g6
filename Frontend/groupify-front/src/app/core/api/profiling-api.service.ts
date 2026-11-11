import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiError, mock } from '../mock/mock';
import { MockDb } from '../mock/mock-db';
import { CsvImport, QuestionnaireQuestion, SkillType, StudentProfile } from '../models';
import { SessionService } from '../session.service';

/** Profiling Service – /api/profiles, /api/imports */
@Injectable({ providedIn: 'root' })
export class ProfilingApi {
  private http = inject(HttpClient);
  private db = inject(MockDb);
  private session = inject(SessionService);
  private base = environment.apiUrl + '/api';
  private useMock = environment.mocks.profiling;

  readonly questions: QuestionnaireQuestion[] = [
    { code: 'Q1', dimension: 'activeReflective', text: 'Face à un nouveau sujet, je préfère…', left: 'Essayer tout de suite', right: 'Y réfléchir d\'abord' },
    { code: 'Q2', dimension: 'activeReflective', text: 'En équipe, je suis plutôt celui ou celle qui…', left: 'Lance les idées', right: 'Écoute puis synthétise' },
    { code: 'Q3', dimension: 'sensingIntuitive', text: 'Je retiens mieux…', left: 'Des faits et des exemples', right: 'Des concepts et des théories' },
    { code: 'Q4', dimension: 'sensingIntuitive', text: 'Je préfère les tâches…', left: 'Concrètes et précises', right: 'Ouvertes et créatives' },
    { code: 'Q5', dimension: 'visualVerbal', text: 'Pour comprendre une architecture, je préfère…', left: 'Un schéma', right: 'Une explication écrite' },
    { code: 'Q6', dimension: 'visualVerbal', text: 'Mes notes de cours contiennent surtout…', left: 'Des dessins, des couleurs', right: 'Du texte structuré' },
    { code: 'Q7', dimension: 'sequentialGlobal', text: 'Pour apprendre, j\'avance…', left: 'Étape par étape', right: 'Par vue d\'ensemble' },
    { code: 'Q8', dimension: 'sequentialGlobal', text: 'Face à un bug, je…', left: 'Teste ligne par ligne', right: 'Cherche le problème global' },
  ];

  me(): Observable<StudentProfile> {
    if (!this.useMock) return this.http.get<StudentProfile>(`${this.base}/profiles/me`);
    return mock(() => this.db.profile(this.session.user()!.id) ?? apiError(404, 'Profil introuvable'));
  }

  updateMe(p: StudentProfile): Observable<StudentProfile> {
    if (!this.useMock) return this.http.put<StudentProfile>(`${this.base}/profiles/me`, p);
    return mock(() => {
      const cur = this.db.profile(this.session.user()!.id) ?? apiError(404, 'Profil introuvable');
      if (p.gpa < 0 || p.gpa > 20) apiError(400, 'La moyenne doit être comprise entre 0 et 20');
      Object.assign(cur, p, { updatedAt: new Date().toISOString() });
      cur.completionRate = this.completion(cur);
      const wasComplete = cur.status === 'COMPLETE';
      cur.status = cur.completionRate === 100 ? 'COMPLETE' : 'INCOMPLETE';
      if (!wasComplete && cur.status === 'COMPLETE') {
        // événement profile.completed -> Gamification
        const team = this.db.teamOf(cur.studentId);
        this.db.credit(cur.studentId, team?.id ?? null, 20, 'PROFILE_COMPLETED', `profile-${cur.studentId}`);
        this.db.award(cur.studentId, 1);
      }
      return cur;
    });
  }

  submitQuestionnaire(answers: Record<string, number>): Observable<StudentProfile> {
    if (!this.useMock) return this.http.post<StudentProfile>(`${this.base}/profiles/me/questionnaire`, { answers });
    return mock(() => {
      const cur = this.db.profile(this.session.user()!.id) ?? apiError(404, 'Profil introuvable');
      const dims: Record<string, number[]> = {};
      this.questions.forEach((q) => (dims[q.dimension] = [...(dims[q.dimension] ?? []), answers[q.code] ?? 0]));
      Object.keys(dims).forEach((d) => ((cur.learningStyle as any)[d] = Math.round(dims[d].reduce((s, v) => s + v, 0) / dims[d].length)));
      cur.completionRate = this.completion(cur);
      cur.updatedAt = new Date().toISOString();
      return cur;
    }, 600);
  }

  all(): Observable<StudentProfile[]> {
    if (!this.useMock) return this.http.get<StudentProfile[]>(`${this.base}/profiles`);
    return mock(() => this.db.profiles);
  }

  byStudent(id: string): Observable<StudentProfile> {
    if (!this.useMock) return this.http.get<StudentProfile>(`${this.base}/profiles/${id}`);
    return mock(() => this.db.profile(id) ?? apiError(404, 'Profil introuvable'));
  }

  adjustSkills(id: string, skills: Record<SkillType, number>): Observable<StudentProfile> {
    if (!this.useMock) return this.http.patch<StudentProfile>(`${this.base}/profiles/${id}/skills`, skills);
    return mock(() => {
      const p = this.db.profile(id) ?? apiError(404, 'Profil introuvable');
      p.skills = { ...skills };
      return p;
    });
  }

  imports(): Observable<CsvImport[]> {
    if (!this.useMock) return this.http.get<CsvImport[]>(`${this.base}/imports`);
    return mock(() => [...this.db.imports].reverse());
  }

  upload(file: File): Observable<CsvImport> {
    if (!this.useMock) {
      const form = new FormData();
      form.append('file', file);
      return this.http.post<CsvImport>(`${this.base}/imports`, form);
    }
    return mock(() => {
      if (!file.name.toLowerCase().endsWith('.csv')) apiError(415, 'Seuls les fichiers .csv sont acceptés');
      const imp: CsvImport = {
        id: this.db.imports.length + 1, fileName: file.name, rowsImported: Math.max(1, Math.round(file.size / 120)), rowsRejected: 0,
        status: 'DONE', importedAt: new Date().toISOString(), importedBy: this.session.user()!.id,
      };
      this.db.imports.push(imp);
      return imp;
    }, 900);
  }

  private completion(p: StudentProfile): number {
    let score = 0;
    if (p.gpa > 0) score += 30;
    if (Object.values(p.skills).every((v) => v >= 1)) score += 30;
    if (Object.values(p.learningStyle).some((v) => v !== 0)) score += 20;
    if (p.interests.length > 0) score += 20;
    return score;
  }
}
