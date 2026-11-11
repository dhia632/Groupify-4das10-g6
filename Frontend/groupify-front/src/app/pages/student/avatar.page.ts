import { Component, inject, signal } from '@angular/core';
import { GamificationApi } from '../../core/api/gamification-api.service';
import { AvatarDTO, LevelDTO, PlayerDTO } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { EmojiPipe } from '../../shared/visuals';

@Component({
  selector: 'app-avatar',
  imports: [EmojiPipe],
  template: `
    <div class="page">
      <div class="card yellow lift row wrap" style="gap:24px">
        <span class="emoji-avatar xl">{{ player()?.avatar?.code | emoji:'avatar' }}</span>
        <div class="grow">
          <h1>{{ player()?.displayName }}</h1>
          <p class="muted">Niveau {{ player()?.level?.rank }} · {{ player()?.level?.name }} · {{ player()?.totalPoints }} XP</p>
          <div class="bar mt-s" style="max-width:420px"><span [style.width.%]="(player()?.progressToNextLevel ?? 0) * 100"></span></div>
          @if (player()?.nextLevel; as n) { <p class="small mt-s">Prochain niveau : <b>{{ n.name }}</b> à {{ n.minPoints }} XP</p> }
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3><span class="mi">face</span> Choisir mon avatar</h3><span class="card-sub">Certains avatars se débloquent avec les niveaux</span></div>
        <div class="avatars">
          @for (a of avatars(); track a.id) {
            <button class="av" [class.selected]="player()?.avatar?.id === a.id" [class.locked]="isLocked(a)" (click)="choose(a)">
              <span class="av-emoji">{{ a.code | emoji:'avatar' }}</span>
              <strong>{{ a.label }}</strong>
              @if (isLocked(a)) { <span class="small">🔒 niveau {{ a.requiredLevel }}</span> }
              @else if (player()?.avatar?.id === a.id) { <span class="small bold">Actuel</span> }
              @else { <span class="small muted">Disponible</span> }
            </button>
          }
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3><span class="mi">stairs</span> Les niveaux</h3></div>
        <div class="levels">
          @for (l of levels(); track l.rank) {
            <div class="lvl" [class.current]="player()?.level?.rank === l.rank" [class.reached]="(player()?.level?.rank ?? 0) >= l.rank">
              <span class="lvl-emoji">{{ l.rank | emoji:'level' }}</span>
              <strong>{{ l.name }}</strong>
              <span class="small">{{ l.minPoints }} XP</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .avatars{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px}
    .av{display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 10px;border:1.6px solid #1e1e1e;border-radius:18px;background:#fff;cursor:pointer;font-family:inherit}
    .av:hover{background:#fff3cf}.av.selected{background:#ffd45e;box-shadow:0 3px 0 #1e1e1e}
    .av.locked{cursor:not-allowed}
    .av-emoji{font-size:46px}
    .levels{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
    .lvl{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px;border:1.6px dashed #b8b1a3;border-radius:16px;color:#8a857c}
    .lvl.reached{border-style:solid;border-color:#1e1e1e;color:#1e1e1e;background:#dcebff}
    .lvl.current{background:#ffd45e;box-shadow:0 3px 0 #1e1e1e}
    .lvl-emoji{font-size:30px}
    @media(max-width:800px){.levels{grid-template-columns:repeat(2,1fr)}}
  `],
})
export class AvatarPage {
  private api = inject(GamificationApi);
  private toast = inject(ToastService);
  player = signal<PlayerDTO | null>(null);
  avatars = signal<AvatarDTO[]>([]);
  levels = signal<LevelDTO[]>([]);

  constructor() {
    this.api.me().subscribe((p) => this.player.set(p));
    this.api.avatars().subscribe((a) => this.avatars.set(a));
    this.api.levels().subscribe((l) => this.levels.set(l));
  }

  isLocked(a: AvatarDTO) { return (this.player()?.level?.rank ?? 1) < a.requiredLevel; }

  choose(a: AvatarDTO) {
    this.api.chooseAvatar(a.id).subscribe({
      next: (p) => { this.player.set(p); this.toast.success(`Nouvel avatar : ${a.label}`); },
      error: (e) => this.toast.fromError(e),
    });
  }
}
