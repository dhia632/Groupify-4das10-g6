import { Injectable } from '@angular/core';
import {
  AnalyticsReport, AvatarDTO, BadgeAwardDTO, BadgeDTO, BalanceReport, ClusteringJob, Contribution, Course,
  CourseEngagement, Criteria, CsvImport, Deliverable, EmblemDTO, GroupingRequest, KudosDTO, LeaderboardEntryDTO,
  LevelDTO, PlayerDTO, PointTransactionDTO, ProfileCluster, Project, PromotionSummary, QualityMetrics, SkillType,
  StudentProfile, StudyGroup, Submission, TeamDashboardDTO, TeamDTO, UserAccount, EventType,
} from '../models';

/** Générateur pseudo-aléatoire à graine fixe : démonstration reproductible. */
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number, h = 10) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, 0, 0, 0); return d; };
const daysAhead = (n: number) => daysAgo(-n, 23);

const SKILLS: SkillType[] = ['PROGRAMMING', 'DESIGN', 'WRITING', 'PROJECT_MANAGEMENT', 'PUBLIC_SPEAKING'];
const FIRST = ['Sara', 'Youssef', 'Ines', 'Amine', 'Mariem', 'Hamza', 'Yasmine', 'Omar', 'Rania', 'Karim', 'Nour', 'Aziz',
  'Salma', 'Mehdi', 'Lina', 'Bilel', 'Eya', 'Wassim', 'Asma', 'Fares', 'Hiba', 'Skander', 'Molka', 'Rayen'];
const LAST = ['Ben Ali', 'Trabelsi', 'Gharbi', 'Jlassi', 'Fezai', 'Mansouri', 'Bouazizi', 'Hammami', 'Saidi', 'Chebbi',
  'Khelifi', 'Mejri', 'Ayari', 'Dridi', 'Zouari', 'Baccouche', 'Sassi', 'Ferchichi', 'Rekik', 'Mabrouk', 'Ghanmi', 'Toumi', 'Kammoun', 'Nasri'];
const INTERESTS = ['Web', 'IA / Data', 'Mobile', 'Cybersécurité', 'Cloud', 'UX / UI', 'Jeux vidéo', 'DevOps', 'IoT', 'Entrepreneuriat'];
const CLUSTER_META: { label: string; color: string; dominant: SkillType[] }[] = [
  { label: 'Moteurs techniques', color: '#3b82f6', dominant: ['PROGRAMMING'] },
  { label: 'Concepteurs', color: '#7b5ea7', dominant: ['DESIGN'] },
  { label: 'Organisateurs', color: '#2f9e5b', dominant: ['PROJECT_MANAGEMENT'] },
  { label: 'Communicants', color: '#f07b1a', dominant: ['WRITING', 'PUBLIC_SPEAKING'] },
];
const TEAM_NAMES = ['Les Pionniers', 'Data Squad', 'Code Owls', 'Pixel Rangers', 'Byte Force', 'Les Bâtisseurs', 'Cloud Nine', 'Team Kernel'];

@Injectable({ providedIn: 'root' })
export class MockDb {
  private rand = rng(2026);

