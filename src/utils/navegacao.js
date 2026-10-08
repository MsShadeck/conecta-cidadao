/**
 * navegacao.js — Links para abrir a rota no Waze ou no Google Maps.
 *
 * O site não traça rotas: quem leva a pessoa até o lugar é o app de mapas que
 * ela já usa. Os links são "universais" (https://): no celular abrem o app
 * instalado; no computador, ou sem o app, abrem o site. Nenhum precisa de chave.
 *
 * Documentação:
 *  - Waze deep links: https://developers.google.com/waze/deeplinks
 *  - Google Maps URLs: https://developers.google.com/maps/documentation/urls/get-started
 */

const CIDADE = 'Indaiatuba - SP';

/** Modos de transporte aceitos pelo Google Maps (travelmode). */
export const MODOS_GOOGLE = {
  walking: 'A pé',
  transit: 'De ônibus',
  bicycling: 'De bicicleta',
  driving: 'De carro',
};

/** Endereço em texto para busca, sempre com a cidade (evita cair em outra Rua X). */
function enderecoParaBusca(local) {
  const texto = local?.enderecoTexto ?? null;
  if (!texto) return null;
  return /indaiatuba/i.test(texto) ? texto : `${texto}, ${CIDADE}`;
}

/** O local tem algum dado que permita navegar (coordenada ou endereço)? */
export function podeNavegar(local) {
  return Boolean(local?.coordenadas || enderecoParaBusca(local));
}

/**
 * Link do Waze (só carro/moto: o Waze não faz rota a pé nem de ônibus).
 * Com coordenada: ll=lat,lng. Sem coordenada: busca pelo endereço (q=).
 * @returns {string|null} null quando não há coordenada nem endereço.
 */
export function linkWaze(local) {
  const base = 'https://waze.com/ul?';
  if (local?.coordenadas) {
    const { lat, lng } = local.coordenadas;
    return `${base}ll=${lat},${lng}&navigate=yes&utm_source=conecta-cidadao`;
  }
  const endereco = enderecoParaBusca(local);
  if (!endereco) return null;
  return `${base}q=${encodeURIComponent(endereco)}&navigate=yes&utm_source=conecta-cidadao`;
}

/**
 * Link de rota do Google Maps.
 * @param {object} local - destino
 * @param {'walking'|'transit'|'bicycling'|'driving'} modo
 * @param {{lat:number,lng:number}} [origem] - ponto de partida; sem ele, o Google usa a localização atual
 * @returns {string|null} null quando não há coordenada nem endereço.
 */
export function linkGoogleMaps(local, modo = 'transit', origem = null) {
  let destino;
  if (local?.coordenadas) destino = `${local.coordenadas.lat},${local.coordenadas.lng}`;
  else destino = enderecoParaBusca(local);
  if (!destino) return null;
  const travelmode = MODOS_GOOGLE[modo] ? modo : 'transit';
  const partes = [
    'https://www.google.com/maps/dir/?api=1',
    origem ? `origin=${origem.lat},${origem.lng}` : null,
    `destination=${encodeURIComponent(destino)}`,
    `travelmode=${travelmode}`,
  ];
  return partes.filter(Boolean).join('&');
}

/** Link do mapa ao vivo do Waze para embutir num <iframe> (um pin no centro). */
export function linkWazeIframe({ lat, lng, zoom = 16, pin = true }) {
  const z = Math.min(17, Math.max(3, Math.round(zoom)));
  return `https://embed.waze.com/pt-BR/iframe?zoom=${z}&lat=${lat}&lon=${lng}${pin ? '&pin=1' : ''}`;
}
