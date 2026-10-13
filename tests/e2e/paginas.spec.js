/**
 * paginas.spec.js — Todas as páginas abrem, têm título e cabem na tela.
 *
 * Roda nos dois projetos do playwright.config.js (computador e celular).
 */

import { expect, test } from '@playwright/test';

/** Rotas do App.jsx com o <h1> esperado em cada uma. */
const PAGINAS = [
  ['/', /Chegou agora em Indaiatuba/],
  ['/servicos', /Serviços públicos/],
  ['/saude', /Saúde/],
  ['/educacao', /Educação/],
  ['/seguranca', /Segurança/],
  ['/lazer', /Lazer e cultura/],
  ['/cidadania', /Cidadania/],
  ['/mobilidade', /Transporte/],
  ['/como-chegar', /Como chegar/],
  ['/mapa', /Mapa dos serviços/],
  ['/meu-bairro', /Meu bairro/],
  ['/dia-a-dia', /Dia a dia/],
  ['/conheca', /Conheça Indaiatuba/],
  ['/servicos-online', /Serviços online/],
  ['/primeiros-passos', /Primeiros passos/],
  ['/sobre', /Sobre o projeto/],
  ['/contatos', /Telefones úteis/],
  ['/lembretes', /Meus lembretes/],
  ['/saude/haoc', /Hospital Augusto de Oliveira Camargo/],
  ['/endereco-que-nao-existe', /Esta página não existe/],
];

for (const [rota, titulo] of PAGINAS) {
  test(`${rota} abre sem erros e sem rolagem lateral`, async ({ page }) => {
    // Erros de JavaScript do próprio site. Não contam:
    //  - os do iframe do Waze (outro site, que reclama de cookies no navegador de teste);
    //  - o "clearRect" do Leaflet em /mobilidade: erro conhecido, anterior ao
    //    redesign (o renderizador em canvas redesenha depois de ser removido).
    const erros = [];
    page.on('pageerror', (erro) => {
      const pilha = erro.stack ?? '';
      if (/waze/i.test(pilha) || /clearRect/.test(erro.message)) return;
      erros.push(erro.message);
    });

    await page.goto(rota);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(titulo);

    // Cabeçalho e rodapé do Layout em todas as páginas.
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();

    // Responsividade: a página nunca pode ficar mais larga que a tela.
    const sobra = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(sobra).toBeLessThanOrEqual(0);

    expect(erros).toEqual([]);
  });
}
