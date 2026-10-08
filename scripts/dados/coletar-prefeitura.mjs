/**
 * coletar-prefeitura.mjs — Lê as fichas oficiais das unidades no portal da Prefeitura.
 *
 * Rode só quando quiser conferir se algo mudou: `npm run dados:prefeitura`.
 * NÃO faz parte do `npm run dados` nem do build, para não sobrecarregar o portal.
 *
 * Como o portal não tem API nem dados abertos, cada unidade (UBS, EMEB, CRAS,
 * parque...) tem uma página com uma "ficha" padronizada:
 *     Endereço: ...   Horário de Atendimento: ...   Telefone: ...
 * Este script:
 *  1. lê o Mapa do Site uma vez e escolhe as páginas das seções de interesse;
 *  2. visita cada página UMA vez, com 1,2 s de intervalo entre elas;
 *  3. guarda só os campos públicos da ficha (sem o nome do responsável nem
 *     e-mails pessoais) em scripts/dados/prefeitura-paginas.json.
 *
 * Esse arquivo é versionado no git: o `npm run dados` trabalha em cima dele,
 * sem acessar o portal. A data da coleta vai junto, para a interface mostrar.
 */

import { writeFile } from 'node:fs/promises';
import { USER_AGENT } from './fontes.mjs';

const BASE = 'https://www.indaiatuba.sp.gov.br';
const INTERVALO_MS = 1200;
const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

/** Seções que interessam ao cidadão; os demais links do mapa do site são ignorados. */
const SECOES = [
  /^\/saude\/atencao-basica\/[^/]+\/$/,
  /^\/saude\/atencao-especializada\/[^/]+\/$/,
  /^\/saude\/assistencia-farmaceutica\/farmacia-[^/]+\/$/,
  /^\/educacao\/educacao-basica\/ensino-fundamental\/ensino-regular\/[^/]+\/$/,
  /^\/educacao\/educacao-basica\/educacao-infantil\/pre-escola\/[^/]+\/$/,
  /^\/educacao\/educacao-basica\/educacao-infantil\/creche\/[^/]+\/$/,
  /^\/seguranca\/(guarda-civil|defesa-civil)\/$/,
  /^\/assistencia-social\/protecao-basica\/(cras-[^/]+|plantao-social)\/$/,
  /^\/assistencia-social\/protecao-especial\/creas\/$/,
  /^\/assistencia-social\/conselhos\/\d-conselho-tutelar\/$/,
  /^\/desenvolvimento-economico-industria-comercio-e-turismo\/turismo\/pontos-turisticos\/[^/]+\/$/,
  /^\/desenvolvimento-economico-industria-comercio-e-turismo\/pat\/$/,
  /^\/cultura\/administrativo\/[^/]+\/$/,
  /^\/esportes\/nucleos-esportivos\/[^/]+\/$/,
  /^\/mobilidade-urbana\/terminais-de-transporte-publico\/[^/]+\/$/,
  /^\/mobilidade-urbana\/transportes\/transporte-coletivo\/$/,
];

