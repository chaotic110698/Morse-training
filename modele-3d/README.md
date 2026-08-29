# Plaque NFC Morse Training

L'icône du site, en objet : un carré aux coins arrondis de 60 mm de côté et
8 mm d'épaisseur, portant le point et le trait de la lettre **A** du morse, avec
un logement pour une pastille NFC creusé par-dessous. Posée sur un bureau, elle
ouvre le site d'un simple contact du téléphone.

![Aperçu du modèle, de dessus et de dessous](apercu.png)

Le dessin n'a pas été redessiné à la main : il est transposé du fichier
`public/icons/icon.svg`, à l'échelle près. Les proportions du carré, le rayon
des coins, le diamètre du point, la longueur du trait et l'écart entre les deux
sont exactement ceux de l'icône.

## Les trois pièces

| Pièce | Rôle | Volume |
| --- | --- | --- |
| **Corps** | la plaque, creusée du motif et du logement NFC | 26,1 cm³ |
| **Motif** | le point et le trait, à incruster dans le creux | 0,3 cm³ |
| **Couvercle NFC** | le disque qui referme le logement | 0,5 cm³ |

Le couvercle est facultatif : une pastille autocollante tient très bien sans
lui. Il sert pour les jetons PVC, qui ne collent pas.

## Cotes

| | |
| --- | --- |
| Encombrement | 60 × 60 × 8 mm |
| Rayon des coins | 13,13 mm (soit 14/64 du côté, comme dans le SVG) |
| Arêtes | chanfrein à 45° de 0,8 mm dessus, 0,6 mm dessous |
| Creux du motif | 1,0 mm de profondeur, débouchant sur la face du dessus |
| Logement NFC | ⌀26,0 mm sur 1,2 mm, pour une pastille de 25 mm |
| Portée du couvercle | ⌀27,6 mm sur 0,8 mm |
| Matière au-dessus de la pastille | 6,0 mm |

L'icône penche très légèrement à gauche — le motif y est décalé de 2,25 unités
sur 64. Invisible à 64 pixels, ce décalage se verrait sur 60 mm : le modèle
recentre donc le motif. Pour rester rigoureusement fidèle à l'icône, passer
`CENTRER_MOTIF` à `False` dans `genere.py` et relancer le script.

## Fichiers

| Fichier | Pour quoi faire |
| --- | --- |
| `plaque-morse.3mf` | **le fichier à ouvrir dans Bambu Studio** — les trois pièces, déjà posées sur le plateau et à leur place les unes par rapport aux autres |
| `stl/plaque-morse-corps.stl` | la plaque seule |
| `stl/plaque-morse-motif.stl` | l'incrustation seule |
| `stl/plaque-morse-couvercle.stl` | le couvercle seul |
| `genere.py` | le script qui produit tout ce qui précède |
| `apercu.png` | l'image ci-dessus, calculée par le script |

Le `.3mf` ne contient aucune extension propriétaire : Bambu Studio, Orca,
PrusaSlicer et Cura le lisent tous sans réparation. Il est en millimètres, et
les pièces sont posées autour de (90, 90) — un point qui tombe sur le plateau
de n'importe quelle Bambu, A1 mini comprise.

## Depuis Bambu Handy

Handy imprime des fichiers déjà tranchés ; il ne tranche pas lui-même. Le
chemin est donc :

1. ouvrir `plaque-morse.3mf` dans **Bambu Studio** sur l'ordinateur ;
2. choisir la couleur des pièces (voir plus bas), trancher ;
3. envoyer sur l'imprimante, ou **Fichier → Exporter → Exporter le projet**
   pour récupérer un `.3mf` tranché.

Le travail apparaît ensuite dans Handy, où il se lance et se suit depuis le
téléphone. Un `.3mf` tranché peut aussi être déposé sur la carte micro-SD ou
envoyé par Bambu Cloud, et Handy l'y retrouve.

## Obtenir les deux couleurs

L'incrustation occupe le millimètre supérieur de la plaque et son contour
coïncide exactement avec celui du creux : aucun jeu, aucune lèvre. Trois façons
de s'en servir, de la plus simple à la plus fine.

**Une seule bobine.** Supprimer l'objet *Motif* et n'imprimer que le corps : le
point et le trait restent lisibles, gravés d'un millimètre. C'est net et ça
suffit.

