import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfilingApi } from '../../core/api/profiling-api.service';
import { ToastService } from '../../core/toast.service';
import { MascotComponent } from '../../shared/mascot.component';

@Component({
  selector: 'app-questionnaire',
  imports: [FormsModule, MascotComponent],
  template: `
    <div class="page" style="max-width:820px;margin:0 auto">
      <div class="row">
        <app-mascot [size]="64" />
        <div class="speech">Questionnaire court rédigé par l'équipe : il n'y a pas de bonne réponse, sois spontané·e !</div>
      </div>

      <div class="card lift">
        <div class="row between">
          <span class="chip">Question {{ step() + 1 }} / {{ questions.length }}</span>
          <span class="small muted">{{ progress() }} %</span>
        </div>
        <div class="bar mt-s"><span [style.width.%]="progress()"></span></div>

        @if (current(); as q) {
          <h2 class="mt" style="font-size:22px">{{ q.text }}</h2>
          <div class="scale-choice mt">
            <span class="end">{{ q.left }}</span>
            <div class="dots">
              @for (v of values; track v) {
                <button class="dot" [class.on]="answers[q.code] === v" [style.width.px]="28 + Math.abs(v) * 5" [style.height.px]="28 + Math.abs(v) * 5" (click)="answer(v)"></button>
              }
            </div>
            <span class="end">{{ q.right }}</span>
          </div>
        }

        <div class="row between mt">
          <button class="btn ghost" [disabled]="step() === 0" (click)="step.set(step() - 1)"><span class="mi">arrow_back</span> Précédent</button>
          @if (step() < questions.length - 1) {
            <button class="btn" [disabled]="answers[current()?.code] === undefined" (click)="step.set(step() + 1)">Suivant <span class="mi">arrow_forward</span></button>
          } @else {
            <button class="btn primary" [disabled]="!complete() || sending()" (click)="send()"><span class="mi">send</span> Envoyer mes réponses</button>
          }
        </div>
      </div>
      <p class="small muted center">Profiling Service · POST /api/profiles/me/questionnaire → 201</p>
    </div>
  `,
  styles: [`
    .scale-choice{display:grid;grid-template-columns:150px 1fr 150px;align-items:center;gap:10px}
    .end{font-weight:700;text-align:center}
    .dots{display:flex;align-items:center;justify-content:space-between;gap:6px}
    .dot{border-radius:50%;border:1.8px solid #1e1e1e;background:#fff;cursor:pointer;transition:background .15s}
    .dot:hover{background:#fff3cf}.dot.on{background:var(--orange)}
  `],
})
export class QuestionnairePage {
  private api = inject(ProfilingApi);
  private toast = inject(ToastService);
  private router = inject(Router);
  Math = Math;
  questions = this.api.questions;
  values = [-5, -3, -1, 1, 3, 5];
  answers: Record<string, number> = {};
  step = signal(0);
  count = signal(0);
  sending = signal(false);
  current = computed(() => this.questions[this.step()]);
  progress = computed(() => Math.round((this.count() / this.questions.length) * 100));
  complete = computed(() => this.count() === this.questions.length);

  answer(v: number) {
    this.answers[this.current().code] = v;
    this.count.set(Object.keys(this.answers).length);
    if (this.step() < this.questions.length - 1) setTimeout(() => this.step.update((s) => s + 1), 220);
  }

  send() {
    this.sending.set(true);
    this.api.submitQuestionnaire(this.answers).subscribe({
      next: () => { this.toast.success('Merci ! Tes styles d\'apprentissage sont enregistrés'); this.router.navigateByUrl('/app/profile'); },
      error: (e) => { this.sending.set(false); this.toast.fromError(e); },
    });
  }
}
