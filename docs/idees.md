# Pistes à creuser

Idées notées au fil de l'eau, pas encore décidées ni commencées. Chacune dit ce
qu'elle est, ce qu'elle demanderait, et ce qui reste à trancher.

---

## Mode histoire

**Noté le 25 août 2026.** Envie d'un « mode histoire » ; ni le récit ni la
forme ne sont arrêtés.

### Ce que le mode résoudrait

L'entraînement actuel est excellent pour progresser et mauvais pour donner
envie. Copier `KMKKMRSKM` pendant quinze minutes est efficace et parfaitement
aride : rien n'est en jeu, rien ne se passe si l'on réussit, rien non plus si
l'on échoue. Un mode histoire donne une raison de copier ce groupe-là,
maintenant — et transforme la série en scène.

C'est aussi le seul mode qui pourrait faire tenir quelqu'un au-delà des trois
premières séances, là où la méthode Koch est la plus ingrate.

### Quatre directions possibles

**A — Les grandes heures de la radiotélégraphie.** Une dizaine d'épisodes
chronologiques, chacun bâti sur un événement réel : un décor en quelques
lignes, un message authentique à copier ou à émettre, puis ce qui s'est
réellement passé. La page *Histoire du morse* fournit déjà les jalons — 1844,
1901, 1912, les deux guerres, 1997-1999 — et le travail de documentation est
donc à moitié fait.

Ce que ça a pour soi : le récit est écrit d'avance, il est vrai, il est libre
de droits, et la difficulté monte naturellement avec l'époque. Le message de
Baltimore en 1844 tient en quatre mots ; le trafic de 1912 est dense, rapide et
se chevauche.

*C'est la direction que je recommanderais.* Elle résout précisément le problème
que vous posez — « je ne sais pas quoi faire comme histoire » — puisque
l'Histoire l'a déjà écrite.

**B — Une carrière d'opérateur.** On part sans indicatif et on en gagne un ; on
enchaîne des contacts de difficulté croissante — premier QSO, contest, DX
lointain sous le bruit, trafic d'urgence. Chaque contact est un échange scripté
qu'il faut copier puis auquel il faut répondre correctement.

Ce que ça a pour soi : c'est un entraînement au trafic réel, pas seulement aux
caractères — RST, codes Q, indicatifs, procédure. Ça relie le morse à la partie
Licence du site. En revanche il faut inventer le récit, et un enchaînement de
QSO fictifs se lasse plus vite qu'une histoire vraie.

**C — Une enquête à déchiffrer.** Des messages codés qui cachent une énigme ;
on décode pour avancer. Amusant, mais le morse y devient un cadenas plutôt
qu'une langue : on décode une fois, lentement, avec la table sous les yeux.
C'est le contraire de ce que le site cherche à construire.

**D — Un récit original.** Station isolée, naufrage, correspondant inconnu qui
répond. Toute la liberté, et tout le travail : c'est la seule direction où le
texte est entièrement à écrire, et où la qualité du mode dépend de la qualité
d'une fiction — pari plus risqué que les trois autres.

### Les questions à trancher avant d'écrire une ligne

1. **Copier, émettre, ou les deux ?** Les deux donnent des scènes très
   différentes : recevoir, c'est subir ; émettre, c'est agir. Alterner serait
   le plus vivant, mais double le travail.
2. **L'échec bloque-t-il ?** Un récit qui s'arrête tant qu'on n'a pas copié
   juste est un mur ; un récit qui avance quoi qu'il arrive perd son enjeu.
   Piste : le message se répète, se ralentit, puis finit par passer — comme un
   vrai correspondant qui reprendrait plus lentement.
3. **Quel alphabet ?** Respecter la progression Koch — n'utiliser que les
   caractères débloqués — contraindrait durement les textes des premiers
   épisodes. L'alternative est une difficulté propre au mode, indépendante de
   Koch, avec des messages courts et très lents au début.
4. **Français ou international ?** Le récit en français, les messages en
   abréviations télégraphiques : c'est ainsi que le trafic se fait réellement,
   et ça réutilise le vocabulaire déjà en place.
5. **Quelle longueur ?** Une dizaine d'épisodes de trois à cinq minutes semble
   la bonne échelle : assez pour une séance, assez court pour être repris.

### Ce que ça toucherait dans le code

- Une nouvelle section au menu, ou une entrée dans la partie *S'entraîner*.
- Des données d'épisodes en `src/data/` — décor, messages, vitesse imposée,
  bruit de fond, dénouement.
- La progression à étendre : épisode atteint, épisodes terminés. Donc une
  version de plus dans le schéma de stockage (`SCHEMA_VERSION`).
- Le moteur audio, le tirage et le bruit de fond existent déjà : le mode
  histoire les orchestre, il n'a rien à réinventer de ce côté.
- Sans doute des succès dédiés.

**Rien n'est commencé.**
