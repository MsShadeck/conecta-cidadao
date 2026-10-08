/**
 * cep.js — Transforma um CEP de Indaiatuba em um ponto no mapa.
 *
 * Ordem das tentativas (todas sem chave de API):
 *  1. BrasilAPI CEP v2 (ou ViaCEP, se a BrasilAPI falhar): rua e bairro do CEP;
 *  2. Nominatim/OpenStreetMap: rua → coordenadas, só dentro de Indaiatuba.
 * A BrasilAPI às vezes traz latitude e longitude, mas para Indaiatuba ela devolve
 * o mesmo ponto (o centro da cidade) para qualquer CEP — por isso esse ponto é
 * ignorado. O ponto encontrado pela rua é aproximado (meio da rua), e a interface avisa.
 */

/** "13334-100" ou "13334100" → "13334100"; null se não tiver 8 dígitos. */
export function limparCep(texto) {
  const digitos = String(texto ?? '').replace(/\D/g, '');
  return digitos.length === 8 ? digitos : null;
}

const ehIndaiatuba = (cidade) =>
  (cidade ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() === 'indaiatuba';

// Ponto genérico que a BrasilAPI devolve para todos os CEPs da cidade (conferido em 10/2026).
const CENTRO_GENERICO = { lat: -23.08842, lng: -47.2119 };

/** A coordenada é a genérica do município (e não a da rua)? */
export function ehCoordenadaGenerica(lat, lng) {
  return (
    Math.abs(lat - CENTRO_GENERICO.lat) < 0.0005 && Math.abs(lng - CENTRO_GENERICO.lng) < 0.0005
  );
}

// Retângulo de Indaiatuba (malha do IBGE), usado para limitar a busca de endereço.
const CAIXA_INDAIATUBA = '-47.3056,-22.9979,-47.0836,-23.226';

async function json(url, signal) {
  const resposta = await fetch(url, { signal });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}

/** Uma consulta ao Nominatim, só dentro de Indaiatuba. Devolve o 1º resultado ou null. */
async function nominatim(texto, signal) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&countrycodes=br&bounded=1' +
    `&viewbox=${CAIXA_INDAIATUBA}&q=${encodeURIComponent(`${texto}, Indaiatuba, SP`)}`;
  const [lugar] = await json(url, signal).catch((erro) => {
    if (erro.name === 'AbortError') throw erro;
    return [];
  });
  return lugar ?? null;
}

/** Rua, bairro e cidade do CEP: BrasilAPI e, se ela falhar, ViaCEP. */
async function enderecoDoCep(cep, signal) {
  try {
    const d = await json(`https://brasilapi.com.br/api/cep/v2/${cep}`, signal);
    const { latitude, longitude } = d.location?.coordinates ?? {};
    return {
      rua: d.street,
      bairro: d.neighborhood,
      cidade: d.city,
      lat: Number(latitude),
      lng: Number(longitude),
    };
  } catch (erro) {
    if (erro.name === 'AbortError') throw erro;
  }
  const via = await json(`https://viacep.com.br/ws/${cep}/json/`, signal).catch((erro) => {
    if (erro.name === 'AbortError') throw erro;
    return null;
  });
  if (!via || via.erro) throw new Error('CEP não encontrado. Confira os números.');
  return { rua: via.logradouro, bairro: via.bairro, cidade: via.localidade };
}

/**
 * @returns {Promise<{lat:number, lng:number, rotulo:string, bairro:string|null, aproximada:boolean}|{lat:null, lng:null, rotulo:string, bairro:string}>}
 *   Se nem a rua for achada no mapa, devolve lat/lng null e o bairro: quem chamou
 *   pode usar o ponto do bairro (Meu bairro faz isso).
 * @throws Error com mensagem pronta para mostrar ao usuário.
 */
export async function localizarCep(texto, signal) {
  const cep = limparCep(texto);
  if (!cep) throw new Error('Digite um CEP com 8 números, por exemplo 13334-100.');

  const endereco = await enderecoDoCep(cep, signal);
  if (!ehIndaiatuba(endereco.cidade))
    throw new Error(`Esse CEP é de ${endereco.cidade}. O site cobre só Indaiatuba.`);
  const rotulo = [endereco.rua, endereco.bairro].filter(Boolean).join(', ') || `CEP ${cep}`;
  const bairro = endereco.bairro || null;

  // 1. A coordenada da BrasilAPI só vale se não for a genérica da cidade.
  if (endereco.lat && endereco.lng && !ehCoordenadaGenerica(endereco.lat, endereco.lng)) {
    return { lat: endereco.lat, lng: endereco.lng, rotulo, bairro, aproximada: true };
  }

  // 2. Rua + bairro no Nominatim; se não achar, só a rua (1 consulta por vez).
  const tentativas = [[endereco.rua, endereco.bairro], [endereco.rua]]
    .map((partes) => partes.filter(Boolean).join(', '))
    .filter((t, i, lista) => t && lista.indexOf(t) === i);
  for (const busca of tentativas) {
    const lugar = await nominatim(busca, signal);
    if (lugar)
      return { lat: Number(lugar.lat), lng: Number(lugar.lon), rotulo, bairro, aproximada: true };
  }

  if (bairro) return { lat: null, lng: null, rotulo, bairro, aproximada: true };
  throw new Error('Não achamos esse CEP no mapa. Tente o nome do bairro ou a sua localização.');
}

/**
 * Endereço digitado ("Rua X, 100") → ponto no mapa, pelo Nominatim (OpenStreetMap).
 * Uma consulta por pedido da pessoa, limitada à área de Indaiatuba.
 */
export async function localizarEndereco(texto, signal) {
  const busca = String(texto ?? '').trim();
  if (busca.length < 4)
    throw new Error('Digite a rua e o número, por exemplo: Rua Onze de Junho, 1000.');
  const lugar = await nominatim(busca, signal);
  if (!lugar)
    throw new Error('Não achamos esse endereço em Indaiatuba. Confira o nome da rua ou use o CEP.');
  return {
    lat: Number(lugar.lat),
    lng: Number(lugar.lon),
    rotulo: busca,
    bairro: lugar.address?.suburb ?? lugar.address?.neighbourhood ?? null,
    aproximada: !lugar.address?.house_number,
  };
}
