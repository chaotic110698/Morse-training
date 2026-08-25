/**
 * Recherche globale, en superposition.
 *
 * Le site a passé la taille où l'on trouve une page en la cherchant dans un
 * menu. La loupe — ou Ctrl+K — ouvre une boîte centrée : on tape, on choisit,
 * on y est. Elle fouille les pages et leurs sections, le lexique, les codes et
 * abréviations, le formulaire et les énoncés des questions.
 *
 * L'ensemble suit le motif du champ à liste : le focus ne quitte jamais la
 * saisie, la sélection se déplace aux flèches et se déclare par
 * `aria-activedescendant`. C'est ce qui permet de taper et de choisir sans
 * jamais changer de main.
 */

import { h, svg } from './dom.ts';
import { createOverlay } from './overlay.ts';
import { fold } from '../core/glossary.ts';
import {
  KIND_LABELS,
  loadSearchIndex,
  searchIndex,
  type SearchHit,
  type SearchIndex,
  type SearchKind,
} from '../core/search.ts';

export interface SearchPanel {
  nodes: HTMLElement[];
  button: HTMLButtonElement;
  open: () => void;
  close: () => void;
  destroy: () => void;
}

export interface SearchPanelOptions {
  navigate: (path: string) => void;
  /** Ouvre le lexique sur un terme : un résultat de lexique n'est pas une page. */
  openGlossary: (term: string) => void;
}

/** Ce que le site propose quand la barre est encore vide. */
const EXAMPLES = ['Farnsworth', 'code Q', 'loi d’Ohm', 'balun', 'fréquence image'];

