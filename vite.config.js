import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Build-time env, so the service worker can decide what is worth precaching.
  //
  // Two sources, because hosts differ: `loadEnv` only reads `.env` *files*
  // (local dev), while platforms like Vercel inject variables straight into
  // `process.env` with no file on disk. Checking only one silently misses the
  // other. `globalThis.process` keeps ESLint's browser globals happy.
  const fileEnv = loadEnv(mode, '.', 'VITE_');
  const processEnv = globalThis.process?.env ?? {};
  const read = (key) => fileEnv[key] ?? processEnv[key];
  const zegoConfigured = Boolean(read('VITE_ZEGO_APP_ID') && read('VITE_ZEGO_SERVER_SECRET'));

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        // Keep the SW out of the way while developing so stale chunks never mask a fix.
        devOptions: { enabled: false },
        includeAssets: ['favicon.svg', 'masked-icon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'VoxCampus — Academic Podcasts & Live Audio Rooms',
          short_name: 'VoxCampus',
          description: 'Stream lectures, join live interactive audio rooms, and discover trending academic podcasts.',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          categories: ['education', 'productivity'],
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          ],
        },
        workbox: {
          // The ZegoCloud live-audio SDK is a very large chunk; without raising this
          // limit `vite build` fails outright instead of just warning.
          maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
          // Don't precache ~5 MB of live-audio SDK on deployments that never use it.
          // Without Zego credentials the room page never requests the chunk anyway,
          // so precaching it only slows down the first visit.
          globIgnores: zegoConfigured ? [] : ['**/zego-*.js'],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true,
          clientsClaim: true,
        },
      }),
    ],
    server: {
      // Bind to all interfaces so the sandboxed live preview can reach the dev server.
      host: true,
      port: 5173,
      strictPort: false,
      // The preview is served from a generated *.e2b.app host; Vite 8 blocks unknown
      // Host headers by default, which would return 403 for the whole preview.
      allowedHosts: true,
    },
    preview: {
      host: true,
      port: 4173,
      allowedHosts: true,
    },
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('@zegocloud')) return 'zego';
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase';
            if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react-vendor';
            return undefined;
          },
        },
      },
    },
  };
});