  // ---------------------------------------------------------------- Auth
  users: UserAccount[] = [];
  // ---------------------------------------------------------------- Profiling
  profiles: StudentProfile[] = [];
  imports: CsvImport[] = [];
  // ---------------------------------------------------------------- Course / Group
  courses: Course[] = [];
  projects: Project[] = [];
  deliverables: Deliverable[] = [];
  requests: GroupingRequest[] = [];
  groups: StudyGroup[] = [];
  submissions: Submission[] = [];
  contributions: Contribution[] = [];
  // ---------------------------------------------------------------- ML Clustering
  jobs: ClusteringJob[] = [];
  // ---------------------------------------------------------------- Gamification
  levels: LevelDTO[] = [
    { rank: 1, name: 'Débutant', minPoints: 0 },
    { rank: 2, name: 'Contributeur', minPoints: 100 },
    { rank: 3, name: 'Collaborateur', minPoints: 250 },
    { rank: 4, name: 'Pilier', minPoints: 500 },
    { rank: 5, name: 'Mentor', minPoints: 1000 },
  ];
  avatars: AvatarDTO[] = [
    { id: 1, code: 'FOX', label: 'Renard', imageUrl: '', requiredLevel: 1 },
    { id: 2, code: 'OWL', label: 'Hibou', imageUrl: '', requiredLevel: 1 },
    { id: 3, code: 'CAT', label: 'Chat', imageUrl: '', requiredLevel: 1 },
    { id: 4, code: 'PANDA', label: 'Panda', imageUrl: '', requiredLevel: 1 },
    { id: 5, code: 'ROBOT', label: 'Robot', imageUrl: '', requiredLevel: 2 },
    { id: 6, code: 'ASTRONAUT', label: 'Astronaute', imageUrl: '', requiredLevel: 3 },
    { id: 7, code: 'DRAGON', label: 'Dragon', imageUrl: '', requiredLevel: 4 },
    { id: 8, code: 'PHOENIX', label: 'Phénix', imageUrl: '', requiredLevel: 5 },
  ];
  emblems: EmblemDTO[] = ['ROCKET', 'LIGHTNING', 'TREE', 'SHIELD', 'STAR', 'WAVE'].map((code, i) => ({ id: i + 1, code, imageUrl: '' }));
  badges: BadgeDTO[] = [
    this.badge(1, 'PROFILE_DONE', 'Profil complété', "A complété son profil d'apprentissage", 'PARTICIPATION', 10, 'PROFILE_COMPLETED', 'FIRST_OCCURRENCE', 1, 'STUDENT'),
    this.badge(2, 'FIRST_STEP', 'Première contribution', "Première contribution au projet de l'équipe", 'PARTICIPATION', 10, 'CONTRIBUTION_RECORDED', 'FIRST_OCCURRENCE', 1, 'STUDENT'),
    this.badge(3, 'ON_TIME', "Livrable à l'heure", "L'équipe a rendu un livrable avant l'échéance", 'DELIVERY', 15, 'DELIVERABLE_SUBMITTED', 'ON_TIME', 1, 'TEAM'),
    this.badge(4, 'HELPER', 'Entraide', 'A reçu 5 kudos de ses coéquipiers', 'COOPERATION', 25, 'KUDOS_RECEIVED', 'COUNT_THRESHOLD', 5, 'STUDENT'),
    this.badge(5, 'REGULAR', 'Régularité', "Actif 7 jours d'affilée", 'REGULARITY', 25, 'DAILY_ACTIVITY', 'STREAK_DAYS', 7, 'STUDENT'),
    this.badge(6, 'DREAM_TEAM', 'Équipe exemplaire', '3 livrables rendus à temps', 'COOPERATION', 40, 'DELIVERABLE_SUBMITTED', 'ON_TIME', 3, 'TEAM'),
  ];
  awards: { studentId: string; badgeId: number; awardedAt: string; manual: boolean }[] = [];
  history: { studentId: string; teamId: number | null; points: number; reason: EventType; sourceEventId: string; createdAt: string }[] = [];
  playerAvatar: Record<string, number> = {};
  teamEmblem: Record<number, number> = {};
  teamNameOverride: Record<number, string> = {};
  kudos: KudosDTO[] = [];
  // ---------------------------------------------------------------- Analytics
  reports: AnalyticsReport[] = [];

  constructor() {
    this.seedUsersAndProfiles();
    this.seedCourses();
    this.seedPublishedGrouping();
    this.seedGamification();
    this.reports = [
      { id: 1, scope: 'COURSE', scopeId: 'AWD', period: 'Semaine 4', status: 'READY', generatedAt: iso(daysAgo(2)) },
      { id: 2, scope: 'PROMOTION', scopeId: '4DAS', period: 'Novembre 2026', status: 'READY', generatedAt: iso(daysAgo(1)) },
    ];
  }

