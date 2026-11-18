/**
 * gerar-sql.mjs — Gera database/02-carga-dados.sql a partir de public/api/*.json (npm run sql).
 *
 * O site continua lendo os arquivos JSON. Este script leva exatamente os mesmos
 * dados para o banco relacional definido em database/01-criacao.sql, para que o
 * modelo do PI 2 (Banco de Dados Relacional) use os dados reais do projeto, e não
 * exemplos inventados.
 *
 * Rode sempre depois de `npm run dados`, para que o SQL acompanhe o JSON.
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { categorias } from '../src/data/servicos.js';

const RAIZ = path.resolve(import.meta.dirname, '..');
const API = path.join(RAIZ, 'public', 'api');
const SAIDA = path.join(RAIZ, 'database', '02-carga-dados.sql');

const lerJson = async (nome) => JSON.parse(await readFile(path.join(API, nome), 'utf8'));

/** Converte um valor JavaScript em literal SQL (texto entre aspas, com escape). */
function sql(valor) {
  if (valor === null || valor === undefined || valor === '') return 'NULL';
  if (typeof valor === 'boolean') return valor ? 'TRUE' : 'FALSE';
  if (typeof valor === 'number') return String(valor);
  return `'${String(valor).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

/** Monta um INSERT com várias linhas (mais rápido e mais legível no phpMyAdmin). */
function inserir(tabela, colunas, linhas) {
  if (linhas.length === 0) return `-- ${tabela}: nenhum registro\n`;
  const valores = linhas.map((linha) => `  (${linha.map(sql).join(', ')})`).join(',\n');
  return `INSERT INTO ${tabela} (${colunas.join(', ')}) VALUES\n${valores};\n`;
}

/** "Jardim América" e "jardim america" devem achar o mesmo bairro. */
const chave = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const [locais, bairros, contatos, servicosOnline, checklist, feriados, comercio] =
  await Promise.all(
    [
      'locais.json',
      'bairros.json',
      'contatos.json',
      'servicos-online.json',
      'checklist.json',
      'feriados.json',
      'comercio.json',
    ].map(lerJson)
  );

const partes = [
  `-- =============================================================================
-- Conecta Cidadão — Carga dos dados reais do site (DML)
-- GERADO por scripts/gerar-sql.mjs (npm run sql) a partir de public/api/*.json.
-- Não edite à mão: corrija o dado na curadoria, rode npm run dados e npm run sql.
-- Dados de ${locais.atualizadoEm}. Execute depois de 01-criacao.sql.
-- =============================================================================

USE conecta_cidadao;
SET NAMES utf8mb4;
START TRANSACTION;
`,
];

// --- Categorias e tipos -------------------------------------------------------
partes.push(
  inserir(
    'categoria',
    ['slug', 'nome', 'rota', 'resumo'],
    categorias.map((c) => [c.slug, c.nome, c.rota, c.resumo])
  )
);

const tipos = [];
const idDoTipo = new Map();
for (const local of locais.locais) {
  const k = `${local.tipo}|${local.categoria}`;
  if (!idDoTipo.has(k)) {
    idDoTipo.set(k, tipos.length + 1);
    tipos.push([tipos.length + 1, local.tipo, local.categoria]);
  }
}
partes.push(inserir('tipo_local', ['id', 'nome', 'categoria_slug'], tipos));

// --- Bairros e coleta de lixo -------------------------------------------------
const idDoBairro = new Map();
const linhasBairro = bairros.bairros.map((b, i) => {
  idDoBairro.set(chave(b.nome), i + 1);
  return [i + 1, b.slug, b.nome, b.coordenadas?.lat ?? null, b.coordenadas?.lng ?? null];
});
partes.push(inserir('bairro', ['id', 'slug', 'nome', 'latitude', 'longitude'], linhasBairro));
partes.push(
  inserir(
    'coleta_lixo',
    ['bairro_id', 'localidade', 'programacao', 'vigencia', 'fonte_url'],
    bairros.bairros.flatMap((b, i) =>
      (Array.isArray(b.coleta) ? b.coleta : b.coleta ? [b.coleta] : []).map((c) => [
        i + 1,
        c.localidade,
        c.programacao,
        c.vigencia,
        c.fonte,
      ])
    )
  )
);

// --- Locais e tabelas dependentes ---------------------------------------------
const linhasLocal = [];
const telefones = [];
const horarios = [];
const servicos = [];
const niveis = [];
const palavras = [];
const fontes = [];

for (const l of locais.locais) {
  const e = l.endereco ?? {};
  const h = l.horarios ?? {};
  linhasLocal.push([
    l.id,
    l.nome,
    idDoTipo.get(`${l.tipo}|${l.categoria}`),
    e.logradouro,
    e.numero,
    e.bairro,
    e.bairro ? (idDoBairro.get(chave(e.bairro)) ?? null) : null,
    e.cep,
    l.enderecoTexto,
    l.coordenadas?.lat ?? null,
    l.coordenadas?.lng ?? null,
    Boolean(l.coordenadas?.aproximada),
    l.coordenadas?.fonte ?? null,
    l.horarioTexto,
    Boolean(h.vinteQuatroHoras),
    h.feriados ?? null,
    l.site,
    l.entrada,
    l.imagem,
    l.observacao,
    l.cnes ?? null,
    l.acessibilidade?.rampa ?? null,
    l.acessibilidade?.banheiroAdaptado ?? null,
    l.atualizadoEm,
  ]);
  [...new Set(l.telefones ?? [])].forEach((numero, i) => telefones.push([l.id, numero, i]));
  const vistos = new Set();
  for (const faixa of h.faixas ?? []) {
    for (const dia of faixa.dias) {
      const k = `${dia}|${faixa.abre}|${faixa.fecha}`;
      if (vistos.has(k)) continue;
      vistos.add(k);
      horarios.push([l.id, dia, faixa.abre, faixa.fecha]);
    }
  }
  (l.servicos ?? []).forEach((s, i) => servicos.push([l.id, s, i]));
  for (const n of new Set(l.niveis ?? [])) niveis.push([l.id, n]);
  for (const p of new Set((l.palavrasChave ?? []).map((x) => x.toLowerCase())))
    palavras.push([l.id, p]);
  (l.fonte ?? []).forEach((url, i) => fontes.push([l.id, url, i]));
}

partes.push(
  inserir(
    'local',
    [
      'id',
      'nome',
      'tipo_local_id',
      'logradouro',
      'numero',
      'bairro_nome',
      'bairro_id',
      'cep',
      'endereco_completo',
      'latitude',
      'longitude',
      'coordenada_aproximada',
      'coordenada_fonte',
      'horario_texto',
      'vinte_quatro_horas',
      'abre_feriados',
      'site',
      'entrada',
      'imagem',
      'observacao',
      'cnes',
      'tem_rampa',
      'tem_banheiro_adaptado',
      'atualizado_em',
    ],
    linhasLocal
  )
);
partes.push(inserir('telefone_local', ['local_id', 'numero', 'ordem'], telefones));
partes.push(
  inserir('horario_funcionamento', ['local_id', 'dia_semana', 'abre', 'fecha'], horarios)
);
partes.push(inserir('servico_local', ['local_id', 'descricao', 'ordem'], servicos));
partes.push(inserir('nivel_ensino_local', ['local_id', 'nivel'], niveis));
partes.push(inserir('palavra_chave_local', ['local_id', 'palavra'], palavras));
partes.push(inserir('fonte_local', ['local_id', 'url', 'ordem'], fontes));

// --- Conteúdo de apoio --------------------------------------------------------
partes.push(
  inserir(
    'contato',
    ['id', 'nome', 'telefone', 'descricao', 'grupo', 'emergencia', 'fonte_url'],
    contatos.contatos.map((c) => [
      c.id,
      c.nome,
      c.telefone,
      c.descricao,
      c.categoria,
      Boolean(c.emergencia),
      c.fonte,
    ])
  )
);
partes.push(
  inserir(
    'categoria_servico_online',
    ['slug', 'nome'],
    servicosOnline.categorias.map((c) => [c.slug, c.nome])
  )
);
partes.push(
  inserir(
    'servico_online',
    ['id', 'nome', 'descricao', 'categoria_slug', 'url'],
    servicosOnline.servicos.map((s) => [s.id, s.nome, s.descricao, s.categoria, s.url])
  )
);
partes.push(
  inserir(
    'checklist_grupo',
    ['id', 'nome', 'ordem'],
    checklist.grupos.map((g, i) => [g.id, g.nome, i + 1])
  )
);
partes.push(
  inserir(
    'checklist_item',
    [
      'id',
      'grupo_id',
      'titulo',
      'o_que_e',
      'por_que',
      'como_fazer',
      'online',
      'documentos',
      'prazo',
      'perfil',
      'pagina_rota',
      'ordem',
    ],
    checklist.itens.map((it, i) => [
      it.id,
      it.grupo,
      it.titulo,
      it.oQueE,
      it.porQue,
      it.comoFazer,
      Boolean(it.online),
      Array.isArray(it.documentos) ? it.documentos.join('; ') : it.documentos,
      it.prazo,
      it.perfil,
      it.pagina?.rota ?? null,
      i + 1,
    ])
  )
);
partes.push(
  inserir(
    'checklist_link',
    ['item_id', 'nome', 'url'],
    checklist.itens.flatMap((it) => (it.links ?? []).map((lk) => [it.id, lk.nome, lk.url]))
  )
);
partes.push(
  inserir(
    'feriado',
    ['data', 'nome', 'tipo', 'fonte_url'],
    feriados.feriados.map((f) => [f.data, f.nome, f.tipo, f.fonte])
  )
);
partes.push(
  inserir(
    'grupo_comercio',
    ['id', 'nome'],
    comercio.grupos.map((g) => [g.id, g.nome])
  )
);
partes.push(
  inserir(
    'estabelecimento',
    [
      'id',
      'nome',
      'tipo',
      'grupo_id',
      'logradouro',
      'numero',
      'bairro_nome',
      'latitude',
      'longitude',
      'telefone',
      'horario_texto',
      'site',
      'observacao',
      'osm_ref',
      'atualizado_em',
    ],
    comercio.itens.map((c) => [
      c.id,
      c.nome,
      c.tipo,
      c.grupo,
      c.endereco?.logradouro,
      c.endereco?.numero,
      c.endereco?.bairro,
      c.coordenadas?.lat ?? null,
      c.coordenadas?.lng ?? null,
      (c.telefones ?? [])[0] ?? null,
      c.horarioTexto,
      c.site,
      c.observacao,
      c.osm,
      c.atualizadoEm,
    ])
  )
);

partes.push('COMMIT;\n');
await writeFile(SAIDA, partes.join('\n'), 'utf8');

console.log(
  `database/02-carga-dados.sql: ${locais.locais.length} locais, ${tipos.length} tipos, ` +
    `${linhasBairro.length} bairros, ${telefones.length} telefones, ${horarios.length} horários, ` +
    `${comercio.itens.length} estabelecimentos, ${contatos.contatos.length} contatos.`
);
