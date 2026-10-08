/**
 * InfoFonte.jsx — "Fonte: ... · Atualizado em ..." no fim de cada bloco de dados.
 *
 * Mostra de onde veio cada informação. O texto do link é o nome do site
 * (ex.: "indaiatuba.sp.gov.br"), mais curto e legível que a URL inteira.
 *
 * @param {{fontes: string[], atualizadoEm?: string}} props
 */
import { formatarData } from '../utils/datas.js';

/** URL → nome curto da fonte. */
export function nomeDaFonte(url) {
  const host = new URL(url).hostname.replace(/^www\./, '');
  const nomes = {
    'indaiatuba.sp.gov.br': 'Prefeitura de Indaiatuba',
    'apidadosabertos.saude.gov.br': 'CNES (Ministério da Saúde)',
    'openstreetmap.org': 'OpenStreetMap',
    'brasilapi.com.br': 'BrasilAPI',
  };
  return nomes[host] ?? host;
}

export default function InfoFonte({ fontes = [], atualizadoEm }) {
  if (!fontes.length && !atualizadoEm) return null;
  return (
    <p className="info-fonte">
      {fontes.length > 0 && (
        <>
          Fonte{fontes.length > 1 ? 's' : ''}:{' '}
          {fontes.map((url, indice) => (
            <span key={url}>
              {indice > 0 && ', '}
              <a href={url} target="_blank" rel="noreferrer">
                {nomeDaFonte(url)}
              </a>
            </span>
          ))}
        </>
      )}
      {atualizadoEm && <> · Atualizado em {formatarData(atualizadoEm)}</>}
    </p>
  );
}