  // =================================================================== SEED
  private seedUsersAndProfiles() {
    for (let i = 0; i < 24; i++) {
      const id = `student${i + 1}`;
      const className = i < 16 ? '4DAS1' : '4DAS2';
      this.users.push({
        id, username: id, email: `${id}@groupify.tn`, firstName: FIRST[i], lastName: LAST[i], role: 'STUDENT',
        status: i === 23 ? 'PENDING' : 'ACTIVE', department: 'Informatique', promotion: '4DAS', createdAt: iso(daysAgo(40 - i)),
      });
      const cluster = i % 4;
      const skills = {} as Record<SkillType, number>;
      SKILLS.forEach((s) => {
        const dominant = CLUSTER_META[cluster].dominant.includes(s);
        skills[s] = Math.max(1, Math.min(5, Math.round((dominant ? 4.2 : 2.4) + (this.rand() - 0.5) * 2)));
      });
      const complete = i < 21;
      this.profiles.push({
        studentId: id,
        displayName: `${FIRST[i]} ${LAST[i]}`,
        gpa: round(9.5 + this.rand() * 8, 1),
        status: complete ? 'COMPLETE' : 'INCOMPLETE',
        completionRate: complete ? 100 : 40 + Math.round(this.rand() * 40),
        skills,
        learningStyle: {
          activeReflective: Math.round((this.rand() - 0.5) * 10),
          sensingIntuitive: Math.round((this.rand() - 0.5) * 10),
          visualVerbal: Math.round((this.rand() - 0.5) * 10),
          sequentialGlobal: Math.round((this.rand() - 0.5) * 10),
        },
        interests: INTERESTS.filter(() => this.rand() > 0.72).slice(0, 4),
        availability: ['Lundi soir', 'Mercredi après-midi', 'Samedi matin'].filter(() => this.rand() > 0.4),
        updatedAt: iso(daysAgo(Math.round(this.rand() * 20))),
      });
    }
    this.profiles[0].displayName = 'Sara Ben Ali';
    this.users.push(
      { id: 'teacher1', username: 'teacher1', email: 'teacher1@groupify.tn', firstName: 'Amel', lastName: 'Haddad', role: 'TEACHER', status: 'ACTIVE', department: 'Informatique', promotion: '-', createdAt: iso(daysAgo(90)) },
      { id: 'teacher2', username: 'teacher2', email: 'teacher2@groupify.tn', firstName: 'Nizar', lastName: 'Belhadj', role: 'TEACHER', status: 'ACTIVE', department: 'Informatique', promotion: '-', createdAt: iso(daysAgo(80)) },
      { id: 'admin1', username: 'admin1', email: 'admin1@groupify.tn', firstName: 'Admin', lastName: 'Groupify', role: 'ADMIN', status: 'ACTIVE', department: 'Direction des études', promotion: '-', createdAt: iso(daysAgo(120)) },
    );
    this.imports = [
      { id: 1, fileName: 'uci_student_performance_extrait.csv', rowsImported: 16, rowsRejected: 1, status: 'DONE', importedAt: iso(daysAgo(12)), importedBy: 'teacher1' },
      { id: 2, fileName: 'profils_synthetiques_seed42.csv', rowsImported: 8, rowsRejected: 0, status: 'DONE', importedAt: iso(daysAgo(6)), importedBy: 'teacher1' },
    ];
  }

