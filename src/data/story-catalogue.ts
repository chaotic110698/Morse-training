/**
 * Le catalogue du récit : ce que le reste du site doit savoir des épisodes
 * sans avoir à les lire.
 *
 * Les épisodes eux-mêmes pèsent une centaine de kilo-octets de prose et sont
 * chargés à la demande, quand on ouvre le mode histoire. Les succès, eux, sont
 * évalués au démarrage — ils vivent dans le paquet principal, et importer
 * `EPISODES` depuis là y ramènerait tout le récit. On a mesuré : quatre-vingts
 * kilo-octets de plus sur le premier écran, pour compter des épisodes.
 *
 * D'où cette liste, qui ne porte que l'identifiant, la génération et le
 * caractère facultatif. Elle recopie donc une information qui existe ailleurs,
 * et c'est le seul endroit du dépôt où cela se produit — `validateStory` refuse
 * de valider si les deux divergent, et la suite logique le vérifie à chaque
 * passage. Ajouter un épisode sans venir ici fera échouer les essais, pas
 * silencieusement dériver les objectifs.
 */

export interface CatalogueEntry {
  id: string;
  generation: number;
  optional: boolean;
}

export const STORY_CATALOGUE: CatalogueEntry[] = [
  { id: 'ce-que-dieu-a-fait', generation: 1, optional: false },
  { id: 'la-ligne', generation: 1, optional: false },
  { id: 'la-derniere-tour', generation: 1, optional: false },
  { id: 'le-fil-sous-atlantique', generation: 2, optional: false },
  { id: 'paris-coupe', generation: 2, optional: false },
  { id: 'la-demande', generation: 2, optional: true },
  { id: 'trois-points', generation: 3, optional: false },
  { id: 'la-main', generation: 3, optional: true },
  { id: 'mgy', generation: 3, optional: false },
  { id: 'la-tour-qui-ecoute', generation: 3, optional: false },
  { id: 'le-poste-a-galene', generation: 4, optional: true },
  { id: 'cinq-minutes', generation: 4, optional: false },
  { id: 'les-sanglots-longs', generation: 4, optional: false },
  { id: 'sept-kilometres', generation: 5, optional: true },
  { id: 'le-quart', generation: 5, optional: false },
  { id: 'les-trois-minutes', generation: 5, optional: false },
  { id: 'notre-dernier-cri', generation: 5, optional: false },
  { id: 'sk', generation: 5, optional: false },
];

/** Épisodes obligatoires : ceux qui composent le récit proprement dit. */
export const STORY_REQUIRED = STORY_CATALOGUE.filter((entry) => !entry.optional).length;

/** Épisodes « Entre les ondes », qui ne racontent que la famille. */
export const STORY_LORE = STORY_CATALOGUE.filter((entry) => entry.optional).length;

export const STORY_GENERATIONS = new Set(STORY_CATALOGUE.map((entry) => entry.generation)).size;
