/**
 * Les habits du site.
 *
 * Un thème n'est pas un cas particulier écrit quelque part dans le code : c'est
 * une entrée dans cette liste, plus un bloc de jetons dans `themes.css`. Rien
 * d'autre n'a besoin de le connaître.
 *
 * Le procédé qui rend ça possible : chaque thème déclare des **traits** — sa
 * clarté, sa source de lumière, s'il emploie des empattements — et la coquille
 * les estampille sur la racine du document sous forme d'attributs. Le style
 * s'accroche aux traits, jamais aux noms. Une règle écrite pour
 * `[data-lumiere='bougie']` vaudra donc pour tous les thèmes à la bougie,
 * y compris ceux qui n'existent pas encore.
 */

/**
 * Ce qui éclaire la pièce. Sert à l'ambiance : la lumière du jour dérive
 * lentement, une flamme est irrégulière, un filament respire, un tube grésille,
 * et une enseigne au néon bafouille avant de se rallumer.
 */
export type LightSource = 'aucune' | 'fenetre' | 'bougie' | 'filament' | 'tube' | 'neon';

export interface ThemeDef {
  /** Identifiant stable : il part dans les réglages enregistrés. */
  id: string;
  name: string;
  /** Une ligne dans la galerie, qui dit le lieu plutôt que les couleurs. */
  blurb: string;
  /**
   * Clair ou sombre. Sert au repli quand on suit le système, et à teinter la
   * barre du navigateur sur téléphone.
   */
  lightness: 'clair' | 'sombre';
  /** Le thème de l'autre clarté, quand il en existe un qui lui répond. */
  twin?: string;
  /** Couleur de la barre du navigateur : c'est le fond du thème. */
  bar: string;
  light: LightSource;
  /** Quatre couleurs pour la vignette de la galerie : fond, surface, accent, texte. */
  swatch: [string, string, string, string];
  /**
   * Vrai si le thème appelle des empattements. Le joueur garde la main : le
   * réglage « police d'époque » peut le refuser.
   */
  period: boolean;
  /**
   * Les années que l'habit couvre, pour le mode histoire. Un épisode de 1912
   * s'ouvre dans l'habit dont l'intervalle le contient.
   */
  years?: [number, number];
}

/**
 * L'ordre est celui de la galerie : les deux habits d'aujourd'hui d'abord,
 * puis le siècle et demi du télégraphe, dans l'ordre où il s'est déroulé.
 */
