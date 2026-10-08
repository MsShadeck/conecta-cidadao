/**
 * geo.js — Distâncias e ordenação por proximidade.
 */

/** Distância em metros entre dois pontos {lat, lng} (fórmula de Haversine). */
export function distanciaMetros(a, b) {
  const R = 6371000; // raio médio da Terra em metros
  const rad = (graus) => (graus * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 850 → "850 m"; 2430 → "2,4 km". A distância é em linha reta. */
export function formatarDistancia(metros) {
  if (metros < 1000) return `${Math.round(metros / 10) * 10} m`;
  return `${(metros / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

/**
 * Devolve os locais com coordenadas, ordenados do mais perto para o mais longe,
 * com o campo "distancia" (metros, em linha reta) acrescentado.
 */
export function ordenarPorDistancia(locais, origem) {
  return locais
    .filter((local) => local.coordenadas)
    .map((local) => ({ ...local, distancia: distanciaMetros(origem, local.coordenadas) }))
    .sort((a, b) => a.distancia - b.distancia);
}

/** Link para abrir o local no OpenStreetMap (funciona em qualquer aparelho). */
export function linkMapa(local) {
  if (local.coordenadas) {
    const { lat, lng } = local.coordenadas;
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
  }
  const busca = `${local.enderecoTexto ?? local.nome}, Indaiatuba, SP`;
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(busca)}`;
}
