/**
 * Contrôles de réglage partagés.
 *
 * La page Réglages et le panneau flottant affichent les mêmes commandes ; les
 * écrire une seule fois évite qu'elles divergent. Ce module ne connaît ni la
 * page ni le panneau : il rend des éléments, l'appelant les dispose.
 */

import { h } from './dom.ts';

export interface SliderOptions {
  min: number;
  max: number;
  step?: number;
  value: number;
  /** Mise en forme de la valeur affichée dans le champ. */
  format: (value: number) => string;
  /** Lecture inverse : du texte saisi vers la valeur. Par défaut, `Number`. */
  parse?: (text: string) => number;
  /** Unité affichée après le champ, quand elle ne tient pas dans le format. */
  unit?: string;
  onInput: (value: number) => void;
  /** Nom de la grandeur réglée, pour les lecteurs d'écran. */
  label: string;
  /**
   * Clavier à faire apparaître sur mobile. `numeric` n'offre que des chiffres,
   * `decimal` y ajoute le séparateur décimal — c'est ce qui déclenche le pavé
   * numérique sur iPhone plutôt que le clavier alphabétique complet.
   */
  keyboard?: 'numeric' | 'decimal';
  /**
   * Identifiant stable du réglage. La page Réglages se redessine entièrement à
   * chaque modification ; sans repère, le champ qui avait le focus disparaît
   * sous les doigts et la flèche suivante ne fait plus rien. Cet identifiant
   * permet de retrouver le même contrôle après le redessin.
   */
  id?: string;
}

/** Arrondit au pas le plus proche, puis borne. */
function snap(value: number, options: SliderOptions): number {
  const step = options.step ?? 1;
  const snapped = Math.round(value / step) * step;
  // Le produit d'un arrondi par un pas décimal traîne des chiffres binaires :
  // 0,1 × 3 vaut 0,30000000000000004. On recale sur la précision du pas.
  const decimals = (String(step).split('.')[1] ?? '').length;
  const clean = Number(snapped.toFixed(decimals));
  return Math.min(options.max, Math.max(options.min, clean));
}

/**
 * Curseur doublé d'un champ de saisie.
 *
 * Les deux commandes pilotent la même valeur et se recopient l'une l'autre. Le
 * curseur applique en continu, le champ seulement à la validation : appliquer
 * chaque frappe ferait passer une vitesse par 2 mots par minute avant
 * d'atteindre 25, ce qui est désagréable en pleine séance.
 */
export function slider(options: SliderOptions): HTMLElement {
  const step = options.step ?? 1;
  const parse = options.parse ?? ((text: string) => Number(text.replace(',', '.')));
  let current = snap(options.value, options);

  const field = h('input', {
    class: 'slider__field',
    type: 'text',
    value: options.format(current),
    attrs: {
      inputmode: options.keyboard ?? (step < 1 ? 'decimal' : 'numeric'),
      enterkeyhint: 'done',
      autocomplete: 'off',
      autocorrect: 'off',
      spellcheck: 'false',
      'aria-label': options.label,
      ...(options.id ? { 'data-focus-key': `${options.id}-field` } : {}),
    },
  });

  const range = h('input', {
    class: 'slider',
    type: 'range',
    attrs: {
      min: options.min,
      max: options.max,
      step,
      value: current,
      'aria-label': options.label,
      ...(options.id ? { 'data-focus-key': `${options.id}-range` } : {}),
    },
  });

  const apply = (value: number, source: 'range' | 'field'): void => {
    const next = snap(value, options);
    if (next === current && source === 'field') {
      // Valeur inchangée mais saisie peut-être mal formée : on reformate.
      field.value = options.format(current);
      return;
    }
    current = next;
    if (source !== 'range') range.value = String(current);
    // Le champ est réécrit même quand la valeur vient de lui. Sans cela, une
    // flèche du clavier monterait la valeur sans toucher au texte affiché ; le
    // redessin qui suit retirerait le champ du DOM, ce qui déclenche un
    // « blur », lequel relirait l'ancien texte et annulerait le changement.
    // C'est aussi ce qui remet « 08 » en forme après une saisie.
    field.value = options.format(current);
    options.onInput(current);
  };

  range.addEventListener('input', () => {
    current = snap(Number(range.value), options);
    field.value = options.format(current);
    options.onInput(current);
  });

  const commit = (): void => {
    // Un champ retiré du DOM émet un « blur » qu'il ne faut pas confondre avec
    // une validation : à ce moment sa valeur n'a plus de sens.
    if (!field.isConnected) return;
    const parsed = parse(field.value);
    if (!Number.isFinite(parsed)) {
      // Saisie illisible : on remet la valeur en place plutôt que de deviner.
      field.value = options.format(current);
      return;
    }
    apply(parsed, 'field');
  };

  field.addEventListener('change', commit);
  field.addEventListener('blur', commit);
  field.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
      field.blur();
      return;
    }
    // Les flèches ajustent d'un pas, comme sur un champ numérique natif.
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      apply(current + (event.key === 'ArrowUp' ? step : -step), 'field');
    }
  });
  // Sélectionner tout à la prise de focus évite d'avoir à effacer avant de
  // saisir, geste pénible sur un téléphone.
  field.addEventListener('focus', () => field.select());

  return h(
    'div',
    { class: 'slider-row' },
    range,
    h(
      'span',
      { class: 'slider__entry' },
      field,
      options.unit ? h('span', { class: 'slider__unit', text: options.unit }) : null,
    ),
  );
}

/** Étiquette, contrôle et aide : le motif de toutes les lignes de réglage. */
export function settingRow(label: string, control: Node, hint?: string): HTMLElement {
  return h(
    'div',
    { class: 'field' },
    h('div', { class: 'field__label', text: label }),
    h('div', { class: 'field__control' }, control),
    hint ? h('p', { class: 'field__hint', text: hint }) : null,
  );
}

/**
 * Mémorise le contrôle qui a le focus avant un redessin, et le rend après.
 *
 * Les vues de réglage se reconstruisent en entier à chaque modification, ce qui
 * est simple et sûr mais fait disparaître l'élément actif. On note son repère
 * et, pour un champ texte, la position du curseur de saisie.
 */
export function keepFocus(container: HTMLElement, redraw: () => void): void {
  const active = document.activeElement as HTMLElement | null;
  const key = active && container.contains(active) ? active.dataset['focusKey'] : undefined;
  const input = active as HTMLInputElement | null;
  const start = key && input && input.type === 'text' ? input.selectionStart : null;
  const end = key && input && input.type === 'text' ? input.selectionEnd : null;

  redraw();

  if (!key) return;
  const restored = container.querySelector<HTMLElement>(`[data-focus-key="${key}"]`);
  if (!restored) return;
  restored.focus();
  if (start !== null && end !== null && restored instanceof HTMLInputElement) {
    try {
      restored.setSelectionRange(start, end);
    } catch {
      // Certains types de champ refusent la sélection : sans conséquence.
    }
  }
}
