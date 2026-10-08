/**
 * busca.js — Busca global do site (overlay Ctrl+K).
 *
 * Procura o termo em tudo o que o site sabe: páginas, itens do checklist
 * "Primeiros passos", locais (nome, tipo, bairro, endereço, serviços e
 * palavras-chave), bairros, comércio do dia a dia, telefones úteis e serviços
 * online. "vacina" acha as UBS, "matrícula" acha as escolas, "ônibus" acha a
 * página de Mobilidade e os terminais.
 *
 * Todas as funções são puras (recebem os dados por parâmetro) para poderem ser
 * testadas no Vitest sem navegador.
 */

import { normalizar } from './texto.js';
import { categorias } from '../data/servicos.js';

const LIMITE_LOCAIS = 20;
const LIMITE_COMERCIO = 8;

// Páginas da v3 que não são categorias de locais (aparecem junto com as categorias).
export const PAGINAS = [
  { slug: 'passos', nome: 'Primeiros passos', resumo: 'O que resolver ao se mudar: cartão SUS, escola, água, luz, título de eleitor', rota: '/primeiros-passos' },
  { slug: 'bairro', nome: 'Meu bairro', resumo: 'O que tem perto de casa pelo CEP ou bairro: UBS, escola, mercado, ônibus', rota: '/meu-bairro' },
  { slug: 'dia-a-dia', nome: 'Dia a dia', resumo: 'Mercados, padarias, farmácias, restaurantes, feiras, bancos e postos', rota: '/dia-a-dia' },
  { slug: 'conheca', nome: 'Conheça Indaiatuba', resumo: 'A cidade em números, bairros no mapa e diferenças para quem vem de São Paulo', rota: '/conheca' },
  { slug: 'servicos', nome: 'Serviços públicos', resumo: 'Saúde, educação, segurança e assistência social', rota: '/servicos' },
];

/** Todas as palavras do termo precisam aparecer no texto (busca "E"). */
function contemTodas(texto, palavras) {
  return palavras.every((palavra) => texto.includes(palavra));
}

/**
 * Pontua um local: quanto maior, mais para cima ele aparece.
 * Nome vale mais que tipo/palavra-chave, que vale mais que bairro/endereço/serviços.
 */
export function pontuarLocal(local, palavras) {
  const nome = normalizar(local.nome);
  const tipo = normalizar(`${local.tipo ?? ''} ${(local.palavrasChave ?? []).join(' ')}`);
  const resto = normalizar(
    [
      local.endereco?.bairro,
      local.enderecoTexto,
      ...(local.servicos ?? []),
      ...(local.niveis ?? []),
      categorias.find((c) => c.slug === local.categoria)?.nome,
    ].join(' ')
  );
  if (!contemTodas(`${nome} ${tipo} ${resto}`, palavras)) return 0;
  let pontos = 1;
  if (contemTodas(nome, palavras)) pontos += 6;
  if (contemTodas(tipo, palavras)) pontos += 3;
  if (nome.startsWith(palavras[0])) pontos += 1;
  return pontos;
}

/**
 * Executa a busca e devolve os resultados em grupos, já no formato que o
 * overlay desenha: { titulo, itens: [{ tipo, chave, nome, detalhe, rota|href, ... }] }.
 */