**Une seule bobine, avec un changement de filament.** Garder les deux pièces.
Comme le motif commence à 7,0 mm — juste après la 35ᵉ couche en 0,2 mm — il
suffit d'insérer un changement de couleur à cette hauteur : clic droit sur la
barre de couches à droite de l'aperçu, *Ajouter une pause / un changement de
filament*. Tout ce qui est au-dessus sort dans la seconde couleur, motif comme
surface autour. Pour n'avoir que le motif en couleur, il faut l'AMS.

**Avec un AMS.** Dans la liste des objets, déplier *Plaque Morse*, sélectionner
la pièce *Motif* et lui affecter le filament orange ; laisser le corps sur le
foncé. Les couleurs de l'icône sont `#0B1015` pour le corps et `#FFB545` pour le
motif ; elles sont déjà inscrites dans le `.3mf`, ce qui aide à s'y retrouver
dans la liste. Penser à réduire la tour de purge, il n'y a qu'un millimètre à
changer.

Si l'on préfère imprimer l'incrustation à part et la coller, mettre
`JEU_MOTIF = 0.15` dans `genere.py` et régénérer : le motif est alors rétréci
de 0,15 mm sur tout son contour, ce qui laisse la place à la colle.

## La pastille NFC

Le logement est prévu pour le format le plus courant : une **pastille ronde de
25 mm**, puce NTAG213 ou NTAG215. Les autocollantes (0,4 mm) comme les jetons
PVC (jusqu'à 1,2 mm) entrent.

- Le logement fait ⌀26,0 mm : un demi-millimètre de jeu au rayon, la pastille
  se pose sans forcer.
- 6 mm de PLA restent au-dessus. Le PLA est transparent aux ondes de
  13,56 MHz : le téléphone lit la pastille par le dessus comme par le dessous.
- Ne rien mettre de métallique dans la plaque. Un aimant, une plaque de lest,
  une feuille d'aluminium sous l'objet, et la pastille devient illisible — sauf
  à utiliser une pastille dite *on-metal*, qui embarque son propre ferrite.

Pour programmer la pastille, n'importe quelle application NFC fait l'affaire
(*NFC Tools* sur Android et iOS, par exemple). Écrire un enregistrement de type
**URL** :

```
https://chaotic110698.github.io/Morse-training/
```

Un NTAG213 offre 144 octets utiles, largement de quoi. Verrouiller la pastille
une fois satisfait, sinon n'importe quel téléphone peut la réécrire.

## Réglages d'impression

Rien d'exotique : la pièce est plate, sans porte-à-faux et sans support.

| | |
| --- | --- |
| Orientation | telle quelle, motif vers le haut, à plat sur le plateau |
| Couche | 0,2 mm — 1,0 mm et 0,8 mm tombent alors juste |
| Parois | 3, pour que les flancs soient francs |
| Remplissage | 15 % suffit ; monter à 25 % donne un objet plus lourd en main |
| Supports | aucun |
| Radeau, bord | inutiles, la semelle dépasse 28 cm² |

Deux endroits demandent un peu d'attention, et le trancheur s'en occupe seul :
le plafond du logement NFC est un pont de 26 mm, et la portée du couvercle un
ressaut de 0,8 mm en l'air. Ni l'un ni l'autre ne pose de problème avec la
ventilation d'une Bambu. L'ordre de grandeur : une bonne heure et une vingtaine
de grammes de PLA ; le trancheur donnera le chiffre exact.

Le chanfrein de 0,6 mm sous la plaque n'est pas décoratif : il absorbe le pied
d'éléphant, cet évasement des premières couches qui empêche autrement l'objet de
poser à plat.

## Régénérer le modèle

Le script ne dépend que de la bibliothèque standard de Python — ni OpenSCAD, ni
CAO, ni bibliothèque à installer.

```sh
python3 modele-3d/genere.py
```

Tous les réglages tiennent dans le premier bloc de `genere.py` : côté,
épaisseur, profondeur du motif, diamètre de la pastille, jeux, finesse des
contours. Une plaque de 45 mm, une épaisseur de 5 mm ou un logement pour une
pastille de 30 mm ne demandent qu'à changer une ligne.

Le script vérifie ce qu'il produit avant d'écrire quoi que ce soit : chaque
maillage doit être fermé — toute arête parcourue exactement deux fois, une fois
dans chaque sens — sans triangle dégénéré et de volume positif. Si un contrôle
échoue, rien n'est écrit. C'est ce qui garantit qu'aucun trancheur n'aura à
réparer le maillage.
