/**
 * sincronizar-integra.mjs — Traz para cá o roteamento e o viário do Indaiatuba Integra.
 *
 * Rode com `npm run integra` sempre que o Indaiatuba Integra for atualizado.
 * (Pasta padrão: ../indaiatuba-integra/indaiatuba-integra; troque com INTEGRA_DIR=...)
 *
 * Por que um script, e não copiar arquivos à mão?
 *   A lógica de rota (algoritmo A* sobre as ruas reais de Indaiatuba) continua
 *   sendo a do Integra: o arquivo server/src/grafo.ts é empacotado SEM alteração
 *   com o esbuild. Se o Integra melhorar o algoritmo, basta rodar este script.
 *
 * O que NÃO é trazido: as linhas de ônibus, as bicicletas e os patinetes do
 * Integra, porque lá eles são simulados (dados fictícios). Só vêm os dados reais
 * do OpenStreetMap: o viário (viario.json) e as ciclovias (ciclovias.geojson).
 *
 * Saída:
 *   api/_integra/roteador.mjs    → rotear() e pontoNaVia() do Integra, em JavaScript
 *   api/_integra/data/            → viario.json e config.json (só as zonas industriais)
 *   public/api/ciclovias.geojson  → ciclovias e ciclofaixas para o mapa
 *   api/_integra/ORIGEM.json      → de qual commit do Integra veio cada arquivo
 */

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { build } from 'esbuild';

const INTEGRA = path.resolve(process.env.INTEGRA_DIR ?? '../indaiatuba-integra/indaiatuba-integra');
const DESTINO = path.resolve('api/_integra');
const SHIM = path.resolve('scripts/integra/dados-shim.mjs');

async function main() {
  const grafo = path.join(INTEGRA, 'server/src/grafo.ts');
  await mkdir(path.join(DESTINO, 'data'), { recursive: true });

  // 1. Empacota grafo.ts (+ geo.ts) num único arquivo JS. O import './dados.js'
  //    do Integra (que carrega também os dados simulados) é trocado pelo nosso
  //    "shim", que só entrega o que o roteamento usa: DATA_DIR e as zonas industriais.
  await build({
    stdin: {
      contents: `export { rotear, pontoNaVia } from ${JSON.stringify(grafo)};`,
      resolveDir: path.dirname(grafo),
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    outfile: path.join(DESTINO, 'roteador.mjs'),
    banner: {
      js: '// ARQUIVO GERADO por scripts/sincronizar-integra.mjs a partir do Indaiatuba Integra. Não edite.',
    },
    plugins: [
      {
        name: 'trocar-dados',
        setup(construtor) {
          construtor.onResolve({ filter: /\/dados\.js$/ }, () => ({ path: SHIM }));
        },
      },
    ],
  });

  // 2. Dados reais do OpenStreetMap que o roteamento precisa.
  await copyFile(
    path.join(INTEGRA, 'server/data/viario.json'),
    path.join(DESTINO, 'data/viario.json')
  );
  const config = JSON.parse(await readFile(path.join(INTEGRA, 'server/data/config.json'), 'utf8'));
  await writeFile(
    path.join(DESTINO, 'data/config.json'),
    JSON.stringify(
      {
        _aviso:
          'Trecho do config.json do Indaiatuba Integra. As zonas industriais são aproximadas e só servem para o roteamento de bicicleta evitar ruas de caminhões.',
        velocidadesKmh: config.velocidadesKmh,
        zonasIndustriais: config.zonasIndustriais,
      },
      null,
      2
    )
  );
  await copyFile(
    path.join(INTEGRA, 'server/data/ciclovias.geojson'),
    path.resolve('public/api/ciclovias.geojson')
  );

  // 3. Registra a origem (commit) para a página de fontes.
  let commit = null;
  try {
    commit = execSync('git rev-parse --short HEAD', { cwd: INTEGRA }).toString().trim();
  } catch {
    // Integra sem git: segue sem o commit.
  }
  const viario = JSON.parse(await readFile(path.join(DESTINO, 'data/viario.json'), 'utf8'));
  await writeFile(
    path.join(DESTINO, 'ORIGEM.json'),
    JSON.stringify(
      {
        projeto: 'Indaiatuba Integra',
        commit,
        sincronizadoEm: new Date().toISOString().slice(0, 10),
        viario: viario._fonte,
        arquivos: [
          'server/src/grafo.ts',
          'server/src/geo.ts',
          'server/data/viario.json',
          'server/data/ciclovias.geojson',
        ],
      },
      null,
      2
    )
  );
  console.log(`Integra sincronizado (commit ${commit ?? 'desconhecido'}).`);
}

await main();