  private seedCourses() {
    const awdStudents = this.users.filter((u) => u.role === 'STUDENT').slice(0, 24).map((u) => u.id);
    this.courses = [
      { id: 1, code: 'AWD', title: 'Applications Web Distribuées', className: '4DAS', teacherId: 'teacher1', enrolledIds: awdStudents },
      { id: 2, code: 'ML', title: 'Machine Learning appliqué', className: '4DAS1', teacherId: 'teacher1', enrolledIds: awdStudents.slice(0, 16) },
      { id: 3, code: 'PJT', title: 'Projet intégré', className: '4DAS2', teacherId: 'teacher2', enrolledIds: awdStudents.slice(16) },
    ];
    this.projects = [
      { id: 1, courseId: 1, title: 'Mini-projet microservices', description: 'Application web complète en architecture microservices (Spring Cloud).', groupSize: 4, deadline: iso(daysAhead(42)) },
      { id: 2, courseId: 2, title: 'Projet clustering', description: 'Segmentation non supervisée sur un jeu de données public.', groupSize: 4, deadline: iso(daysAhead(28)) },
      { id: 3, courseId: 3, title: 'Projet intégré', description: 'Projet de fin de semestre en équipe.', groupSize: 4, deadline: iso(daysAhead(60)) },
    ];
    this.deliverables = [
      { id: 1, projectId: 1, title: 'Conception (séance 4)', dueDate: iso(daysAgo(1, 23)) },
      { id: 2, projectId: 1, title: 'API Gateway et Eureka (séance 5)', dueDate: iso(daysAhead(7)) },
      { id: 3, projectId: 1, title: 'Communication asynchrone (séance 7)', dueDate: iso(daysAhead(21)) },
      { id: 4, projectId: 1, title: 'Soutenance finale (séance 10)', dueDate: iso(daysAhead(42)) },
      { id: 5, projectId: 2, title: 'Rapport d\'analyse', dueDate: iso(daysAhead(14)) },
    ];
  }

  private seedPublishedGrouping() {
    const req: GroupingRequest = {
      id: 1, projectId: 1, weights: { gpa: 40, skills: 30, styles: 15, interests: 15 }, algorithm: 'KMEANS_STRATIFIED',
      groupSize: 4, status: 'PUBLISHED', requestedAt: iso(daysAgo(8)), jobId: 'job-0001',
    };
    this.requests.push(req);
    const job = this.runClustering(req, this.courses[0].enrolledIds.filter((id) => this.profile(id)?.status === 'COMPLETE'), 'job-0001', daysAgo(8));
    this.jobs.push(job);
    job.groups.forEach((g, i) => {
      this.groups.push({
        id: i + 1, projectId: 1, requestId: 1, name: TEAM_NAMES[i], memberIds: g.studentIds,
        status: 'PUBLISHED', qualityScore: round(70 + this.rand() * 25, 0),
      });
    });
    // garantir que student1 et student2 sont dans la première équipe (comme le scénario backend)
    const g1 = this.groups[0];
    ['student1', 'student2'].forEach((sid) => {
      const other = this.groups.find((g) => g.memberIds.includes(sid));
      if (other && other !== g1) {
        const swap = g1.memberIds.find((m) => m !== 'student1' && m !== 'student2')!;
        other.memberIds = other.memberIds.map((m) => (m === sid ? swap : m));
        g1.memberIds = g1.memberIds.map((m) => (m === swap ? sid : m));
      }
    });
    // soumissions et contributions
    this.groups.forEach((g, i) => {
      if (i !== 4) this.submissions.push({ id: this.submissions.length + 1, deliverableId: 1, groupId: g.id, submittedAt: iso(daysAgo(i < 3 ? 2 : 1, 18)), submittedBy: g.memberIds[0] });
      g.memberIds.forEach((sid, j) => {
        const n = 2 + Math.round(this.rand() * 5);
        for (let k = 0; k < n; k++) {
          const types: Contribution['type'][] = ['COMMIT', 'DOCUMENT', 'MEETING', 'REVIEW'];
          const t = types[Math.floor(this.rand() * 4)];
          this.contributions.push({
            id: this.contributions.length + 1, groupId: g.id, studentId: sid, type: t,
            description: { COMMIT: 'Commit sur le microservice', DOCUMENT: 'Mise à jour du README', MEETING: 'Réunion d\'équipe', REVIEW: 'Revue de pull request' }[t],
            recordedAt: iso(daysAgo(Math.floor(this.rand() * 14), 9 + j)),
          });
        }
      });
    });
  }

