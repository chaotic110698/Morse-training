/**
 * Retour haptique via l'API Vibration.
 *
 * Support reel : Chrome, Edge, Firefox et Samsung Internet sous Android le
 * proposent. Safari sur iOS ne l'expose pas, et aucune API web ne donne acces
 * au moteur haptique fin d'un iPhone : sur iOS le retour tactile est donc
 * silencieusement indisponible. La detection ci-dessous permet a l'interface
 * d'expliquer la situation plutot que de proposer un reglage sans effet.
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

  /** Vibration ponctuelle d'une duree donnee, en millisecondes. */
  pulse(ms: number): void {
    if (!this.available) return;
    navigator.vibrate(Math.max(1, Math.round(ms)));
  }

  /**
   * Joue une sequence entiere d'un seul appel. Confier le motif complet au
   * systeme est nettement plus precis que declencher une vibration par
   * element depuis JavaScript, car l'ordonnancement est fait par l'OS.
   */
  playSequence(elements: TimedElement[]): void {
    if (!this.available) return;
    const pattern = toVibrationPattern(elements);
    if (pattern.length > 0) navigator.vibrate(pattern);
  }

  /**
   * Maintient la vibration jusqu'a `release()`. Au manipulateur droit la duree
   * de l'appui n'est pas connue a l'avance : on demande donc une vibration
   * longue qu'on interrompt au relachement, ce qui reproduit exactement la
   * duree du contact.
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
