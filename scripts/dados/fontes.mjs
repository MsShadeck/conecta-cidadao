/**
 * fontes.mjs — Acesso às fontes de dados externas, usado só no build (npm run dados).
 *
 * Regras de boa vizinhança com as APIs públicas:
 *  - todas as requisições levam um User-Agent que identifica o projeto;
 *  - há uma pausa mínima entre requisições ao mesmo servidor (1 s para o
 *    Nominatim e o Overpass, como pedem os termos de uso);
 *  - as respostas ficam em cache em scripts/.cache/ (fora do git). Rodar o
 *    script de novo no mesmo dia não consulta a internet outra vez.
 *    Use `npm run dados -- --sem-cache` para forçar a atualização.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

export const USER_AGENT =
  'ConectaCidadao/2.0 (projeto academico Fatec Indaiatuba; https://github.com/MsShadeck/conecta-cidadao)';

const PASTA_CACHE = path.resolve('scripts/.cache');
const VALIDADE_CACHE_MS = 24 * 60 * 60 * 1000; // 1 dia
const semCache = process.argv.includes('--sem-cache');

// Pausa mínima entre requisições, por servidor.
const INTERVALO_MS = {
  'nominatim.openstreetmap.org': 1100,
  'overpass-api.de': 1100,
  default: 400,
};
const ultimaRequisicao = new Map();

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

async function respeitarIntervalo(url) {
  const host = new URL(url).host;
  const intervalo = INTERVALO_MS[host] ?? INTERVALO_MS.default;
  const desde = Date.now() - (ultimaRequisicao.get(host) ?? 0);
  if (desde < intervalo) await esperar(intervalo - desde);
  ultimaRequisicao.set(host, Date.now());
}

/**
 * Busca uma URL e devolve o JSON (ou o texto), usando o cache em disco.
 * @param {string} url
 * @param {{metodo?: string, corpo?: string, texto?: boolean, tentativas?: number}} opcoes
 */
export async function buscar(url, { metodo = 'GET', corpo, texto = false, tentativas = 3 } = {}) {
  const chave = createHash('sha1')
    .update(metodo + url + (corpo ?? ''))
    .digest('hex');
  const arquivo = path.join(PASTA_CACHE, `${chave}.json`);

  if (!semCache) {
    try {
      const salvo = JSON.parse(await readFile(arquivo, 'utf8'));
      if (Date.now() - salvo.em < VALIDADE_CACHE_MS) return salvo.dados;
    } catch {
      // Sem cache: segue para a internet.
    }
  }

  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    await respeitarIntervalo(url);
    try {
      const resposta = await fetch(url, {
        method: metodo,
        body: corpo,
        headers: {
          'User-Agent': USER_AGENT,
          ...(corpo ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
        },
      });
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status} em ${url}`);
      const dados = texto ? await resposta.text() : await resposta.json();
      await mkdir(PASTA_CACHE, { recursive: true });
      await writeFile(arquivo, JSON.stringify({ em: Date.now(), url, dados }));
      return dados;
    } catch (erro) {
      if (tentativa === tentativas) throw erro;
      // Espera cada vez mais antes de tentar de novo (2 s, 4 s...).
      await esperar(2000 * tentativa);
    }
  }
  return null;
}

/** Todas as páginas do CNES para o município (a API devolve 20 por vez). */
export async function buscarCnes(codigoMunicipio) {
  const todos = [];
  for (let offset = 0; offset < 5000; offset += 20) {
    const url = `https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?codigo_municipio=${codigoMunicipio}&limit=20&offset=${offset}`;
    const pagina = await buscar(url);
    const lista = pagina?.estabelecimentos ?? [];
    todos.push(...lista);
    if (lista.length < 20) break;
  }
  return todos;
}

/**
 * Consulta o Overpass (OpenStreetMap). Usar só no build, nunca a cada visita.
 * O servidor principal às vezes responde 504 (sobrecarga); nesse caso tenta um
 * espelho público da mesma API, com os mesmos dados.
 */
export async function buscarOverpass(consulta) {
  const corpo = `data=${encodeURIComponent(consulta)}`;
  try {
    return await buscar('https://overpass-api.de/api/interpreter', { metodo: 'POST', corpo });
  } catch (erro) {
    console.warn(`  Overpass principal falhou (${erro.message}); tentando o espelho...`);
    return buscar('https://overpass.kumi.systems/api/interpreter', { metodo: 'POST', corpo });
  }
}