  private seedGamification() {
    this.groups.forEach((g) => (this.teamEmblem[g.id] = ((g.id - 1) % 6) + 1));
    this.playerAvatar['student1'] = 1;
    // événements historiques -> points
    for (const g of this.groups) {
      for (const sid of g.memberIds) {
        this.credit(sid, g.id, 10, 'GROUP_JOINED', `seed-group-${g.id}`, daysAgo(8));
        if (this.profile(sid)?.status === 'COMPLETE') {
          this.credit(sid, g.id, 20, 'PROFILE_COMPLETED', `seed-profile-${sid}`, daysAgo(9));
          this.award(sid, 1, daysAgo(9));
        }
      }
    }
    for (const c of this.contributions) {
      this.credit(c.studentId, c.groupId, 5, 'CONTRIBUTION_RECORDED', `seed-contrib-${c.id}`, new Date(c.recordedAt));
    }
    for (const s of this.submissions) {
      const g = this.groups.find((x) => x.id === s.groupId)!;
      g.memberIds.forEach((sid) => {
        this.credit(sid, g.id, 30, 'DELIVERABLE_SUBMITTED', `seed-sub-${s.id}`, new Date(s.submittedAt));
        this.award(sid, 3, new Date(s.submittedAt));
      });
    }
    // jours d'activité de student1 sur le mois (calendrier)
    [1, 2, 3, 5, 6, 8, 9, 10, 12, 13, 15, 16, 17].forEach((d) =>
      this.credit('student1', 1, 2, 'DAILY_ACTIVITY', `seed-daily-${d}`, daysAgo(d)));
    this.award('student1', 2, daysAgo(7));
    // kudos reçus
    const mates = this.groups[0].memberIds.filter((m) => m !== 'student1');
    [[mates[0], 'student1', 'Merci pour ton aide sur le diagramme !'], [mates[1], 'student1', 'Super explication de RabbitMQ'],
     ['student1', mates[0], 'Bravo pour la Gateway'], [mates[2], 'student1', 'Merci pour la revue de code']].forEach(([from, to, msg], i) => {
      this.kudos.push({ id: i + 1, fromStudentId: from, fromName: this.name(from), toStudentId: to, toName: this.name(to), message: msg, createdAt: iso(daysAgo(6 - i)) });
      this.credit(to, 1, 5, 'KUDOS_RECEIVED', `kudos:${i + 1}`, daysAgo(6 - i));
    });
  }

  private badge(id: number, code: string, name: string, description: string, category: BadgeDTO['category'], reward: number,
                trigger: EventType, condition: BadgeDTO['rules'][0]['conditionType'], threshold: number, scope: 'STUDENT' | 'TEAM'): BadgeDTO {
    return { id, code, name, description, iconUrl: '', category, rewardPoints: reward, active: true, rules: [{ triggerEvent: trigger, conditionType: condition, threshold, scope }] };
  }

  // =================================================================== HELPERS
  profile(id: string) { return this.profiles.find((p) => p.studentId === id); }
  user(id: string) { return this.users.find((u) => u.id === id); }
  name(id: string) { const u = this.user(id); return u ? `${u.firstName} ${u.lastName}` : id; }
  teamOf(studentId: string) { return this.groups.find((g) => g.status === 'PUBLISHED' && g.memberIds.includes(studentId)); }

  credit(studentId: string, teamId: number | null, points: number, reason: EventType, sourceEventId: string, at = new Date()) {
    if (this.history.some((h) => h.studentId === studentId && h.sourceEventId === sourceEventId)) return false;
    this.history.push({ studentId, teamId, points, reason, sourceEventId, createdAt: iso(at) });
    return true;
  }
  award(studentId: string, badgeId: number, at = new Date(), manual = false) {
    if (this.awards.some((a) => a.studentId === studentId && a.badgeId === badgeId)) return false;
    this.awards.push({ studentId, badgeId, awardedAt: iso(at), manual });
    const b = this.badges.find((x) => x.id === badgeId)!;
    const team = this.teamOf(studentId);
    if (b.rewardPoints > 0) this.credit(studentId, team?.id ?? null, b.rewardPoints, 'BADGE_REWARD', `badge:${b.code}`, at);
    return true;
  }

