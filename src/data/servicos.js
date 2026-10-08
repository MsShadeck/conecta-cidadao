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
 *   icone  → imagem da pasta public/ (caminho começa em "/" = raiz do site)
 *   resumo → frase curta mostrada no card da Home
 */

import { normalizar } from '../utils/texto.js';

export const categorias = [
  {
    slug: 'saude',
    nome: 'Saúde',
    rota: '/saude',
    icone: '/img/interface/cuidados-de-saude.png',
    resumo: 'UBS, UPA 24h, hospitais, CAPS e farmácias municipais.',
  },
  {
    slug: 'educacao',
    nome: 'Educação',
    rota: '/educacao',
    icone: '/img/interface/universidade.png',
    resumo: 'Escolas municipais (EMEBs) e creches, com endereço e telefone.',
  },
  {
    slug: 'seguranca',
    nome: 'Segurança',
    rota: '/seguranca',
    icone: '/img/interface/social-security.png',
    resumo: 'Guarda Civil, Defesa Civil, Bombeiros e telefones de emergência.',
  },
  {
    slug: 'lazer',
    nome: 'Lazer e cultura',
    rota: '/lazer',
    icone: '/img/interface/bicicleta.png',
    resumo: 'Parques, museus, centros culturais e espaços de esporte.',
  },
  {
    slug: 'cidadania',
    nome: 'Cidadania',
    rota: '/cidadania',
    icone: '/img/interface/cidadania.svg',
    resumo: 'Prefeitura, Ponto Cidadão, Poupatempo, CRAS e Conselho Tutelar.',
  },
  {
    slug: 'mobilidade',
    nome: 'Ônibus e bike',
    rota: '/mobilidade',
    icone: '/img/interface/onibus.svg',
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
