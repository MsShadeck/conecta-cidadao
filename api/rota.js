/**
 * api/rota.js — Função serverless da Vercel: GET /api/rota?de=lat,lng&para=lat,lng
 *
 * Calcula o trajeto A PÉ e de BICICLETA pelas ruas reais de Indaiatuba usando o
 * roteamento do Indaiatuba Integra (api/_integra/roteador.mjs, gerado por
 * `npm run integra`). Nada de chave de API: o mapa das ruas vem do OpenStreetMap.
 *
 * Ônibus não entra aqui: não existem dados abertos de linhas e horários de
 * Indaiatuba. A página "Como chegar" leva a pessoa à previsão oficial.
 *
 * Em desenvolvimento, o vite.config.js encaminha /api/rota para este arquivo.
 */

import { readFileSync } from 'node:fs';
import { rotear } from './_integra/roteador.mjs';

// Velocidades médias usadas pelo Integra (config.json): 5 km/h a pé, 15 km/h de bike.
const config = JSON.parse(
  readFileSync(new URL('./_integra/data/config.json', import.meta.url), 'utf8')
);
const VELOCIDADE_KMH = { pe: config.velocidadesKmh.caminhada, bike: config.velocidadesKmh.bike };

// Retângulo que envolve o município (malha do IBGE). Fora dele, não há ruas no grafo.
const LIMITES = { oeste: -47.3056, sul: -23.226, leste: -47.0836, norte: -22.9979 };

/** "-23.08,-47.21" → [-23.08, -47.21], ou null se inválido / fora da cidade. */
export function lerPonto(texto) {
  const [lat, lng] = String(texto ?? '')
    .split(',')
    .map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < LIMITES.sul || lat > LIMITES.norte || lng < LIMITES.oeste || lng > LIMITES.leste)
    return null;
  return [lat, lng];
}

/** Reduz a quantidade de pontos (a cada ~5 m não precisa de um ponto novo). */
function arredondar([lat, lng]) {
  return [Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5];
}

function resumir(rota, kmh) {
  // Rota com só 2 pontos = o Integra não achou caminho pelas ruas e ligou em linha reta.
  const linhaReta = rota.pontos.length <= 2;
  return {
    distanciaM: Math.round(rota.distanciaM),
    minutos: Math.max(1, Math.round((rota.distanciaM / 1000 / kmh) * 60)),
    percentualCiclovia: rota.percentualCiclovia,
    linhaReta,
    segmentos: rota.segmentos.map((s) => ({
      infra: s.infra,
      distanciaM: Math.round(s.distanciaM),
      pontos: s.pontos.map(arredondar),
    })),
  };
}

export default function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const de = lerPonto(url.searchParams.get('de'));
  const para = lerPonto(url.searchParams.get('para'));
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (!de || !para) {
    res.statusCode = 400;
    res.end(
      JSON.stringify({
        erro: 'Informe origem e destino dentro de Indaiatuba (de=lat,lng&para=lat,lng).',
      })
    );
    return;
  }

  try {
    const resposta = {
      pe: resumir(rotear(de, para, 'caminhada'), VELOCIDADE_KMH.pe),
      bike: resumir(rotear(de, para, 'micro'), VELOCIDADE_KMH.bike),
      velocidadesKmh: VELOCIDADE_KMH,
      fonte:
        'Roteamento do Indaiatuba Integra sobre o viário do OpenStreetMap (© OpenStreetMap contributors)',
    };
    // A mesma consulta pode ficar 1 dia no cache da Vercel (as ruas mudam pouco).
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.statusCode = 200;
    res.end(JSON.stringify(resposta));
  } catch (erro) {
    res.statusCode = 500;
    res.end(
      JSON.stringify({ erro: 'Não foi possível calcular a rota agora.', detalhe: erro.message })
    );
  }
}
