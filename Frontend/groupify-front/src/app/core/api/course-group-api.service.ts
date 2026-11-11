import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiError, mock } from '../mock/mock';
import { MockDb } from '../mock/mock-db';
import { Contribution, Course, Criteria, Deliverable, GroupingRequest, Project, StudyGroup, Submission } from '../models';
import { SessionService } from '../session.service';

/** Course / Group Service – /api/courses, /api/projects, /api/grouping-requests, /api/groups, /api/deliverables */
@Injectable({ providedIn: 'root' })
export class CourseGroupApi {
  private http = inject(HttpClient);
  private db = inject(MockDb);
  private session = inject(SessionService);
  private base = environment.apiUrl + '/api';
  private useMock = environment.mocks.courseGroup;

  // ---------------------------------------------------------------- modules
  courses(): Observable<Course[]> {
    if (!this.useMock) return this.http.get<Course[]>(`${this.base}/courses`);
    return mock(() => {
      const u = this.session.user()!;
      return u.role === 'TEACHER' ? this.db.courses.filter((c) => c.teacherId === u.id) : this.db.courses;
    });
  }

  course(id: number): Observable<Course> {
    if (!this.useMock) return this.http.get<Course>(`${this.base}/courses/${id}`);
    return mock(() => this.db.courses.find((c) => c.id === id) ?? apiError(404, 'Module introuvable'));
  }

  createCourse(c: Pick<Course, 'code' | 'title' | 'className'>): Observable<Course> {
    if (!this.useMock) return this.http.post<Course>(`${this.base}/courses`, c);
    return mock(() => {
      if (!c.code || !c.title) apiError(400, 'Code et intitulé obligatoires');
      const course: Course = { id: Math.max(0, ...this.db.courses.map((x) => x.id)) + 1, ...c, teacherId: this.session.user()!.id, enrolledIds: [] };
      this.db.courses.push(course);
      return course;
    });
  }

  enroll(courseId: number, studentIds: string[]): Observable<Course> {
    if (!this.useMock) return this.http.post<Course>(`${this.base}/courses/${courseId}/enrollments`, { studentIds });
    return mock(() => {
      const c = this.db.courses.find((x) => x.id === courseId) ?? apiError(404, 'Module introuvable');
      const already = studentIds.filter((id) => c.enrolledIds.includes(id));
      if (already.length === studentIds.length) apiError(409, 'Étudiant(s) déjà inscrit(s)');
      c.enrolledIds = [...new Set([...c.enrolledIds, ...studentIds])];
      return c;
    });
  }

  // ---------------------------------------------------------------- projets et livrables
  projects(courseId: number): Observable<Project[]> {
    if (!this.useMock) return this.http.get<Project[]>(`${this.base}/courses/${courseId}/projects`);
    return mock(() => this.db.projects.filter((p) => p.courseId === courseId));
  }

  createProject(p: Omit<Project, 'id'>): Observable<Project> {
    if (!this.useMock) return this.http.post<Project>(`${this.base}/projects`, p);
    return mock(() => {
      const project: Project = { ...p, id: Math.max(0, ...this.db.projects.map((x) => x.id)) + 1 };
      this.db.projects.push(project);
      return project;
    });
  }

  deliverables(projectId: number): Observable<Deliverable[]> {
    if (!this.useMock) return this.http.get<Deliverable[]>(`${this.base}/projects/${projectId}/deliverables`);
    return mock(() => this.db.deliverables.filter((d) => d.projectId === projectId));
  }

  submissions(groupId: number): Observable<Submission[]> {
    if (!this.useMock) return this.http.get<Submission[]>(`${this.base}/groups/${groupId}/submissions`);
    return mock(() => this.db.submissions.filter((s) => s.groupId === groupId));
  }

  submit(deliverableId: number, groupId: number): Observable<Submission> {
    if (!this.useMock) return this.http.post<Submission>(`${this.base}/deliverables/${deliverableId}/submissions`, { groupId });
    return mock(() => {
      if (this.db.submissions.some((s) => s.deliverableId === deliverableId && s.groupId === groupId)) apiError(409, 'Livrable déjà rendu');
      const sub: Submission = { id: this.db.submissions.length + 1, deliverableId, groupId, submittedAt: new Date().toISOString(), submittedBy: this.session.user()!.id };
      this.db.submissions.push(sub);
      // événement deliverable.submitted -> Gamification
      const d = this.db.deliverables.find((x) => x.id === deliverableId)!;
      const onTime = new Date(sub.submittedAt) <= new Date(d.dueDate);
      const g = this.db.groups.find((x) => x.id === groupId)!;
      g.memberIds.forEach((sid) => {
        this.db.credit(sid, groupId, onTime ? 30 : 10, 'DELIVERABLE_SUBMITTED', `sub-${sub.id}`);
        if (onTime) this.db.award(sid, 3);
      });
      return sub;
    }, 500);
  }

  // ---------------------------------------------------------------- groupes
  myGroup(): Observable<StudyGroup | null> {
    if (!this.useMock) return this.http.get<StudyGroup | null>(`${this.base}/groups/me`);
    return mock(() => this.db.teamOf(this.session.user()!.id) ?? null);
  }

  group(id: number): Observable<StudyGroup> {
    if (!this.useMock) return this.http.get<StudyGroup>(`${this.base}/groups/${id}`);
    return mock(() => this.db.groups.find((g) => g.id === id) ?? apiError(404, 'Groupe introuvable'));
  }

  groupsOfProject(projectId: number): Observable<StudyGroup[]> {
    if (!this.useMock) return this.http.get<StudyGroup[]>(`${this.base}/projects/${projectId}/groups`);
    return mock(() => this.db.groups.filter((g) => g.projectId === projectId));
  }

