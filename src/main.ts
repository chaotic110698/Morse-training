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

// Mise à jour du service worker : on recharge silencieusement au prochain
// passage, sans interrompre une série d'entraînement en cours.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    shell.toast('Une nouvelle version est prête. Elle s’appliquera au prochain lancement.', 'info');
    void updateSW(false);
  },
  onOfflineReady() {
    shell.toast('Le site est disponible hors ligne.', 'success');
  },
});
