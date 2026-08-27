/**
 * Repérage des termes du lexique dans les pages.
 *
 * Un mot défini ailleurs sur le site devient cliquable là où on le rencontre.
 * Le procédé n'a d'intérêt que s'il reste discret : on ne signale qu'une
 * occurrence par terme et par page, et jamais dans une formule, un tableau de
 * valeurs, un bouton ou un titre — c'est-à-dire partout où un soulignement
 * gênerait la lecture ou dérouterait un clic.
 *
 * Les pages se redessinent sans prévenir : une série d'écoute change de
 * caractère, un questionnaire passe à la question suivante. Un observateur
 * suit donc le contenu plutôt que de compter sur un seul passage au chargement.
 */

import { h } from './dom.ts';
import { glossaryIndex, loadGlossary, slugify, type GlossaryIndex, type SeenTerms } from '../core/glossary.ts';

/**
 * Ce qu'on ne traverse pas. Deux familles : ce qui n'est pas de la prose
 * (formules, valeurs, morse, saisies) et ce qui est déjà cliquable, où un
 * bouton de plus casserait la cible.
 */
const SKIP = [
  'a', 'button', 'input', 'textarea', 'select', 'option', 'label', 'summary',
  'code', 'pre', 'kbd', 'samp', 'abbr',
  'h1', 'h2', 'h3', 'h4', 'th',
  '.terme', '.formula', '.mono', '.num', '.morse', '.display', '.converter',
  '.metric', '.lexicon', '.toolbar', '.picker', '.qcm-choice', '.chapter-nav',
  '.crumbs', '.field__label', '.switch', '.slider-row', '[data-lexique="off"]',
].join(', ');

/**
 * En dessous, une chaîne ne peut porter aucun terme du lexique : les formes les
 * plus courtes sont des sigles de deux lettres — « AM », « CW », « FI ».
 */
const MIN_LENGTH = 2;

export interface GlossaryMarker {
  /** Repasse sur le contenu, par exemple après un changement de page. */
  refresh: () => void;
  destroy: () => void;
}

export function createGlossaryMarker(root: HTMLElement, openAt: (key: string) => void): GlossaryMarker {
  let scheduled = 0;
  let index: GlossaryIndex | null = glossaryIndex();

  /**
   * Les nœuds de texte candidats sont relevés avant toute modification : les
   * décorer en cours de parcours reviendrait à marcher sur la branche qu'on
   * est en train de scier.
   */
  const collect = (node: Element, found: Text[]): void => {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child as Text;
        if (text.data.trim().length >= MIN_LENGTH) found.push(text);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element;
        if (element.matches(SKIP)) continue;
        collect(element, found);
      }
    }
  };

  /**
   * Vrai si l'élément dispose ses enfants en flex ou en grille.
   *
   * C'est la seule question que le marquage doit poser à la mise en page, et
   * elle est mesurée une fois par parent : `getComputedStyle` sur chaque nœud
   * de texte d'une longue page coûterait cher pour rien.
   */
  const arranged = new WeakMap<Element, boolean>();
  const arrangesChildren = (element: Element): boolean => {
    const known = arranged.get(element);
    if (known !== undefined) return known;
    const display = getComputedStyle(element).display;
    const value = display.endsWith('flex') || display.endsWith('grid');
    arranged.set(element, value);
    return value;
  };

  const decorate = (text: Text, seen: SeenTerms, loaded: GlossaryIndex): void => {
    const matches = loaded.match(text.data, seen);
    if (matches.length === 0) return;
    const source = text.data;
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const match of matches) {
      if (match.start > cursor) fragment.append(source.slice(cursor, match.start));
      fragment.append(
        h('button', {
          class: 'terme',
          type: 'button',
          text: source.slice(match.start, match.end),
          title: `Définition : ${match.entry.term}`,
          data: { terme: slugify(match.entry.term) },
        }),
      );
      cursor = match.end;
    }
    if (cursor < source.length) fragment.append(source.slice(cursor));

    // Dans un conteneur flex ou en grille, le nœud de texte formait un seul
    // élément ; le découper en trois en ferait trois, et la mise en page
    // jetterait les espaces qui les séparent — « 20 WPM caractères » devenant
    // « 20WPMcaractères ». On lui rend donc un unique élément, à l'intérieur
    // duquel le texte se compose normalement.
    const parent = text.parentElement;
    if (parent && arrangesChildren(parent)) {
      text.replaceWith(h('span', { class: 'terme-suite' }, fragment));
      return;
    }
    text.replaceWith(fragment);
  };

  /**
   * Les termes déjà signalés sont relus dans la page plutôt que mémorisés :
   * quand une page se redessine, les marques disparaissent avec elle, et un
   * compteur interne continuerait à croire le travail fait.
   */
  const mark = (loaded: GlossaryIndex): void => {
    const seen = new Set<string>();
    for (const marked of root.querySelectorAll<HTMLElement>('.terme[data-terme]')) {
      const slug = marked.dataset['terme'];
      if (slug) seen.add(slug);
    }
    // Le repérage raisonne sur les termes canoniques, la page sur les
    // identifiants : on passe par un jeu commun, celui des identifiants.
    const bySlug: SeenTerms = {
      has: (term) => seen.has(slugify(term)),
      add: (term) => void seen.add(slugify(term)),
    };

    const targets: Text[] = [];
    collect(root, targets);
    for (const text of targets) if (text.isConnected) decorate(text, bySlug, loaded);
  };

  /**
   * Une mutation survenue dans un sous-arbre qu'on ne parcourt jamais ne peut
   * ni créer un terme à souligner ni en effacer un. Le filtre a son
   * importance : pendant une séance d'émission, l'affichage change à chaque
   * élément manipulé, et repasser sur toute la page à ce rythme prendrait du
   * temps là où il faut précisément n'en prendre aucun.
   */
  const relevant = (records: MutationRecord[]): boolean =>
    records.some((record) => {
      const target =
        record.target.nodeType === Node.ELEMENT_NODE
          ? (record.target as Element)
          : record.target.parentElement;
      return target !== null && !target.closest(SKIP);
    });

  const observer = new MutationObserver((records) => {
    if (relevant(records)) schedule();
  });

  const run = (): void => {
    scheduled = 0;
    if (!index) return;
    observer.disconnect();
    mark(index);
    // Les mutations que le repérage vient lui-même de produire sont écartées :
    // les réobserver relancerait le cycle indéfiniment.
    observer.takeRecords();
    observer.observe(root, { childList: true, subtree: true, characterData: true });
  };

  const schedule = (): void => {
    if (scheduled) return;
    scheduled = window.requestAnimationFrame(run);
  };

  // Un seul écouteur délégué plutôt qu'un par mot : les marques vont et
  // viennent à chaque redessin, pas lui.
  const onClick = (event: MouseEvent): void => {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('.terme[data-terme]');
    const slug = target?.dataset['terme'];
    if (!slug) return;
    event.preventDefault();
    openAt(slug);
  };
  root.addEventListener('click', onClick);

  // Les définitions arrivent dans un module à part, chargé après la première
  // page : d'ici là le clic reste possible — le panneau saura attendre — mais
  // il n'y a rien à souligner.
  if (index) run();
  else {
    void loadGlossary().then((loaded) => {
      index = loaded;
      run();
    });
  }

  return {
    refresh: schedule,
    destroy: () => {
      observer.disconnect();
      root.removeEventListener('click', onClick);
      if (scheduled) window.cancelAnimationFrame(scheduled);
    },
  };
}
