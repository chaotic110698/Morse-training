# Morse Training

Site d'entraînement au code morse, utilisable au navigateur sur téléphone comme
sur ordinateur. Aucun compte, aucun serveur, aucune donnée qui quitte
l'appareil : tout tourne dans le navigateur et la progression est enregistrée
localement.

## Ce que le site propose

**Apprendre**

- *Comprendre le morse* — les cinq règles de durée, la vitesse en mots par
  minute, la méthode Farnsworth et la méthode Koch, avec un tableau de durées
  recalculé en direct selon vos réglages.
- *Histoire du morse* — du télégraphe Chappe à la fin de la veille maritime, en
  dix jalons.
- *Alphabet et lexique* — lettres, chiffres, ponctuation et caractères
  accentués, rangés en catégories repliables, chaque entrée étant écoutable
  d'un clic.
- *Alphabet OTAN* — l'alphabet radiotéléphonique international : les vingt-six
  mots et les dix chiffres avec une prononciation transcrite pour un
  francophone, le code morse de chaque lettre en regard, un outil pour épeler un
  indicatif, un exercice à quatre choix dans les deux sens, l'histoire du code
  et l'épellation française usuelle au téléphone.
- *Communiquer en morse* — le vocabulaire du trafic : signaux de procédure,
  codes Q, abréviations et mots courants, chacun écoutable ; puis les indicatifs
  d'appel, leur structure, les différences entre pays et les suffixes de
  situation, avec un générateur d'indicatifs fictifs. Un indicatif adopté est
  tiré plus souvent dans le mode *Mots et indicatifs*.
- *Comprendre la radio* — ce qu'est une onde, les trois chemins de propagation,
  l'ionosphère et le cycle solaire, les domaines de fréquences, les modes
  d'émission, la composition d'une station et ce que l'écoute et l'émission
  demandent en France. Avec un convertisseur fréquence / longueur d'onde qui
  situe la fréquence dans le plan de bandes, et le tableau des bandes
  radioamateur de la région 1.

**Licence** — préparation au certificat d'opérateur du service amateur

- *Le certificat d'opérateur* — ce que la licence autorise, le déroulement des
  deux épreuves, le barème et ce qu'il implique, l'inscription, et la
  distinction entre le certificat et la notification d'indicatif.
- *Le cadre réglementaire* — les trois niveaux de règles, les six acteurs et,
  surtout, la répartition des compétences entre l'ARCEP, le ministre et l'ANFR.
- *Classes d'émission* — les trois caractères expliqués comme un système, avec
  un décodeur interactif, les trois tables, les classes réellement rencontrées,
  et les conditions techniques imposées à la station.
- *Bandes et puissances* — les trois régions de l'UIT, les quatre statuts
  d'attribution, les vingt-cinq bandes de la région 1 avec leur largeur calculée
  et leur statut segment par segment, et un vérificateur de fréquence.
- *Le trafic et ses règles* — quand s'identifier, quoi vérifier avant d'émettre,
  ce qu'on a le droit de dire, et le journal de bord.
- *La station et l'indicatif* — structure des indicatifs français, suffixes
  d'exploitation, déclarations, urbanisme et droit à l'antenne, sanctions, et
  trafic à l'étranger sous la recommandation CEPT.

Le contenu de cette section est rédigé pour ce site à partir du cours de F6GPX
publié par le Radio-Club de la Haute Île, crédité et lié depuis la page
d'entrée. Voir `docs/formation/LISEZMOI.md`.

**S'entraîner**

- *Écoute (Koch)* — l'exercice central : on commence à deux caractères, à pleine
  vitesse, et on en ajoute un dès que la reconnaissance dépasse le seuil. Grille
  de réponse tactile sur téléphone, clavier physique sur ordinateur, option de
  révision ciblée sur les caractères les plus ratés.
- *Émission* — trois manipulateurs : droit (une touche, la durée de l'appui
  fait le point ou le trait), palettes **un élément par appui** — qui
  n'enchaînent rien tant que la touche reste enfoncée — et palettes iambiques
  en mode A ou B. Au doigt sur
  téléphone et sur tablette, au clavier sur ordinateur comme sur iPad, avec
  touches réassignables. Une option de **frappe indulgente** retire toute
  contrainte de temps : chaque élément est comparé au code attendu, une pause
  n'a plus aucune conséquence, et seul un élément qui ne correspond pas
  interrompt la saisie.
