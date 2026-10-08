/**
 * eslint.config.js — Regras de qualidade do código (ESLint 9, formato "flat").
 *
 * O ESLint lê o código sem executá-lo e aponta erros comuns: variável não usada,
 * hook chamado no lugar errado, dependência faltando no useEffect etc.
 * Rode com `npm run lint`.
 */

import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // Pastas geradas pela build ou por ferramentas: não precisam ser analisadas.
  { ignores: ['dist', 'node_modules', 'dev-dist', 'api/_integra'] },

  // Código do site (roda no navegador).
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      // As duas regras dos hooks: chamar hooks só no topo do componente e
      // declarar no array do useEffect tudo o que ele usa.
      ...reactHooks.configs.recommended.rules,
      // O projeto documenta as props com JSDoc em vez de PropTypes.
      'react/prop-types': 'off',
    },
  },

  // Scripts de build, testes, funções serverless e arquivos de configuração (rodam no Node).
  {
    files: ['scripts/**/*.{js,mjs}', 'api/**/*.js', '*.config.js', 'src/**/*.test.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: js.configs.recommended.rules,
  },
];
