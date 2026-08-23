/**
 * Mise en forme des grandeurs physiques.
 *
 * Le choix du multiple ne peut pas se faire par une comparaison stricte : les
 * valeurs affichées sont des produits de saisies utilisateur, et 200 kΩ × 5 µF
 * vaut 0,999999999999999 en binaire, pas 1. Sans tolérance, une constante de
 * temps d'une seconde ronde s'affiche « 1 000 ms ». On compare donc à la
 * borne diminuée d'un milliardième, ce qui règle tous les cas de ce genre sans
 * jamais changer un résultat réellement inférieur au seuil.
 */

/** Arrondi lisible : chiffres significatifs plutôt que décimales fixes. */
export function num(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return value > 0 ? 'infinie' : '—';
  return value.toLocaleString('fr-FR', { maximumSignificantDigits: digits });
}

const TOLERANCE = 1 - 1e-9;

/** Choisit le premier palier atteint, puis met en forme. */
function scaled(value: number, steps: Array<[number, string]>, digits: number): string {
  const magnitude = Math.abs(value);
  for (const [scale, suffix] of steps) {
    if (magnitude >= scale * TOLERANCE) return `${num(value / scale, digits)} ${suffix}`;
  }
  const last = steps[steps.length - 1]!;
  return `${num(value / last[0], digits)} ${last[1]}`;
}

export function formatOhms(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return 'infinie';
  if (value === 0) return '0 Ω';
  return scaled(value, [[1e6, 'MΩ'], [1e3, 'kΩ'], [1, 'Ω'], [1e-3, 'mΩ']], digits);
}

export function formatHertz(value: number, digits = 4): string {
  if (!Number.isFinite(value) || value === 0) return '0 Hz';
  return scaled(value, [[1e9, 'GHz'], [1e6, 'MHz'], [1e3, 'kHz'], [1, 'Hz']], digits);
}

export function formatSeconds(value: number, digits = 4): string {
  if (!Number.isFinite(value) || value === 0) return '0 s';
  return scaled(value, [[1, 's'], [1e-3, 'ms'], [1e-6, 'µs'], [1e-9, 'ns']], digits);
}

export function formatMetres(value: number, digits = 4): string {
  if (!Number.isFinite(value) || value === 0) return '0 m';
  return scaled(value, [[1000, 'km'], [1, 'm'], [1e-2, 'cm'], [1e-3, 'mm']], digits);
}
