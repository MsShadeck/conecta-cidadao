/**
 * proximidade.js — O que fica mais perto de um ponto (Meu bairro e Home).
 *
 * Junta os serviços públicos (/api/locais.json) e o comércio do dia a dia
 * (/api/comercio.json) em "necessidades" (UBS, escola, mercado, farmácia...)
 * e devolve os mais próximos de cada uma, com a distância em linha reta.
 */

import { distanciaMetros, ordenarPorDistancia } from './geo.js';
import { normalizar } from './texto.js';

/** O que a pessoa costuma procurar perto de casa, em blocos. */
export const NECESSIDADES = [
  { id: 'ubs', bloco: 'publicos', titulo: 'Posto de saúde (UBS)', categoria: 'saude', filtro: (l) => l.tipo === 'UBS' },
  {
    id: 'urgencia',
    bloco: 'publicos',
    titulo: 'Urgência (UPA e pronto-socorro)',
    categoria: 'saude',
    filtro: (l) => ['Pronto atendimento 24h', 'Hospital'].includes(l.tipo),
  },
  { id: 'escola', bloco: 'publicos', titulo: 'Escola municipal (EMEB)', categoria: 'educacao', filtro: (l) => l.tipo === 'EMEB' },
  { id: 'creche', bloco: 'publicos', titulo: 'Creche', categoria: 'educacao', filtro: (l) => l.tipo === 'Creche' },
  { id: 'seguranca', bloco: 'publicos', titulo: 'Segurança', categoria: 'seguranca', filtro: (l) => l.categoria === 'seguranca' },
  { id: 'cras', bloco: 'publicos', titulo: 'Assistência social (CRAS)', categoria: 'cidadania', filtro: (l) => l.tipo === 'CRAS' },
  { id: 'terminal', bloco: 'onibus', titulo: 'Terminal de ônibus', categoria: 'mobilidade', filtro: (l) => l.tipo === 'Terminal de ônibus' },
  { id: 'mercado', bloco: 'dia', titulo: 'Mercado', categoria: 'dia-a-dia', comercio: true, filtro: (c) => c.grupo === 'mercados' },
  { id: 'padaria', bloco: 'dia', titulo: 'Padaria', categoria: 'dia-a-dia', comercio: true, filtro: (c) => c.grupo === 'padarias' },
  { id: 'farmacia', bloco: 'dia', titulo: 'Farmácia', categoria: 'dia-a-dia', comercio: true, filtro: (c) => c.grupo === 'farmacias' },
  { id: 'restaurante', bloco: 'dia', titulo: 'Restaurante ou lanche', categoria: 'dia-a-dia', comercio: true, filtro: (c) => c.grupo === 'restaurantes' },
  { id: 'feira', bloco: 'dia', titulo: 'Feira', categoria: 'dia-a-dia', comercio: true, filtro: (c) => c.grupo === 'feiras' },
  { id: 'parque', bloco: 'lazer', titulo: 'Parque', categoria: 'lazer', filtro: (l) => l.tipo === 'Parque' },
];

/**
 * Para cada necessidade, os N mais próximos do ponto.
 * @returns {Array<{...necessidade, itens: Array}>} (necessidades sem nenhum item ficam de fora)
 */
export function maisProximos({ locais = [], comercio = [] }, ponto, quantidade = 2) {
  return NECESSIDADES.map((n) => ({
    ...n,
    itens: ordenarPorDistancia((n.comercio ? comercio : locais).filter(n.filtro), ponto).slice(0, quantidade),
  })).filter((n) => n.itens.length > 0);
}

/**
 * Qual bairro (da lista do OpenStreetMap) corresponde ao ponto?
 * 1º pelo nome que veio do CEP ("Cidade Nova"); 2º pelo ponto de bairro mais perto.
 * @returns {{bairro: object, porNome: boolean}|null}
 */
export function bairroDoPonto(bairros, ponto, nomeDoCep = null) {
  if (!bairros?.length) return null;
  if (nomeDoCep) {
    const alvo = normalizar(nomeDoCep);
    const igual = bairros.find((b) => normalizar(b.nome) === alvo);
    if (igual) return { bairro: igual, porNome: true };
  }
  const [maisPerto] = [...bairros].sort(
    (a, b) => distanciaMetros(ponto, a.coordenadas) - distanciaMetros(ponto, b.coordenadas)
  );
  return { bairro: maisPerto, porNome: false };
}

/** Procura um bairro pelo nome digitado (sem acento; aceita só o começo). */
export function procurarBairro(bairros, texto) {
  const alvo = normalizar(texto);
  if (!alvo) return null;
  return (
    bairros.find((b) => normalizar(b.nome) === alvo) ??
    bairros.find((b) => normalizar(b.nome).includes(alvo)) ??
    null
  );
}