  contributions(groupId: number): Observable<Contribution[]> {
    if (!this.useMock) return this.http.get<Contribution[]>(`${this.base}/groups/${groupId}/contributions`);
    return mock(() => this.db.contributions.filter((c) => c.groupId === groupId).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)));
  }

  addContribution(groupId: number, type: Contribution['type'], description: string): Observable<Contribution> {
    if (!this.useMock) return this.http.post<Contribution>(`${this.base}/groups/${groupId}/contributions`, { type, description });
    return mock(() => {
      const c: Contribution = { id: this.db.contributions.length + 1, groupId, studentId: this.session.user()!.id, type, description, recordedAt: new Date().toISOString() };
      this.db.contributions.push(c);
      // événement contribution.recorded -> Gamification
      this.db.credit(c.studentId, groupId, 5, 'CONTRIBUTION_RECORDED', `contrib-${c.id}`);
      this.db.award(c.studentId, 2);
      return c;
    });
  }

  // ---------------------------------------------------------------- constitution des groupes
  requests(projectId: number): Observable<GroupingRequest[]> {
    if (!this.useMock) return this.http.get<GroupingRequest[]>(`${this.base}/projects/${projectId}/grouping-requests`);
    return mock(() => this.db.requests.filter((r) => r.projectId === projectId).sort((a, b) => b.id - a.id));
  }

  request(id: number): Observable<GroupingRequest> {
    if (!this.useMock) return this.http.get<GroupingRequest>(`${this.base}/grouping-requests/${id}`);
    return mock(() => this.db.requests.find((r) => r.id === id) ?? apiError(404, 'Demande introuvable'), 150);
  }

  /** 202 : le calcul est délégué au ML Clustering Engine (événement clustering.requested). */
  launchGrouping(projectId: number, weights: Criteria, algorithm: string, groupSize: number): Observable<GroupingRequest> {
    if (!this.useMock) return this.http.post<GroupingRequest>(`${this.base}/projects/${projectId}/grouping-requests`, { weights, algorithm, groupSize });
    return mock(() => {
      const project = this.db.projects.find((p) => p.id === projectId) ?? apiError(404, 'Projet introuvable');
      const course = this.db.courses.find((c) => c.id === project.courseId)!;
      const incomplete = course.enrolledIds.filter((id) => this.db.profile(id)?.status !== 'COMPLETE');
      if (course.enrolledIds.length - incomplete.length < groupSize) apiError(409, 'Pas assez de profils complets pour former des groupes');
      if (this.db.groups.some((g) => g.projectId === projectId && g.status === 'PUBLISHED')) apiError(409, 'Les groupes de ce projet sont déjà publiés');
      const req: GroupingRequest = {
        id: Math.max(0, ...this.db.requests.map((r) => r.id)) + 1, projectId, weights, algorithm, groupSize,
        status: 'RUNNING', requestedAt: new Date().toISOString(), jobId: `job-${String(this.db.jobs.length + 1).padStart(4, '0')}`,
      };
      this.db.requests.push(req);
      setTimeout(() => {
        // le ML publie clustering.completed -> groupes proposés
        const job = this.db.runClustering(req, course.enrolledIds.filter((id) => !incomplete.includes(id)), req.jobId!);
        this.db.jobs.push(job);
        this.db.groups = this.db.groups.filter((g) => !(g.projectId === projectId && g.status === 'PROPOSED'));
        const start = Math.max(0, ...this.db.groups.map((g) => g.id)) + 1;
        job.groups.forEach((g, i) => this.db.groups.push({
          id: start + i, projectId, requestId: req.id, name: `Groupe ${i + 1}`, memberIds: g.studentIds, status: 'PROPOSED',
          qualityScore: Math.round(70 + Math.random() * 25),
        }));
        req.status = 'PROPOSED';
      }, 2600);
      return req;
    }, 400);
  }

  moveMember(fromGroupId: number, toGroupId: number, studentId: string): Observable<StudyGroup[]> {
    if (!this.useMock) return this.http.put<StudyGroup[]>(`${this.base}/groups/${toGroupId}/members`, { studentId, fromGroupId });
    return mock(() => {
      const from = this.db.groups.find((g) => g.id === fromGroupId) ?? apiError(404, 'Groupe introuvable');
      const to = this.db.groups.find((g) => g.id === toGroupId) ?? apiError(404, 'Groupe introuvable');
      if (from.status === 'PUBLISHED') apiError(409, 'Groupes déjà publiés : modification impossible');
      from.memberIds = from.memberIds.filter((m) => m !== studentId);
      to.memberIds = [...to.memberIds, studentId];
      return [from, to];
    }, 150);
  }

  publish(projectId: number, requestId: number): Observable<StudyGroup[]> {
    if (!this.useMock) return this.http.post<StudyGroup[]>(`${this.base}/projects/${projectId}/groups/publish`, { requestId });
    return mock(() => {
      const req = this.db.requests.find((r) => r.id === requestId) ?? apiError(404, 'Demande introuvable');
      if (req.status !== 'PROPOSED') apiError(409, 'Aucune proposition à publier');
      const groups = this.db.groups.filter((g) => g.requestId === requestId);
      groups.forEach((g) => {
        g.status = 'PUBLISHED';
        // événement groups.published -> Gamification (+10 points par membre)
        g.memberIds.forEach((sid) => this.db.credit(sid, g.id, 10, 'GROUP_JOINED', `publish-${requestId}`));
      });
      req.status = 'PUBLISHED';
      return groups;
    }, 500);
  }
}
