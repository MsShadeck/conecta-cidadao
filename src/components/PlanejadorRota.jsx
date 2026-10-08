/**
 * PlanejadorRota.jsx — Bloco "Como chegar" (página do local e /como-chegar).
 *
 * Origem: a localização ou o CEP da pessoa (SeletorOrigem).
 * Destino: um local do site.
 *
 * As rotas a pé e de bicicleta vêm de /api/rota, que usa o roteamento do
 * Indaiatuba Integra sobre as ruas reais (OpenStreetMap). Na rota de bike,
 * cada trecho é colorido pela infraestrutura: ciclovia, ciclofaixa, rua
 * compartilhada ou via sem infraestrutura.
 *
 * Ônibus: não existem dados abertos de linhas e horários de Indaiatuba, então
 * o bloco não inventa uma linha. Ele leva à previsão oficial da operadora.
 *
 * @param {{destino: object}} props - um local de /api/locais.json
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOrigem } from '../context/AppContext.jsx';
import SeletorOrigem from './SeletorOrigem.jsx';
import MapaPreguicoso from './mapa/MapaPreguicoso.jsx';
import { distanciaMetros, formatarDistancia } from '../utils/geo.js';
import './PlanejadorRota.css';

/** Cores dos trechos de bicicleta, por infraestrutura (mesma legenda do Integra). */
export const CORES_INFRA = {
  ciclovia: { cor: '#1a7f37', nome: 'Ciclovia' },
  ciclofaixa: { cor: '#3fa34d', nome: 'Ciclofaixa' },
  compartilhada: { cor: '#c98a00', nome: 'Rua compartilhada' },
  sem: { cor: '#c92a2a', nome: 'Sem infraestrutura (atenção)' },
};

const URL_HORARIOS_ONIBUS =
  'https://www.indaiatuba.sp.gov.br/mobilidade-urbana/horarios-de-onibus/';

