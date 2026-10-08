/**
 * servicos.js — Categorias do Conecta Cidadão e dados fixos do site.
 *
 * Na v1, este arquivo guardava também os 24 locais (só nome e foto). Na v2 os
 * locais vêm de fontes reais e ficam em public/api/locais.json, gerado por
 * `npm run dados` (ver scripts/atualizar-dados.mjs). As páginas leem esse
 * arquivo com fetch, pelo hook useDados.
 *
 * Aqui ficam só as informações que não mudam: o nome, a cor (via data-categoria
 * no CSS), o ícone e o texto de cada categoria.
 *
 * Estrutura de uma categoria:
 *   slug   → identificador sem acento, usado na URL e no atributo data-categoria (cores do CSS)
 *   nome   → texto exibido ao usuário
 *   rota   → caminho registrado no App.jsx
 *   (ícone) → desenhado em SVG pelo componente IconeCategoria, a partir do slug
 *   resumo → frase curta mostrada no card da Home
 */

import { normalizar } from '../utils/texto.js';

export const categorias = [
  {
    slug: 'saude',
    nome: 'Saúde',
    rota: '/saude',
    resumo: 'UBS, UPA 24h, hospitais, CAPS e farmácias municipais.',
  },
  {
    slug: 'educacao',
    nome: 'Educação',
    rota: '/educacao',
    resumo: 'Escolas municipais (EMEBs), creches, faculdades e escolas técnicas.',
  },
  {
    slug: 'seguranca',
    nome: 'Segurança',
    rota: '/seguranca',
    resumo: 'Guarda Civil, Defesa Civil, Bombeiros e telefones de emergência.',
  },
  {
    slug: 'lazer',
    nome: 'Lazer e cultura',
    rota: '/lazer',
    resumo: 'Parques, museus, cultura, esporte e shoppings.',
  },
  {
    slug: 'cidadania',
    nome: 'Cidadania',
    rota: '/cidadania',
    resumo: 'Prefeitura, Ponto Cidadão, Poupatempo, CRAS e Conselho Tutelar.',
  },
  {
    slug: 'mobilidade',
    nome: 'Ônibus e bike',
    rota: '/mobilidade',
    resumo: 'Terminais, cartão SOU, previsão oficial dos ônibus, Ecobike e ciclovias.',
  },
];

/**
 * Procura uma categoria pelo slug.
 * @param {string} slug - ex.: 'saude'
 * @returns {object|undefined} a categoria ou undefined se o slug não existir.
 */
export function buscarCategoria(slug) {
  return categorias.find((categoria) => categoria.slug === slug);
}

/**
 * normalizar() mora em src/utils/texto.js; é reexportada aqui para continuar
 * disponível no mesmo lugar de antes (import { normalizar } from './servicos.js').
 */
export { normalizar };

/** Integrantes do grupo, exibidos na página Sobre (iniciais usadas no avatar). */
export const equipe = [
  { iniciais: 'MS', nome: 'Moisés Globekener de Almeida Shadeck' },
  { iniciais: 'HB', nome: 'Homer Betinatti Gomes' },
];
