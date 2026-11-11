import { Component, input } from '@angular/core';

/** "Groupy", la mascotte renard de la plateforme (dessin SVG original). */
@Component({
  selector: 'app-mascot',
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="64" r="50" fill="#FFD45E" stroke="#1E1E1E" stroke-width="3" />
      <path d="M28 46 L22 14 L50 34 Z" fill="#F07B1A" stroke="#1E1E1E" stroke-width="3" stroke-linejoin="round" />
      <path d="M92 46 L98 14 L70 34 Z" fill="#F07B1A" stroke="#1E1E1E" stroke-width="3" stroke-linejoin="round" />
      <path d="M29 40 L26 22 L41 33 Z" fill="#FDE3C8" />
      <path d="M91 40 L94 22 L79 33 Z" fill="#FDE3C8" />
      <path d="M24 62 C24 38 96 38 96 62 C96 86 78 100 60 100 C42 100 24 86 24 62 Z" fill="#F07B1A" stroke="#1E1E1E" stroke-width="3" />
      <path d="M38 76 C46 70 54 72 60 80 C66 72 74 70 82 76 C80 92 70 99 60 99 C50 99 40 92 38 76 Z" fill="#FFF3CF" />
      <ellipse cx="46" cy="62" rx="5" ry="6.5" fill="#1E1E1E" />
      <ellipse cx="74" cy="62" rx="5" ry="6.5" fill="#1E1E1E" />
      <circle cx="47.6" cy="60" r="1.8" fill="#fff" />
      <circle cx="75.6" cy="60" r="1.8" fill="#fff" />
      <path d="M55 78 Q60 82 65 78 Q60 86 55 78 Z" fill="#1E1E1E" />
      @if (happy()) {
        <path d="M52 86 Q60 93 68 86" fill="none" stroke="#1E1E1E" stroke-width="2.6" stroke-linecap="round" />
      } @else {
        <path d="M54 89 L66 89" fill="none" stroke="#1E1E1E" stroke-width="2.6" stroke-linecap="round" />
      }
      <circle cx="36" cy="74" r="4" fill="#F05A5A" opacity=".35" />
      <circle cx="84" cy="74" r="4" fill="#F05A5A" opacity=".35" />
    </svg>
  `,
  styles: [':host{display:inline-flex}'],
})
export class MascotComponent {
  size = input(64);
  happy = input(true);
}
