/**
 * Conheca.jsx — Página "/conheca": Conheça Indaiatuba.
 *
 * - Números do IBGE (população, área, densidade), sempre com o ano e a fonte,
 *   lado a lado com os de São Paulo (capital) para dar a escala;
 * - mapa com o contorno do município e os bairros (Leaflet + OSM — mapa de
 *   vários pontos: o iFrame do Waze mostra um ponto só, ver README);
 * - "Diferenças para quem vem de São Paulo": só fatos, cada um com a fonte;
 * - links oficiais de história, agenda e cultura.
 * Os dados vêm de /api/cidade.json (gerado por `npm run dados`).
 */

import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useDados from '../hooks/useDados.js';
import useTituloPagina from '../hooks/useTituloPagina.js';
import EstadoDados from '../components/EstadoDados.jsx';
import MapaPreguicoso from '../components/mapa/MapaPreguicoso.jsx';
import './Conheca.css';

const numero = (valor, casas = 0) =>
  valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

/** Linhas da tabela de comparação: rótulo, chave em ibge.*, unidade e casas decimais. */
const LINHAS = [
  { rotulo: 'População estimada', chave: 'populacaoEstimada', unidade: 'pessoas' },
  { rotulo: 'População no Censo', chave: 'populacaoCenso', unidade: 'pessoas' },
  { rotulo: 'Área', chave: 'areaKm2', unidade: 'km²', casas: 1 },
  { rotulo: 'Densidade', chave: 'densidade', unidade: 'hab./km²', casas: 1 },
];

export default function Conheca() {
  useTituloPagina(
    'Conheça Indaiatuba — Conecta Cidadão',
    'Indaiatuba em números (IBGE), mapa dos bairros e o que muda para quem vem de São Paulo: DDD, água, energia, ônibus e feriados, com fontes.'
  );
  const navigate = useNavigate();
  const cidade = useDados('/api/cidade.json');
  const bairros = useDados('/api/bairros.json');
  const { dados: limite } = useDados('/api/limite-municipio.geojson');

  const marcadores = useMemo(
    () =>
      (bairros.dados?.bairros ?? []).map((b) => ({
        id: b.slug,
        lat: b.coordenadas.lat,
        lng: b.coordenadas.lng,
        titulo: b.nome,
        detalhe: 'Bairro',
        categoria: 'bairro',
        rota: `/bairros/${b.slug}`,
      })),
    [bairros.dados]
  );
  const camadas = useMemo(
    () => (limite ? [{ geojson: limite, cor: '#3b3bb0', titulo: 'Limite do município' }] : []),
    [limite]
  );

  const ibge = cidade.dados?.ibge;

  return (
    <div data-categoria="conheca">
      <section className="container pagina-topo">
        <h1 className="titulo-pagina">Conheça Indaiatuba</h1>
        <p className="texto-apoio">
          Uma cidade do interior de São Paulo, na Região Metropolitana de Campinas. Aqui estão os
          números oficiais, os bairros no mapa e o que muda para quem vem da capital.
        </p>
      </section>

      <EstadoDados carregando={cidade.carregando} erro={cidade.erro} recarregar={cidade.recarregar}>
        {ibge && (
          <section className="container conheca-bloco" aria-labelledby="titulo-numeros">
            <h2 id="titulo-numeros" className="conheca-titulo">
              Em números
            </h2>
            <div className="painel conheca-tabela-area">
              <table className="conheca-tabela">
                <caption className="somente-leitor">
                  Indaiatuba e São Paulo (capital), segundo o IBGE
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Dado (ano)</th>
                    <th scope="col">Indaiatuba</th>
                    <th scope="col">São Paulo (capital)</th>
                  </tr>
                </thead>
                <tbody>
                  {LINHAS.map((linha) => {
                    const ind = ibge.indaiatuba[linha.chave];
                    const sp = ibge.saoPaulo[linha.chave];
                    if (!ind) return null;
                    return (
                      <tr key={linha.chave}>
                        <th scope="row">
                          {linha.rotulo} ({ind.ano})
                        </th>
                        <td>
                          {numero(ind.valor, linha.casas)} {linha.unidade}
                        </td>
                        <td>
                          {sp
                            ? `${numero(sp.valor, linha.casas)} ${linha.unidade}`
                            : 'Informação não disponível'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="info-fonte">
                Fonte:{' '}
                {ibge.fontes.map((f, i) => (
                  <span key={f.url}>
                    {i > 0 && ' · '}
                    <a href={f.url} target="_blank" rel="noopener noreferrer">
                      {f.nome}
                    </a>
                  </span>
                ))}
                . Consultado em {cidade.dados.atualizadoEm.split('-').reverse().join('/')}.
              </p>
            </div>
          </section>
        )}

        <section className="container conheca-bloco" aria-labelledby="titulo-mapa">
          <h2 id="titulo-mapa" className="conheca-titulo">
            Os bairros no mapa
          </h2>
          <p className="info-fonte">
            Contorno do município: IBGE. Bairros: © OpenStreetMap contributors — são pontos de
            referência, não os limites oficiais dos bairros. Toque em um bairro para ver o que tem
            perto.
          </p>
          <MapaPreguicoso
            marcadores={marcadores}
            camadas={camadas}
            agrupar
            aoAbrir={(rota) => navigate(rota)}
            altura={440}
            rotulo="Mapa de Indaiatuba com o contorno do município e os bairros"
          />
        </section>

        {cidade.dados?.diferencas && (
          <section
            className="container conheca-bloco"
            id="diferencas"
            aria-labelledby="titulo-diferencas"
          >
            <h2 id="titulo-diferencas" className="conheca-titulo">
              Diferenças para quem vem de São Paulo
            </h2>
            <ul className="conheca-diferencas">
              {cidade.dados.diferencas.map((d) => (
                <li key={d.id} className="painel">
                  <h3>{d.titulo}</h3>
                  <p>{d.texto}</p>
                  <p className="info-fonte">
                    <a href={d.fonte} target="_blank" rel="noopener noreferrer">
                      Fonte
                    </a>
                    {d.rota && (
                      <>
                        {' · '}
                        <Link to={d.rota}>Ver no site</Link>
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {cidade.dados?.links && (
          <section className="container conheca-bloco" aria-labelledby="titulo-links">
            <h2 id="titulo-links" className="conheca-titulo">
              História, agenda e cultura
            </h2>
            <ul className="conheca-links">
              {cidade.dados.links.map((l) => (
                <li key={l.url}>
                  <a className="painel" href={l.url} target="_blank" rel="noopener noreferrer">
                    <strong>{l.nome}</strong>
                    <span>{l.descricao}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="info-fonte">
              Parques, museus e shoppings estão em <Link to="/lazer">Lazer e cultura</Link>.
            </p>
          </section>
        )}
      </EstadoDados>
    </div>
  );
}
