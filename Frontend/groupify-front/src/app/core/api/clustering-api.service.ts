import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiError, mock } from '../mock/mock';
import { MockDb } from '../mock/mock-db';
import { AlgorithmInfo, ClusteringJob, Criteria, SimulationResult } from '../models';

/** Corps JSON envoyé à POST /api/clustering/demandes (noms identiques à FastAPI). */
export interface DemandeRequest {
  idCours: number;
  idEnseignant: number;
  algorithme: string;          // ex. 'KMEANS'
  nombreGroupes: number;
  tailleGroupe: number;
  graineAleatoire: number;
  criteres: Record<string, unknown>[];
}

/** Réponse d'une demande. Les autres champs sont acceptés (voir Swagger). */
export interface Demande {
  id: number;
  etat: string;                // EN_ATTENTE, PROPOSE, ...
  [key: string]: any;
}

/** ML Clustering Engine (Python · FastAPI) – /api/clustering */
@Injectable({ providedIn: 'root' })
export class ClusteringApi {
  private http = inject(HttpClient);
  private db = inject(MockDb);
  private base: string = environment.apiUrl + '/api/clustering';
  private demandesUrl: string = this.base + '/demandes';
  private useMock = environment.mocks.clustering;

  // ---------------------------------------------------------------
  // 1) VRAIS ENDPOINTS FastAPI  (/api/clustering/demandes ...)
  //    Ils appellent toujours le backend (pas de mock).
  // ---------------------------------------------------------------

  createDemande(body: DemandeRequest): Observable<Demande> {
    return this.http.post<Demande>(this.demandesUrl, body);
  }

  listDemandes(): Observable<Demande[]> {
    return this.http.get<Demande[]>(this.demandesUrl);
  }

  getDemande(id: number): Observable<Demande> {
    return this.http.get<Demande>(this.demandesUrl + '/' + id);
  }

  deleteDemande(id: number): Observable<void> {
    return this.http.delete<void>(this.demandesUrl + '/' + id);
  }

  executer(id: number): Observable<any> {
    return this.http.post<any>(this.demandesUrl + '/' + id + '/executer', {});
  }

  groupes(id: number): Observable<any> {
    return this.http.get<any>(this.demandesUrl + '/' + id + '/groupes');
  }

  clusters(id: number): Observable<any> {
    return this.http.get<any>(this.demandesUrl + '/' + id + '/clusters');
  }

  qualite(id: number): Observable<any> {
    return this.http.get<any>(this.demandesUrl + '/' + id + '/qualite');
  }

  explication(id: number, idEtudiant: number): Observable<any> {
    return this.http.get<any>(this.demandesUrl + '/' + id + '/etudiants/' + idEtudiant + '/explication');
  }

  /** Corps à vérifier dans Swagger (PUT /deplacer). */
  deplacer(id: number, body: Record<string, unknown>): Observable<any> {
    return this.http.put<any>(this.demandesUrl + '/' + id + '/deplacer', body);
  }

  valider(id: number): Observable<any> {
    return this.http.post<any>(this.demandesUrl + '/' + id + '/valider', {});
  }

  // ---------------------------------------------------------------
  // 2) ANCIENNES METHODES (page « Laboratoire ML »)
  //    Elles marchent avec les mocks. Attention : /algorithms, /jobs
  //    et /simulate n'existent pas encore dans FastAPI.
  // ---------------------------------------------------------------

  algorithms(): Observable<AlgorithmInfo[]> {
    if (!this.useMock) return this.http.get<AlgorithmInfo[]>(this.base + '/algorithms');
    return mock(() => [
      { code: 'KMEANS_STRATIFIED', name: 'k-means + répartition stratifiée', description: 'Profils types sur les attributs numériques, puis un représentant de chaque profil par groupe.' },
      { code: 'KPROTOTYPES_STRATIFIED', name: 'k-prototypes + répartition stratifiée', description: 'Mélange attributs numériques et catégoriels (centres d\'intérêt).' },
      { code: 'ANTICLUSTERING', name: 'Anticlustering', description: 'Maximise la diversité à l\'intérieur des groupes, recherche locale par échanges.' },
    ]);
  }

  jobs(): Observable<ClusteringJob[]> {
    if (!this.useMock) return this.http.get<ClusteringJob[]>(this.base + '/jobs');
    return mock(() => [...this.db.jobs].reverse());
  }

  job(id: string): Observable<ClusteringJob> {
    if (!this.useMock) return this.http.get<ClusteringJob>(this.base + '/jobs/' + id);
    return mock(() => this.db.jobs.find((j) => j.id === id) ?? apiError(404, 'Job introuvable'));
  }

  /** Compare la répartition optimisée à une répartition aléatoire. */
  simulate(courseId: number, groupSize: number, weights: Criteria): Observable<SimulationResult> {
    if (!this.useMock) {
      return this.http.post<SimulationResult>(this.base + '/simulate', { courseId, groupSize, weights });
    }
    return mock(() => {
      const course = this.db.courses.find((c) => c.id === courseId) ?? apiError(404, 'Module introuvable');
      const ids = course.enrolledIds.filter((id) => this.db.profile(id)?.status === 'COMPLETE');
      if (ids.length < groupSize) apiError(400, 'Pas assez de profils complets');
      const job = this.db.runClustering({ id: 900 + groupSize, projectId: 0, weights, algorithm: 'KMEANS_STRATIFIED', groupSize, status: 'RUNNING', requestedAt: '' }, ids, 'simulation');
      const random = this.db.randomMetrics(ids, Math.max(1, Math.round(ids.length / groupSize)), 4, weights);
      return { optimized: job.metrics, random };
    }, 700);
  }
}