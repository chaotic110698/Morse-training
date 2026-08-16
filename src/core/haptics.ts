/**
 * Retour haptique via l'API Vibration.
 *
 * Support réel : Chrome, Edge, Firefox et Samsung Internet sous Android le
 * proposent. Safari sur iOS ne l'expose pas, et aucune API web ne donne accès
 * au moteur haptique fin d'un iPhone : sur iOS le retour tactile est donc
 * silencieusement indisponible. La détection ci-dessous permet à l'interface
 * d'expliquer la situation plutôt que de proposer un réglage sans effet.
 */

import type { TimedElement } from './timing.ts';
import { toVibrationPattern } from './timing.ts';

/** Vrai si le navigateur expose l'API Vibration. */
export function hapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export class Haptics {
  private enabled = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.cancel();
  }

  get available(): boolean {
    return this.enabled && hapticsSupported();
  }

  /** Vibration ponctuelle d'une durée donnée, en millisecondes. */
  pulse(ms: number): void {
    if (!this.available) return;
    navigator.vibrate(Math.max(1, Math.round(ms)));
  }

  /**
   * Joue une séquence entière d'un seul appel. Confier le motif complet au
   * système est nettement plus précis que déclencher une vibration par
   * élément depuis JavaScript, car l'ordonnancement est fait par l'OS.
   */
  playSequence(elements: TimedElement[]): void {
    if (!this.available) return;
    const pattern = toVibrationPattern(elements);
    if (pattern.length > 0) navigator.vibrate(pattern);
  }

  /**
   * Maintient la vibration jusqu'à `release()`. Au manipulateur droit la durée
   * de l'appui n'est pas connue à l'avance : on demande donc une vibration
   * longue qu'on interrompt au relâchement, ce qui reproduit exactement la
   * durée du contact.
   */
  hold(maxMs = 4000): void {
    if (!this.available) return;
    navigator.vibrate(Math.round(maxMs));
  }

  release(): void {
    if (!hapticsSupported()) return;
    navigator.vibrate(0);
  }

  /** Petit motif de confirmation ou d'erreur. */
  feedback(kind: 'ok' | 'error'): void {
    if (!this.available) return;
    navigator.vibrate(kind === 'ok' ? 18 : [40, 60, 40]);
  }

  cancel(): void {
    if (!hapticsSupported()) return;
    navigator.vibrate(0);
  }
}
