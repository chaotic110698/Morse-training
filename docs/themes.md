# Ajouter un habit

Un thème tient en deux endroits. Il n'y en a pas de troisième : aucun composant,
aucune vue, aucun réglage n'a besoin d'être averti.

## 1. L'entrée du registre

Dans `src/data/themes.ts`, à sa place chronologique dans le tableau `THEMES` :

```ts
{
  id: 'atelier',              // stable : il part dans les réglages enregistrés
  name: 'Atelier',
  blurb: 'Une ligne qui dit le lieu, pas les couleurs.',
  lightness: 'sombre',        // sert au jumelage et à la barre du navigateur
  twin: 'etabli',             // facultatif — l'habit de l'autre clarté
  bar: '#141210',             // = swatch[0], la couleur de la barre du navigateur
  light: 'filament',          // voir la liste des sources plus bas
  swatch: ['#141210', '#241f1a', '#c98a3c', '#eee2cf'],  // fond, surface, accent, texte
  period: true,               // appelle les empattements
  years: [1906, 1938],        // facultatif — pour le mode histoire
}
```

## 2. Le bloc de jetons

Dans `src/styles/themes.css`, un bloc `:root[data-theme='atelier']` qui redéfinit
la palette. Le plus simple est de copier celui d'un habit voisin et de changer
les valeurs : il n'y a pas de jeton facultatif, ils y sont tous.

Un habit d'époque redéfinit aussi ses rayons d'angle — `--radius-sm`, `--radius`,
`--radius-lg` — parce que carrer les coins fait à soi seul la moitié de l'effet.

## C'est tout

La galerie des réglages, le panneau d'accès rapide, la barre du navigateur, la
police d'époque, le traitement des émojis, l'ambiance lumineuse et le mode
histoire se servent tous du registre. Rien à toucher.

## Les règles à respecter

Elles sont vérifiées par `logic-habits.ts`, qui échouera si l'une est enfreinte.

- **Les identifiants sont uniques**, et stables une fois publiés : un identifiant
  qui change périme les réglages enregistrés des joueurs. Un habit supprimé n'est
  pas un problème — un identifiant inconnu retombe sur le suivi du système.
- **Un jumeau se désigne en retour**, et les deux ont des clartés opposées.
  Sans jumeau, l'habit ne bascule jamais : c'est voulu, on ne trahit pas un choix.
- **Les intervalles d'années ne se recouvrent pas**, et couvrent tous les
  épisodes existants.
- **`bar` vaut `swatch[0]`** : la barre du navigateur est le fond de l'habit.
- **Le vert et le rouge restent lisibles comme juste et faux**, même quand
  l'accent en est proche. C'est la seule contrainte qui ne se vérifie pas
  automatiquement. Voir `tsf`, dont l'accent est le vert de l'œil magique : le
  juste y passe à un vert nettement plus sourd et plus jaune pour ne pas s'y
  confondre.

## Les traits, et pourquoi

Le registre ne sert pas seulement à peupler une liste. Chaque habit déclare des
traits, que `applyTheme` estampille sur la racine du document :

| Trait | Attribut posé | Ce qui s'y accroche |
| --- | --- | --- |
| `period` | `data-font="periode"` | les empattements, le ternissement des émojis |
| `light` | `data-lumiere="bougie"` | l'ambiance lumineuse, dans `ambiance.css` |
| — | `data-ambiance="discrete"` | la force réglée par le joueur |

Le style s'accroche aux traits, jamais aux noms. Une règle écrite pour
`[data-lumiere='bougie']` vaudra donc pour tous les habits à la bougie, y compris
ceux qui n'existent pas encore. C'est ce qui fait qu'ajouter un habit ne demande
que les deux étapes ci-dessus.

## Les sources de lumière

Neuf, et elles ne se ressemblent pas : une source n'est pas obligée de
vaciller pour dire un lieu.

| Source | Ce qu'elle fait | Cadence |
| --- | --- | --- |
| `fenetre` | le jour dérive, comme un ciel où passent des nuages | 46 s |
| `bougie` | une flamme saute, et la lumière penche avec elle | 6,5 s |
| `filament` | l'ampoule respire, le réseau lui fait un creux | 9 s |
| `tube` | parfaitement égal, sauf deux papillotements brefs | 12 s |
| `neon` | une enseigne bafouille par salves, puis se tient tranquille | 11 s |
| `phare` | un pinceau traverse la pièce en biais, puis plus rien | 14 s |
| `orage` | deux éclairs lointains coup sur coup, le second plus fort | 25 s |
| `aube` | la pièce se réchauffe, **une seule fois**, sans revenir | 3 min |
| `braise` | elle éclaire par en dessous, respire, et reprend | 13 s |

Quatre d'entre elles ont besoin de deux nappes — une teinte qui reste, et un
mouvement par-dessus. Elles se servent du pseudo-élément
`.ambiance__lueur::after`, qui ne coûte rien aux autres : sans `content`, il
n'existe pas. C'est ce qui évite d'ajouter un élément dans l'ossature pour
quatre cas particuliers.

## Ajouter une source de lumière

Plus rare, mais même principe. Un nom de plus dans `LightSource`, un bloc dans
`ambiance.css` accroché à `[data-lumiere='...']`, et une phrase dans
`LIGHT_BLURB` (`src/ui/theme-picker.ts`) qui dit ce qu'elle éclaire. Le
compilateur réclamera la phrase : `LIGHT_BLURB` est un `Record` complet sur le
type, on ne peut pas oublier.

Deux précautions valent d'être répétées, parce qu'elles se paient cher :

- **Tout ce qui annule doit égaler la spécificité de ce qui allume.** Le piège
  s'est refermé deux fois sur ce seul fichier, et vaut aussi pour la seconde
  nappe — `:root[data-lumiere] .ambiance__lueur::after` égale bien
  `:root[data-lumiere='phare'] .ambiance__lueur::after`, un attribut valant un
  attribut qu'il porte une valeur ou non. Les deux cas d'origine : `.ambiance__lueur { animation:
  none }` perd contre `:root[data-lumiere='x'] .ambiance__lueur`, et
  `:root[data-lumiere] … { will-change: auto }` perd contre
  `:root[data-lumiere][data-ambiance='discrete'] …`. Dans les deux cas la règle
  ne prend pas, et rien ne le signale. Le bloc en fin de fichier est écrit
  correctement — le copier plutôt que l'improviser.
- **Ne réserver une couche de composition que là où quelque chose bouge.**
  `will-change` sur une surface plein écran coûte sa surface en mémoire vidéo.
  Elle n'est demandée que sous un habit éclairé, ambiance allumée, et système
  ne réclamant pas moins d'animation ; ailleurs la couche est en
  `display: none`, pas seulement transparente.
- **Rester loin des seuils de photosensibilité.** Tout ce qui bouge est
  l'opacité d'un dégradé déjà très transparent ; le plus grand écart de
  luminance, le clignotement du tube, reste sous les trois pour cent de l'écran.
  Un vacillement rapide et ample n'aurait pas sa place ici.
