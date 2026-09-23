/**
 * main.jsx — Ponto de entrada da aplicação.
 *
 * É o primeiro arquivo JavaScript executado pelo navegador (chamado pelo
 * <script type="module"> do index.html). Ele monta o React dentro da <div id="root">
 * e carrega o CSS global, que vale para o site inteiro.
 */

// StrictMode: modo de desenvolvimento do React que avisa sobre práticas obsoletas.
// Ele não aparece na tela e não afeta a build de produção.
import { StrictMode } from 'react';
// createRoot: API do React 18 responsável por criar a "raiz" da árvore de componentes.
import { createRoot } from 'react-dom/client';
// App: componente que contém as rotas e todo o restante da aplicação.
import App from './App.jsx';
// CSS global (tokens de cor, reset e classes compartilhadas). Importado uma única
// vez aqui para valer em todas as páginas.
import './styles/global.css';

// Procura a <div id="root"> no index.html, cria a raiz do React nela e desenha o <App />.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
