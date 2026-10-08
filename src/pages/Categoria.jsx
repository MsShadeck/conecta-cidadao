/**
 * Categoria.jsx — Página de um serviço (/saude, /educacao, /seguranca, /lazer, /cidadania).
 *
 * Um único componente atende a todas as rotas: o App.jsx passa a prop "slug".
 * Os locais vêm de /api/locais.json (dados reais, com fonte), e a página oferece:
 *  - filtros por tipo e por bairro;
 *  - ordem alfabética ou por distância (quando a pessoa informa de onde sai);
 *  - alternância entre lista e mapa;
 *  - a contagem real de locais.
 *
 * Os filtros ficam na URL (?tipo=UBS&ver=mapa): dá para compartilhar o link
 * e o botão Voltar do navegador funciona.
 *
 * @param {{slug: string}} props - identificador da categoria, ex.: 'saude'.
 */

import { useCallback, useMemo } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { buscarCategoria } from '../data/servicos.js';
import { useOrigem } from '../context/AppContext.jsx';
import useDados from '../hooks/useDados.js';
import useTituloPagina from '../hooks/useTituloPagina.js';
import { ordenarPorDistancia } from '../utils/geo.js';
import { plural } from '../utils/texto.js';
import CardLocal from '../components/CardLocal.jsx';
import ChipsCategorias from '../components/ChipsCategorias.jsx';
import BotaoUtil from '../components/BotaoUtil.jsx';
import SugestaoLocais from '../components/SugestaoLocais.jsx';
import EstadoDados from '../components/EstadoDados.jsx';
import InfoFonte from '../components/InfoFonte.jsx';
import SeletorOrigem from '../components/SeletorOrigem.jsx';
import EmergenciaRapida from '../components/EmergenciaRapida.jsx';
import MapaPreguicoso from '../components/mapa/MapaPreguicoso.jsx';
import './Categoria.css';

