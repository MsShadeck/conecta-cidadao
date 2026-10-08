/**
 * cep.js — Transforma um CEP de Indaiatuba em um ponto no mapa.
 *
 * Ordem das tentativas (todas sem chave de API):
 *  1. BrasilAPI CEP v2: às vezes já traz latitude e longitude;
 *  2. ViaCEP (rua e bairro) + Nominatim/OpenStreetMap (rua → coordenadas).
 * O ponto encontrado pela rua é aproximado (meio da rua), e a interface avisa.
 */

/** "13334-100" ou "13334100" → "13334100"; null se não tiver 8 dígitos. */
export function limparCep(texto) {
  const digitos = String(texto ?? '').replace(/\D/g, '');
  return digitos.length === 8 ? digitos : null;
}

const ehIndaiatuba = (cidade) =>
  (cidade ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() === 'indaiatuba';

async function json(url, signal) {
  const resposta = await fetch(url, { signal });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}

/**
 * @returns {Promise<{lat:number, lng:number, rotulo:string, aproximada:boolean}>}
 * @throws Error com mensagem pronta para mostrar ao usuário.
 */
export async function localizarCep(texto, signal) {
  const cep = limparCep(texto);
  if (!cep) throw new Error('Digite um CEP com 8 números, por exemplo 13334-100.');

  // 1. BrasilAPI
  try {
    const dados = await json(`https://brasilapi.com.br/api/cep/v2/${cep}`, signal);
    if (!ehIndaiatuba(dados.city))
      throw new Error(`Esse CEP é de ${dados.city}. O site cobre só Indaiatuba.`);
    const { latitude, longitude } = dados.location?.coordinates ?? {};
    if (latitude && longitude) {
      return {
        lat: Number(latitude),
        lng: Number(longitude),
        rotulo: [dados.street, dados.neighborhood].filter(Boolean).join(', ') || `CEP ${cep}`,
        aproximada: true, // coordenada do CEP, não da casa
      };
    }
  } catch (erro) {
    if (erro.name === 'AbortError' || /O site cobre/.test(erro.message)) throw erro;
    // Outros erros: tenta o caminho alternativo.
  }

  // 2. ViaCEP + Nominatim
  const via = await json(`https://viacep.com.br/ws/${cep}/json/`, signal).catch(() => null);
  if (!via || via.erro) throw new Error('CEP não encontrado. Confira os números.');
  if (!ehIndaiatuba(via.localidade))
    throw new Error(`Esse CEP é de ${via.localidade}. O site cobre só Indaiatuba.`);
  const busca = [via.logradouro, via.bairro, 'Indaiatuba', 'SP'].filter(Boolean).join(', ');
  const [lugar] = await json(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(busca)}`,
    signal
  ).catch(() => []);
  if (!lugar) throw new Error('Não achamos esse CEP no mapa. Tente usar a sua localização.');
  return {
    lat: Number(lugar.lat),
    lng: Number(lugar.lon),
    rotulo: [via.logradouro, via.bairro].filter(Boolean).join(', ') || `CEP ${cep}`,
    aproximada: true,
  };
}