export function createSearchPanel(options: SearchPanelOptions): SearchPanel {
  let index: SearchIndex | null = searchIndex();
  let hits: SearchHit[] = [];
  let selected = 0;

  const input = h('input', {
    class: 'input recherche__champ',
    type: 'search',
    id: 'recherche-champ',
    attrs: {
      placeholder: 'Rechercher une page, un mot, une formule…',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      role: 'combobox',
      'aria-expanded': 'false',
      'aria-controls': 'recherche-resultats',
      'aria-autocomplete': 'list',
      'aria-label': 'Rechercher dans tout le site',
    },
    on: {
      input: () => draw(),
      keydown: (event) => onKeydown(event),
    },
  }) as HTMLInputElement;

  const count = h('p', { class: 'recherche__compte', attrs: { 'aria-live': 'polite' } });
  const list = h('div', {
    class: 'recherche__liste',
    id: 'recherche-resultats',
    attrs: { role: 'listbox', 'aria-label': 'Résultats' },
  });

  const overlay = createOverlay({
    id: 'panneau-recherche',
    title: 'Recherche',
    variant: 'palette',
    onOpen: () => {
      draw();
      if (!index) {
        void loadSearchIndex().then((loaded) => {
          index = loaded;
          if (overlay.isOpen()) draw();
        });
      }
      button.setAttribute('aria-expanded', 'true');
    },
    onClose: () => {
      button.setAttribute('aria-expanded', 'false');
      input.value = '';
      hits = [];
      selected = 0;
    },
    initialFocus: () => input,
  });

  overlay.head.insertAdjacentElement(
    'afterend',
    h('div', { class: 'recherche__tete' }, input, count),
  );
  overlay.body.append(list);

  // --- Résultats ---

  const optionId = (position: number): string => `recherche-option-${position}`;

  const select = (position: number): void => {
    if (hits.length === 0) return;
    selected = (position + hits.length) % hits.length;
    for (const [rank, node] of [...list.querySelectorAll<HTMLElement>('.recherche__item')].entries()) {
      const active = rank === selected;
      node.classList.toggle('is-selected', active);
      node.setAttribute('aria-selected', String(active));
      if (active) {
        input.setAttribute('aria-activedescendant', node.id);
        node.scrollIntoView({ block: 'nearest' });
      }
    }
  };

  const choose = (hit: SearchHit): void => {
    overlay.close();
    if (hit.target.type === 'glossaire') {
      options.openGlossary(hit.target.term);
      return;
    }
    options.navigate(hit.target.path);
    if (hit.target.anchor) scrollToHeading(hit.target.anchor);
  };

  /**
   * Rejoint le titre de section choisi. La page vient d'être demandée mais
   * n'est pas encore posée : on la guette quelques images avant d'abandonner,
   * plutôt que de parier sur un délai.
   */
  const scrollToHeading = (heading: string): void => {
    const wanted = fold(heading).trim();
    let tries = 0;
    const look = (): void => {
      const outlet = document.querySelector('.outlet');
      const found = outlet
        ? [...outlet.querySelectorAll<HTMLElement>('h2, h3')].find(
            (node) => fold(node.textContent ?? '').trim() === wanted,
          )
        : null;
      if (found) {
        found.scrollIntoView({ block: 'start' });
        return;
      }
      tries += 1;
      if (tries < 12) window.requestAnimationFrame(look);
    };
    window.requestAnimationFrame(look);
  };

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowDown') { event.preventDefault(); select(selected + 1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); select(selected - 1); }
    else if (event.key === 'Home' && hits.length > 0) { event.preventDefault(); select(0); }
    else if (event.key === 'End' && hits.length > 0) { event.preventDefault(); select(hits.length - 1); }
    else if (event.key === 'Enter') {
      const hit = hits[selected];
      if (hit) { event.preventDefault(); choose(hit); }
    } else if (event.key === 'Escape' && input.value !== '') {
      // Échap efface d'abord la recherche, comme dans le lexique.
      event.stopPropagation();
      event.preventDefault();
      input.value = '';
      draw();
    }
  };

  const itemNode = (hit: SearchHit, position: number): HTMLElement =>
    h(
      'button',
      {
        class: 'recherche__item',
        type: 'button',
        id: optionId(position),
        attrs: { role: 'option', 'aria-selected': String(position === selected), tabindex: '-1' },
        on: {
          click: () => choose(hit),
          mousemove: () => select(position),
        },
      },
      h('span', { class: 'recherche__label', text: hit.label }),
      h('span', { class: 'recherche__detail', text: hit.detail }),
    );

  const draw = (): void => {
    const query = input.value.trim();

    if (!index) {
      count.textContent = '';
      input.setAttribute('aria-expanded', 'false');
      list.replaceChildren(h('p', { class: 'empty', text: 'Chargement de l’index…' }));
      return;
    }

    if (query === '') {
      hits = [];
      selected = 0;
      count.textContent = '';
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      list.replaceChildren(
        h(
          'div',
          { class: 'recherche__vide' },
          h('p', { text: 'Pages, sections, lexique, codes, formules et questions d’examen.' }),
          h(
            'p',
            { class: 'recherche__exemples' },
            'Par exemple : ',
            ...EXAMPLES.flatMap((example, rank) => [
              rank > 0 ? ' · ' : '',
              h('button', {
                class: 'recherche__exemple',
                type: 'button',
                text: example,
                on: {
                  click: () => {
                    input.value = example;
                    input.focus();
                    draw();
                  },
                },
              }),
            ]),
          ),
        ),
      );
      return;
    }

    hits = index.query(query);
    selected = 0;
    input.setAttribute('aria-expanded', String(hits.length > 0));

    if (hits.length === 0) {
      count.textContent = 'Aucun résultat';
      input.removeAttribute('aria-activedescendant');
      list.replaceChildren(
        h('p', { class: 'empty', text: `Rien ne correspond à « ${query} ».` }),
      );
      return;
    }

    count.textContent = `${hits.length} résultat${hits.length > 1 ? 's' : ''}`;

    // Les résultats restent classés par pertinence ; les intitulés de famille
    // ne font que nommer les paquets qui se suivent naturellement.
    const nodes: HTMLElement[] = [];
    let previous: SearchKind | null = null;
    for (const [position, hit] of hits.entries()) {
      if (hit.kind !== previous) {
        nodes.push(h('p', { class: 'recherche__famille', text: KIND_LABELS[hit.kind] }));
        previous = hit.kind;
      }
      nodes.push(itemNode(hit, position));
    }
    list.replaceChildren(...nodes);
    select(0);
  };

  // --- Bouton et raccourci clavier ---

  const icon = svg(
    'svg',
    { viewBox: '0 0 24 24', width: '20', height: '20', fill: 'none', 'aria-hidden': 'true' },
    svg('circle', {
      cx: '11', cy: '11', r: '6.5',
      stroke: 'currentColor', 'stroke-width': '1.7',
    }),
    svg('path', {
      d: 'M16 16l4.5 4.5',
      stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linecap': 'round',
    }),
  );

  const button = h('button', {
    class: 'topbar__action topbar__search',
    type: 'button',
    attrs: {
      'aria-label': 'Rechercher',
      'aria-controls': 'panneau-recherche',
      'aria-expanded': 'false',
      title: 'Rechercher (Ctrl + K)',
    },
    on: {
      click: () => {
        if (overlay.isOpen()) overlay.close();
        else overlay.open();
      },
    },
  }) as HTMLButtonElement;
  button.append(icon);

  const onShortcut = (event: KeyboardEvent): void => {
    if (event.key.toLowerCase() !== 'k' || !(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    if (overlay.isOpen()) overlay.close();
    else overlay.open();
  };
  document.addEventListener('keydown', onShortcut);

  return {
    nodes: overlay.nodes,
    button,
    open: overlay.open,
    close: overlay.close,
    destroy: () => {
      document.removeEventListener('keydown', onShortcut);
      overlay.destroy();
    },
  };
}
