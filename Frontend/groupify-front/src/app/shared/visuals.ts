import { Pipe, PipeTransform } from '@angular/core';
import { EventType } from '../core/models';

export const AVATAR_EMOJI: Record<string, string> = {
  FOX: '🦊', OWL: '🦉', CAT: '🐱', PANDA: '🐼', ROBOT: '🤖', ASTRONAUT: '🧑‍🚀', DRAGON: '🐉', PHOENIX: '🦅',
};
export const EMBLEM_EMOJI: Record<string, string> = {
  ROCKET: '🚀', LIGHTNING: '⚡', TREE: '🌳', SHIELD: '🛡️', STAR: '⭐', WAVE: '🌊',
};
export const BADGE_EMOJI: Record<string, string> = {
  PROFILE_DONE: '📝', FIRST_STEP: '👣', ON_TIME: '⏰', HELPER: '🤝', REGULAR: '🔥', DREAM_TEAM: '🏆',
};
export const LEVEL_EMOJI = ['🌱', '💎', '🤝', '🏛️', '🧠'];
export const EVENT_LABEL: Record<EventType, string> = {
  PROFILE_COMPLETED: 'Profil complété',
  GROUP_JOINED: 'Équipe rejointe',
  CONTRIBUTION_RECORDED: 'Contribution',
  DELIVERABLE_SUBMITTED: 'Livrable rendu',
  KUDOS_RECEIVED: 'Kudos reçu',
  DAILY_ACTIVITY: 'Jour actif',
  BADGE_REWARD: 'Bonus de badge',
  MANUAL: 'Attribution manuelle',
};

/** {{ 'FOX' | emoji:'avatar' }} -> 🦊 */
@Pipe({ name: 'emoji' })
export class EmojiPipe implements PipeTransform {
  transform(code: string | null | undefined, kind: 'avatar' | 'emblem' | 'badge' | 'level' = 'avatar'): string {
    if (kind === 'level') return LEVEL_EMOJI[(Number(code) || 1) - 1] ?? '⭐';
    if (!code) return kind === 'avatar' ? '🙂' : kind === 'emblem' ? '🏳️' : '🏅';
    const map = kind === 'avatar' ? AVATAR_EMOJI : kind === 'emblem' ? EMBLEM_EMOJI : BADGE_EMOJI;
    return map[code] ?? (kind === 'badge' ? '🏅' : '🙂');
  }
}

/** Initiales d'un nom : "Sara Ben Ali" -> "SB" */
@Pipe({ name: 'initials' })
export class InitialsPipe implements PipeTransform {
  transform(name: string | null | undefined): string {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }
}

/** Libellé lisible d'un type d'événement de gamification. */
@Pipe({ name: 'eventLabel' })
export class EventLabelPipe implements PipeTransform {
  transform(t: EventType): string { return EVENT_LABEL[t] ?? t; }
}
