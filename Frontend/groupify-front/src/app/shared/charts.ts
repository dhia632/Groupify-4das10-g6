import { Component, computed, input } from '@angular/core';

// =====================================================================
// Graphiques SVG légers (aucune dépendance externe)
// =====================================================================

/** Anneau de pourcentage. */
@Component({
  selector: 'app-donut',
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" [attr.viewBox]="'0 0 ' + size() + ' ' + size()">
      <circle [attr.cx]="c()" [attr.cy]="c()" [attr.r]="r()" fill="none" stroke="#f1e6d6" [attr.stroke-width]="stroke()" />
      <circle [attr.cx]="c()" [attr.cy]="c()" [attr.r]="r()" fill="none" [attr.stroke]="color()" [attr.stroke-width]="stroke()"
              stroke-linecap="round" [attr.stroke-dasharray]="dash()" [attr.transform]="'rotate(-90 ' + c() + ' ' + c() + ')'"
              style="transition: stroke-dasharray .8s ease" />
      <circle [attr.cx]="c()" [attr.cy]="c()" [attr.r]="r() + stroke() / 2" fill="none" stroke="#1E1E1E" stroke-width="1.5" />
      <circle [attr.cx]="c()" [attr.cy]="c()" [attr.r]="r() - stroke() / 2" fill="none" stroke="#1E1E1E" stroke-width="1.5" />
      <text [attr.x]="c()" [attr.y]="c()" text-anchor="middle" dominant-baseline="central"
            [attr.font-size]="size() / 4.6" font-weight="800" fill="#1E1E1E">{{ label() ?? (rounded() + '%') }}</text>
    </svg>
  `,
  styles: [':host{display:inline-flex}'],
})
export class DonutComponent {
  value = input(0);
  size = input(120);
  stroke = input(14);
  color = input('#F07B1A');
  label = input<string | null>(null);
  c = computed(() => this.size() / 2);
  r = computed(() => this.size() / 2 - this.stroke() / 2 - 2);
  rounded = computed(() => Math.round(this.value()));
  dash = computed(() => {
    const len = 2 * Math.PI * this.r();
    const v = Math.max(0, Math.min(100, this.value()));
    return `${(len * v) / 100} ${len}`;
  });
}

/** Diagramme radar (compétences). */
@Component({
  selector: 'app-radar',
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" [attr.viewBox]="'-20 -20 ' + (size() + 40) + ' ' + (size() + 40)">
      @for (ring of rings(); track $index) {
        <polygon [attr.points]="ring" fill="none" stroke="#d8d2c5" stroke-width="1" />
      }
      @for (a of axesPts(); track $index) {
        <line [attr.x1]="c()" [attr.y1]="c()" [attr.x2]="a.x" [attr.y2]="a.y" stroke="#d8d2c5" />
        <text [attr.x]="a.lx" [attr.y]="a.ly" text-anchor="middle" dominant-baseline="central" font-size="11" fill="#6d6a64">{{ a.label }}</text>
      }
      @for (s of shapes(); track $index) {
        <polygon [attr.points]="s.points" [attr.fill]="s.color" fill-opacity=".25" [attr.stroke]="s.color" stroke-width="2.4" />
        @for (p of s.dots; track $index) {
          <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3.5" [attr.fill]="s.color" stroke="#1E1E1E" stroke-width="1" />
        }
      }
    </svg>
  `,
  styles: [':host{display:inline-flex}'],
})
export class RadarComponent {
  axes = input<string[]>([]);
  series = input<{ values: number[]; color: string }[]>([]);
  max = input(5);
  size = input(240);
  c = computed(() => this.size() / 2);
  private pt(i: number, ratio: number) {
    const n = this.axes().length || 1;
    const ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const rad = (this.size() / 2 - 22) * ratio;
    return { x: this.c() + rad * Math.cos(ang), y: this.c() + rad * Math.sin(ang) };
  }
  rings = computed(() => [0.25, 0.5, 0.75, 1].map((r) => this.axes().map((_, i) => { const p = this.pt(i, r); return `${p.x},${p.y}`; }).join(' ')));
  axesPts = computed(() => this.axes().map((label, i) => {
    const p = this.pt(i, 1);
    const l = this.pt(i, 1.17);
    return { ...p, lx: l.x, ly: l.y, label };
  }));
  shapes = computed(() => this.series().map((s) => {
    const dots = s.values.map((v, i) => this.pt(i, Math.max(0, Math.min(1, v / this.max()))));
    return { color: s.color, dots, points: dots.map((d) => `${d.x},${d.y}`).join(' ') };
  }));
}