export default function Categoria({ slug }) {
  const categoria = buscarCategoria(slug);
  // Título dinâmico: "Saúde — Conecta Cidadão". O hook é chamado antes do
  // possível "return" abaixo porque hooks não podem ficar depois de um desvio.
  useTituloPagina(
    categoria ? `${categoria.nome} em Indaiatuba — Conecta Cidadão` : 'Conecta Cidadão',
    categoria
      ? `${categoria.nome} em Indaiatuba: ${categoria.resumo} Endereços, telefones e horários.`
      : undefined
  );

  const { dados, carregando, erro, recarregar } = useDados('/api/locais.json');
  const { origem } = useOrigem();
  const [parametros, setParametros] = useSearchParams();
  const navigate = useNavigate();

  const tipo = parametros.get('tipo') ?? '';
  const bairro = parametros.get('bairro') ?? '';
  const ordem = parametros.get('ordem') ?? 'nome';
  const ver = parametros.get('ver') ?? 'lista';

  /** Troca um filtro na URL mantendo os outros (replace: não enche o histórico). */
  function mudar(chave, valor) {
    const novos = new URLSearchParams(parametros);
    if (valor) novos.set(chave, valor);
    else novos.delete(chave);
    setParametros(novos, { replace: true });
  }

  const daCategoria = useMemo(
    () => (dados?.locais ?? []).filter((local) => local.categoria === slug),
    [dados, slug]
  );

  // Opções dos filtros saem dos próprios dados (só aparecem tipos/bairros que existem).
  const tipos = useMemo(() => [...new Set(daCategoria.map((l) => l.tipo))].sort(), [daCategoria]);
  const bairros = useMemo(
    () =>
      [...new Set(daCategoria.map((l) => l.endereco?.bairro).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      ),
    [daCategoria]
  );

  const visiveis = useMemo(() => {
    const filtrados = daCategoria.filter(
      (l) => (!tipo || l.tipo === tipo) && (!bairro || l.endereco?.bairro === bairro)
    );
    if (ordem === 'distancia' && origem) {
      // Locais sem coordenadas vão para o fim da lista.
      const comDistancia = ordenarPorDistancia(filtrados, origem);
      return [...comDistancia, ...filtrados.filter((l) => !l.coordenadas)];
    }
    return [...filtrados].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [daCategoria, tipo, bairro, ordem, origem]);

  const marcadores = useMemo(
    () =>
      visiveis
        .filter((l) => l.coordenadas)
        .map((l) => ({
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
  const abrir = useCallback((rota) => navigate(rota), [navigate]);

  // Proteção: se o slug não existir nos dados, redireciona para a Home em vez
  // de quebrar a tela. "replace" troca a entrada no histórico, para o botão
  // Voltar não trazer o usuário de volta à página inválida.
  if (!categoria) {
    return <Navigate to="/" replace />;
  }

  return (
    // data-categoria nesta <div> externa define as variáveis de cor que todos
    // os elementos filhos (etiqueta, cards, chips) herdam pelo CSS.
    <div data-categoria={categoria.slug}>
      <section className="container categoria-topo">
        <ChipsCategorias />
        <div className="categoria-titulo-area">
          <h1 className="titulo-pagina">{categoria.nome}</h1>
          {dados && (
            <span className="etiqueta">{plural(daCategoria.length, 'local', 'locais')}</span>
          )}
        </div>
        <p className="texto-apoio">{categoria.resumo}</p>
      </section>

      {slug === 'seguranca' && (
        <section className="container">
          <EmergenciaRapida />
        </section>
      )}

      <section className="container">
        <EstadoDados carregando={carregando} erro={erro} recarregar={recarregar}>
          <div className="painel categoria-filtros">
            <div className="categoria-filtros-linha">
              <label className="filtro">
                <span>Tipo</span>
                <select
                  className="campo"
                  value={tipo}
                  onChange={(e) => mudar('tipo', e.target.value)}
                >
                  <option value="">Todos os tipos</option>
                  {tipos.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="filtro">
                <span>Bairro</span>
                <select
                  className="campo"
                  value={bairro}
                  onChange={(e) => mudar('bairro', e.target.value)}
                >
                  <option value="">Todos os bairros</option>
                  {bairros.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
              <label className="filtro">
                <span>Ordem</span>
                <select
                  className="campo"
                  value={ordem}
                  onChange={(e) => mudar('ordem', e.target.value)}
                >
                  <option value="nome">Nome (A–Z)</option>
                  <option value="distancia">Mais perto de mim</option>
                </select>
              </label>
              {/* Lista ou mapa: grupo de botões de alternância (aria-pressed). */}
              <div className="filtro" role="group" aria-label="Forma de exibição">
                <span aria-hidden="true">Ver em</span>
                <div className="alternar">
                  <button
                    type="button"
                    aria-pressed={ver === 'lista'}
                    onClick={() => mudar('ver', '')}
                  >
                    Lista
                  </button>
                  <button
                    type="button"
                    aria-pressed={ver === 'mapa'}
                    onClick={() => mudar('ver', 'mapa')}
                  >
                    Mapa
                  </button>
                </div>
              </div>
            </div>

            {ordem === 'distancia' && !origem && (
              <SeletorOrigem titulo="Para ordenar por distância, diga de onde você sai" />
            )}

            {/* role="status": o leitor de tela anuncia a nova contagem ao filtrar. */}
            <p className="categoria-contagem" role="status">
              {plural(visiveis.length, 'local encontrado', 'locais encontrados')}
              {(tipo || bairro) && (
                <button
                  type="button"
                  className="categoria-limpar"
                  onClick={() => setParametros({}, { replace: true })}
                >
                  Limpar filtros
                </button>
              )}
            </p>
          </div>

          {ver === 'mapa' ? (
            <div className="categoria-mapa">
              <MapaPreguicoso
                marcadores={marcadores}
                origem={origem}
                agrupar
                aoAbrir={abrir}
                altura={480}
                rotulo={`Mapa de ${categoria.nome}`}
              />
              {visiveis.length > marcadores.length && (
                <p className="info-fonte">
                  {plural(
                    visiveis.length - marcadores.length,
                    'local não aparece',
                    'locais não aparecem'
                  )}{' '}
                  no mapa porque a localização não está disponível nas fontes. Eles estão na lista.
                </p>
              )}
            </div>
          ) : null}

          {/* A lista aparece sempre (no modo mapa, abaixo dele): é a alternativa
              em texto do mapa para quem usa leitor de tela. */}
          <ul className="grade-locais">
            {visiveis.map((local) => (
              <li key={local.id}>
                <CardLocal local={local} distancia={local.distancia} />
              </li>
            ))}
          </ul>

          {dados && (
            <InfoFonte fontes={dados.fontes.map((f) => f.url)} atualizadoEm={dados.atualizadoEm} />
          )}
        </EstadoDados>
      </section>

      {/* Aula "Review + Rotas": BotaoUtil (LikeButton) e SugestaoLocais (ListaAlunos).
          key={categoria.slug}: as rotas usam o mesmo componente Categoria,
          então sem a key o React manteria o estado (curtidas e sugestões) ao
          trocar de /saude para /lazer. Mudando a key, o estado recomeça do zero. */}
      <section className="container">
        <div className="painel categoria-extra">
          <BotaoUtil key={`util-${categoria.slug}`} pagina={categoria.slug} />
          <SugestaoLocais
            key={`sugestao-${categoria.slug}`}
            categoriaSlug={categoria.slug}
            categoriaNome={categoria.nome}
          />
        </div>
      </section>
    </div>
  );
}
