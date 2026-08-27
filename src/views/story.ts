/**
 * Le mode histoire.
 *
 * Un sommaire par générations, puis un lecteur qui déroule l'épisode temps par
 * temps. Le récit se lit, le morse se manipule : c'est la seule façon d'avoir
 * beaucoup d'histoire sans rendre la séance épuisante.
 *
 * On joue épisode par épisode, quand on veut, et l'on reprend au temps où l'on
 * s'est arrêté — rien n'oblige à suivre l'ordre du récit.
 */

import { h, setChildren } from '../ui/dom.ts';
import { createSender, type Sender, type SenderMode } from '../ui/sender.ts';
import { createMorseTable } from '../ui/morse-table.ts';
import { MorsePlayer } from '../ui/player.ts';
import { buildSequence, elementsForCode, resolveTiming } from '../core/timing.ts';
import { compactCode, encodeChar } from '../core/morse.ts';
import { recordEpisode } from '../core/progress.ts';
import {
  beatText,
  compareCopy,
  episodeProgress,
  interpolate,
  keyersFor,
  sineOf,
  type StoryContext,
} from '../core/story.ts';
import { EPISODES, LINEAGE, type Beat, type Episode } from '../data/story.ts';
import type { ToneVoice } from '../core/audio.ts';
import type { View, ViewContext } from '../ui/router.ts';

const GENERATION_NAMES = ['I', 'II', 'III', 'IV', 'V'];

/**
 * Vitesse à laquelle le manipulateur à clavier rend les lettres. Elle ne
 * dépend pas de l'époque : ce n'est pas une épreuve de copie, c'est le retour
 * sonore de sa propre frappe.
 */
const SEND_WPM = 18;

/**
 * Ce que l'époque donne à entendre. Le nom est affiché en tête d'épisode : sans
 * lui, on remarque que le son a changé sans savoir de quoi il s'agit.
 */
const VOICE_LABELS: Record<ToneVoice, { nom: string; quoi: string }> = {
  relais: {
    nom: 'Sondeur à relais',
    quoi: 'Le télégraphe filaire ne chantait pas : il claquait, une fois à la fermeture du circuit, une fois à l’ouverture.',
  },
  etincelle: {
    nom: 'Poste à étincelle',
    quoi: 'Une note sale, hachée à la cadence des décharges. C’est le son de la radio de 1900 aux années 1920.',
  },
  pur: {
    nom: 'Note pure',
    quoi: 'La note propre d’un oscillateur, telle qu’on l’entend depuis les années 1930.',
  },
};

/** Minutes et secondes, pour le temps d'antenne. */
const format = (seconds: number): string => {
  const total = Math.abs(seconds);
  return `${Math.floor(total / 60)} min ${String(total % 60).padStart(2, '0')}`;
};

