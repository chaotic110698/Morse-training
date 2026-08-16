# Morse Training

Site d'entrainement au code morse, utilisable au navigateur sur telephone comme
sur ordinateur. Aucun compte, aucun serveur, aucune donnee qui quitte
l'appareil : tout tourne dans le navigateur et la progression est enregistree
localement.

## Ce que le site propose

**Apprendre**

- *Comprendre le morse* — les cinq regles de duree, la vitesse en mots par
  minute, la methode Farnsworth et la methode Koch, avec un tableau de durees
  recalcule en direct selon vos reglages.
- *Histoire du morse* — du telegraphe Chappe a la fin de la veille maritime, en
  dix jalons.
- *Alphabet et lexique* — lettres, chiffres, ponctuation, caracteres accentues
  et signaux de procedure, chaque entree etant ecoutable d'un clic.

**S'entrainer**

- *Ecoute (Koch)* — l'exercice central : on commence a deux caracteres, a pleine
  vitesse, et on en ajoute un des que la reconnaissance depasse le seuil. Grille
  de reponse tactile sur telephone, clavier physique sur ordinateur, option de
  revision ciblee sur les caracteres les plus rates.
- *Emission* — manipulateur droit (une touche, la duree de l'appui fait le
  point ou le trait) ou palettes iambiques en mode A ou B. Au doigt sur
  telephone, au clavier sur ordinateur, avec touches reassignables.
- *Mots et indicatifs* — abreviations, codes Q, mots courants, indicatifs
  generes et groupes aleatoires de cinq caracteres.
- *Lecture visuelle* — sans son, dans les deux sens (code vers lettre, lettre
  vers code).

**Suivre sa progression**

Statistiques par caractere sous forme de carte de chaleur, points faibles du
moment, historique des series, series de jours consecutifs, et vingt-huit succes.
Le tout s'exporte et se reimporte en JSON.

## Sorties son, lumiere et vibration

Les trois sorties sont construites a partir de la meme sequence temporelle,
elles ne peuvent donc pas deriver l'une par rapport a l'autre.

- **Son** — Web Audio, programme sur l'horloge de l'AudioContext et non avec
  `setTimeout`, avec enveloppe d'attaque reglable pour eviter les clics de
  manipulation.
- **Lumiere** — une diode temoin allumee exactement le temps du signal, plutot
  qu'un clignotement plein ecran qui serait epuisant et risque pour les
  personnes photosensibles.
- **Vibration** — le motif complet est confie au systeme d'un seul appel, ce qui
  donne un rythme bien plus regulier qu'une serie de declenchements. Disponible
  sur Android ; Safari sur iOS n'expose aucune API de vibration, l'interface le
  signale explicitement.

## Developpement

```bash
npm install
npm run dev        # serveur de developpement
npm run typecheck  # verification des types
npm run build      # construction dans dist/
npm run preview    # previsualisation de la construction
```

## Deploiement

Le site est publie sur GitHub Pages par le workflow
`.github/workflows/deploy.yml`. Il se declenche a chaque poussee, mais ne
publie que depuis la branche par defaut du depot : renommer ou changer cette
branche ne demande aucune modification du workflow.

Une seule chose est a faire une fois pour toutes dans les reglages du depot :
choisir **GitHub Actions** comme source dans la section Pages.

La base d'URL est definie dans `vite.config.ts` (`base: '/Morse-training/'`) :
elle doit correspondre au nom du depot, sinon les assets sont demandes a la
racine du domaine.

## Organisation du code

```
src/
  core/      logique pure : tables morse, calcul des durees, moteur audio,
             manipulateur, methode Koch, progression, succes, stockage
  ui/        briques d'interface : fabrique DOM, routeur, ossature, diode,
             manipulateur a l'ecran, lecteur, suivi de session
  views/     une page par fichier, plus la table des routes
  data/      vocabulaire d'entrainement
  styles/    jetons de design, base, mise en page, composants, contenu
```

Aucun framework : le rendu est fait avec une petite fabrique DOM, ce qui evite
qu'un cycle de rendu ne vienne s'intercaler entre l'horloge audio et
l'affichage.

## Licence

MIT.
