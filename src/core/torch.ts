/**
 * Pilotage de la lampe torche du téléphone.
 *
 * Le web n'expose pas de « lampe » : la torche est une contrainte de la piste
 * vidéo de la caméra arrière. Il faut donc ouvrir un flux caméra, puis allumer
 * et éteindre par `applyConstraints`.
 *
 * Trois pièges rendent l'affaire moins directe qu'il n'y paraît, et chacun se
 * manifeste de la même façon vue de l'utilisateur — la caméra s'ouvre, mais
 * rien ne s'allume :
 *
 * 1. Sur plusieurs appareils, la torche ne répond que si le flux est réellement
 *    consommé. Un `MediaStream` obtenu puis laissé de côté ne suffit pas : la
 *    pile caméra reste en veille. On attache donc le flux à un élément vidéo
 *    minuscule et on le lit, pour maintenir le pipeline actif.
 * 2. `getCapabilities()` n'est pas implémenté partout. L'absence de cette
 *    méthode ne signifie pas l'absence de lampe : on tente alors l'allumage
 *    plutôt que de renoncer d'emblée.
 * 3. `applyConstraints` peut accepter la demande sans effet. On vérifie donc le
 *    résultat par `getSettings()` au lieu de croire l'absence d'erreur.
 *
 * Support réel : Chrome, Edge et Samsung Internet sous Android. Safari sur iOS
 * n'expose historiquement pas cette contrainte ; le cas échéant, l'essai
 * ci-dessous le dit explicitement au lieu de laisser l'utilisateur deviner.
 */

export type TorchFailure = 'unsupported' | 'denied' | 'no-camera' | 'no-torch' | 'ineffective' | 'error';

export interface TorchResult {
  ok: boolean;
  reason?: TorchFailure;
  message?: string;
  /**
   * Vrai seulement si l'appareil a confirmé l'allumage. Faux quand il ne
   * renseigne rien : la demande est alors passée sans erreur, mais rien ne
   * prouve que la lampe s'est allumée, et l'interface doit le dire.
   */
  verified?: boolean;
}

const MESSAGES: Record<TorchFailure, string> = {
  unsupported:
    "Ce navigateur ne permet pas de piloter la lampe. C'est le cas de Safari sur iPhone et iPad : aucune interface web n'y donne accès au flash.",
  denied:
    "L'accès à la caméra a été refusé. La lampe passe par la caméra arrière, il n'existe pas d'autre chemin.",
  'no-camera': "Aucune caméra arrière n'a été trouvée sur cet appareil.",
  'no-torch': "La caméra de cet appareil ne déclare pas de lampe pilotable.",
  ineffective:
    "Le navigateur a accepté la demande mais la lampe ne s'est pas allumée : cet appareil ne la pilote pas réellement depuis une page web.",
  error: "La lampe n'a pas pu être activée.",
};

/**
 * Pré-vérification sans demander la moindre autorisation : si la contrainte
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

type TorchTrack = MediaStreamTrack & {
  getCapabilities?: () => MediaTrackCapabilities & { torch?: boolean };
  getSettings?: () => MediaTrackSettings & { torch?: boolean };
};

export class Torch {
  private stream: MediaStream | null = null;
  private track: TorchTrack | null = null;
  private video: HTMLVideoElement | null = null;
  private lit = false;
  private failureAnnounced = false;

  /** Prévenu une seule fois si une commutation échoue en cours d'émission. */
  onFailure: ((message: string) => void) | null = null;

  get active(): boolean {
    return this.track !== null;
  }

  /**
   * Ouvre la caméra arrière, maintient son flux actif, puis vérifie par un
   * allumage réel que la lampe répond. Le clignotement bref sert aussi de
   * confirmation visible pour l'utilisateur.
   */
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

    const track = stream.getVideoTracks()[0] as TorchTrack | undefined;
    if (!track) {
      for (const t of stream.getTracks()) t.stop();
      return { ok: false, reason: 'no-camera', message: MESSAGES['no-camera'] };
    }

    // Refus uniquement si la piste déclare explicitement ne pas avoir de lampe.
    // Une méthode absente n'est pas une réponse négative.
    const capabilities = track.getCapabilities?.();
    if (capabilities && 'torch' in capabilities && capabilities.torch !== true) {
      for (const t of stream.getTracks()) t.stop();
      return { ok: false, reason: 'no-torch', message: MESSAGES['no-torch'] };
    }

    this.stream = stream;
    this.track = track;
    this.lit = false;
    this.failureAnnounced = false;
    this.attachVideo(stream);

    const test = await this.selfTest();
    if (!test.ok) {
      this.release();
      return test;
    }
    return test;
  }

  /**
   * Un élément vidéo d'un pixel, lu en sourdine, garde la pile caméra active.
   * `display: none` la remettrait en veille sur plusieurs navigateurs, d'où une
   * taille minuscule et une opacité nulle plutôt qu'un masquage.
   */
  private attachVideo(stream: MediaStream): void {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('aria-hidden', 'true');
    Object.assign(video.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '1px',
      height: '1px',
      opacity: '0',
      pointerEvents: 'none',
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.append(video);
    void video.play().catch(() => {
      // La lecture peut être refusée sans que la torche en pâtisse : l'essai
      // qui suit tranchera, inutile d'échouer ici.
    });
    this.video = video;
  }

  /** Allume brièvement pour vérifier que la lampe répond vraiment. */
  async selfTest(holdMs = 220): Promise<TorchResult> {
    const track = this.track;
    if (!track) return { ok: false, reason: 'error', message: MESSAGES.error };

    try {
      await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] });
    } catch (error) {
      const detail = error instanceof Error ? ` (${error.message})` : '';
      return { ok: false, reason: 'no-torch', message: `${MESSAGES['no-torch']}${detail}` };
    }

    const applied = track.getSettings?.().torch;
    await new Promise((resolve) => window.setTimeout(resolve, holdMs));
    try {
      await track.applyConstraints({ advanced: [{ torch: false } as MediaTrackConstraintSet] });
    } catch {
      // L'extinction ratée est traitée par `release()`, qui coupe la piste.
    }
    this.lit = false;

    // `getSettings` peut ne rien renseigner : seul un `false` explicite prouve
    // que la demande est restée sans effet, et seul un `true` prouve l'inverse.
    if (applied === false) {
      return { ok: false, reason: 'ineffective', message: MESSAGES.ineffective };
    }
    return { ok: true, verified: applied === true };
  }

  /**
   * Allume ou éteint. L'appel est délibérément « tiré et oublié » : attendre la
   * promesse décalerait le son, or c'est le son qui fait foi pour le rythme.
   * Un échec est signalé une seule fois, pour ne pas noyer l'utilisateur.
   */
  set(on: boolean): void {
    const track = this.track;
    if (!track || this.lit === on) return;
    this.lit = on;
    void track
      .applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] })
      .catch((error: unknown) => {
        if (this.failureAnnounced) return;
        this.failureAnnounced = true;
        const detail = error instanceof Error ? ` (${error.message})` : '';
        this.onFailure?.(`La lampe a cessé de répondre en cours d'émission${detail}.`);
      });
  }

  /** Éteint, arrête la lecture et rend la caméra au système. */
  release(): void {
    if (this.track) {
      this.set(false);
      this.track.stop();
    }
    for (const track of this.stream?.getTracks() ?? []) track.stop();
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
      this.video.remove();
    }
    this.stream = null;
    this.track = null;
    this.video = null;
    this.lit = false;
    this.failureAnnounced = false;
  }
}
