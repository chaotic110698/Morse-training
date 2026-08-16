/** Présentation lisible des codes de touches physiques (`KeyboardEvent.code`). */

const NAMES: Record<string, string> = {
  Space: "Barre d'espace",
  ArrowLeft: 'Flèche gauche',
  ArrowRight: 'Flèche droite',
  ArrowUp: 'Flèche haut',
  ArrowDown: 'Flèche bas',
  ControlLeft: 'Ctrl gauche',
  ControlRight: 'Ctrl droit',
  ShiftLeft: 'Maj gauche',
  ShiftRight: 'Maj droite',
  AltLeft: 'Alt gauche',
  AltRight: 'Alt droit',
  Enter: 'Entrée',
  Comma: 'Virgule',
  Period: 'Point',
  Slash: 'Barre oblique',
  Semicolon: 'Point-virgule',
  Backquote: 'Accent grave',
  Backslash: 'Antislash',
  BracketLeft: 'Crochet gauche',
  BracketRight: 'Crochet droit',
};

export function keyLabel(code: string): string {
  if (NAMES[code]) return NAMES[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `Pavé num. ${code.slice(6)}`;
  return code;
}

/**
 * Retrouve le code physique d'une touche.
 *
 * `KeyboardEvent.code` est la bonne source : il désigne la touche physique
 * indépendamment de la disposition du clavier. Mais Safari sur iPad ne le
 * renseigne pas toujours pour un clavier externe — il arrive vide, et toute
 * comparaison échoue silencieusement. On retombe alors sur `key`, qu'iPadOS
 * fournit systématiquement, en reconstruisant le code correspondant.
 */
export function resolveCode(event: KeyboardEvent): string {
  if (event.code) return event.code;

  const key = event.key;
  if (key === ' ' || key === 'Spacebar') return 'Space';
  if (key.startsWith('Arrow') || key === 'Enter' || key === 'Escape' || key === 'Tab') return key;
  if (/^[a-zA-Z]$/.test(key)) return `Key${key.toUpperCase()}`;
  if (/^[0-9]$/.test(key)) return `Digit${key}`;

  // Les modificateurs se distinguent par leur position, pas par leur libellé.
  const right = event.location === 2;
  if (key === 'Control') return right ? 'ControlRight' : 'ControlLeft';
  if (key === 'Shift') return right ? 'ShiftRight' : 'ShiftLeft';
  if (key === 'Alt') return right ? 'AltRight' : 'AltLeft';
  return key;
}

/** Vrai si l'événement correspond à la touche configurée, quel que soit l'appareil. */
export function matchesBinding(event: KeyboardEvent, binding: string): boolean {
  return event.code === binding || resolveCode(event) === binding;
}

/** Vrai s'il s'agit de la barre d'espace, y compris sur un clavier d'iPad. */
export function isSpaceKey(event: KeyboardEvent): boolean {
  return matchesBinding(event, 'Space');
}

/** Touches dont il faut absolument neutraliser le comportement par défaut. */
const SCROLLING_KEYS = new Set(['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

export function shouldPreventDefault(code: string): boolean {
  return SCROLLING_KEYS.has(code);
}

/** Vrai si l'événement vient d'un champ de saisie, où il ne faut pas manipuler. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}
