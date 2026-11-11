import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-toast-host',
  template: `
    <div class="toasts">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast pop" [class]="'toast pop ' + t.kind" (click)="toast.dismiss(t.id)">
          <span class="mi fill">{{ t.kind === 'success' ? 'check_circle' : t.kind === 'error' ? 'error' : 'info' }}</span>
          <span>{{ t.text }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toasts{position:fixed;right:22px;bottom:22px;display:flex;flex-direction:column;gap:10px;z-index:1000;max-width:380px}
    .toast{display:flex;gap:10px;align-items:flex-start;padding:12px 16px;border:1.6px solid #1e1e1e;border-radius:14px;background:#fff;box-shadow:0 3px 0 #1e1e1e;cursor:pointer;font-size:13px;font-weight:500}
    .toast.success{background:#dcf3e3}.toast.error{background:#ffd9d9}.toast.info{background:#fff3cf}
  `],
})
export class ToastHostComponent {
  toast = inject(ToastService);
}