  // =================================================================== ML : clustering + répartition
  clusterOf(p: StudentProfile): number {
    let best = 0, bestScore = -1;
    CLUSTER_META.forEach((c, i) => {
      const score = c.dominant.reduce((s, sk) => s + p.skills[sk], 0) / c.dominant.length;
      if (score > bestScore) { bestScore = score; best = i; }
    });
    return best;
  }

  runClustering(req: GroupingRequest, studentIds: string[], jobId: string, at = new Date()): ClusteringJob {
    const r = rng(req.id * 97 + studentIds.length);
    const profs = studentIds.map((id) => this.profile(id)!).filter(Boolean);
    const k = 4;
    const points = profs.map((p) => {
      const c = this.clusterOf(p);
      const tech = p.skills.PROGRAMMING + p.skills.DESIGN - p.skills.WRITING - p.skills.PUBLIC_SPEAKING;
      const orga = p.skills.PROJECT_MANAGEMENT * 1.5 - p.skills.DESIGN + p.gpa / 4;
      return { studentId: p.studentId, x: round(tech + (r() - 0.5) * 1.6, 2), y: round(orga + (r() - 0.5) * 1.6, 2), clusterId: c };
    });
    const clusters: ProfileCluster[] = CLUSTER_META.map((m, i) => ({ clusterId: i, label: m.label, color: m.color, size: points.filter((p) => p.clusterId === i).length }));
    // répartition stratifiée : chaque groupe reçoit à tour de rôle un étudiant de chaque profil
    const nGroups = Math.max(1, Math.round(profs.length / req.groupSize));
    const ordered = [...points].sort((a, b) => a.clusterId - b.clusterId || this.profile(b.studentId)!.gpa - this.profile(a.studentId)!.gpa);
    const groups = Array.from({ length: nGroups }, (_, i) => ({ groupIndex: i, studentIds: [] as string[] }));
    let dir = 1, gi = 0;
    for (const p of ordered) {
      groups[gi].studentIds.push(p.studentId);
      gi += dir;
      if (gi === nGroups) { gi = nGroups - 1; dir = -1; } else if (gi < 0) { gi = 0; dir = 1; }
    }
    const metrics = this.metrics(groups.map((g) => g.studentIds), k, req.weights);
    const randomMetrics = this.randomMetrics(studentIds, nGroups, k, req.weights);
    metrics.randomBaselineGain = round(randomMetrics.gpaStdDev > 0 ? (1 - metrics.gpaStdDev / randomMetrics.gpaStdDev) * 100 : 0, 0);
    return {
      id: jobId, requestId: req.id, algorithm: req.algorithm, k, groupSize: req.groupSize, weights: req.weights, seed: 42,
      status: 'DONE', startedAt: iso(at), finishedAt: iso(new Date(at.getTime() + 2400)), clusters, points, groups, metrics,
    };
  }

  metrics(groups: string[][], k: number, _w?: Criteria): QualityMetrics {
    const means = groups.map((g) => g.reduce((s, id) => s + this.profile(id)!.gpa, 0) / Math.max(1, g.length));
    const avg = means.reduce((s, v) => s + v, 0) / Math.max(1, means.length);
    const std = Math.sqrt(means.reduce((s, v) => s + (v - avg) ** 2, 0) / Math.max(1, means.length));
    const coverage = groups.reduce((s, g) => s + SKILLS.filter((sk) => g.some((id) => this.profile(id)!.skills[sk] >= 4)).length / SKILLS.length, 0) / Math.max(1, groups.length);
    const diversity = groups.reduce((s, g) => s + new Set(g.map((id) => this.clusterOf(this.profile(id)!))).size / Math.min(k, g.length || 1), 0) / Math.max(1, groups.length);
    return { gpaStdDev: round(std), skillCoverage: round(coverage * 100, 0), diversityIndex: round(diversity, 2), randomBaselineGain: 0, silhouette: 0.41 };
  }