/** Baixa uma página do portal (que usa ISO-8859-1) e devolve o HTML como texto. */
async function baixar(caminho) {
  const resposta = await fetch(BASE + caminho, { headers: { 'User-Agent': USER_AGENT } });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status} em ${caminho}`);
  return new TextDecoder('latin1').decode(Buffer.from(await resposta.arrayBuffer()));
}

/** HTML → linhas de texto, preservando as quebras de bloco. */
export function htmlParaLinhas(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(p|div|li|h\d|tr|td)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&ordm;/g, 'º')
    .replace(/&ordf;/g, 'ª')
    .replace(/&#34;|&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .split('\n')
    .map((linha) => linha.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

const ROTULOS = {
  endereco: /^Endereço\s*:/i,
  horario: /^Horário( de Atendimento)?\s*:/i,
  telefone: /^Telefones?\s*:/i,
  site: /^Site\s*:/i,
  entrada: /^Entrada\s*:/i,
};

/**
 * Extrai a ficha de uma página. O valor pode vir na mesma linha do rótulo
 * ("Endereço: Rua X") ou na linha seguinte ("Endereço:" / "Rua X").
 * Usa a ÚLTIMA ocorrência de cada rótulo: a ficha fica no fim do conteúdo.
 */
export function extrairFicha(linhas) {
  const ficha = {};
  for (const [campo, rotulo] of Object.entries(ROTULOS)) {
    for (let i = linhas.length - 1; i >= 0; i -= 1) {
      if (!rotulo.test(linhas[i])) continue;
      let valor = linhas[i].replace(rotulo, '').trim();
      const proxima = linhas[i + 1] ?? '';
      const proximaEhRotulo = Object.values(ROTULOS).some((r) => r.test(proxima));
      if (!valor && proxima && !proximaEhRotulo) valor = proxima;
      // "Rua X, 10 - " termina com hífen solto quando o bairro está vazio.
      valor = valor.replace(/\s*-\s*$/, '').trim();
      if (valor) ficha[campo] = valor;
      break;
    }
  }
  return ficha;
}

/** Itens de lista do conteúdo ("* Vacinas", "- Emissão do Cartão SUS") = serviços oferecidos. */
export function extrairServicos(linhas) {
  return linhas
    .filter((linha) => /^[*\-•]\s*\S/.test(linha))
    .map((linha) =>
      linha
        .replace(/^[*\-•]\s*/, '')
        .replace(/[;,.]\s*$/, '')
        .trim()
    )
    .filter((item) => item.length > 2 && item.length < 140);
}

/**
 * Lê o Mapa do Site e devolve, para cada página das seções de interesse, o
 * texto mais completo dos links que apontam para ela. O mapa costuma ter dois:
 * "UBS X" e "Unidade Básica de Saúde X - Califórnia"; o mais longo é o melhor nome.
 */
export function paginasDoMapa(html) {
  const nomes = new Map();
  for (const [, href, texto] of html.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    let caminho = href.replace(/^https?:\/\/www\.indaiatuba\.sp\.gov\.br/, '');
    if (/^https?:/.test(caminho)) continue;
    caminho = `/${caminho}`.replace(/\/+/g, '/');
    if (!caminho.endsWith('/')) caminho += '/';
    if (!SECOES.some((secao) => secao.test(caminho))) continue;
    const nome = htmlParaLinhas(texto).join(' ').trim();
    const atual = nomes.get(caminho) ?? '';
    nomes.set(caminho, nome.length > atual.length ? nome : atual);
  }
  return nomes;
}

async function main() {
  const mapa = paginasDoMapa(await baixar('/mapa-do-site/'));
  console.log(`Páginas selecionadas no mapa do site: ${mapa.size}`);

  // --so-nomes: só atualiza os nomes do arquivo já coletado (1 requisição).
  if (process.argv.includes('--so-nomes')) {
    const { readFile } = await import('node:fs/promises');
    const dados = JSON.parse(await readFile('scripts/dados/prefeitura-paginas.json', 'utf8'));
    for (const pagina of dados.paginas) {
      pagina.nomeNoMapa = mapa.get(pagina.url.replace(BASE, '')) || null;
    }
    await writeFile('scripts/dados/prefeitura-paginas.json', `${JSON.stringify(dados, null, 2)}\n`);
    console.log('Nomes atualizados.');
    return;
  }
  const caminhos = new Set(mapa.keys());

  const paginas = [];
  for (const caminho of [...caminhos].sort()) {
    await esperar(INTERVALO_MS);
    try {
      const html = await baixar(caminho);
      const titulo = ((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '')
        .split('&raquo;')
        .pop()
        .split('|')[0]
        .trim();
      // O conteúdo termina onde começa o rodapé ("Indaiatuba / A Prefeitura").
      const linhas = htmlParaLinhas(html);
      const fim = linhas.findIndex(
        (l, i) => l === 'Indaiatuba' && linhas[i + 1] === 'A Prefeitura'
      );
      const conteudo = fim > 0 ? linhas.slice(0, fim) : linhas;
      const ficha = extrairFicha(conteudo);
      paginas.push({
        url: BASE + caminho,
        titulo,
        nomeNoMapa: mapa.get(caminho) || null,
        ...ficha,
        servicos: extrairServicos(conteudo),
      });
      process.stdout.write('.');
    } catch (erro) {
      console.warn(`\nFalhou: ${caminho} (${erro.message})`);
    }
  }

  const saida = { coletadoEm: new Date().toISOString().slice(0, 10), fonte: BASE, paginas };
  await writeFile('scripts/dados/prefeitura-paginas.json', `${JSON.stringify(saida, null, 2)}\n`);
  console.log(`\nFichas salvas: ${paginas.length} → scripts/dados/prefeitura-paginas.json`);
}

/**
 * Lê as linhas de uma tabela HTML: [[célula, célula...], ...] (sem o cabeçalho <th>).
 * Exportada para teste.
 */
export function linhasDaTabela(htmlTabela) {
  return [...htmlTabela.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map(([, linha]) =>
      [...linha.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(([, celula]) =>
        htmlParaLinhas(celula).join(' ').replace(/\s+/g, ' ').trim()
      )
    )
    .filter((celulas) => celulas.length > 0);
}

/**
 * Coleta domiciliar: a página oficial traz uma tabela com os locais que
 * mudaram de dia ou turno em 2026 (localidade, programação anterior, nova).
 * Grava scripts/dados/coleta-prefeitura.json (1 requisição).
 */
async function coletarColeta() {
  const caminho = '/urbanismo/coleta-domiciliar-urbana/';
  const html = await baixar(caminho);
  const primeiraTabela = html.slice(html.search(/<table/i), html.search(/<\/table>/i) + 8);
  const locais = linhasDaTabela(primeiraTabela)
    .filter((c) => c.length >= 3 && c[0])
    .map(([localidade, anterior, nova]) => ({ localidade, anterior, nova }));
  const texto = htmlParaLinhas(html).join(' ');
  const vigencia = texto.match(/a partir do dia (\d{1,2} de \w+ de \d{4})/i)?.[1] ?? null;
  await writeFile(
    'scripts/dados/coleta-prefeitura.json',
    `${JSON.stringify(
      {
        coletadoEm: new Date().toISOString().slice(0, 10),
        fonte: BASE + caminho,
        vigencia,
        horariosGerais:
          'Diurno: de segunda a sábado, a partir das 6h. Noturno: de segunda a sexta a partir das 17h e aos sábados a partir das 16h.',
        locais,
      },
      null,
      2
    )}\n`
  );
  console.log(`Coleta: ${locais.length} locais com programação nova → scripts/dados/coleta-prefeitura.json`);
}

// Só roda a coleta quando o arquivo é executado direto (não quando é importado nos testes).
// --coleta: só a tabela da coleta de lixo (1 requisição).
if (process.argv[1]?.endsWith('coletar-prefeitura.mjs')) {
  if (process.argv.includes('--coleta')) await coletarColeta();
  else await main();
}
