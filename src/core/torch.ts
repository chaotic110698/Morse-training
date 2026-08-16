/**
 * Pilotage de la lampe torche du telephone.
 *
 * Le web n'expose pas de « lampe » : la torche est une contrainte de la piste
 * video de la camera arriere. Il faut donc ouvrir un flux camera, verifier que
 * la piste declare la capacite `torch`, puis allumer et eteindre par
 * `applyConstraints`.
 *
 * Consequences pratiques :
 *
 * - Support reel : Chrome, Edge et Samsung Internet sous Android. Safari sur
 *   iOS n'expose pas cette contrainte, la torche y est donc indisponible quel
 *   que soit le modele d'iPhone.
 * - L'autorisation camera est demandee, et l'indicateur d'utilisation de la
 *   camera s'allume. La piste est relachee des que la torche est desactivee.
 * - `applyConstraints` traverse la pile camera du systeme : la commutation
 *   prend typiquement plusieurs dizaines de millisecondes. Au dela d'une
 *   dizaine de mots par minute, la lampe ne suit plus le rythme demande ;
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
    "Ce navigateur ne permet pas de piloter la lampe. C'est le cas de Safari sur iPhone et iPad : aucune interface web n'y donne acces au flash.",
  denied:
    "L'acces a la camera a ete refuse. La lampe passe par la camera arriere, il n'existe pas d'autre chemin.",
  'no-camera': "Aucune camera arriere n'a ete trouvee sur cet appareil.",
  'no-torch': "La camera de cet appareil ne declare pas de lampe pilotable.",
  error: "La lampe n'a pas pu etre activee.",
};

/**
 * Pre-verification sans demander la moindre autorisation : si la contrainte
 * `torch` n'est meme pas connue du navigateur, inutile d'ouvrir la camera.
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

  /** Ouvre la camera arriere et verifie la presence d'une lampe pilotable. */
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
   * Allume ou eteint. L'appel est deliberement « tire et oublie » : attendre la
   * promesse decalerait le son, or c'est le son qui fait foi pour le rythme.
   */
  set(on: boolean): void {
    if (!this.track || this.lit === on) return;
    this.lit = on;
    void this.track
      .applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] })
      .catch(() => {
        // Une commutation ratee ne doit pas interrompre la lecture en cours.
      });
  }

  /** Eteint puis rend la camera au systeme. */
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
