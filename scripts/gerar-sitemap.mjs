/**
 * gerar-sitemap.mjs — Cria public/sitemap.xml antes de cada build.
 *
 * O sitemap lista todas as páginas do site para os buscadores (Google, Bing):
 * as páginas fixas e uma página para cada local de public/api/locais.json.
 * Roda sozinho no `npm run build` (ver package.json).
 */

import { readFile, writeFile } from 'node:fs/promises';

const SITE = 'https://conecta-cidadao.vercel.app';
const PAGINAS_FIXAS = [
  '/',
  '/primeiros-passos',
  '/perto-de-mim',
  '/mapa',
  '/como-chegar',
  '/servicos-online',
  '/contatos',
  '/saude',
  '/educacao',
  '/seguranca',
  '/lazer',
  '/cidadania',
  '/mobilidade',
  '/lembretes',
  '/sobre',
];

const { locais, atualizadoEm } = JSON.parse(await readFile('public/api/locais.json', 'utf8'));
const urls = [...PAGINAS_FIXAS, ...locais.map((l) => `/${l.categoria}/${l.id}`)];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${atualizadoEm}</lastmod></url>`).join('\n')}
</urlset>
`;
await writeFile('public/sitemap.xml', xml);
console.log(`sitemap.xml: ${urls.length} endereços`);