  randomMetrics(ids: string[], nGroups: number, k: number, w?: Criteria): QualityMetrics {
    const r = rng(7);
    const shuffled = [...ids].sort(() => r() - 0.5);
    const groups = Array.from({ length: nGroups }, (_, i) => shuffled.filter((_, j) => j % nGroups === i));
    return this.metrics(groups, k, w);
  }

  // =================================================================== Gamification : vues calculées
  levelFor(points: number) { return [...this.levels].reverse().find((l) => points >= l.minPoints) ?? this.levels[0]; }
  pointsOf(studentId: string) { return this.history.filter((h) => h.studentId === studentId).reduce((s, h) => s + h.points, 0); }

  playerDto(studentId: string): PlayerDTO {
    const pts = this.pointsOf(studentId);
    const level = this.levelFor(pts);
    const next = this.levels.find((l) => l.minPoints > pts) ?? null;
    const progress = next ? round((pts - level.minPoints) / (next.minPoints - level.minPoints)) : 1;
    const avatarId = this.playerAvatar[studentId];
    return {
      studentId, displayName: this.name(studentId), avatar: this.avatars.find((a) => a.id === avatarId) ?? null,
      totalPoints: pts, level, nextLevel: next, progressToNextLevel: progress,
      badgesCount: this.awards.filter((a) => a.studentId === studentId).length,
      currentStreakDays: studentId === 'student1' ? 3 : Math.floor(this.rand() * 4), teamId: this.teamOf(studentId)?.id ?? null,
    };
  }

  myBadges(studentId: string): BadgeAwardDTO[] {
    return this.awards.filter((a) => a.studentId === studentId)
      .sort((a, b) => b.awardedAt.localeCompare(a.awardedAt))
      .map((a) => ({ badge: this.badges.find((b) => b.id === a.badgeId)!, awardedAt: a.awardedAt, manual: a.manual }));
  }

