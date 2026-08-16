/**
 * Pilotage de la lampe torche du téléphone.
 *
 * Le web n'expose pas de « lampe » : la torche est une contrainte de la piste
 * vidéo de la caméra arrière. Il faut donc ouvrir un flux caméra, vérifier que
 * la piste déclare la capacité `torch`, puis allumer et éteindre par
 * `applyConstraints`.
 *
 * Conséquences pratiques :
 *
 * - Support réel : Chrome, Edge et Samsung Internet sous Android. Safari sur
 *   iOS n'expose pas cette contrainte, la torche y est donc indisponible quel
 *   que soit le modèle d'iPhone.
 * - L'autorisation caméra est demandée, et l'indicateur d'utilisation de la
 *   caméra s'allume. La piste est relâchée dès que la torche est désactivée.
 * - `applyConstraints` traverse la pile caméra du système : la commutation
 *   prend typiquement plusieurs dizaines de millisecondes. Au-delà d'une
 *   dizaine de mots par minute, la lampe ne suit plus le rythme demandé ;
 *   l'interface le signale et propose de ralentir.
 */

export type TorchFailure = 'unsupported' | 'denied' | 'no-camera' | 'no-torch' | 'error';

export interface TorchResult {
  ok: boolean;
  reason?: TorchFailure;
  message?: string;
}

const MESSAGES: Record<TorchFailure, string> = {
  unsupported:
    "Ce navigateur ne permet pas de piloter la lampe. C'est le cas de Safari sur iPhone et iPad : aucune interface web n'y donne accès au flash.",
  denied:
    "L'accès à la caméra a été refusé. La lampe passe par la caméra arrière, il n'existe pas d'autre chemin.",
  'no-camera': "Aucune caméra arrière n'a été trouvée sur cet appareil.",
  'no-torch': "La caméra de cet appareil ne déclare pas de lampe pilotable.",
  error: "La lampe n'a pas pu être activée.",
};

/**
 * Pre-vérification sans demander la moindre autorisation : si la contrainte
 * `torch` n'est même pas connue du navigateur, inutile d'ouvrir la caméra.
 */
export function torchPossiblySupported(): boolean {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getSupportedConstraints) {
    return false;
  }
  const supported = navigator.mediaDevices.getSupportedConstraints() as MediaTrackSupportedConstraints & {
    torch?: boolean;
  };
  return Boolean(supported.torch);
}

export class Torch {
  private stream: MediaStream | null = null;
  private track: MediaStreamTrack | null = null;
  private lit = false;

  get active(): boolean {
    return this.track !== null;
  }

  /** Ouvre la caméra arrière et vérifie la présence d'une lampe pilotable. */
  async acquire(): Promise<TorchResult> {
    if (this.track) return { ok: true };
    if (!torchPossiblySupported()) {
      return { ok: false, reason: 'unsupported', message: MESSAGES.unsupported };
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      const reason: TorchFailure =
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'denied'
          : name === 'NotFoundError' || name === 'OverconstrainedError'
            ? 'no-camera'
            : 'error';
      return { ok: false, reason, message: MESSAGES[reason] };
    }

    const track = stream.getVideoTracks()[0];
    const capabilities = track?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
    if (!track || !capabilities?.torch) {
      for (const t of stream.getTracks()) t.stop();
      return { ok: false, reason: 'no-torch', message: MESSAGES['no-torch'] };
    }

    this.stream = stream;
    this.track = track;
    this.lit = false;
    return { ok: true };
  }

  /**
   * Allume ou éteint. L'appel est délibérément « tiré et oublié » : attendre la
   * promesse décalerait le son, or c'est le son qui fait foi pour le rythme.
   */
  set(on: boolean): void {
    if (!this.track || this.lit === on) return;
    this.lit = on;
    void this.track
      .applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] })
      .catch(() => {
        // Une commutation ratée ne doit pas interrompre la lecture en cours.
      });
  }

  /** Éteint puis rend la caméra au système. */
  release(): void {
    if (this.track) {
      this.set(false);
      this.track.stop();
    }
    for (const track of this.stream?.getTracks() ?? []) track.stop();
    this.stream = null;
    this.track = null;
    this.lit = false;
  }
}
