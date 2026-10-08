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
  plugins: [react(), funcoesDaPastaApi()],
  test: {
    // Testes de funções puras: não precisam de navegador simulado.
    environment: 'node',
  },
});