  historyOf(studentId: string): PointTransactionDTO[] {
    return this.history.filter((h) => h.studentId === studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(({ points, reason, sourceEventId, createdAt }) => ({ points, reason, sourceEventId, createdAt }));
  }

  teamPoints(teamId: number) { return this.history.filter((h) => h.teamId === teamId).reduce((s, h) => s + h.points, 0); }

  teamDto(teamId: number): TeamDTO {
    const g = this.groups.find((x) => x.id === teamId)!;
    const total = this.deliverables.filter((d) => d.projectId === g.projectId).length;
    const done = this.submissions.filter((s) => s.groupId === teamId).length;
    return {
      id: g.id, groupId: g.id, courseId: this.projects.find((p) => p.id === g.projectId)!.courseId,
      name: this.teamNameOverride[g.id] ?? g.name, emblem: this.emblems.find((e) => e.id === this.teamEmblem[g.id]) ?? null,
      totalPoints: this.teamPoints(g.id), progressPercent: total ? round((done / total) * 100, 1) : 0, memberIds: g.memberIds,
    };
  }

  teamDashboard(teamId: number): TeamDashboardDTO {
    const team = this.teamDto(teamId);
    const per = team.memberIds.map((sid) => ({ sid, pts: this.history.filter((h) => h.teamId === teamId && h.studentId === sid).reduce((s, h) => s + h.points, 0) }));
    const total = per.reduce((s, p) => s + p.pts, 0);
    const g = this.groups.find((x) => x.id === teamId)!;
    const onTime = this.submissions.filter((s) => s.groupId === teamId).length;
    return {
      team,
      deliverablesTotal: this.deliverables.filter((d) => d.projectId === g.projectId).length,
      deliverablesSubmitted: onTime, onTimeDeliveries: onTime,
      contributions: per.map((p) => ({ studentId: p.sid, displayName: this.name(p.sid), avatarUrl: null, points: p.pts, sharePercent: total ? round((p.pts / total) * 100, 1) : 0 })),
      teamBadges: onTime > 0 ? [this.badges[2]] : [],
    };
  }

  leaderboard(courseId: number): LeaderboardEntryDTO[] {
    return this.groups.filter((g) => g.status === 'PUBLISHED' && this.projects.find((p) => p.id === g.projectId)?.courseId === courseId)
      .map((g) => this.teamDto(g.id))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((t, i) => ({ rank: i + 1, teamId: t.id, name: t.name, emblemUrl: t.emblem?.code ?? null, totalPoints: t.totalPoints, progressPercent: t.progressPercent }));
  }

  // =================================================================== Analytics : vues calculées
  balance(courseId: number): BalanceReport {
    const project = this.projects.find((p) => p.courseId === courseId)!;
    const groups = this.groups.filter((g) => g.projectId === project?.id && g.status === 'PUBLISHED');
    const m = this.metrics(groups.map((g) => g.memberIds), 4);
    const rm = this.randomMetrics(groups.flatMap((g) => g.memberIds), Math.max(1, groups.length), 4);
    return {
      courseId, projectId: project?.id, gpaStdDev: m.gpaStdDev, skillCoverage: m.skillCoverage, diversityIndex: m.diversityIndex,
      randomBaselineGpaStdDev: rm.gpaStdDev, computedAt: iso(new Date()),
      groups: groups.map((g) => {
        const gm = this.metrics([g.memberIds], 4);
        return { groupId: g.id, name: this.teamNameOverride[g.id] ?? g.name, avgGpa: round(g.memberIds.reduce((s, id) => s + this.profile(id)!.gpa, 0) / g.memberIds.length, 1), skillCoverage: gm.skillCoverage, diversityIndex: gm.diversityIndex };
      }),
    };
  }

  engagement(courseId: number): CourseEngagement {
    const board = this.leaderboard(courseId);
    const teams = board.map((b) => {
      const weekly = [0, 1, 2, 3].map((w) => this.history.filter((h) => h.teamId === b.teamId && this.weekIndex(h.createdAt) === 3 - w).reduce((s, h) => s + h.points, 0)).reverse();
      const members = this.groups.find((g) => g.id === b.teamId)!.memberIds;
      const active = members.filter((sid) => this.contributions.some((c) => c.studentId === sid && Date.now() - new Date(c.recordedAt).getTime() < 7 * 864e5)).length;
      return { teamId: b.teamId, name: b.name, points: b.totalPoints, badges: this.awards.filter((a) => members.includes(a.studentId)).length, activeRate: round((active / members.length) * 100, 0), weekly };
    });
    const subs = this.submissions.length;
    return {
      courseId, teams,
      activeRate: round(teams.reduce((s, t) => s + t.activeRate, 0) / Math.max(1, teams.length), 0),
      contributionsLast7Days: this.contributions.filter((c) => Date.now() - new Date(c.recordedAt).getTime() < 7 * 864e5).length,
      deliverablesOnTimeRate: round((subs / Math.max(1, this.groups.filter((g) => g.projectId === 1).length)) * 100, 0),
    };
  }

  private weekIndex(isoDate: string) { return Math.floor((Date.now() - new Date(isoDate).getTime()) / (7 * 864e5)); }

  promotion(promotionId: string): PromotionSummary {
    const b = this.balance(1);
    const e = this.engagement(1);
    return {
      promotionId, label: 'Promotion 4DAS 2026-2027', students: this.users.filter((u) => u.role === 'STUDENT').length,
      courses: this.courses.length, groups: this.groups.length, avgGpaStdDev: b.gpaStdDev, avgSkillCoverage: b.skillCoverage, activeRate: e.activeRate,
      classes: [
        { className: '4DAS1', groups: 4, gpaStdDev: round(b.gpaStdDev * 0.9), activeRate: e.activeRate + 4 },
        { className: '4DAS2', groups: 2, gpaStdDev: round(b.gpaStdDev * 1.2), activeRate: Math.max(0, e.activeRate - 9) },
      ],
    };
  }
}
