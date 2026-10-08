/**
 * PlanejadorRota.jsx — Bloco "Como chegar" (página do local e /como-chegar).
 *
 * O site NÃO desenha rotas: quem leva a pessoa até o lugar é o Waze ou o
 * Google Maps, que ela já usa no celular. No Google Maps, o modo "De ônibus"
 * mostra as linhas reais de Indaiatuba, os horários e a tarifa.
 *
 * Se a pessoa informar de onde sai (localização ou CEP), o Google Maps já abre
 * com a rota completa; sem isso, ele usa a localização atual do aparelho.
 *
 * @param {{destino: object}} props - um local de /api/locais.json
 */

/* VERSÃO ANTERIOR (v2) — rota desenhada no próprio site
   Calculava a rota a pé e de bicicleta com o roteamento do Indaiatuba Integra
   (/api/rota) e desenhava o traçado num mapa Leaflet. Foi substituída pelos
   botões do Waze e do Google Maps (v3). A função api/rota.js continua no
   projeto, mas a interface não a usa mais.
   (Os fechamentos de comentário abaixo levam uma barra invertida extra.)

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOrigem } from '../context/AppContext.jsx';
import SeletorOrigem from './SeletorOrigem.jsx';
import MapaPreguicoso from './mapa/MapaPreguicoso.jsx';
import { distanciaMetros, formatarDistancia } from '../utils/geo.js';
import './PlanejadorRota.css';

/** Cores dos trechos de bicicleta, por infraestrutura (mesma legenda do Integra). *\/
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
          {/* Opções de trajeto: botões de alternância que trocam o desenho do mapa. *\/}
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
*/

// VERSÃO ATIVA (v3) — botões de navegação externa.
import { useOrigem } from '../context/AppContext.jsx';
import SeletorOrigem from './SeletorOrigem.jsx';
import BotoesNavegacao from './BotoesNavegacao.jsx';
import { podeNavegar } from '../utils/navegacao.js';
import './PlanejadorRota.css';

export default function PlanejadorRota({ destino }) {
  const { origem } = useOrigem();

  if (!podeNavegar(destino)) {
    return (
      <p className="nao-disponivel">
        Informação não disponível — a fonte não informa o endereço nem a localização deste local.
        Confira no órgão responsável.
      </p>
    );
  }

  return (
    <div className="planejador">
      <BotoesNavegacao local={destino} origem={origem} />
      <p className="info-fonte">
        De ônibus: o Google Maps mostra as linhas de Indaiatuba, onde embarcar e o horário. Para a
        previsão oficial de chegada nos pontos, veja a página Transporte.
      </p>
      <details className="planejador-origem">
        <summary>Sair de outro lugar (opcional)</summary>
        <SeletorOrigem titulo="De onde você sai?" />
        <p className="info-fonte">
          Com o ponto de partida, o Google Maps já abre a rota completa. A sua localização e o seu
          CEP não são enviados a este site: só ficam no seu navegador.
        </p>
      </details>
    </div>
  );
}