export function buscarTudo(
  termo,
  { locais = [], contatos = [], servicos = [], checklist = [], bairros: listaBairros = [], comercio = [] } = {}
) {
  const palavras = normalizar(termo).split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return [];
  const grupos = [];

  // Categorias (ex.: "saude", "onibus").
  const cats = [...categorias, ...PAGINAS].filter((c) => contemTodas(normalizar(`${c.nome} ${c.resumo}`), palavras));
  if (cats.length) {
    grupos.push({
      titulo: 'Categorias',
      itens: cats.map((c) => ({
        tipo: 'categoria',
        chave: `cat-${c.slug}`,
        nome: c.nome,
        detalhe: c.resumo,
        rota: c.rota,
        categoriaSlug: c.slug,
      })),
    });
  }

  // Primeiros passos: itens do checklist da mudança (título, explicação e palavras-chave).
  const passos = checklist.filter((item) =>
    contemTodas(normalizar(`${item.titulo} ${item.oQueE} ${(item.palavrasChave ?? []).join(' ')}`), palavras)
  );
  if (passos.length) {
    grupos.push({
      titulo: 'Primeiros passos',
      itens: passos.slice(0, 6).map((item) => ({
        tipo: 'passo',
        chave: `passo-${item.id}`,
        nome: item.titulo,
        detalhe: item.oQueE,
        rota: `/primeiros-passos#passo-${item.id}`,
        iconeSlug: 'passos',
        categoriaSlug: 'passos',
      })),
    });
  }

  // Locais, do mais relevante para o menos.
  const achados = locais
    .map((local) => ({ local, pontos: pontuarLocal(local, palavras) }))
    .filter((r) => r.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos || a.local.nome.localeCompare(b.local.nome, 'pt-BR'))
    .slice(0, LIMITE_LOCAIS);
  if (achados.length) {
    grupos.push({
      titulo: 'Locais',
      itens: achados.map(({ local }) => ({
        tipo: 'local',
        chave: `local-${local.id}`,
        nome: local.nome,
        detalhe: [local.tipo, local.endereco?.bairro].filter(Boolean).join(' · '),
        rota: `/${local.categoria}/${local.id}`,
        categoriaSlug: local.categoria,
        imagem: local.imagem,
      })),
    });
  }

  // Bairros da lista do OpenStreetMap (v3): leva à página do bairro em "Meu bairro".
  const bairrosAchados = listaBairros.filter((b) => contemTodas(normalizar(b.nome), palavras));
  if (bairrosAchados.length) {
    grupos.push({
      titulo: 'Bairros',
      itens: bairrosAchados.slice(0, 5).map((b) => ({
        tipo: 'bairro',
        chave: `bairro-${b.slug}`,
        nome: b.nome,
        detalhe: 'O que tem perto: UBS, escola, mercado, ônibus',
        rota: `/bairros/${b.slug}`,
        iconeSlug: 'bairro',
        categoriaSlug: 'bairro',
      })),
    });
  }

  // Bairros pelo endereço dos locais (v2): leva ao mapa já filtrado.
  // Só quando a lista de bairros não foi passada (ou não achou nada).
  const bairros = new Map();
  for (const local of locais) {
    const bairro = local.endereco?.bairro;
    if (!bairrosAchados.length && bairro && contemTodas(normalizar(bairro), palavras)) {
      bairros.set(bairro, (bairros.get(bairro) ?? 0) + 1);
    }
  }
  if (bairros.size) {
    grupos.push({
      titulo: 'Bairros',
      itens: [...bairros]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([bairro, total]) => ({
          tipo: 'bairro',
          chave: `bairro-${bairro}`,
          nome: bairro,
          detalhe: `${total} ${total === 1 ? 'local' : 'locais'} no mapa`,
          rota: `/mapa?bairro=${encodeURIComponent(bairro)}`,
        })),
    });
  }

  // Comércio do dia a dia (OpenStreetMap): leva à página Dia a dia já filtrada.
  const lojas = comercio.filter((c) =>
    contemTodas(normalizar(`${c.nome} ${c.tipo} ${c.enderecoTexto ?? ''}`), palavras)
  );
  if (lojas.length) {
    grupos.push({
      titulo: 'Dia a dia',
      itens: lojas
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .slice(0, LIMITE_COMERCIO)
        .map((c) => ({
          tipo: 'comercio',
          chave: `comercio-${c.id}`,
          nome: c.nome,
          detalhe: [c.tipo, c.enderecoTexto].filter(Boolean).join(' · '),
          rota: `/dia-a-dia?q=${encodeURIComponent(c.nome)}`,
          iconeSlug: 'dia-a-dia',
          categoriaSlug: 'dia-a-dia',
        })),
    });
  }

  // Telefones úteis (busca também pelo número).
  const digitos = termo.replace(/\D/g, '');
  const fones = contatos.filter(
    (c) =>
      contemTodas(normalizar(`${c.nome} ${c.descricao}`), palavras) ||
      (digitos.length >= 3 && c.telefone.replace(/\D/g, '').includes(digitos))
  );
  if (fones.length) {
    grupos.push({
      titulo: 'Telefones',
      itens: fones.slice(0, 6).map((c) => ({
        tipo: 'contato',
        chave: `fone-${c.id}`,
        nome: `${c.nome} — ${c.telefone}`,
        detalhe: c.descricao,
        href: `tel:${c.telefone.replace(/[^\d+]/g, '')}`,
        categoriaSlug: c.categoria,
      })),
    });
  }

  // Serviços online oficiais.
  const online = servicos.filter((s) =>
    contemTodas(
      normalizar(`${s.nome} ${s.descricao} ${(s.palavrasChave ?? []).join(' ')}`),
      palavras
    )
  );
  if (online.length) {
    grupos.push({
      titulo: 'Serviços online',
      itens: online.slice(0, 6).map((s) => ({
        tipo: 'servico',
        chave: `online-${s.id}`,
        nome: s.nome,
        detalhe: s.descricao,
        href: s.url,
      })),
    });
  }

  return grupos;
}
