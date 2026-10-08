/**
 * Local.jsx — Página de detalhe de um local (/:categoria/:id).
 *
 * Ex.: /saude/ubs-jd-california. Mostra tudo o que as fontes informam sobre o
 * lugar: endereço, telefones clicáveis, horários com o selo "Aberto agora",
 * serviços, mini-mapa, "Como chegar", a fonte e a data de atualização.
 *
 * Campo sem fonte aparece como "Informação não disponível", nunca com um valor
 * chutado.
 */

import { Link, Navigate, useParams } from 'react-router-dom';
import { buscarCategoria } from '../data/servicos.js';
import useDados from '../hooks/useDados.js';
import useTituloPagina from '../hooks/useTituloPagina.js';
import { linkMapa } from '../utils/geo.js';
import { textoDias } from '../utils/horario.js';
import Foto from '../components/Foto.jsx';
import SeloAberto from '../components/SeloAberto.jsx';
import InfoFonte from '../components/InfoFonte.jsx';
import EstadoDados from '../components/EstadoDados.jsx';
import PlanejadorRota from '../components/PlanejadorRota.jsx';
import BotaoUtil from '../components/BotaoUtil.jsx';
import EmergenciaRapida from '../components/EmergenciaRapida.jsx';
import './Local.css';

const URL_OUVIDORIA = 'https://www.indaiatuba.sp.gov.br/fale-conosco/';

/** Texto padrão para qualquer campo que a fonte não informa. */
function NaoDisponivel() {
  return <span className="nao-disponivel">Informação não disponível</span>;
}

/** Endereço em uma linha: "Rua X, 10 - Bairro · CEP 13330-000". */
function textoEndereco(local) {
  const e = local.endereco;
  if (!e?.logradouro) return local.enderecoTexto;
  const rua = [e.logradouro, e.numero].filter(Boolean).join(', ');
  return [rua, e.bairro].filter(Boolean).join(' - ') + (e.cep ? ` · CEP ${e.cep}` : '');
}

export default function Local() {
  const { categoria: slug, id } = useParams();
  const categoria = buscarCategoria(slug);
  const { dados, carregando, erro, recarregar } = useDados('/api/locais.json');
  const local = dados?.locais.find((l) => l.id === id && l.categoria === slug);

  useTituloPagina(local ? `${local.nome} — Conecta Cidadão` : 'Local — Conecta Cidadão');

  // Categoria inexistente na URL: volta para o início.
  if (!categoria) return <Navigate to="/" replace />;

  return (
    <div data-categoria={slug}>
      <div className="container">
        {/* Trilha de navegação ("breadcrumb"): mostra onde a pessoa está. */}
        <nav className="trilha" aria-label="Você está em">
          <Link to="/">Início</Link> <span aria-hidden="true">›</span>{' '}
          <Link to={categoria.rota}>{categoria.nome}</Link>
          {local && (
            <>
              {' '}
              <span aria-hidden="true">›</span> <span aria-current="page">{local.nome}</span>
            </>
          )}
        </nav>

        <EstadoDados carregando={carregando} erro={erro} recarregar={recarregar}>
          {dados && !local ? (
            <div className="painel">
              <h1 className="titulo-pagina">Local não encontrado</h1>
              <p className="texto-apoio">
                Ele pode ter mudado de endereço ou saído da lista. Veja todos os locais de{' '}
                <Link to={categoria.rota}>{categoria.nome}</Link>.
              </p>
            </div>
          ) : (
            local && <DetalheLocal local={local} categoria={categoria} />
          )}
        </EstadoDados>
      </div>
    </div>
  );
}

