/**
 * busca.js — Busca global do site (overlay Ctrl+K).
 *
 * Procura o termo em tudo o que o site sabe: locais (nome, tipo, bairro,
 * endereço, serviços e palavras-chave), bairros, telefones úteis e serviços
 * online. "vacina" acha as UBS, "matrícula" acha as escolas, "ônibus" acha a
 * página de Mobilidade e os terminais.
 *
 * Todas as funções são puras (recebem os dados por parâmetro) para poderem ser
 * testadas no Vitest sem navegador.
 */

import { normalizar } from './texto.js';
import { categorias } from '../data/servicos.js';

const LIMITE_LOCAIS = 20;

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
export function buscarTudo(termo, { locais = [], contatos = [], servicos = [] } = {}) {
  const palavras = normalizar(termo).split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return [];
  const grupos = [];

  // Categorias (ex.: "saude", "onibus").
  const cats = categorias.filter((c) => contemTodas(normalizar(`${c.nome} ${c.resumo}`), palavras));
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
        icone: c.icone,
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

  // Bairros: leva ao mapa já filtrado.
  const bairros = new Map();
  for (const local of locais) {
    const bairro = local.endereco?.bairro;
    if (bairro && contemTodas(normalizar(bairro), palavras)) {
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
