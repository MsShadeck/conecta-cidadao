/**
 * Clima.jsx — Tempo agora e previsão de hoje em Indaiatuba (Open-Meteo).
 *
 * O Open-Meteo é uma API aberta, sem chave e com CORS liberado, então o
 * navegador busca direto, em tempo real. O useDados guarda a resposta em
 * memória: trocar de página e voltar não refaz a consulta.
 *
 * Os avisos de chuva forte e de calor usam limites definidos por este site
 * (ver LIMITES abaixo). Não são alertas oficiais: o aviso sempre leva para a
 * Defesa Civil, que é quem emite alerta de verdade.
 */

import useDados from '../hooks/useDados.js';
import './Clima.css';

const URL_CLIMA =
  'https://api.open-meteo.com/v1/forecast?latitude=-23.09&longitude=-47.22' +
  '&current=temperature_2m,apparent_temperature,precipitation,weather_code' +
  '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code' +
  '&timezone=America%2FSao_Paulo&forecast_days=1';

const URL_DEFESA_CIVIL = 'https://www.indaiatuba.sp.gov.br/seguranca/defesa-civil/';

/** Limites usados pelos avisos (critério do site, não oficial). */
const LIMITES = { chuvaForteMm: 30, chuvaProvavelPct: 80, chuvaModeradaMm: 10, calorC: 34 };

/** Códigos de tempo da OMM (WMO) usados pelo Open-Meteo → texto e símbolo. */
function descreverTempo(codigo) {
  if (codigo === 0) return ['Céu limpo', '☀️'];
  if (codigo <= 2) return ['Poucas nuvens', '🌤️'];
  if (codigo === 3) return ['Nublado', '☁️'];
  if (codigo <= 48) return ['Neblina', '🌫️'];
  if (codigo <= 57) return ['Garoa', '🌦️'];
  if (codigo <= 67) return ['Chuva', '🌧️'];
  if (codigo <= 77) return ['Neve', '❄️'];
  if (codigo <= 82) return ['Pancadas de chuva', '🌧️'];
  return ['Tempestade', '⛈️'];
}

/** Monta a lista de avisos a partir da previsão do dia. Exportada para teste. */
export function avisosDoDia(diario) {
  const avisos = [];
  const chuva = diario.precipitation_sum?.[0] ?? 0;
  const chance = diario.precipitation_probability_max?.[0] ?? 0;
  const tempestade = (diario.weather_code?.[0] ?? 0) >= 95;
  if (
    chuva >= LIMITES.chuvaForteMm ||
    tempestade ||
    (chance >= LIMITES.chuvaProvavelPct && chuva >= LIMITES.chuvaModeradaMm)
  ) {
    avisos.push(`Previsão de chuva forte hoje (${Math.round(chuva)} mm, ${chance}% de chance).`);
  }
  if ((diario.temperature_2m_max?.[0] ?? 0) >= LIMITES.calorC) {
    avisos.push(
      `Calor forte: máxima de ${Math.round(diario.temperature_2m_max[0])} °C. Beba água e evite sol forte.`
    );
  }
  return avisos;
}

export default function Clima() {
  const { dados, erro } = useDados(URL_CLIMA);
  // Sem dados ou com erro, o bloco simplesmente não aparece (não é essencial).
  if (erro || !dados?.current) return null;

  const [texto, simbolo] = descreverTempo(dados.current.weather_code);
  const avisos = avisosDoDia(dados.daily);

  return (
    <section className="clima" aria-labelledby="titulo-clima">
      <div className="clima-agora">
        <span className="clima-simbolo" aria-hidden="true">
          {simbolo}
        </span>
        <div>
          <h2 id="titulo-clima" className="clima-titulo">
            Tempo em Indaiatuba agora
          </h2>
          <p className="clima-temperatura">
            {Math.round(dados.current.temperature_2m)} °C · {texto}
          </p>
          <p className="clima-detalhe">
            Sensação de {Math.round(dados.current.apparent_temperature)} °C · Hoje:{' '}
            {Math.round(dados.daily.temperature_2m_min[0])}° a{' '}
            {Math.round(dados.daily.temperature_2m_max[0])}°, chance de chuva de{' '}
            {dados.daily.precipitation_probability_max[0]}%
          </p>
        </div>
      </div>

      {avisos.length > 0 && (
        // role="alert" faz o leitor de tela anunciar o aviso assim que ele aparece.
        <div className="clima-aviso" role="alert">
          {avisos.map((a) => (
            <p key={a}>⚠️ {a}</p>
          ))}
          <a href={URL_DEFESA_CIVIL} target="_blank" rel="noreferrer">
            Orientações da Defesa Civil (emergência: 199)
          </a>
        </div>
      )}

      <p className="clima-fonte">
        Previsão:{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Open-Meteo
        </a>{' '}
        (CC BY 4.0). Avisos calculados por este site, não são alertas oficiais.
      </p>
    </section>
  );
}
