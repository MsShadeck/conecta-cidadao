/**
 * Mobilidade.jsx — Página "/mobilidade": ônibus, bicicleta e terminais.
 *
 * O que é mostrado e de onde vem:
 *  - ônibus: resumo, cartão SOU e links para a previsão OFICIAL de chegadas
 *    (Indaiatuba não publica dados abertos de linhas, paradas e horários;
 *    por isso não há página de linha aqui — ver docs/fontes-de-dados.md);
 *  - terminais e atendimento: /api/locais.json (categoria "mobilidade");
 *  - Ecobike: regras da página oficial + estações mapeadas no OpenStreetMap;
 *  - ciclovias: /api/ciclovias.geojson (OpenStreetMap, via Indaiatuba Integra).
 */

import { useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useDados from '../hooks/useDados.js';
import useTituloPagina from '../hooks/useTituloPagina.js';
import ChipsCategorias from '../components/ChipsCategorias.jsx';
import CardLocal from '../components/CardLocal.jsx';
import EstadoDados from '../components/EstadoDados.jsx';
import InfoFonte from '../components/InfoFonte.jsx';
import BotaoUtil from '../components/BotaoUtil.jsx';
import MapaPreguicoso from '../components/mapa/MapaPreguicoso.jsx';
import { formatarData } from '../utils/datas.js';
import './Categoria.css'; // reaproveita o topo (.categoria-topo) das páginas de categoria
import '../components/PlanejadorRota.css'; // legenda de cores (.planejador-legenda)
import './Mobilidade.css';

const COR_CICLOVIA = '#1a7f37';

export default function Mobilidade() {
  useTituloPagina('Ônibus e bike em Indaiatuba — Conecta Cidadão');
  const navigate = useNavigate();
  const abrir = useCallback((rota) => navigate(rota), [navigate]);

  const mobilidade = useDados('/api/mobilidade.json');
  const locais = useDados('/api/locais.json');
  const { dados: ciclovias } = useDados('/api/ciclovias.geojson');

  const terminais = useMemo(
    () => (locais.dados?.locais ?? []).filter((l) => l.categoria === 'mobilidade'),
    [locais.dados]
  );

  // Marcadores: terminais (categoria mobilidade) + estações Ecobike do OSM.
  const marcadores = useMemo(() => {
    const lista = terminais
      .filter((l) => l.coordenadas)
      .map((l) => ({
        id: l.id,
        lat: l.coordenadas.lat,
        lng: l.coordenadas.lng,
        titulo: l.nome,
        detalhe: l.tipo,
        categoria: 'mobilidade',
        rota: `/mobilidade/${l.id}`,
      }));
    const estacoes = mobilidade.dados?.ecobike.estacoesNoMapa ?? [];
    estacoes.forEach((e, i) =>
      lista.push({
        id: `ecobike-${i}`,
        lat: e.coordenadas.lat,
        lng: e.coordenadas.lng,
        titulo: 'Estação Ecobike',
        detalhe: 'Posição no OpenStreetMap',
        categoria: 'saude', // verde, para diferenciar dos terminais
      })
    );
    return lista;
  }, [terminais, mobilidade.dados]);

  const camadas = useMemo(
    () => (ciclovias ? [{ geojson: ciclovias, cor: COR_CICLOVIA, espessura: 3 }] : []),
    [ciclovias]
  );

  const dados = mobilidade.dados;

  return (
    <div data-categoria="mobilidade">
      <section className="container categoria-topo">
        <ChipsCategorias />
        <h1 className="titulo-pagina">Ônibus e bike</h1>
        <p className="texto-apoio">
          Como se locomover em Indaiatuba sem carro: transporte coletivo, terminais, cartão SOU,
          bicicletas grátis do Ecobike e ciclovias.
        </p>
        <Link to="/como-chegar" className="botao-primario mobilidade-cta">
          Planejar um trajeto (a pé ou de bike)
        </Link>
      </section>

      <EstadoDados
        carregando={mobilidade.carregando}
        erro={mobilidade.erro}
        recarregar={mobilidade.recarregar}
      >
        {dados && (
          <div className="container mobilidade">
            {/* ------------------------- Ônibus ------------------------- */}
            <section className="painel mobilidade-bloco" aria-labelledby="t-onibus">
              <h2 id="t-onibus">🚌 Ônibus municipal</h2>
              <p>{dados.onibus.resumo}</p>
              <ul className="mobilidade-links">
                {dados.onibus.links.map((link) => (
                  <li key={link.url}>
                    <a href={link.url} target="_blank" rel="noreferrer" className="mobilidade-link">
                      <strong>{link.nome}</strong>
                      <span>{link.descricao}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mobilidade-aviso" role="note">
                Por que não mostramos as linhas aqui? A Prefeitura e a operadora não publicam os
                itinerários e horários em formato aberto. Para não arriscar uma informação errada,
                este site leva você direto ao sistema oficial, que mostra também a previsão de
                chegada em cada ponto.
              </p>
            </section>

            <section className="painel mobilidade-bloco" aria-labelledby="t-cartao">
              <h2 id="t-cartao">💳 {dados.onibus.cartao.titulo}</h2>
              <p>{dados.onibus.cartao.texto}</p>
              <p className="mobilidade-telefones">
                {dados.onibus.cartao.telefones.map((tel) => (
                  <a key={tel} href={`tel:${tel.replace(/[^\d+]/g, '')}`}>
                    {tel}
                  </a>
                ))}
                <span>WhatsApp: {dados.onibus.cartao.whatsapp}</span>
              </p>
              <InfoFonte fontes={[dados.onibus.cartao.fonte]} />
            </section>

            <section className="painel mobilidade-bloco" aria-labelledby="t-noticias">
              <h2 id="t-noticias">📰 Novidades (confira antes de usar)</h2>
              <ul className="mobilidade-noticias">
                {dados.onibus.noticias.map((n) => (
                  <li key={n.titulo}>
                    <strong>{n.titulo}</strong>
                    <p>{n.texto}</p>
                    <span className="info-fonte">
                      Fonte:{' '}
                      <a href={n.fonte} target="_blank" rel="noreferrer">
                        imprensa ({formatarData(n.data)})
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* ------------------------- Mapa ------------------------- */}
            <section className="mobilidade-mapa" aria-labelledby="t-mapa">
              <h2 id="t-mapa" className="mobilidade-subtitulo">
                Terminais, Ecobike e ciclovias no mapa
              </h2>
              <MapaPreguicoso
                marcadores={marcadores}
                camadas={camadas}
                aoAbrir={abrir}
                altura={460}
                rotulo="Mapa com terminais de ônibus, estações Ecobike e ciclovias"
              />
              <ul className="planejador-legenda">
                <li>
                  <span style={{ background: COR_CICLOVIA }} aria-hidden="true" /> Ciclovias e
                  ciclofaixas (OpenStreetMap)
                </li>
              </ul>
              <p className="info-fonte">
                Estações Ecobike no mapa: só as que estão cadastradas no OpenStreetMap (
                {dados.ecobike.estacoesNoMapa.length} de 5). A lista oficial de locais está no texto
                abaixo.
              </p>
            </section>

            <EstadoDados
              carregando={locais.carregando}
              erro={locais.erro}
              recarregar={locais.recarregar}
            >
              <section aria-labelledby="t-terminais">
                <h2 id="t-terminais" className="mobilidade-subtitulo">
                  Terminais e atendimento
                </h2>
                <ul className="grade-locais">
                  {terminais.map((local) => (
                    <li key={local.id}>
                      <CardLocal local={local} />
                    </li>
                  ))}
                </ul>
              </section>
            </EstadoDados>

            {/* ------------------------- Bicicleta ------------------------- */}
            <section id="ecobike" className="painel mobilidade-bloco" aria-labelledby="t-ecobike">
              <h2 id="t-ecobike">🚲 {dados.ecobike.titulo}</h2>
              <p>{dados.ecobike.texto}</p>
              <p>
                <strong>Horários: </strong>
                {dados.ecobike.horarios}
              </p>
              <p>
                Telefone:{' '}
                <a href={`tel:${dados.ecobike.telefone.replace(/[^\d+]/g, '')}`}>
                  {dados.ecobike.telefone}
                </a>
              </p>
              <InfoFonte fontes={[dados.ecobike.fonte]} />
            </section>

            <section className="painel mobilidade-bloco" aria-labelledby="t-bike">
              <h2 id="t-bike">🛣️ {dados.bike.titulo}</h2>
              <p>{dados.bike.texto}</p>
              {dados.bike.links.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                  {link.nome}
                </a>
              ))}
            </section>

            <InfoFonte
              fontes={[
                'https://www.indaiatuba.sp.gov.br/mobilidade-urbana/',
                'https://www.openstreetmap.org/copyright',
              ]}
              atualizadoEm={dados.atualizadoEm}
            />
            <div className="painel">
              <BotaoUtil pagina="mobilidade" />
            </div>
          </div>
        )}
      </EstadoDados>
    </div>
  );
}
