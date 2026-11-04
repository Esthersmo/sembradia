import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Política de seguridad de contenidos (CSP). GitHub Pages no deja poner cabeceras, así que va en una <meta>.
// Solo se permite cargar código de la propia app (y del captcha de Cloudflare) y hablar con Supabase y Open-Meteo.
const SUPA = new URL(process.env.VITE_SUPABASE_URL || 'https://zviyckrkvynmhukhrvvl.supabase.co').host;
const CF = 'https://challenges.cloudflare.com';
const CSP = [
  "default-src 'self'",
  `script-src 'self' ${CF}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://${SUPA}`,
  `connect-src 'self' data: https://${SUPA} wss://${SUPA} https://api.open-meteo.com`,
  `frame-src ${CF}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');
const csp = { name: 'csp', transformIndexHtml: html => html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="${CSP}">`) };

export default defineConfig({
  base: './',
  // Dos páginas: la app y la de los enlaces compartidos (ver.html)
  build: { target: 'es2022', rollupOptions: { input: { main: 'index.html', ver: 'ver.html' } } },
  plugins: [
    csp,
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt', // la recarga tras una versión nueva la decide la app (ver «Versión nueva» en app.js)
      injectRegister: false,
      injectManifest: { globPatterns: ['**/*.{js,css,html,png,webp,svg}'] },
      manifest: {
        name: 'Sembradía',
        short_name: 'Sembradía',
        description: 'Calendario de siembra por provincia, riegos y cuidados de tus plantas.',
        lang: 'es',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#F6F3EE',
        theme_color: '#F6F3EE',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
