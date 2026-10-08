/**
 * MapaGeral.jsx — Página "/mapa": todos os locais num mapa só.
 *
 *  - camadas por categoria (caixas de seleção liga/desliga);
 *  - marcadores agrupados quando estão próximos (leaflet.markercluster);
 *  - "Perto de mim": com a origem definida, a lista fica em ordem de distância;
 *  - lista sincronizada: clicar num item da lista abre o balão no mapa.
 *    A lista também é a alternativa em texto do mapa para leitores de tela.
 *
 * Aceita ?bairro=Nome (vindo da busca global) para abrir já filtrado.
 */

import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { categorias } from '../data/servicos.js';
import { useOrigem } from '../context/AppContext.jsx';
import useDados from '../hooks/useDados.js';
import useTituloPagina from '../hooks/useTituloPagina.js';
import { formatarDistancia, ordenarPorDistancia } from '../utils/geo.js';
import { plural } from '../utils/texto.js';
import EstadoDados from '../components/EstadoDados.jsx';
import InfoFonte from '../components/InfoFonte.jsx';
import SeletorOrigem from '../components/SeletorOrigem.jsx';
import MapaPreguicoso from '../components/mapa/MapaPreguicoso.jsx';
import './Categoria.css'; // contagem (.categoria-contagem)
import './MapaGeral.css';

const LIMITE_LISTA = 60;

export default function MapaGeral() {
  useTituloPagina(
    'Mapa dos serviços de Indaiatuba — Conecta Cidadão',
    'Mapa com UBS, escolas, creches, CRAS, parques, terminais de ônibus e outros serviços públicos de Indaiatuba.'
  );
  const navigate = useNavigate();
  const abrir = useCallback((rota) => navigate(rota), [navigate]);
  const { dados, carregando, erro, recarregar } = useDados('/api/locais.json');
  const { dados: limite } = useDados('/api/limite-municipio.geojson');
  const { origem } = useOrigem();
  const [parametros, setParametros] = useSearchParams();
  const bairro = parametros.get('bairro') ?? '';

  // Camadas ligadas: começa com todas.
  const [ligadas, setLigadas] = useState(() => new Set(categorias.map((c) => c.slug)));
  const [selecionado, setSelecionado] = useState(null);

  function alternarCamada(slug) {
    setLigadas((atual) => {
      const nova = new Set(atual);
      if (nova.has(slug)) nova.delete(slug);
      else nova.add(slug);
      return nova;
    });
  }

  const visiveis = useMemo(() => {
    const filtrados = (dados?.locais ?? []).filter(
      (l) => l.coordenadas && ligadas.has(l.categoria) && (!bairro || l.endereco?.bairro === bairro)
    );
    return origem
      ? ordenarPorDistancia(filtrados, origem)
      : [...filtrados].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [dados, ligadas, bairro, origem]);

  const marcadores = useMemo(
    () =>
      visiveis.map((l) => ({
        id: l.id,
        lat: l.coordenadas.lat,
        lng: l.coordenadas.lng,
        titulo: l.nome,
        detalhe: [l.tipo, l.endereco?.bairro].filter(Boolean).join(' · '),
        categoria: l.categoria,
        rota: `/${l.categoria}/${l.id}`,
      })),
    [visiveis]
  );

  // Contorno do município desenhado de leve, para a pessoa ver os limites da cidade.
  const camadas = useMemo(
    () => (limite ? [{ geojson: limite, cor: '#1a6faf', espessura: 2 }] : []),
    [limite]
  );

  return (
    <>
      <section className="container pagina-topo">
        <h1 className="titulo-pagina">Mapa dos serviços</h1>
        <p className="texto-apoio">
          Todos os locais públicos de Indaiatuba com localização conhecida. Ligue e desligue as
          categorias, ou diga de onde você sai para ver o que está mais perto.
        </p>
      </section>

      <section className="container mapa-geral">
        <EstadoDados carregando={carregando} erro={erro} recarregar={recarregar}>
          <div className="painel mapa-geral-controles">
            <fieldset className="mapa-geral-camadas">
              <legend>Camadas</legend>
              {categorias.map((c) => (
                <label key={c.slug} className="mapa-geral-camada" data-categoria={c.slug}>
                  <input
                    type="checkbox"
                    checked={ligadas.has(c.slug)}
                    onChange={() => alternarCamada(c.slug)}
                  />
                  <span className="mapa-geral-cor" aria-hidden="true" />
                  {c.nome}
                </label>
              ))}
            </fieldset>
            {bairro && (
              <p className="mapa-geral-bairro">
                Mostrando só o bairro <strong>{bairro}</strong>.{' '}
                <button type="button" onClick={() => setParametros({}, { replace: true })}>
                  Ver a cidade toda
                </button>
              </p>
            )}
            <SeletorOrigem titulo="Perto de mim" />
          </div>

          <div className="mapa-geral-corpo">
            <MapaPreguicoso
              marcadores={marcadores}
              camadas={camadas}
              origem={origem}
              agrupar
              selecionado={selecionado}
              aoAbrir={abrir}
              altura={560}
              rotulo="Mapa de todos os serviços públicos"
            />

            <div className="mapa-geral-lista">
              <p className="categoria-contagem" role="status">
                {plural(visiveis.length, 'local no mapa', 'locais no mapa')}
                {origem ? ' · do mais perto ao mais longe' : ''}
              </p>
              <ul>
                {visiveis.slice(0, LIMITE_LISTA).map((l) => (
                  <li key={l.id} data-categoria={l.categoria}>
                    {/* Botão: mostra no mapa. Link: abre a página do local. */}
                    <button
                      type="button"
                      className={`mapa-geral-item${selecionado === l.id ? ' mapa-geral-item--ativo' : ''}`}
                      onClick={() => setSelecionado(l.id)}
                    >
                      {/* Texto só para leitor de tela: o nome acessível continua
                          contendo o texto visível (WCAG 2.5.3). */}
                      <span className="somente-leitor">Mostrar no mapa: </span>
                      <span className="mapa-geral-cor" aria-hidden="true" />
                      <span>
                        <strong>{l.nome}</strong>
                        <small>
                          {[l.tipo, l.endereco?.bairro].filter(Boolean).join(' · ')}
                          {l.distancia !== undefined && ` · ${formatarDistancia(l.distancia)}`}
                        </small>
                      </span>
                    </button>
                    <Link to={`/${l.categoria}/${l.id}`} className="mapa-geral-detalhes">
                      Detalhes
                    </Link>
                  </li>
                ))}
              </ul>
              {visiveis.length > LIMITE_LISTA && (
                <p className="info-fonte">
                  Mostrando os {LIMITE_LISTA} primeiros. Use as camadas ou a busca para refinar.
                </p>
              )}
            </div>
          </div>

          {dados && (
            <InfoFonte fontes={dados.fontes.map((f) => f.url)} atualizadoEm={dados.atualizadoEm} />
          )}
        </EstadoDados>
      </section>
    </>
  );
}
