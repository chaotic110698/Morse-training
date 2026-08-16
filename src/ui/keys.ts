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
