/**
 * Panneau en superposition.
 *
 * Les réglages et le lexique s'ouvrent de la même façon : un voile, une feuille
 * qui glisse, le focus enfermé dedans, Échap pour sortir. Écrire deux fois
 * cette mécanique reviendrait à la corriger deux fois — et à ce qu'elle finisse
 * par diverger sur un détail d'accessibilité, ce qui est précisément le genre
 * de détail dont personne ne s'aperçoit.
 */

import { h } from './dom.ts';

/**
 * Les panneaux ouverts, pour n'en laisser qu'un. Deux dialogues modaux
 * superposés, c'est un piège à focus dans un piège à focus : Échap n'en ferme
 * qu'un, et le lecteur d'écran ne sait plus lequel il annonce.
 */
const opened = new Set<{ close: () => void }>();

export interface OverlayOptions {
  id: string;
  /** Titre du panneau, lu par les technologies d'assistance. */
  title: string;
  /**
   * `sheet` : une feuille ancrée au bord, pour ce qu'on garde ouvert en
   * travaillant. `palette` : une boîte centrée, pour ce qu'on ouvre, utilise et
   * referme dans la seconde.
   */
  variant?: 'sheet' | 'palette';
  /** Appelé juste avant l'ouverture, pour préparer le contenu. */
  onOpen?: () => void;
  onClose?: () => void;
  /** Élément à mettre au premier plan à l'ouverture, plutôt que le premier. */
  initialFocus?: () => HTMLElement | null;
}

export interface Overlay {
  /** Le voile puis le panneau, à insérer dans la page. */
  nodes: HTMLElement[];
  /** Le corps du panneau, à remplir par l'appelant. */
  body: HTMLElement;
  /** L'en-tête, entre le titre et le bouton de fermeture. */
  head: HTMLElement;
  isOpen: () => boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  destroy: () => void;
}

export function createOverlay(options: OverlayOptions): Overlay {
  let open = false;
  let lastFocus: HTMLElement | null = null;

  const body = h('div', { class: 'panel__body' });
  const title = h('h2', { class: 'panel__title', id: `${options.id}-titre`, text: options.title });
  const closeButton = h('button', {
    class: 'panel__close',
    type: 'button',
    text: '✕',
    attrs: { 'aria-label': `Fermer ${options.title.toLowerCase()}` },
    on: { click: () => close() },
  });

  const head = h('header', { class: 'panel__head' }, title, closeButton);
  const veil = h('div', { class: 'panel-veil', id: `${options.id}-voile`, attrs: { hidden: 'true' } });
  const panel = h(
    'aside',
    {
      class: options.variant === 'palette' ? 'panel panel--palette' : 'panel',
      id: options.id,
      attrs: {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': `${options.id}-titre`,
        hidden: 'true',
      },
    },
    head,
    body,
  );

  const focusable = (): HTMLElement[] =>
    [...panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])',
    )].filter((element) => !element.hasAttribute('disabled') && element.offsetParent !== null);

  const onKeydown = (event: KeyboardEvent): void => {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    // Le focus reste dans le panneau tant qu'il est ouvert : c'est ce qui
    // distingue un dialogue d'un bloc simplement posé par-dessus.
    const items = focusable();
    if (items.length === 0) return;
    const first = items[0] as HTMLElement;
    const last = items[items.length - 1] as HTMLElement;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !panel.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const doOpen = (): void => {
    if (open) return;
    for (const other of [...opened]) other.close();
    open = true;
    opened.add(self);
    lastFocus = document.activeElement as HTMLElement | null;
    options.onOpen?.();
    panel.hidden = false;
    veil.hidden = false;
    document.body.classList.add('panel-open');
    // Le panneau vient de passer de `display: none` à sa mise en page : sans
    // cette lecture, qui force le calcul, le navigateur regrouperait les deux
    // changements de style et la feuille apparaîtrait d'un coup, sans glisser.
    void panel.offsetHeight;
    window.requestAnimationFrame(() => {
      panel.classList.add('is-open');
      (options.initialFocus?.() ?? focusable()[0])?.focus();
    });
  };

  const close = (): void => {
    if (!open) return;
    open = false;
    opened.delete(self);
    panel.classList.remove('is-open');
    document.body.classList.remove('panel-open');
    veil.hidden = true;
    // On laisse l'animation se terminer avant de retirer le panneau du flux.
    window.setTimeout(() => {
      if (!open) panel.hidden = true;
    }, 220);
    options.onClose?.();
    lastFocus?.focus();
    lastFocus = null;
  };

  veil.addEventListener('click', close);
  document.addEventListener('keydown', onKeydown);

  const self: Overlay = {
    nodes: [veil, panel],
    body,
    head,
    isOpen: () => open,
    open: doOpen,
    close,
    toggle: () => (open ? close() : doOpen()),
    destroy: () => {
      opened.delete(self);
      document.removeEventListener('keydown', onKeydown);
    },
  };
  return self;
}
