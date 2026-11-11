// =====================================================================
// Modèles partagés : reprennent les contrats d'API des 6 microservices
// =====================================================================

export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

// ---------------------------------------------------------------- Auth Service
export interface UserAccount {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: 'ACTIVE' | 'PENDING' | 'DISABLED';
  department: string;
  promotion: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  token?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  role: Role;
}

// ---------------------------------------------------------------- Profiling Service
export type SkillType = 'PROGRAMMING' | 'DESIGN' | 'WRITING' | 'PROJECT_MANAGEMENT' | 'PUBLIC_SPEAKING';

export const SKILL_LABELS: Record<SkillType, string> = {
  PROGRAMMING: 'Programmation',
  DESIGN: 'Conception',
  WRITING: 'Rédaction',
  PROJECT_MANAGEMENT: 'Gestion de projet',
  PUBLIC_SPEAKING: 'Prise de parole',
};

export interface LearningStyle {
  activeReflective: number;   // -5 actif ... +5 réfléchi
  sensingIntuitive: number;   // -5 concret ... +5 intuitif
  visualVerbal: number;       // -5 visuel ... +5 verbal
  sequentialGlobal: number;   // -5 séquentiel ... +5 global
}

export interface StudentProfile {
  studentId: string;
  displayName: string;
  gpa: number;
  status: 'INCOMPLETE' | 'COMPLETE';
  completionRate: number;
  skills: Record<SkillType, number>;
  learningStyle: LearningStyle;
  interests: string[];
  availability: string[];
  updatedAt: string;
}

export interface CsvImport {
  id: number;
  fileName: string;
  rowsImported: number;
  rowsRejected: number;
  status: 'PENDING' | 'DONE' | 'FAILED';
  importedAt: string;
  importedBy: string;
}

export interface QuestionnaireQuestion {
  code: string;
  dimension: keyof LearningStyle;
  text: string;
  left: string;
  right: string;
}

// ---------------------------------------------------------------- Course / Group Service
export interface Course {
  id: number;
  code: string;
  title: string;
  className: string;
  teacherId: string;
  enrolledIds: string[];
}

export interface Project {
  id: number;
  courseId: number;
  title: string;
  description: string;
  groupSize: number;
  deadline: string;
}

export interface Deliverable {
  id: number;
  projectId: number;
  title: string;
  dueDate: string;
}

export interface Criteria {
  gpa: number;
  skills: number;
  styles: number;
  interests: number;
}

export type RequestStatus = 'PENDING' | 'RUNNING' | 'PROPOSED' | 'PUBLISHED' | 'FAILED';

export interface GroupingRequest {
  id: number;
  projectId: number;
  weights: Criteria;
  algorithm: string;
  groupSize: number;
  status: RequestStatus;
  requestedAt: string;
  jobId?: string;
}

export interface StudyGroup {
  id: number;
  projectId: number;
  requestId: number;
  name: string;
  memberIds: string[];
  status: 'PROPOSED' | 'PUBLISHED';
  qualityScore: number;
}

export interface Submission {
  id: number;
  deliverableId: number;
  groupId: number;
  submittedAt: string;
  submittedBy: string;
}

export interface Contribution {
  id: number;
  groupId: number;
  studentId: string;
  type: 'COMMIT' | 'DOCUMENT' | 'MEETING' | 'REVIEW';
  description: string;
  recordedAt: string;
}

// ---------------------------------------------------------------- ML Clustering Engine
export interface QualityMetrics {
  gpaStdDev: number;
  skillCoverage: number;
  diversityIndex: number;
  randomBaselineGain: number;
  silhouette: number;
}

export interface ProfileCluster {
  clusterId: number;
  label: string;
  size: number;
  color: string;
}

export interface ProjectedPoint {
  studentId: string;
  x: number;
  y: number;
  clusterId: number;
}

export interface ClusteringJob {
  id: string;
  requestId: number;
  algorithm: string;
  k: number;
  groupSize: number;
  weights: Criteria;
  seed: number;
  status: 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED';
  startedAt: string;
  finishedAt?: string;
  clusters: ProfileCluster[];
  points: ProjectedPoint[];
  groups: { groupIndex: number; studentIds: string[] }[];
  metrics: QualityMetrics;
}

export interface AlgorithmInfo {
  code: string;
  name: string;
  description: string;
}

export interface SimulationResult {
  optimized: QualityMetrics;
  random: QualityMetrics;
}

