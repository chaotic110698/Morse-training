/**
 * Le lexique, en superposition.
 *
 * Même mécanique que les réglages, pour la même raison : on tombe sur un mot
 * inconnu au milieu d'un chapitre ou d'une série, et aller le chercher ailleurs
 * signifierait perdre ce qu'on était en train de faire.
 *
 * Deux entrées possibles. Le bouton du bandeau ouvre la liste complète, par
 * ordre alphabétique, chaque définition se dépliant pour elle seule. Un mot
 * repéré dans un texte ouvre directement le panneau sur sa définition.
 */

import { h, svg } from './dom.ts';
import { createOverlay, type Overlay } from './overlay.ts';
import { glossaryIndex, loadGlossary, slugify, type GlossaryIndex } from '../core/glossary.ts';
import type { GlossaryEntry } from '../data/glossary.ts';

export interface GlossaryPanel {
  nodes: HTMLElement[];
  button: HTMLButtonElement;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Ouvre le lexique sur une entrée, désignée par son terme ou son identifiant. */
  openAt: (key: string) => void;
  destroy: () => void;
}

const entryId = (entry: GlossaryEntry): string => `lexique-${slugify(entry.term)}`;

const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

export function createGlossaryPanel(navigate: (path: string) => void): GlossaryPanel {
  let index: GlossaryIndex | null = glossaryIndex();
  let query = '';
  /** Entrée à déplier dès l'ouverture, quand on arrive par un mot cliqué. */
  let pending: GlossaryEntry | null = null;
  /**
   * Termes dépliés. Le lexique repart replié à chaque ouverture : un
   * dictionnaire qui rouvrirait sur les sept définitions consultées la veille
   * n'aiderait personne, et un mot cliqué doit arriver seul à l'écran.
   */
  const expanded = new Set<string>();

  const search = h('input', {
    class: 'input glossaire__search',
    type: 'search',
    id: 'lexique-recherche',
    attrs: {
      placeholder: 'Rechercher un terme…',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      'aria-label': 'Rechercher dans le lexique',
    },
    on: {
      input: () => {
        query = search.value;
        drawList();
      },
      keydown: (event) => {
        if (event.key !== 'Escape' || search.value === '') return;
        // Échap vide d'abord la recherche : refermer le panneau du même geste
        // ferait perdre la liste à qui voulait seulement effacer trois lettres.
        event.stopPropagation();
        event.preventDefault();
        search.value = '';
        query = '';
        drawList();
      },
    },
  }) as HTMLInputElement;

  const count = h('p', { class: 'glossaire__count', attrs: { 'aria-live': 'polite' } });
  const alphabet = h('nav', { class: 'glossaire__alpha', attrs: { 'aria-label': 'Aller à une lettre' } });
  const list = h('div', { class: 'glossaire__list' });

  const overlay: Overlay = createOverlay({
    id: 'panneau-lexique',
    title: 'Lexique',
    onOpen: () => ensureIndex(),
    onClose: () => {
      pending = null;
      expanded.clear();
      query = '';
      search.value = '';
      button.setAttribute('aria-expanded', 'false');
    },
    initialFocus: () => {
      if (!pending) return search;
      const target = list.querySelector<HTMLElement>(`#${CSS.escape(entryId(pending))} > summary`);
      pending = null;
      return target ?? search;
    },
  });

  // La recherche et la frise alphabétique se placent entre l'en-tête et la
  // liste : posées dans le corps, elles défileraient avec elle et il faudrait
  // remonter tout l'alphabet pour changer d'idée.
  overlay.head.insertAdjacentElement(
    'afterend',
    h('div', { class: 'glossaire__tools' }, h('div', { class: 'glossaire__query' }, search, count), alphabet),
  );
  overlay.body.append(list);

  /** Charge les définitions si besoin, puis redessine. */
  const ensureIndex = (then?: (loaded: GlossaryIndex) => void): void => {
    if (index) {
      drawList();
      then?.(index);
      return;
    }
    drawList();
    void loadGlossary().then((loaded) => {
      index = loaded;
      drawList();
      then?.(loaded);
    });
  };

  // --- Rendu d'une définition ---

  /**
   * Une définition renvoie aux termes voisins qu'elle emploie. C'est ce qui
   * transforme une liste de fiches en un réseau : on entre par « ROS » et on
   * ressort en ayant compris l'adaptation d'impédance.
   */
  const definitionOf = (entry: GlossaryEntry, loaded: GlossaryIndex): DocumentFragment => {
    const fragment = document.createDocumentFragment();
    const text = entry.definition;
    let cursor = 0;
    for (const match of loaded.matchDefinition(entry)) {
      if (match.start > cursor) fragment.append(text.slice(cursor, match.start));
      fragment.append(crossLink(text.slice(match.start, match.end), match.entry));
      cursor = match.end;
    }
    if (cursor < text.length) fragment.append(text.slice(cursor));
    return fragment;
  };

  const crossLink = (label: string, target: GlossaryEntry): HTMLElement =>
    h('button', {
      class: 'glossaire__link',
      type: 'button',
      text: label,
      title: `Définition : ${target.term}`,
      on: { click: () => reveal(target) },
    });

  const entryBlock = (entry: GlossaryEntry, loaded: GlossaryIndex): HTMLElement => {
    const aliases = (entry.aliases ?? []).filter(
      (alias) => alias.toLowerCase() !== entry.term.toLowerCase(),
    );
    const summary = h(
      'summary',
      { class: 'glossaire__term' },
      h('span', { class: 'glossaire__word', text: entry.term }),
      aliases.length > 0 ? h('span', { class: 'glossaire__aliases', text: aliases.join(', ') }) : null,
    );

    const body = h('div', { class: 'glossaire__def' }, h('p', {}, definitionOf(entry, loaded)));

    const references = (entry.see ?? [])
      .map((term) => loaded.find(term))
      .filter((target): target is GlossaryEntry => target !== null);
    if (references.length > 0) {
      body.append(
        h(
          'p',
          { class: 'glossaire__see' },
          h('span', { class: 'glossaire__see-label', text: 'Voir aussi' }),
          ...references.flatMap((target, position) => [
            position > 0
              ? h('span', { class: 'glossaire__see-sep', text: '·', attrs: { 'aria-hidden': 'true' } })
              : null,
            crossLink(target.term, target),
          ]),
        ),
      );
    }

    if (entry.route) {
      const path = entry.route.replace(/^#/, '');
      body.append(
        h('button', {
          class: 'glossaire__chapter',
          type: 'button',
          text: 'Lire le chapitre →',
          on: {
            click: () => {
              overlay.close();
              navigate(path);
            },
          },
        }),
      );
    }

    const details = h('details', { class: 'glossaire__entry', id: entryId(entry) }, summary, body);
    if (expanded.has(entry.term)) details.open = true;
    details.addEventListener('toggle', () => {
      if (details.open) expanded.add(entry.term);
      else expanded.delete(entry.term);
    });
    return details;
  };

  // --- Rendu de la liste ---

  const drawList = (): void => {
    const loaded = index;
    if (!loaded) {
      count.textContent = '';
      alphabet.hidden = true;
      list.replaceChildren(h('p', { class: 'empty', text: 'Chargement du lexique…' }));
      return;
    }

    const found = loaded.search(query);
    count.textContent =
      query.trim() === ''
        ? `${loaded.entries.length} termes`
        : found.length === 0
          ? 'Aucun terme'
          : `${found.length} terme${found.length > 1 ? 's' : ''}`;

    if (found.length === 0) {
      alphabet.hidden = true;
      list.replaceChildren(h('p', { class: 'empty', text: 'Aucun terme ne correspond à cette recherche.' }));
      return;
    }

    // La recherche classe les débuts de mot en tête : la découper en tranches
    // alphabétiques annulerait ce classement, donc on ne groupe qu'au repos.
    if (query.trim() !== '') {
      alphabet.hidden = true;
      list.replaceChildren(...found.map((entry) => entryBlock(entry, loaded)));
      return;
    }

    alphabet.hidden = false;
    const groups = loaded.groups(found);
    const letters = new Set(groups.map((group) => group.letter));
    alphabet.replaceChildren(
      ...ALPHABET.map((letter) =>
        h('button', {
          class: 'glossaire__jump',
          type: 'button',
          text: letter,
          disabled: !letters.has(letter),
          attrs: { 'aria-label': `Aller à la lettre ${letter}` },
          on: {
            click: () => {
              // Saut instantané : la liste fait plusieurs milliers de pixels,
              // et une glissade d'un bout à l'autre de l'alphabet donnerait le
              // mal de mer avant d'arriver.
              list.querySelector(`[data-letter="${letter}"]`)?.scrollIntoView({ block: 'start' });
            },
          },
        }),
      ),
    );

    list.replaceChildren(
      ...groups.map((group) =>
        h(
          'section',
          { class: 'glossaire__group', data: { letter: group.letter } },
          h('h3', { class: 'glossaire__letter', text: group.letter }),
          ...group.entries.map((entry) => entryBlock(entry, loaded)),
        ),
      ),
    );
  };

  /** Ouvre le lexique sur une entrée, en repartant de la liste complète. */
  const reveal = (entry: GlossaryEntry): void => {
    expanded.add(entry.term);
    if (query !== '') {
      query = '';
      search.value = '';
    }
    if (!overlay.isOpen()) {
      pending = entry;
      overlay.open();
      button.setAttribute('aria-expanded', 'true');
      return;
    }
    drawList();
    const details = list.querySelector<HTMLDetailsElement>(`#${CSS.escape(entryId(entry))}`);
    if (!details) return;
    details.open = true;
    details.scrollIntoView({ block: 'center' });
    details.querySelector('summary')?.focus();
  };

  // --- Bouton du bandeau ---

  const icon = svg(
    'svg',
    { viewBox: '0 0 24 24', width: '20', height: '20', fill: 'none', 'aria-hidden': 'true' },
    svg('path', {
      d: 'M4 4.5A1.5 1.5 0 0 1 5.5 3H10a2 2 0 0 1 2 2 2 2 0 0 1 2-2h4.5A1.5 1.5 0 0 1 20 4.5v13a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 0 0-2 2 2 2 0 0 0-2-2H5.5A1.5 1.5 0 0 1 4 17.5z',
      stroke: 'currentColor',
      'stroke-width': '1.6',
      'stroke-linejoin': 'round',
    }),
    svg('path', { d: 'M12 5v16', stroke: 'currentColor', 'stroke-width': '1.6' }),
  );

  const button = h('button', {
    class: 'topbar__action topbar__book',
    type: 'button',
    attrs: {
      'aria-label': 'Lexique',
      'aria-controls': 'panneau-lexique',
      'aria-expanded': 'false',
      title: 'Lexique',
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
    open: () => {
      overlay.open();
      button.setAttribute('aria-expanded', 'true');
    },
    close: overlay.close,
    toggle: () => {
      overlay.toggle();
      button.setAttribute('aria-expanded', String(overlay.isOpen()));
    },
    openAt: (key: string) => {
      if (index) {
        const entry = index.find(key);
        if (entry) reveal(entry);
        return;
      }
      // Le mot a été cliqué avant que les définitions ne soient là : on ouvre
      // le panneau tout de suite et on déplie l'entrée dès qu'elle arrive.
      overlay.open();
      button.setAttribute('aria-expanded', 'true');
      ensureIndex((loaded) => {
        const entry = loaded.find(key);
        if (entry) reveal(entry);
      });
    },
    destroy: overlay.destroy,
  };
}