export function storyView(context: ViewContext): View {
  const { store } = context;
  const root = h('div', { class: 'stack' });
  const player = new MorsePlayer(store);
  let table = createMorseTable();
  let board: Sender | null = null;
  /**
   * Le manipulateur retenu suit le joueur d'un temps d'émission à l'autre :
   * qui a choisi la palette ne veut pas la rechoisir à chaque message.
   */
  let senderMode: SenderMode = 'clavier';

  const storyContext = (episode: Episode): StoryContext => ({
    generation: episode.generation,
    lineage: LINEAGE,
  });

  /** La vitesse d'un épisode, indépendante des réglages d'entraînement. */
  const timingAt = (wpm: number) =>
    resolveTiming({ charWpm: wpm, effectiveWpm: Math.max(5, Math.round(wpm * 0.75)) });

  /**
   * Le bruit de bande de l'époque.
   *
   * Chaque épisode porte son rapport signal sur bruit : 1901 gratte, 1970 est
   * calme. Le réglage n'est appliqué qu'au moteur audio, jamais enregistré —
   * on emprunte le bruit le temps d'une scène et on rend l'appareil comme on
   * l'a trouvé. Et si le joueur a coupé le bruit dans ses réglages, on n'y
   * touche pas : c'est son choix, pas celui du récit.
   */
  const startNoise = (snrDb: number): void => {
    if (!store.settings.noiseEnabled) return;
    store.audio.updateSettings({ noiseEnabled: true, noiseSnrDb: snrDb });
    void store.audio.startNoise();
  };

  const stopNoise = (): void => {
    store.audio.stopNoise();
    store.audio.updateSettings({
      noiseEnabled: store.settings.noiseEnabled,
      noiseSnrDb: store.settings.noiseSnrDb,
    });
  };

  /**
   * Le grain de l'époque. Les données parlent de timbre, le moteur audio de
   * voix : c'est la même chose, et la traduction tient sur une ligne.
   */
  const voiceOf = (episode: Episode): ToneVoice => episode.sound.timbre;

  /** Joue un code brut : un caractère émis au manipulateur, ou le signal HH. */
  const playCode = (code: string, wpm: number, voice: ToneVoice = 'pur'): void => {
    const elements = elementsForCode(code, timingAt(wpm));
    if (elements.length > 0) void player.playElements(elements, { voice });
  };

  /** Joue un texte à la vitesse de l'épisode, sans toucher aux réglages du site. */
  const playAt = async (
    text: string,
    wpm: number,
    voice: ToneVoice,
    onChar?: (index: number, char: string | undefined) => void,
  ): Promise<boolean> => {
    const timing = timingAt(wpm);
    const tokens = [...text.toUpperCase()].map((char) =>
      char === ' ' ? { code: '', char: ' ' } : { code: encodeChar(char) ?? '', char },
    );
    const elements = buildSequence(
      tokens.filter((token) => token.code !== '' || token.char === ' '),
      timing,
    );
    if (elements.length === 0) return false;
    return player.playElements(elements, { onChar: onChar ?? undefined, voice });
  };

  // --- Sommaire ---

  const drawHub = (): void => {
    const blocks: HTMLElement[] = [];
    for (const rank of [1, 2, 3, 4, 5]) {
      const member = LINEAGE.generations.find((entry) => entry.rank === rank);
      const episodes = EPISODES.filter((episode) => episode.generation === rank);
      if (!member) continue;

      const cards = episodes.map((episode) => {
        const record = store.progress.story.episodes[episode.id];
        const { total } = episodeProgress(episode, 0);
        const done = record?.completed === true;
        const started = (record?.beat ?? 0) > 0 && !done;
        const action = done ? 'Rejouer' : started ? 'Reprendre' : 'Commencer';
        return h(
          'button',
          {
            class: `recit-carte${done ? ' is-done' : ''}${episode.optional ? ' recit-carte--lore' : ''}`,
            type: 'button',
            attrs: { 'aria-label': `${action} : ${episode.title}, ${episode.year}` },
            on: { click: () => openEpisode(episode) },
          },
          h(
            'span',
            { class: 'recit-carte__tete' },
            h('span', { class: 'recit-carte__annee', text: String(episode.year) }),
            done
              ? h('span', { class: 'recit-carte__etat', text: 'terminé' })
              : started
                ? h('span', { class: 'recit-carte__etat', text: 'en cours' })
                : null,
          ),
          h('span', { class: 'recit-carte__titre', text: episode.title }),
          h('span', { class: 'recit-carte__resume', text: episode.summary }),
          h(
            'span',
            { class: 'recit-carte__pied' },
            h('span', {
              class: 'recit-carte__mesure',
              text: episode.optional ? 'Entre les ondes' : `${total} passage${total > 1 ? 's' : ''} en morse`,
            }),
            h('span', { class: 'recit-carte__action', text: `${action} →` }),
          ),
        );
      });

      blocks.push(
        h(
          'section',
          { class: 'recit-gen' },
          h(
            'header',
            { class: 'recit-gen__tete' },
            h('span', { class: 'recit-gen__rang', text: GENERATION_NAMES[rank - 1] ?? String(rank) }),
            h(
              'span',
              { class: 'recit-gen__qui' },
              h('span', { class: 'recit-gen__nom', text: `${member.given} ${LINEAGE.surname}` }),
              h('span', {
                class: 'recit-gen__detail',
                text: `né en ${member.born} · sine ${sineOf(LINEAGE, rank)}`,
              }),
            ),
          ),
          cards.length > 0
            ? h('div', { class: 'recit-gen__liste' }, ...cards)
            : h('p', { class: 'empty', text: 'Épisodes à écrire.' }),
        ),
      );
    }

    setChildren(root, [
      h(
        'section',
        { class: 'card card--accent' },
        h('h2', { class: 'card__title', text: 'Cinq générations, une signature' }),
        h('p', { class: 'prose__lead' },
          'De 1844 à 1999, les ', h('strong', { text: LINEAGE.surname }),
          ' ont transmis le même métier de père en fils. Les situations et les ' +
            'messages sont historiques ; la famille est inventée, et chaque épisode ' +
            'dit à la fin ce qui est vrai.'),
      ),
      ...blocks,
    ]);
  };

  // --- Lecteur d'épisode ---

  /**
   * Ouvre un épisode. On reprend là où l'on s'est arrêté — sauf s'il est
   * terminé, auquel cas il n'y a plus rien à reprendre : on le rejoue.
   */
  const openEpisode = (episode: Episode, fromStart = false): void => {
    const ctx = storyContext(episode);
    const record = store.progress.story.episodes[episode.id];
    const resume = record && !record.completed ? record.beat : 0;
    let index = fromStart ? 0 : Math.min(resume, episode.beats.length - 1);
    let errors = 0;
    let bestCopy = record?.bestCopy ?? 0;

    table = createMorseTable({ onPick: (_, code) => playCode(code, SEND_WPM, voiceOf(episode)) });
    // La table se règle une fois pour l'épisode : toutes les lettres, plus les
    // chiffres et la ponctuation seulement s'il en emploie.
    table.limit(
      episode.beats
        .filter((beat) => beat.kind === 'receive' || beat.kind === 'send')
        .map((beat) => (beat as { text: string }).text)
        .join(''),
    );
    const stage = h('div', { class: 'recit-scene' });
    const trail = h('div', { class: 'recit-fil' });
    const meter = h('p', { class: 'recit-mesure' });

    const persist = (extra: Partial<{ completed: boolean }> = {}): void => {
      recordEpisode(store.progress, episode.id, {
        beat: index,
        errors,
        bestCopy,
        withoutTable: !table.consulted(),
        ...extra,
      });
      errors = 0;
      store.saveNow();
    };

    let clock = 0;
    const stopClock = (): void => {
      if (clock) window.clearInterval(clock);
      clock = 0;
    };

    const stop = (): void => {
      player.stop();
      stopNoise();
      stopClock();
      board?.destroy();
      board = null;
    };

    const back = (): void => {
      stop();
      persist();
      drawHub();
    };

    const advance = (): void => {
      stop();
      if (index < episode.beats.length - 1) {
        index += 1;
        persist();
        drawBeat();
      } else {
        persist({ completed: true });
        drawHub();
      }
    };

    /** Les temps déjà passés restent lisibles au-dessus : le récit ne s'efface pas. */
    const drawTrail = (): void => {
      const lines: HTMLElement[] = [];
      for (const beat of episode.beats.slice(0, index)) {
        if (beat.kind === 'recit' || beat.kind === 'epilogue') {
          for (const line of beatText(beat, ctx, episode.year)) {
            lines.push(h('p', { class: 'recit-fil__ligne', text: line }));
          }
        } else if (beat.kind === 'receive' || beat.kind === 'send') {
          lines.push(
            h('p', { class: 'recit-fil__morse' },
              h('span', { class: 'recit-fil__sens', text: beat.kind === 'send' ? 'émis' : 'reçu' }),
              h('span', { class: 'mono', text: beatText(beat, ctx, episode.year)[0] ?? '' })),
          );
        }
      }
      setChildren(trail, lines.slice(-8));
    };

    const drawBeat = (): void => {
      const beat = episode.beats[index];
      if (!beat) return;
      drawTrail();
      const { done, total } = episodeProgress(episode, index);
      meter.textContent = total > 0 ? `Passage ${Math.min(done + 1, total)} sur ${total}` : '';
      setChildren(stage, [renderBeat(beat)]);
    };

    const renderBeat = (beat: Beat): HTMLElement => {
      const lines = beatText(beat, ctx, episode.year);

      if (beat.kind === 'recit' || beat.kind === 'epilogue') {
        return h(
          'div',
          { class: `recit-bloc${beat.kind === 'epilogue' ? ' recit-bloc--epilogue' : ''}` },
          beat.kind === 'epilogue'
            ? h('h2', { class: 'card__title', text: 'Ce qui s’est réellement passé' })
            : null,
          ...lines.map((line) => h('p', { class: 'recit-texte', text: line })),
          h('button', {
            class: 'btn btn--primary',
            type: 'button',
            text: index < episode.beats.length - 1 ? 'Continuer' : 'Terminer l’épisode',
            on: { click: advance },
          }),
        );
      }

      if (beat.kind === 'silence') {
        return h(
          'div',
          { class: 'recit-bloc recit-silence' },
          h('p', { class: 'recit-texte', text: lines[0] ?? 'Rien. Puis rien encore.' }),
          h('p', { class: 'recit-silence__note', text: 'On cesse d’émettre. On écoute.' }),
          h('button', { class: 'btn btn--primary', type: 'button', text: 'Continuer', on: { click: advance } }),
        );
      }

      if (beat.kind === 'receive') return renderReceive(beat, lines[0] ?? '');
      return renderSend(beat, lines[0] ?? '');
    };

    // --- Réception ---

    const renderReceive = (beat: Extract<Beat, { kind: 'receive' }>, text: string): HTMLElement => {
      let wpm = beat.wpm ?? 12;
      let step = 0;
      const snrDb = beat.sound?.snrDb ?? episode.sound.snrDb;
      const voice = beat.sound?.timbre ?? voiceOf(episode);

      const tape = h('p', {
        class: 'recit-bande',
        attrs: { 'aria-label': 'Signal reçu, en points et traits' },
      });
      const notes = h('textarea', {
        class: 'input recit-notes',
        attrs: { placeholder: 'Écrivez ici ce que vous copiez…', spellcheck: 'false', rows: '3' },
      }) as HTMLTextAreaElement;
      const verdict = h('p', { class: 'recit-verdict', attrs: { 'aria-live': 'polite' } });
      const suivant = h('button', {
        class: 'btn btn--primary',
        type: 'button',
        text: 'Continuer',
        disabled: true,
        on: { click: advance },
      }) as HTMLButtonElement;

      /**
       * La bande porte le signal, jamais la lettre : c'est au joueur de
       * déchiffrer. Afficher le texte reviendrait à donner la réponse de
       * l'exercice au moment de le poser.
       */
      const showTape = (upTo: number): void => {
        setChildren(
          tape,
          [...text].slice(0, upTo).map((char, position) =>
            char === ' '
              ? h('span', { class: 'recit-bande__mot' })
              : h('span', {
                  class: `recit-bande__signe${position === upTo - 1 ? ' is-now' : ''}`,
                  // Serré, pas espacé : c'est l'écart entre deux caractères qui
                  // doit se voir, pas celui entre deux signes du même.
                  text: compactCode(encodeChar(char) ?? ''),
                }),
          ),
        );
      };

      /**
       * Deux façons d'écouter, et un seul bouton pour les deux.
       *
       * Au fil, le message passe d'un trait et `AGN` le redemande en entier.
       * Pas à pas, le même bouton avance d'un caractère et `AGN` redit le
       * dernier — c'est ce qu'on veut quand on hésite entre deux lettres, et
       * réentendre la phrase complète pour cela n'aurait aucun sens.
       */
      let stepMode = false;
      /** Dernier caractère réellement sonné, pour le rejouer seul. */
      let lastChar = '';

      const listen = async (): Promise<void> => {
        player.stop();
        startNoise(snrDb);
        step = 0;
        showTape(0);
        lastChar = '';
        const complete = await playAt(text, wpm, voice, (position) => {
          step = position + 1;
          showTape(step);
        });
        // Le dernier appel de position arrive au début du dernier caractère :
        // sans ce rattrapage, la bande s'arrête un signe avant la fin. Mais
        // seulement si le message est allé au bout — une écoute interrompue
        // doit laisser la bande là où l'oreille s'est arrêtée.
        if (complete) {
          step = text.length;
          showTape(step);
        }
        refresh();
      };

      const oneMore = async (): Promise<void> => {
        if (step >= text.length) return;
        player.stop();
        startNoise(snrDb);
        // On saute les espaces plutôt que de les compter comme un pas : un
        // clic qui ne produit aucun son passe pour un bouton cassé.
        while (step < text.length && text[step] === ' ') step += 1;
        if (step >= text.length) { showTape(step); refresh(); return; }
        const char = text[step] as string;
        step += 1;
        lastChar = char;
        showTape(step);
        refresh();
        await playAt(char, wpm, voice);
      };

      const again = async (): Promise<void> => {
        if (!stepMode) return listen();
        player.stop();
        startNoise(snrDb);
        if (lastChar !== '') await playAt(lastChar, wpm, voice);
      };

      const wpmLabel = h('output', { class: 'recit-tempo__valeur', text: `${wpm} WPM` });

      const mainButton = h('button', {
        class: 'btn btn--primary',
        type: 'button',
        text: 'Écouter',
        on: { click: () => void (stepMode ? oneMore() : listen()) },
      }) as HTMLButtonElement;

      const againButton = h('button', {
        class: 'btn btn--code',
        type: 'button',
        text: 'AGN',
        on: { click: () => void again() },
      }) as HTMLButtonElement;

      /** Remet les commandes en accord avec le mode et l'avancement. */
      const refresh = (): void => {
        const done = step >= text.length;
        mainButton.textContent = stepMode ? (done ? 'Message terminé' : 'Lettre suivante') : 'Écouter';
        mainButton.disabled = stepMode && done;
        againButton.title = stepMode ? 'Répétez le dernier caractère' : 'Répétez le message';
        againButton.disabled = stepMode && lastChar === '';
      };

      const stepToggle = h(
        'label',
        { class: 'switch' },
        h('input', {
          type: 'checkbox',
          on: {
            change: (event) => {
              stepMode = (event.target as HTMLInputElement).checked;
              // Changer de mode remet la bande à zéro : reprendre au milieu
              // d'un relevé fait dans l'autre mode n'aurait pas de sens.
              player.stop();
              step = 0;
              lastChar = '';
              showTape(0);
              refresh();
            },
          },
        }),
        h('span', { text: 'Lettre par lettre' }),
      );

      const controls = h(
        'div',
        { class: 'recit-controles' },
        mainButton,
        h('button', {
          class: 'btn btn--code',
          type: 'button',
          title: 'Transmettez plus lentement',
          text: 'QRS',
          on: {
            click: () => {
              wpm = Math.max(5, wpm - 3);
              wpmLabel.textContent = `${wpm} WPM`;
            },
          },
        }),
        againButton,
        wpmLabel,
        stepToggle,
      );

      refresh();

      const check = (): void => {
        const result = compareCopy(notes.value, text);
        bestCopy = Math.max(bestCopy, result.ratio);
        setChildren(verdict, [
          ...result.marks.map((mark) => {
            if (mark.kind === 'ok') return h('span', { class: 'is-ok', text: mark.char });
            if (mark.kind === 'wrong') return h('span', { class: 'is-ko', text: mark.char });
            if (mark.kind === 'missing') return h('span', { class: 'is-manque', text: mark.char });
            if (mark.kind === 'space') return h('span', { class: 'recit-verdict__espace' });
            return h('span', { class: 'is-trop', text: mark.typed });
          }),
          h('span', { class: 'recit-verdict__compte', text: ` ${result.correct} sur ${result.total}` }),
        ]);
        suivant.disabled = false;
      };

      return h(
        'div',
        { class: 'recit-bloc recit-recevoir' },
        h('p', { class: 'recit-source' },
          h('span', { class: 'recit-source__quoi', text: 'À déchiffrer' }),
          beat.from ? h('span', { class: 'recit-source__qui', text: beat.from }) : null),
        tape,
        controls,
        table.element,
        h('label', { class: 'recit-notes__label', text: 'Vos notes' }),
        notes,
        h(
          'div',
          { class: 'recit-controles' },
          h('button', { class: 'btn', type: 'button', text: 'Comparer', on: { click: check } }),
          suivant,
        ),
        verdict,
        beat.note ? h('p', { class: 'card__hint', text: beat.note }) : null,
      );
    };

    // --- Émission ---

    const renderSend = (beat: Extract<Beat, { kind: 'send' }>, text: string): HTMLElement => {
      board?.destroy();
      const suivant = h('button', {
        class: 'btn btn--primary',
        type: 'button',
        text: 'Continuer',
        disabled: true,
        on: { click: advance },
      }) as HTMLButtonElement;

      /**
       * Le temps d'antenne.
       *
       * Il ne démarre qu'à la première frappe : lire la consigne ne met
       * personne en danger. Une fois la limite passée il ne s'arrête pas, il
       * change de couleur et continue de monter — un poste clandestin ne perd
       * pas la partie à la sixième minute, il se fait relever la position.
       */
      const limit = beat.limit ?? 0;
      const clockLabel = limit > 0 ? h('span', { class: 'recit-chrono' }) : null;
      let elapsed = 0;
      const showClock = (): void => {
        if (!clockLabel) return;
        const left = limit - elapsed;
        const over = left < 0;
        clockLabel.textContent = over
          ? `En l’air depuis ${format(elapsed)}`
          : `Encore ${format(left)}`;
        clockLabel.classList.toggle('is-over', over);
      };
      const startClock = (): void => {
        if (!clockLabel || clock) return;
        clock = window.setInterval(() => {
          elapsed += 1;
          showClock();
        }, 1000);
      };
      showClock();

      board = createSender({
        store: context.store,
        play: (code) => playCode(code, SEND_WPM, voiceOf(episode)),
        available: keyersFor(episode.year),
        year: episode.year,
        voice: voiceOf(episode),
        initialMode: senderMode,
        onMode: (next) => {
          senderMode = next;
        },
        onChange: (state) => {
          errors = state.errors;
        },
        onFirstKey: startClock,
        onDone: () => {
          suivant.disabled = false;
          stopClock();
        },
      });
      board.load(text);

      return h(
        'div',
        { class: 'recit-bloc recit-emettre' },
        h('p', { class: 'recit-source' },
          h('span', { class: 'recit-source__quoi', text: 'À transmettre' }),
          beat.to ? h('span', { class: 'recit-source__qui', text: beat.to }) : null),
        beat.hint ? h('p', { class: 'card__hint', text: beat.hint }) : null,
        clockLabel,
        board.element,
        h('div', { class: 'recit-controles' }, suivant),
      );
    };

    const restart = (): void => {
      stop();
      index = 0;
      persist();
      drawBeat();
      root.scrollIntoView({ block: 'start' });
    };

    setChildren(root, [
      h(
        'div',
        { class: 'recit-entete' },
        h('button', { class: 'btn btn--ghost', type: 'button', text: '← Sommaire', on: { click: back } }),
        h('button', {
          class: 'btn btn--ghost',
          type: 'button',
          text: 'Depuis le début',
          attrs: { title: 'Reprendre l’épisode à son premier temps' },
          on: { click: restart },
        }),
        h('span', { class: 'recit-entete__annee', text: String(episode.year) }),
        h('span', {
          class: 'recit-entete__qui',
          text: `${interpolate('{prenom} {nom}', ctx)} · sine ${sineOf(LINEAGE, episode.generation)}`,
        }),
        h('span', {
          class: 'recit-entete__son',
          text: VOICE_LABELS[voiceOf(episode)].nom,
          title: VOICE_LABELS[voiceOf(episode)].quoi,
        }),
      ),
      h('h2', { class: 'recit-titre', text: episode.title }),
      meter,
      trail,
      stage,
    ]);
    drawBeat();
  };

  drawHub();

  return {
    element: root,
    destroy: () => {
      player.stop();
      stopNoise();
      board?.destroy();
    },
  };
}