export default function PlanejadorRota({ destino }) {
  const { origem } = useOrigem();
  const navigate = useNavigate();
  const [resultado, setResultado] = useState({ estado: 'parado', dados: null, erro: null });
  const [modo, setModo] = useState('pe');

  const temDestino = Boolean(destino?.coordenadas);

  // Busca a rota sempre que origem ou destino mudam (com AbortController).
  useEffect(() => {
    if (!origem || !temDestino) return undefined;
    const controle = new AbortController();
    const { lat, lng } = destino.coordenadas;
    setResultado({ estado: 'carregando', dados: null, erro: null });
    fetch(`/api/rota?de=${origem.lat},${origem.lng}&para=${lat},${lng}`, {
      signal: controle.signal,
    })
      .then(async (resposta) => {
        const corpo = await resposta.json();
        if (!resposta.ok) throw new Error(corpo.erro ?? 'Não foi possível calcular a rota.');
        return corpo;
      })
      .then((dados) => setResultado({ estado: 'pronto', dados, erro: null }))
      .catch((erro) => {
        if (erro.name !== 'AbortError')
          setResultado({ estado: 'erro', dados: null, erro: erro.message });
      });
    return () => controle.abort();
  }, [origem, temDestino, destino]);

  const { dados } = resultado;

  // Linhas desenhadas no mapa para o modo escolhido.
  const rotas = useMemo(() => {
    if (!dados) return [];
    if (modo === 'pe') {
      return dados.pe.segmentos.map((s) => ({
        pontos: s.pontos,
        cor: '#1a6faf',
        tracejado: true,
        titulo: 'A pé',
      }));
    }
    return dados.bike.segmentos.map((s) => ({
      pontos: s.pontos,
      cor: CORES_INFRA[s.infra]?.cor,
      titulo: CORES_INFRA[s.infra]?.nome,
    }));
  }, [dados, modo]);

  const marcadorDestino = useMemo(
    () =>
      temDestino
        ? [
            {
              id: destino.id,
              lat: destino.coordenadas.lat,
              lng: destino.coordenadas.lng,
              titulo: destino.nome,
              categoria: destino.categoria,
            },
          ]
        : [],
    [destino, temDestino]
  );

  if (!temDestino) {
    return (
      <p className="nao-disponivel">
        A localização exata deste local não está disponível nas fontes, então não dá para traçar a
        rota. Use o endereço acima no seu aplicativo de mapas.
      </p>
    );
  }

  const linhaRetaM = origem ? distanciaMetros(origem, destino.coordenadas) : null;

  return (
    <div className="planejador">
      <SeletorOrigem />

      {origem && resultado.estado === 'carregando' && (
        <p className="estado-dados" role="status">
          Calculando o trajeto pelas ruas...
        </p>
      )}
      {resultado.estado === 'erro' && (
        <p className="estado-dados estado-dados--erro" role="alert">
          {resultado.erro}
        </p>
      )}

      {origem && dados && (
        <>
          {/* Opções de trajeto: botões de alternância que trocam o desenho do mapa. */}
          <div className="planejador-opcoes" role="group" aria-label="Escolha como ir">
            <button
              type="button"
              className="planejador-opcao"
              aria-pressed={modo === 'pe'}
              onClick={() => setModo('pe')}
            >
              <span className="planejador-icone" aria-hidden="true">
                🚶
              </span>
              <strong>A pé</strong>
              <span>
                {dados.pe.minutos} min · {formatarDistancia(dados.pe.distanciaM)}
              </span>
            </button>
            <button
              type="button"
              className="planejador-opcao"
              aria-pressed={modo === 'bike'}
              onClick={() => setModo('bike')}
            >
              <span className="planejador-icone" aria-hidden="true">
                🚲
              </span>
              <strong>De bicicleta</strong>
              <span>
                {dados.bike.minutos} min · {formatarDistancia(dados.bike.distanciaM)}
              </span>
              <span className="planejador-detalhe">
                {dados.bike.percentualCiclovia}% em ciclovia ou ciclofaixa
              </span>
            </button>
            <div className="planejador-opcao planejador-opcao--onibus">
              <span className="planejador-icone" aria-hidden="true">
                🚌
              </span>
              <strong>De ônibus</strong>
              <span className="planejador-detalhe">
                Indaiatuba não publica dados abertos das linhas. Veja qual linha passa perto de você
                e a previsão de chegada no sistema oficial:
              </span>
              <a href={URL_HORARIOS_ONIBUS} target="_blank" rel="noreferrer">
                Abrir horários e previsão de chegada
              </a>
              <Link to="/mobilidade">Cartão SOU, terminais e dicas</Link>
            </div>
          </div>

          {(dados.pe.linhaReta || dados.bike.linhaReta) && (
            <p className="planejador-aviso" role="note">
              Não achamos um caminho pelas ruas para um dos trajetos; ele aparece em linha reta.
              Confira no mapa.
            </p>
          )}

          <MapaPreguicoso
            marcadores={marcadorDestino}
            origem={origem}
            rotas={rotas}
            altura={380}
            rotulo={`Trajeto ${modo === 'pe' ? 'a pé' : 'de bicicleta'} até ${destino.nome}`}
            aoAbrir={navigate}
          />

          {modo === 'bike' && (
            <ul
              className="planejador-legenda"
              aria-label="Legenda das cores do trajeto de bicicleta"
            >
              {Object.entries(CORES_INFRA).map(([chave, { cor, nome }]) => (
                <li key={chave}>
                  <span style={{ background: cor }} aria-hidden="true" /> {nome}
                </li>
              ))}
            </ul>
          )}
          {modo === 'bike' && (
            <p className="info-fonte">
              Sem bicicleta? A Prefeitura empresta de graça pelo{' '}
              <Link to="/mobilidade#ecobike">Ecobike</Link>.
            </p>
          )}

          <p className="info-fonte">
            Tempo estimado a {dados.velocidadesKmh.pe} km/h a pé e {dados.velocidadesKmh.bike} km/h
            de bicicleta. Distância em linha reta: {formatarDistancia(linhaRetaM)}. Rota calculada
            pelo roteamento do Indaiatuba Integra sobre as ruas do OpenStreetMap (as ruas podem ter
            mudado: siga a sinalização).
          </p>
        </>
      )}
    </div>
  );
}
