/** Point d'entrée : assemble l'état, l'ossature et le routeur. */

import { registerSW } from 'virtual:pwa-register';
import './styles/index.css';
import { AppStore } from './core/store.ts';
import { createShell } from './ui/shell.ts';
import { Router } from './ui/router.ts';
import { ROUTES } from './views/routes.ts';

const root = document.getElementById('app');
if (!root) throw new Error('Élément #app introuvable');

const store = new AppStore();
const shell = createShell(root, store);

const router = new Router({
  routes: ROUTES,
  outlet: shell.outlet,
  context: { store, toast: shell.toast },
  onChange: shell.setActiveRoute,
});
router.start();

// Le premier geste de l'utilisateur, quel qu'il soit, sert à déverrouiller le
// contexte audio : les navigateurs mobiles refusent de le démarrer autrement,
// et attendre le bouton « Écouter » ferait manquer le tout premier son.
const unlockOnce = (): void => {
  void store.audio.unlock();
  window.removeEventListener('pointerdown', unlockOnce);
  window.removeEventListener('keydown', unlockOnce);
};
window.addEventListener('pointerdown', unlockOnce, { once: false });
window.addEventListener('keydown', unlockOnce, { once: false });

// Le navigateur peut fermer l'onglet sans prévenir : on force l'écriture avant
// que la page ne parte en arrière-plan, plutôt que de compter sur `unload`.
window.addEventListener('pagehide', () => store.saveNow());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') store.saveNow();
});

/*
 * Mise à jour du service worker.
 *
 * Deux précautions, apprises à la dure : un navigateur ne cherche une nouvelle
 * version qu'au chargement de la page, si bien qu'un onglet laissé ouvert — le
 * cas normal sur téléphone — peut servir une version périmée indéfiniment. Et
 * activer le nouveau service worker ne suffit pas : tant que la page n'est pas
 * rechargée, elle continue d'exécuter l'ancien code. On vérifie donc
 * périodiquement, et on recharge réellement, après avoir sauvegardé.
 */
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    const check = (): void => {
      void registration.update().catch(() => {
        // Hors ligne ou serveur injoignable : la prochaine vérification suffira.
      });
    };
    window.setInterval(check, 30 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
  },
  onNeedRefresh() {
    shell.toast('Nouvelle version disponible, rechargement…', 'info');
    store.saveNow();
    // Court délai pour que le message soit lu, puis rechargement effectif.
    window.setTimeout(() => void updateSW(true), 1000);
  },
  onOfflineReady() {
    shell.toast('Le site est disponible hors ligne.', 'success');
  },
});