/** Barres horizontales simples. */
@Component({
  selector: 'app-hbars',
  template: `
    <div class="hb">
      @for (it of items(); track it.label) {
        <div class="hb-row">
          <span class="hb-label" [title]="it.label">{{ it.label }}</span>
          <div class="bar grow"><span [style.width.%]="pct(it.value)" [style.background]="it.color || null"></span></div>
          <span class="hb-val">{{ it.value }}{{ unit() }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .hb{display:flex;flex-direction:column;gap:10px}
    .hb-row{display:flex;align-items:center;gap:10px}
    .hb-label{width:130px;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .hb-val{width:64px;text-align:right;font-weight:700;font-size:13px}
  `],
})
export class HBarsComponent {
  items = input<{ label: string; value: number; color?: string }[]>([]);
  max = input<number | null>(null);
  unit = input('');
  pct(v: number) {
    const m = this.max() ?? Math.max(1, ...this.items().map((i) => i.value));
    return Math.max(2, (v / m) * 100);
  }
}

/** Colonnes verticales (évolution hebdomadaire). */
@Component({
  selector: 'app-columns',
  template: `
    <div class="cols" [style.height.px]="height()">
      @for (v of values(); track $index) {
        <div class="col-item">
          <span class="col-val">{{ v }}</span>
          <div class="col-bar" [style.height.%]="pct(v)" [style.background]="color()"></div>
          <span class="col-lbl">{{ labels()[$index] }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .cols{display:flex;align-items:flex-end;gap:10px}
    .col-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:4px}
    .col-bar{width:100%;max-width:38px;border:1.4px solid #1e1e1e;border-radius:8px 8px 4px 4px;min-height:4px;transition:height .6s ease}
    .col-val{font-size:11px;font-weight:700}
    .col-lbl{font-size:11px;color:#6d6a64}
  `],
})
export class ColumnsComponent {
  values = input<number[]>([]);
  labels = input<string[]>([]);
  color = input('#F07B1A');
  height = input(150);
  pct(v: number) { return Math.max(3, (v / Math.max(1, ...this.values())) * 82); }
}

/** Nuage de points (projection ACP 2D des profils). */
@Component({
  selector: 'app-scatter',
  template: `
    <svg [attr.width]="'100%'" [attr.viewBox]="'0 0 ' + w + ' ' + h" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" [attr.width]="w" [attr.height]="h" fill="#fffdf7" stroke="#1E1E1E" stroke-width="1.5" rx="12" />
      <line [attr.x1]="pad" [attr.y1]="h / 2" [attr.x2]="w - pad" [attr.y2]="h / 2" stroke="#e3dccd" stroke-dasharray="4 4" />
      <line [attr.x1]="w / 2" [attr.y1]="pad" [attr.x2]="w / 2" [attr.y2]="h - pad" stroke="#e3dccd" stroke-dasharray="4 4" />
      <text [attr.x]="w - pad" [attr.y]="h / 2 - 6" text-anchor="end" font-size="10" fill="#6d6a64">CP1 : profil technique →</text>
      <text [attr.x]="w / 2 + 6" [attr.y]="pad + 10" font-size="10" fill="#6d6a64">CP2 : organisation ↑</text>
      @for (p of placed(); track $index) {
        <circle [attr.cx]="p.cx" [attr.cy]="p.cy" [attr.r]="p.highlight ? 8 : 6" [attr.fill]="p.color"
                [attr.stroke]="p.highlight ? '#1E1E1E' : '#ffffff'" [attr.stroke-width]="p.highlight ? 2.5 : 1.5">
          <title>{{ p.label }}</title>
        </circle>
      }
    </svg>
  `,
  styles: [':host{display:block}'],
})
export class ScatterComponent {
  points = input<{ x: number; y: number; color: string; label: string; highlight?: boolean }[]>([]);
  w = 520; h = 320; pad = 26;
  placed = computed(() => {
    const ps = this.points();
    if (!ps.length) return [];
    const xs = ps.map((p) => p.x), ys = ps.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const sx = (v: number) => this.pad + ((v - minX) / Math.max(0.01, maxX - minX)) * (this.w - 2 * this.pad);
    const sy = (v: number) => this.h - this.pad - ((v - minY) / Math.max(0.01, maxY - minY)) * (this.h - 2 * this.pad);
    return ps.map((p) => ({ ...p, cx: sx(p.x), cy: sy(p.y) }));
  });
}