- *Mots et indicatifs* — abréviations, codes Q, mots courants, indicatifs
  générés et groupes aléatoires de cinq caractères.
- *Lecture visuelle* — sans son, dans les deux sens (code vers lettre, lettre
  vers code).

**Outils**

- *Enregistreur d'émission* — capte la frappe sans consigne ni note, affiche le
  texte et le morse décodés, dessine la frise du rythme réel, et exporte en WAV
  et en texte. Les manipulateurs et leur réglage sont partagés avec l'exercice
  d'émission.
- *Traducteur* — texte vers morse et morse vers texte, en direct dans les deux
  sens, avec export du résultat en fichier WAV. Le résultat s'écoute, défile caractère par caractère, et peut piloter la
  lampe torche du téléphone pour émettre réellement en lumière. La torche passe
  par la caméra arrière, seul chemin qu'offre le web : elle fonctionne sous
  Android, pas sous iOS, où un flash d'écran est proposé en repli.

**Suivre sa progression**

Statistiques par caractère sous forme de carte de chaleur, points faibles du
moment, historique des séries, séries de jours consécutifs, et vingt-huit succès.
Le tout s'exporte et se réimporte en JSON.

## Sorties son, lumière et vibration

Les trois sorties sont construites à partir de la même séquence temporelle,
elles ne peuvent donc pas dériver l'une par rapport à l'autre. Elles ne
dépendent pas les unes des autres pour autant : quand le contexte audio refuse
de démarrer — appareil en silencieux, session prise par la caméra de la torche —
la séquence bascule sur une horloge d'animation, de sorte que la lumière et la
vibration continuent de fonctionner, et l'interface explique l'absence de son.

- **Son** — Web Audio, programmé sur l'horloge de l'AudioContext et non avec
  `setTimeout`, avec enveloppe d'attaque réglable pour éviter les clics de
  manipulation.
- **Lumière** — une diode témoin allumée exactement le temps du signal, plutôt
  qu'un clignotement plein écran qui serait épuisant et risque pour les
  personnes photosensibles.
- **Vibration** — le motif complet est confié au système d'un seul appel, ce qui
  donne un rythme bien plus régulier qu'une série de déclenchements. Disponible
  sur Android ; Safari sur iOS n'expose aucune API de vibration, l'interface le
  signale explicitement.
- **Lampe torche** — pilotée dans le traducteur via la contrainte `torch` de la
  piste vidéo de la caméra arrière. Trois pièges se manifestent tous de la même
  façon — la caméra s'ouvre, rien ne s'allume — et sont traités séparément : le
  flux est attaché à un élément vidéo lu en sourdine, car plusieurs appareils
  laissent la pile caméra en veille sans cela ; `getCapabilities()` absent n'est
  pas tenu pour un refus, seule une déclaration explicite l'est ; et le résultat
  est vérifié par `getSettings()` plutôt que déduit de l'absence d'erreur. Un
  bouton « Tester la lampe » permet de trancher de visu, et l'interface
  distingue un allumage confirmé par l'appareil d'une demande simplement
  acceptée. La commutation du flash prend plusieurs dizaines de millisecondes :
  au-delà d'une dizaine de mots par minute elle ne suit plus, ce que l'interface
  annonce.

## Pourquoi un mode « un élément par appui »

Un manipulateur iambique enchaîne les éléments tant que la palette est tenue :
c'est sa raison d'être. Mais à 20 mots par minute, un point et le silence qui
le suit durent 120 ms à eux deux — moins qu'un relâchement de touche. Un
débutant obtient donc trois points là où il en voulait un, surtout au clavier.
Le mode « un élément par appui » produit exactement un élément par appui, quelle
que soit sa durée, et met les appuis en file pour qu'on puisse frapper plus vite
que la vitesse réglée sans rien perdre. Les modes iambiques restent disponibles
pour qui veut travailler le geste réel.

## Bruit de fond de réception

Un récepteur ne laisse passer qu'une bande étroite autour de la tonalité : le
bruit entendu en trafic réel n'est pas du bruit blanc mais un souffle coloré,
dans lequel les signaux se détachent. `src/core/noise.ts` le reproduit en
filtrant du bruit blanc par deux passe-bande en cascade centrés sur la
tonalité, dans un contexte hors ligne.

