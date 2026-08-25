import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { searchIndexPlugin } from './build/search-index.ts';

// Le site est publie sur GitHub Pages a l'adresse
// https://<user>.github.io/Morse-training/ : la base doit donc inclure le
// nom du depot, sinon les assets sont demandes a la racine du domaine.
// Empreinte injectée à la construction : affichée dans le bandeau, elle permet
// de savoir d'un coup d'œil quelle version le navigateur exécute réellement.
const BUILD_STAMP = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

export default defineConfig({
  base: '/Morse-training/',
  define: {
    __BUILD_STAMP__: JSON.stringify(BUILD_STAMP),
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  plugins: [
    searchIndexPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/favicon.svg'],
      manifest: {
        name: 'Morse Training',
        short_name: 'Morse',
        description: "Apprendre et s'entrainer au code morse : ecoute, manipulation, lexique et histoire.",
        lang: 'fr',
        dir: 'ltr',
        start_url: '/Morse-training/',
        scope: '/Morse-training/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0b1015',
        theme_color: '#0b1015',
        categories: ['education', 'utilities'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/Morse-training/index.html',
      },
      devOptions: { enabled: false },
    }),
  ],
});