export const THEMES: ThemeDef[] = [
  {
    id: 'dark',
    name: 'Sombre',
    blurb: 'La référence du site : gris-bleu froid, voyant ambre.',
    lightness: 'sombre',
    twin: 'light',
    bar: '#0b1015',
    light: 'aucune',
    swatch: ['#0b1015', '#1d2733', '#ffb545', '#e7eef5'],
    period: false,
  },
  {
    id: 'light',
    name: 'Clair',
    blurb: 'Le même jeu de jetons, redéfini pour le jour.',
    lightness: 'clair',
    twin: 'dark',
    bar: '#f2f5f8',
    light: 'aucune',
    swatch: ['#f2f5f8', '#eef2f6', '#a35400', '#101a24'],
    period: false,
  },
  {
    id: 'papier',
    name: 'Papier et encre',
    blurb: 'Le registre de 1844, à la lumière d’une fenêtre. Encre ferro-gallique, crayon rouge pour la faute.',
    lightness: 'clair',
    twin: 'cabine',
    bar: '#e6e2d6',
    light: 'fenetre',
    swatch: ['#e6e2d6', '#e3ded0', '#2f4b6e', '#241f19'],
    period: true,
    years: [1800, 1875],
  },
  {
    id: 'cabine',
    name: 'Cabine de nuit',
    blurb: 'Le bureau du télégraphiste après la fermeture : noyer, laiton, une lampe à huile qui bouge.',
    lightness: 'sombre',
    twin: 'papier',
    bar: '#13100b',
    light: 'bougie',
    swatch: ['#13100b', '#2a231a', '#d8a83c', '#f0e5d1'],
    period: true,
    years: [1876, 1905],
  },
  {
    id: 'tsf',
    name: 'TSF 1930',
    blurb: 'Le poste à lampes dans son ébénisterie, et l’œil magique qui verdit quand le signal entre.',
    lightness: 'sombre',
    twin: 'bande',
    bar: '#17120e',
    light: 'filament',
    swatch: ['#17120e', '#2f251c', '#7ad18f', '#ecdfc9'],
    period: true,
    years: [1906, 1938],
  },
  {
    id: 'campagne',
    name: 'Poste de campagne',
    blurb: 'La station de campagne sous sa toile : kaki, bakélite, un cadran qui luit à la lampe de secours.',
    lightness: 'sombre',
    bar: '#131610',
    light: 'filament',
    swatch: ['#131610', '#29301f', '#dbc862', '#e2e6d5'],
    period: true,
    years: [1939, 1949],
  },
  {
    id: 'bande',
    name: 'Bande perforée',
    blurb: 'Le bureau des téléscripteurs sous les tubes : papier blanc, encre noire, ruban rouge pour la faute.',
    lightness: 'clair',
    twin: 'tsf',
    bar: '#eceae3',
    light: 'tube',
    swatch: ['#eceae3', '#e5e3db', '#24242a', '#17171a'],
    period: true,
    years: [1950, 2100],
  },
  {
    id: 'neon',
    name: 'Néon 2087',
    blurb: 'Pour le plaisir : verre fumé, violet électrique, et une enseigne qui bafouille au fond de la rue.',
    lightness: 'sombre',
    bar: '#08060f',
    light: 'neon',
    swatch: ['#08060f', '#1a1233', '#c15cff', '#e8e2ff'],
    // Pas d'empattements : celui-ci ne vient d'aucune époque qu'on ait connue.
    period: false,
    // Et pas d'années : le mode histoire s'arrête en 1999, et un habit sans
    // intervalle ne lui sera jamais prêté.
  },
];

const BY_ID = new Map(THEMES.map((theme) => [theme.id, theme]));

/**
 * L'habit à appliquer, à partir de celui qu'on a choisi et de la lumière du
 * système.
 *
 * La règle vit ici et nulle part ailleurs : la coquille s'en sert pour peindre
 * la page, la galerie pour dire lequel est appliqué quand ce n'est pas celui
 * sur lequel on a cliqué. Les deux ne peuvent pas diverger.
 */
export function resolveThemeId(chosen: string, followsSystem: boolean, prefersLight: boolean): string {
  if (chosen === 'auto') return prefersLight ? 'light' : 'dark';
  if (!followsSystem) return chosen;
  const theme = themeById(chosen);
  const wanted = prefersLight ? 'clair' : 'sombre';
  if (theme.lightness === wanted || !theme.twin) return theme.id;
  return theme.twin;
}

/** Le thème d'identifiant donné, ou celui de repli si le nom ne dit rien. */
export function themeById(id: string): ThemeDef {
  return BY_ID.get(id) ?? (BY_ID.get('dark') as ThemeDef);
}

export function isKnownTheme(id: unknown): id is string {
  return typeof id === 'string' && BY_ID.has(id);
}

/**
 * L'habit d'une année, pour le mode histoire.
 *
 * Les intervalles sont écrits pour se toucher sans se recouvrir ; si une année
 * tombait malgré tout dans un trou, on rend le dernier habit qui la précède,
 * plutôt que rien.
 */
export function themeForYear(year: number): ThemeDef | null {
  let fallback: ThemeDef | null = null;
  for (const theme of THEMES) {
    if (!theme.years) continue;
    const [from, to] = theme.years;
    if (year >= from && year <= to) return theme;
    if (year > to) fallback = theme;
  }
  return fallback;
}
