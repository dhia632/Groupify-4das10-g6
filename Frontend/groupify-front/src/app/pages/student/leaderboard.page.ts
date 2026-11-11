import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CourseGroupApi } from '../../core/api/course-group-api.service';
import { GamificationApi } from '../../core/api/gamification-api.service';
import { Course, LeaderboardEntryDTO } from '../../core/models';
import { SessionService } from '../../core/session.service';
import { HBarsComponent } from '../../shared/charts';
import { EmojiPipe } from '../../shared/visuals';

@Component({
  selector: 'app-leaderboard',
  imports: [FormsModule, DecimalPipe, EmojiPipe, HBarsComponent],
  template: `
    <div class="page">
      <div class="page-title">
        <div>
          <h1>Classement des équipes</h1>
          <p>Gamification responsable : on compare les équipes, jamais les individus.</p>
        </div>
        <select class="input" style="width:280px" [ngModel]="courseId()" (ngModelChange)="load($event)">
          @for (c of courses(); track c.id) { <option [ngValue]="c.id">{{ c.code }} · {{ c.title }}</option> }
        </select>
      </div>

      @if (board().length) {
        <div class="grid g-3">
          @for (t of board().slice(0, 3); track t.teamId) {
            <div class="card lift top" [class]="'card lift top r' + t.rank" [class.mine]="t.teamId === myTeam()">
              <span class="medal">{{ ['🥇', '🥈', '🥉'][t.rank - 1] }}</span>
              <span class="emoji-avatar lg">{{ t.emblemUrl | emoji:'emblem' }}</span>
              <h2>{{ t.name }}</h2>
              <div class="stat-value">{{ t.totalPoints }} XP</div>
              <div class="bar mt-s" style="width:100%"><span [style.width.%]="t.progressPercent"></span></div>
              <span class="small">Projet : {{ t.progressPercent | number:'1.0-0' }} %</span>
            </div>
          }
        </div>
        <div class="grid g-2">
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>#</th><th>Équipe</th><th>Points</th><th>Progression</th></tr></thead>
              <tbody>
                @for (t of board(); track t.teamId) {
                  <tr [class.active]="t.teamId === myTeam()">
                    <td class="bold">{{ t.rank }}</td>
                    <td>{{ t.emblemUrl | emoji:'emblem' }} <b>{{ t.name }}</b> @if (t.teamId === myTeam()) { <span class="chip yellow">mon équipe</span> }</td>
                    <td>{{ t.totalPoints }} XP</td>
                    <td>{{ t.progressPercent | number:'1.0-0' }} %</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="card">
            <div class="card-head"><h3>Points par équipe</h3></div>
            <app-hbars [items]="bars()" unit=" XP" />
          </div>
        </div>
      } @else {
        <div class="card empty">Aucune équipe publiée pour ce module.</div>
      }
    </div>
  `,
  styles: [`
    .top{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
    .top.r1{background:#fff3cf}.top.r2{background:#eef1f5}.top.r3{background:#fde3c8}
    .top.mine{outline:3px solid var(--orange);outline-offset:3px}
    .medal{font-size:34px;position:absolute;top:10px;right:14px}
  `],
})
export class LeaderboardPage {
  private gami = inject(GamificationApi);
  private coursesApi = inject(CourseGroupApi);
  private session = inject(SessionService);
  courses = signal<Course[]>([]);
  courseId = signal<number>(1);
  board = signal<LeaderboardEntryDTO[]>([]);
  myTeam = signal<number | null>(null);
  bars = computed(() => this.board().map((b) => ({ label: b.name, value: b.totalPoints, color: b.teamId === this.myTeam() ? '#f07b1a' : '#ffd45e' })));

  constructor() {
    this.coursesApi.courses().subscribe((c) => this.courses.set(c));
    if (this.session.role() === 'STUDENT') {
      this.gami.me().subscribe((p) => this.myTeam.set(p.teamId));
    }
    this.load(1);
  }

  load(courseId: number) {
    this.courseId.set(courseId);
    this.gami.leaderboard(courseId).subscribe({ next: (b) => this.board.set(b), error: () => this.board.set([]) });
  }
}
