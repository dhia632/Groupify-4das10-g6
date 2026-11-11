import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiError, mock } from '../mock/mock';
import { MockDb } from '../mock/mock-db';
import { AnalyticsReport, BalanceReport, CourseEngagement, PromotionSummary } from '../models';

/** Analytics Service – /api/analytics */
@Injectable({ providedIn: 'root' })
export class AnalyticsApi {
  private http = inject(HttpClient);
  private db = inject(MockDb);
  private base = environment.apiUrl + '/api/analytics';
  private useMock = environment.mocks.analytics;

  balance(courseId: number): Observable<BalanceReport> {
    if (!this.useMock) return this.http.get<BalanceReport>(`${this.base}/courses/${courseId}/balance`);
    return mock(() => {
      const b = this.db.balance(courseId);
      if (!b.groups.length) apiError(404, 'Aucun groupe publié pour ce module');
      return b;
    });
  }

  engagement(courseId: number): Observable<CourseEngagement> {
    if (!this.useMock) return this.http.get<CourseEngagement>(`${this.base}/courses/${courseId}/engagement`);
    return mock(() => this.db.engagement(courseId));
  }

  promotion(promotionId: string): Observable<PromotionSummary> {
    if (!this.useMock) return this.http.get<PromotionSummary>(`${this.base}/promotions/${promotionId}/summary`);
    return mock(() => this.db.promotion(promotionId));
  }

  reports(): Observable<AnalyticsReport[]> {
    if (!this.useMock) return this.http.get<AnalyticsReport[]>(`${this.base}/reports`);
    return mock(() => [...this.db.reports].reverse());
  }

  /** 202 : génération asynchrone, le rapport passe de PENDING à READY. */
  generateReport(scope: AnalyticsReport['scope'], scopeId: string, period: string): Observable<AnalyticsReport> {
    if (!this.useMock) return this.http.post<AnalyticsReport>(`${this.base}/reports`, { scope, scopeId, period });
    return mock(() => {
      const r: AnalyticsReport = { id: this.db.reports.length + 1, scope, scopeId, period, status: 'PENDING', generatedAt: new Date().toISOString() };
      this.db.reports.push(r);
      setTimeout(() => (r.status = 'READY'), 2500);
      return r;
    });
  }
}
