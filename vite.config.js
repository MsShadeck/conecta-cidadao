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

// base '/' é o necessário para o BrowserRouter: os arquivos são buscados sempre a
// partir da raiz do domínio, inclusive quando a pessoa abre /saude direto no navegador.
export default defineConfig({
  base: '/',
  plugins: [react()],
});
