/**
 * playwright.config.js — Testes de navegador (end-to-end) com o Playwright.
 *
 * Diferente do Vitest (que testa funções puras no Node), o Playwright abre o
 * site num Chromium de verdade e clica, digita e confere o que aparece na tela.
 * Rode com `npm run test:e2e` (na primeira vez: `npx playwright install chromium`).
 *
 * O próprio Playwright sobe o servidor do Vite (webServer) antes dos testes.
 */

import { defineConfig, devices } from '@playwright/test';

const PORTA = 5174;

export default defineConfig({
  testDir: './tests/e2e',
  // Cada teste tem 30 s; páginas com mapa podem demorar no primeiro acesso.
  timeout: 30_000,
  fullyParallel: true,
  // Em CI, falha se alguém esquecer um test.only no código.
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://localhost:${PORTA}`,
    // Guarda rastro e captura de tela só quando um teste falha.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // Celular: mesmo Chromium, com tela e toque de um Pixel 7.
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx vite --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
