import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  text: string;
  kind: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private seq = 0;

  success(text: string) { this.push(text, 'success'); }
  error(text: string) { this.push(text, 'error'); }
  info(text: string) { this.push(text, 'info'); }

  /** Message d'erreur lisible à partir d'une erreur HTTP (format ApiError du backend) ou JS. */
  fromError(err: any, fallback = 'Une erreur est survenue') {
    const msg = err?.error?.message ?? err?.message ?? fallback;
    const status = err?.status ? ` (${err.status})` : '';
    this.error(msg + status);
  }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(text: string, kind: Toast['kind']) {
    const id = ++this.seq;
    this.toasts.update((list) => [...list, { id, text, kind }]);
    setTimeout(() => this.dismiss(id), 4000);
  }
}
