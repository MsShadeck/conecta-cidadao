/**
 * vite.config.js — Configuração do Vite (servidor de desenvolvimento e build).
 *
 * O Vite é a ferramenta que roda o projeto em `npm run dev` e gera a pasta
 * dist/ em `npm run build`.
 */

import { defineConfig } from 'vite';
// Plugin oficial do React: entende JSX e habilita a atualização instantânea
// da tela ao salvar um arquivo (Hot Module Replacement).
import react from '@vitejs/plugin-react';
// PWA: gera o "service worker", que guarda arquivos no aparelho para o site
// abrir mesmo sem internet (telefones úteis, locais e lembretes).
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Em produção, a Vercel executa api/rota.js como função serverless.
 * No `npm run dev` não existe Vercel, então este pequeno plugin faz o mesmo papel:
 * quando o navegador pede /api/rota, o Vite chama a função diretamente.
 */
function funcoesDaPastaApi() {
  return {
    name: 'funcoes-da-pasta-api',
    configureServer(servidor) {
      servidor.middlewares.use('/api/rota', async (req, res) => {
        // O middleware do Vite tira o prefixo /api/rota de req.url; devolvemos para a função.
        req.url = `/api/rota${req.url}`;
        const { default: handler } = await servidor.ssrLoadModule('/api/rota.js');
        handler(req, res);
      });
    },
  };
}

// base '/' é o necessário para o BrowserRouter: os arquivos são buscados sempre a
// partir da raiz do domínio, inclusive quando a pessoa abre /saude direto no navegador.
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    funcoesDaPastaApi(),
    VitePWA({
      registerType: 'autoUpdate', // nova versão do site instala sozinha
      manifest: false, // o manifest já existe em public/manifest.webmanifest
      workbox: {
        // Guardados na instalação: o código do site, os ícones e os dados que
        // precisam funcionar sem internet (locais, telefones, serviços online).
        // As fotos ficam de fora (pesariam 3 MB) e entram no cache quando vistas.
        globPatterns: [
          '**/*.{js,css,html,svg,webmanifest}',
          'icones/*.png',
          'img/interface/pequeno/*.png',
          'img/interface/*.svg',
          'api/*.json',
        ],
        // Qualquer rota (/saude, /lembretes...) abre o index.html mesmo offline.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Dados do site (locais, telefones, feriados...): mostra o que está
            // guardado na hora e atualiza em segundo plano.
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/') && /\.(json|geojson)$/.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'dados' },
          },
          {
            // Rota calculada na hora: sempre pela internet.
            urlPattern: ({ url }) => url.pathname === '/api/rota',
            handler: 'NetworkOnly',
          },
          {
            // Fotos em JPG (alternativa para navegadores sem WebP).
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'imagens',
              expiration: { maxEntries: 120, maxAgeSeconds: 30 * 24 * 3600 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    // Testes de funções puras: não precisam de navegador simulado.
    environment: 'node',
  },
});