Le tampon obtenu est **normalisé à une valeur efficace de 1** avant d'être
bouclé, avec un fondu enchaîné qui rend le raccord inaudible. Cette
normalisation est ce qui rend le niveau calculable : le gain appliqué vaut
alors exactement la valeur efficace visée, et un rapport signal/bruit affiché
en décibels veut dire quelque chose. Sans elle, le filtrage retirerait une part
variable de l'énergie et le réglage ne signifierait rien.

Le rapport se règle par préréglages, de conditions excellentes à la limite de
copie. Le bruit démarre avec une série d'entraînement, un enregistrement ou une
émission, et s'arrête avec eux. Accessoirement, il maintient la sortie audio
active : beaucoup de casques, surtout en Bluetooth, signalent l'extinction de
cette sortie par un craquement qu'on prend sinon pour un élément du code. Un
silence de fin réglable joue le même rôle quand le bruit est désactivé.

## Export audio

Le rendu WAV se fait dans un `OfflineAudioContext` : même graphe que la lecture
en direct — oscillateur, enveloppe d'attaque, volume — mais calculé plus vite
que le temps réel, puis encodé en PCM 16 bits, format qu'ouvre n'importe quel
lecteur sans codec. Dans l'enregistreur, la séquence rendue provient des
instants réels de fermeture et d'ouverture du contact : le fichier porte donc le
rythme de l'opérateur, imperfections comprises, sur une tonalité pure.

## Mises à jour et cache hors ligne

Le site est une PWA : un service worker met les fichiers en cache pour
fonctionner sans réseau. Deux écueils en découlent, tous deux traités dans
`src/main.ts` :

- un navigateur ne cherche une nouvelle version qu'au chargement de la page, si
  bien qu'un onglet laissé ouvert peut servir une version périmée
  indéfiniment. Une vérification est donc déclenchée périodiquement et à chaque
  retour sur l'onglet ;
- activer le nouveau service worker ne suffit pas : tant que la page n'est pas
  rechargée, elle continue d'exécuter l'ancien code. Le rechargement est donc
  effectif, après sauvegarde de la progression.

La date de construction est affichée en bas du bandeau latéral, ce qui permet de
vérifier quelle version s'exécute réellement. En dernier recours, « Forcer la
mise à jour » dans les réglages désinscrit le service worker, vide les caches et
recharge, sans toucher à la progression.

## Compatibilité clavier

`KeyboardEvent.code` désigne la touche physique indépendamment de la
disposition, et c'est sur lui que reposent les raccourcis du manipulateur. Mais
Safari sur iPad ne le renseigne pas toujours pour un clavier externe : il arrive
vide, et toute comparaison échoue en silence. `resolveCode()` reconstruit alors
le code depuis `key`, qu'iPadOS fournit systématiquement, de sorte que la barre
d'espace fonctionne sur tous les appareils.

## Développement

```bash
npm install
npm run dev        # serveur de développement
npm run typecheck  # vérification des types
npm run build      # construction dans dist/
npm run preview    # prévisualisation de la construction
```

## Déploiement

Le site est publié sur GitHub Pages par le workflow
`.github/workflows/deploy.yml`. Il se déclenche à chaque poussée, mais ne
publie que depuis la branche par défaut du dépôt : renommer ou changer cette
branche ne demande aucune modification du workflow.

Une seule chose est à vérifier une fois pour toutes dans les réglages du dépôt,
section Pages : la source doit être **GitHub Actions**, et non « Deploy from a
branch ». Ce dernier mode publie le dépôt tel quel, donc le `index.html` source,
qui référence `/src/main.ts` : le navigateur reçoit alors une page sans style ni
script, puisque rien n'a été construit.

La base d'URL est définie dans `vite.config.ts` (`base: '/Morse-training/'`) :
elle doit correspondre au nom du dépôt, sinon les assets sont demandés à la
racine du domaine.

## Organisation du code

```
src/
  core/      logique pure : tables morse, calcul des durées, moteur audio,
             manipulateur, méthode Koch, progression, succès, stockage
  ui/        briques d'interface : fabrique DOM, routeur, ossature, diode,
             manipulateur à l'écran, lecteur, suivi de session
  views/     une page par fichier, plus la table des routes
  data/      vocabulaire d'entraînement
  styles/    jetons de design, base, mise en page, composants, contenu
```

Aucun framework : le rendu est fait avec une petite fabrique DOM, ce qui évite
qu'un cycle de rendu ne vienne s'intercaler entre l'horloge audio et
l'affichage.

## Licence

MIT.
