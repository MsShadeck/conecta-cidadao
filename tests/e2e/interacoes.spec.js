/**
 * interacoes.spec.js — Busca (Ctrl K), menu, preferências e filtros.
 *
 * Confere o comportamento dos componentes do Radix UI (Dialog) e do Motion:
 * abrir, navegar pelo teclado, fechar com Esc e devolver o foco.
 */

import { expect, test } from '@playwright/test';

test.describe('Busca', () => {
  test('abre pelo cabeçalho, fecha com Esc e devolve o foco', async ({ page }) => {
    await page.goto('/');
    const botao = page.getByRole('button', { name: 'Buscar um serviço' });
    await botao.click();

    const janela = page.getByRole('dialog', { name: 'Buscar serviços em Indaiatuba' });
    await expect(janela).toBeVisible();
    // O foco vai direto para o campo de texto.
    await expect(janela.getByRole('searchbox')).toBeFocused();
    // Campo vazio: sugere as categorias.
    await expect(janela.getByRole('button', { name: /Saúde/ })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(janela).toBeHidden();
    await expect(botao).toBeFocused();
  });

  test('Ctrl K, setas e Enter levam ao resultado', async ({ page, isMobile }) => {
    test.skip(isMobile, 'atalho de teclado físico');
    await page.goto('/sobre');
    await page.keyboard.press('Control+k');

    const janela = page.getByRole('dialog', { name: 'Buscar serviços em Indaiatuba' });
    await expect(janela).toBeVisible();
    await page.keyboard.type('educação');
    await expect(janela.locator('.busca-item').first()).toBeVisible();

    // O primeiro item fica destacado; Enter abre.
    await expect(janela.locator('.busca-item').first()).toHaveClass(/busca-item--ativo/);
    await page.keyboard.press('Enter');
    await expect(janela).toBeHidden();
    await expect(page).not.toHaveURL(/\/sobre$/);
  });

  test('mostra mensagem quando não encontra nada', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Buscar um serviço' }).click();
    await page.getByRole('searchbox').fill('xyzxyzxyz');
    await expect(page.getByRole('status').filter({ hasText: 'Nada encontrado' })).toBeVisible();
  });
});

test.describe('Menu', () => {
  test('abre o painel, navega e fecha sozinho', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();

    const painel = page.getByRole('dialog', { name: 'Navegar' });
    await expect(painel).toBeVisible();
    await painel.getByRole('link', { name: 'Telefones úteis' }).click();

    await expect(page).toHaveURL(/\/contatos$/);
    await expect(painel).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Telefones úteis');
  });

  test('Esc fecha e devolve o foco ao botão', async ({ page }) => {
    await page.goto('/');
    const botao = page.getByRole('button', { name: 'Menu' });
    await botao.click();
    await expect(page.getByRole('dialog', { name: 'Navegar' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Navegar' })).toBeHidden();
    await expect(botao).toBeFocused();
  });

  test('tema escuro e letra maior ficam salvos', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    const painel = page.getByRole('dialog', { name: 'Navegar' });

    await painel.getByLabel('Tema').selectOption('escuro');
    await expect(page.locator('html')).toHaveAttribute('data-tema', 'escuro');

    await painel.getByRole('button', { name: 'Letra maior' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-fonte', 'maior');

    // Recarregar mantém as escolhas (localStorage + script do index.html).
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-tema', 'escuro');
    await expect(page.locator('html')).toHaveAttribute('data-fonte', 'maior');
  });
});

test.describe('Categoria', () => {
  test('alterna entre lista e mapa e guarda na URL', async ({ page }) => {
    await page.goto('/saude');
    const mapa = page.getByRole('button', { name: 'Mapa', exact: true });
    await mapa.click();
    await expect(mapa).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/ver=mapa/);
    await expect(page.getByRole('button', { name: 'Lista', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  test('busca dentro da categoria filtra os cartões', async ({ page }) => {
    await page.goto('/saude');
    const contagem = page.locator('.categoria-contagem');
    await expect(contagem).toContainText('encontrado');
    await page.getByRole('searchbox', { name: 'Buscar em Saúde' }).fill('haoc');
    await expect(contagem).toContainText('1 local encontrado');
    await expect(page.getByRole('link', { name: /Hospital Augusto/ })).toBeVisible();
  });
});

test('Esta página foi útil?: o botão marca o voto', async ({ page }) => {
  await page.goto('/saude');
  const util = page.getByRole('button', { name: 'Útil' });
  await util.click();
  await expect(page.getByRole('button', { name: 'Marcada como útil' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});