// ---------------------------------------------------------------- Gamification Service (DTO du backend)
export interface AvatarDTO { id: number; code: string; label: string; imageUrl: string; requiredLevel: number; }
export interface EmblemDTO { id: number; code: string; imageUrl: string; }
export interface LevelDTO { rank: number; name: string; minPoints: number; }

export interface PlayerDTO {
  studentId: string;
  displayName: string;
  avatar: AvatarDTO | null;
  totalPoints: number;
  level: LevelDTO;
  nextLevel: LevelDTO | null;
  progressToNextLevel: number;
  badgesCount: number;
  currentStreakDays: number;
  teamId: number | null;
}

export type EventType = 'PROFILE_COMPLETED' | 'GROUP_JOINED' | 'CONTRIBUTION_RECORDED' | 'DELIVERABLE_SUBMITTED'
  | 'KUDOS_RECEIVED' | 'DAILY_ACTIVITY' | 'BADGE_REWARD' | 'MANUAL';
export type BadgeCategory = 'PARTICIPATION' | 'COOPERATION' | 'REGULARITY' | 'DELIVERY';
export type ConditionType = 'FIRST_OCCURRENCE' | 'COUNT_THRESHOLD' | 'STREAK_DAYS' | 'ON_TIME';
export type RuleScope = 'STUDENT' | 'TEAM';

export interface BadgeRuleDTO { triggerEvent: EventType; conditionType: ConditionType; threshold: number; scope: RuleScope; }
export interface BadgeDTO {
  id: number; code: string; name: string; description: string; iconUrl: string;
  category: BadgeCategory; rewardPoints: number; active: boolean; rules: BadgeRuleDTO[];
}
export interface BadgeRequest {
  code: string; name: string; description: string; iconUrl: string;
  category: BadgeCategory; rewardPoints: number; rules: BadgeRuleDTO[];
}
export interface BadgeAwardDTO { badge: BadgeDTO; awardedAt: string; manual: boolean; }
export interface PointTransactionDTO { points: number; reason: EventType; sourceEventId: string; createdAt: string; }
export interface Page<T> { content: T[]; page?: { size: number; number: number; totalElements: number; totalPages: number }; }

export interface TeamDTO {
  id: number; groupId: number; courseId: number; name: string; emblem: EmblemDTO | null;
  totalPoints: number; progressPercent: number; memberIds: string[];
}
export interface MemberContributionDTO { studentId: string; displayName: string; avatarUrl: string | null; points: number; sharePercent: number; }
export interface TeamDashboardDTO {
  team: TeamDTO; deliverablesTotal: number; deliverablesSubmitted: number; onTimeDeliveries: number;
  contributions: MemberContributionDTO[]; teamBadges: BadgeDTO[];
}
export interface LeaderboardEntryDTO { rank: number; teamId: number; name: string; emblemUrl: string | null; totalPoints: number; progressPercent: number; }
export interface EngagementDTO { courseId: number; teamsCount: number; playersCount: number; activePlayersLast7Days: number; averageTeamPoints: number; badgesAwarded: number; }
export interface KudosDTO { id: number; fromStudentId: string; fromName: string; toStudentId: string; toName: string; message: string; createdAt: string; }

// ---------------------------------------------------------------- Analytics Service
export interface GroupBalance {
  groupId: number;
  name: string;
  avgGpa: number;
  skillCoverage: number;
  diversityIndex: number;
}

export interface BalanceReport {
  courseId: number;
  projectId: number;
  gpaStdDev: number;
  skillCoverage: number;
  diversityIndex: number;
  randomBaselineGpaStdDev: number;
  groups: GroupBalance[];
  computedAt: string;
}

export interface TeamEngagement {
  teamId: number;
  name: string;
  points: number;
  badges: number;
  activeRate: number;
  weekly: number[];
}

export interface CourseEngagement {
  courseId: number;
  teams: TeamEngagement[];
  activeRate: number;
  contributionsLast7Days: number;
  deliverablesOnTimeRate: number;
}

export interface PromotionSummary {
  promotionId: string;
  label: string;
  students: number;
  courses: number;
  groups: number;
  avgGpaStdDev: number;
  avgSkillCoverage: number;
  activeRate: number;
  classes: { className: string; groups: number; gpaStdDev: number; activeRate: number }[];
}

export interface AnalyticsReport {
  id: number;
  scope: 'COURSE' | 'CLASS' | 'PROMOTION';
  scopeId: string;
  period: string;
  status: 'PENDING' | 'READY' | 'FAILED';
  generatedAt: string;
}
