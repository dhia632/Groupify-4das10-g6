import { Component, computed, input } from '@angular/core';

/** Calendrier mensuel d'activité (jours actifs en orange, aujourd'hui en jaune). */
@Component({
  selector: 'app-activity-calendar',
  template: `
    <div class="cal">
      @for (d of weekDays; track $index) { <span class="wd">{{ d }}</span> }
      @for (cell of cells(); track $index) {
        @if (cell === 0) {
          <span></span>
        } @else {
          <span class="day" [class.active]="isActive(cell)" [class.today]="cell === today()" [class.future]="cell > today()">{{ cell }}</span>
        }
      }
    </div>
    <div class="legend">
      <span><i class="dot active"></i> Actif</span>
      <span><i class="dot today"></i> Aujourd'hui</span>
    </div>
  `,
  styles: [`
    .cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;text-align:center}
    .wd{font-size:11px;font-weight:700;color:#6d6a64}
    .day{width:30px;height:30px;margin:auto;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:600}
    .day.active{background:#e8862a;color:#fff;border:1.4px solid #1e1e1e}
    .day.today{background:#ffd45e;border:1.6px solid #1e1e1e;color:#1e1e1e}
    .day.future{color:#b7b1a5}
    .legend{display:flex;gap:16px;font-size:11px;color:#6d6a64;margin-top:10px}
    .dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:middle;border:1.2px solid #1e1e1e}
    .dot.active{background:#e8862a}.dot.today{background:#ffd45e}
  `],
})
export class ActivityCalendarComponent {
  /** Jours du mois courant où l'étudiant a été actif. */
  activeDays = input<number[]>([]);
  weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  today = computed(() => new Date().getDate());
  cells = computed(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // lundi = 0
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return [...Array(offset).fill(0), ...Array.from({ length: days }, (_, i) => i + 1)];
  });
  isActive(d: number) { return this.activeDays().includes(d); }
}