function DetalheLocal({ local, categoria }) {
  const endereco = textoEndereco(local);
  return (
    <article className="local">
      <header className="local-topo">
        <div className="local-titulos">
          <span className="etiqueta">{local.tipo}</span>
          <h1 className="titulo-pagina">{local.nome}</h1>
          <SeloAberto horarios={local.horarios} completo />
        </div>
        {local.imagem && (
          <Foto
            className="local-foto"
            src={local.imagem}
            alt={`Foto de ${local.nome}`}
            sizes="(max-width: 760px) 100vw, 420px"
            largura={900}
            altura={600}
            prioridade
          />
        )}
      </header>

      {['saude', 'seguranca'].includes(local.categoria) && <EmergenciaRapida />}

      {local.observacao && (
        <p className="local-observacao" role="note">
          {local.observacao}
        </p>
      )}

      <div className="local-grade">
        <section className="painel local-bloco" aria-labelledby="t-endereco">
          <h2 id="t-endereco">Endereço</h2>
          {endereco ? <p>{endereco}</p> : <NaoDisponivel />}
          {local.coordenadas?.aproximada && (
            <p className="local-dica">A posição no mapa é aproximada (pela rua, sem o número).</p>
          )}
          <a className="botao-secundario" href={linkMapa(local)} target="_blank" rel="noreferrer">
            Abrir no mapa
          </a>
        </section>

        <section className="painel local-bloco" aria-labelledby="t-telefones">
          <h2 id="t-telefones">Telefones</h2>
          {local.telefones.length ? (
            <ul className="local-telefones">
              {local.telefones.map((tel) => (
                <li key={tel}>
                  {/* tel: abre o discador do celular; os espaços e símbolos saem do link. */}
                  <a href={`tel:${tel.replace(/[^\d+]/g, '')}`}>{tel}</a>
                </li>
              ))}
            </ul>
          ) : (
            <NaoDisponivel />
          )}
          {local.site && (
            <p>
              <a href={local.site} target="_blank" rel="noreferrer">
                Site oficial
              </a>
            </p>
          )}
        </section>

        <section className="painel local-bloco" aria-labelledby="t-horario">
          <h2 id="t-horario">Horário</h2>
          {local.horarios?.faixas?.length ? (
            <ul className="local-horarios">
              {local.horarios.vinteQuatroHoras ? (
                <li>24 horas, todos os dias</li>
              ) : (
                local.horarios.faixas.map((f) => (
                  <li key={`${f.dias.join()}-${f.abre}`}>
                    <strong>{textoDias(f.dias)}</strong> {f.abre} às {f.fecha}
                  </li>
                ))
              )}
            </ul>
          ) : null}
          {local.horarioTexto ? (
            <p className="local-dica">Como está na fonte: “{local.horarioTexto}”</p>
          ) : (
            <NaoDisponivel />
          )}
          {local.entrada && <p>Entrada: {local.entrada}</p>}
        </section>

        <section className="painel local-bloco" aria-labelledby="t-servicos">
          <h2 id="t-servicos">{local.niveis ? 'Ensino e serviços' : 'Serviços oferecidos'}</h2>
          {local.niveis && <p>Atende: {local.niveis.join(', ')}</p>}
          {local.servicos.length ? (
            <ul className="local-servicos">
              {local.servicos.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : (
            !local.niveis && <NaoDisponivel />
          )}
          <h3 className="local-subtitulo">Acessibilidade</h3>
          <p>
            Rampa e banheiro adaptado: <NaoDisponivel />
          </p>
        </section>
      </div>

      <section className="painel local-bloco local-como-chegar" aria-labelledby="t-chegar">
        <h2 id="t-chegar">Como chegar</h2>
        <PlanejadorRota destino={local} />
      </section>

      <footer className="local-rodape">
        <InfoFonte fontes={local.fonte} atualizadoEm={local.atualizadoEm} />
        <div className="local-acoes">
          <Link className="botao-secundario" to={`/lembretes?local=${local.id}`}>
            Criar lembrete para este local
          </Link>
          {/* Correções vão para a Ouvidoria oficial: este site não é da Prefeitura. */}
          <a className="botao-secundario" href={URL_OUVIDORIA} target="_blank" rel="noreferrer">
            Informar erro (Ouvidoria)
          </a>
          <Link className="botao-secundario" to={categoria.rota}>
            Ver todos de {categoria.nome}
          </Link>
        </div>
        <BotaoUtil pagina={`${local.categoria}/${local.id}`} />
      </footer>
    </article>
  );
}
