/**
 * Sauvegarde du mode histoire.
 *
 * Le site enregistre déjà tout seul dans le navigateur ; ce panneau sert à
 * emporter la partie ailleurs — d'un téléphone à un ordinateur, ou avant de
 * vider son cache. Il n'apparaît que dans le mode histoire : le bandeau porte
 * déjà trois boutons, et un quatrième permanent ne tiendrait pas sur un
 * téléphone.
 */

import { h, svg } from './dom.ts';
import { createOverlay } from './overlay.ts';
import { buildSaveFile, downloadText, parseSaveFile } from '../core/storage.ts';
import { storyCompleted } from '../core/progress.ts';
import type { AppStore } from '../core/store.ts';
import type { ToastKind } from './router.ts';

export interface SavePanel {
  nodes: HTMLElement[];
  button: HTMLButtonElement;
  /** Montre ou cache le bouton selon la page affichée. */
  setVisible: (visible: boolean) => void;
  destroy: () => void;
}

export function createSavePanel(
  store: AppStore,
  toast: (message: string, kind?: ToastKind) => void,
): SavePanel {
  const summary = h('p', { class: 'sauvegarde__etat' });

  const overlay = createOverlay({
    id: 'panneau-sauvegarde',
    title: 'Sauvegarde',
    variant: 'palette',
    onOpen: () => {
      const done = storyCompleted(store.progress);
      const started = Object.keys(store.progress.story.episodes).length;
      summary.textContent =
        started === 0
          ? 'Aucun épisode commencé pour l’instant.'
          : `${done} épisode${done > 1 ? 's' : ''} terminé${done > 1 ? 's' : ''} sur ${started} entamé${started > 1 ? 's' : ''}.`;
      button.setAttribute('aria-expanded', 'true');
    },
    onClose: () => button.setAttribute('aria-expanded', 'false'),
  });

  const fileInput = h('input', {
    type: 'file',
    attrs: { accept: 'application/json,.json', hidden: 'true', 'aria-label': 'Choisir une sauvegarde' },
    on: {
      change: (event) => {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          const result = parseSaveFile(String(reader.result ?? ''));
          if (!result.ok || !result.settings || !result.progress) {
            toast(result.message, 'error');
            return;
          }
          store.replaceState(result.settings, result.progress);
          toast('Sauvegarde chargée.', 'success');
          overlay.close();
        });
        reader.readAsText(file);
        input.value = '';
      },
    },
  }) as HTMLInputElement;

  overlay.body.append(
    h(
      'div',
      { class: 'sauvegarde' },
      summary,
      h('p', { class: 'card__hint' },
        'La partie est déjà enregistrée dans ce navigateur. Le fichier sert à ' +
          'l’emporter ailleurs, ou à la mettre à l’abri.'),
      h(
        'div',
        { class: 'sauvegarde__actions' },
        h('button', {
          class: 'btn btn--primary',
          type: 'button',
          text: 'Enregistrer un fichier',
          on: {
            click: () => {
              const stamp = new Date().toISOString().slice(0, 10);
              downloadText(
                `morse-training-${stamp}.json`,
                JSON.stringify(buildSaveFile(store.settings, store.progress), null, 2),
              );
              toast('Sauvegarde enregistrée.', 'success');
            },
          },
        }),
        h('button', {
          class: 'btn',
          type: 'button',
          text: 'Charger un fichier',
          on: { click: () => fileInput.click() },
        }),
      ),
      fileInput,
    ),
  );

  // Une antenne qui rayonne : le geste d'émettre, dans le ton du mode.
  const icon = svg(
    'svg',
    { viewBox: '0 0 24 24', width: '20', height: '20', fill: 'none', 'aria-hidden': 'true' },
    svg('circle', { cx: '12', cy: '17', r: '2', fill: 'currentColor' }),
    svg('path', {
      d: 'M8.5 13.6a5 5 0 0 1 7 0M5.6 10.3a9.5 9.5 0 0 1 12.8 0M2.7 7a13.7 13.7 0 0 1 18.6 0',
      stroke: 'currentColor',
      'stroke-width': '1.6',
      'stroke-linecap': 'round',
    }),
  );

  const button = h('button', {
    class: 'topbar__action topbar__save',
    type: 'button',
    attrs: {
      'aria-label': 'Sauvegarde du mode histoire',
      'aria-controls': 'panneau-sauvegarde',
      'aria-expanded': 'false',
      title: 'Sauvegarde',
      hidden: 'true',
    },
    on: {
      click: () => {
        overlay.toggle();
        button.setAttribute('aria-expanded', String(overlay.isOpen()));
      },
    },
  }) as HTMLButtonElement;
  button.append(icon);

  return {
    nodes: overlay.nodes,
    button,
    setVisible: (visible: boolean) => {
      button.hidden = !visible;
      if (!visible) overlay.close();
    },
    destroy: overlay.destroy,
  };
}
