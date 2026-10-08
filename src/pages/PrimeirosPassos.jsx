/**
 * PrimeirosPassos.jsx — Página "/primeiros-passos": checklist da mudança.
 *
 * Para quem está se mudando para Indaiatuba: o que resolver (saúde, escola,
 * água, luz, IPTU, coleta, documentos, ônibus, pets), com o que é, por que
 * importa, como fazer, documentos e prazo (só quando a fonte oficial informa)
 * e os links oficiais. Os itens vêm de /api/checklist.json.
 *
 *  - "Marcar como feito" e o perfil (crianças, carro, pet) ficam salvos no
 *    navegador com useLocalStorage;
 *  - "Criar lembrete" abre a página Lembretes já com o texto;
 *  - "Imprimir / salvar PDF" usa a folha de impressão (@media print).
 */

import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useDados from '../hooks/useDados.js';
import useLocalStorage from '../hooks/useLocalStorage.js';
import useTituloPagina from '../hooks/useTituloPagina.js';
import EstadoDados from '../components/EstadoDados.jsx';
import InfoFonte from '../components/InfoFonte.jsx';
import IconeCategoria from '../components/IconeCategoria.jsx';
import './PrimeirosPassos.css';

const PERFIS = [
  { id: 'criancas', rotulo: 'Moro com crianças' },
  { id: 'carro', rotulo: 'Tenho carro ou moto' },
  { id: 'pet', rotulo: 'Tenho cão ou gato' },
];

/** O item vale para esta pessoa? (itens sem perfil valem para todo mundo) */
export function itemSeAplica(item, perfil) {
  return !item.perfil || Boolean(perfil[item.perfil]);
}

export default function PrimeirosPassos() {
  useTituloPagina(
    'Primeiros passos em Indaiatuba — Conecta Cidadão',
    'Checklist da mudança para Indaiatuba: Cartão SUS, creche e escola, água, luz, IPTU, coleta de lixo, título de eleitor, cartão do ônibus e pets.'
  );
  const { dados, carregando, erro, recarregar } = useDados('/api/checklist.json');
  const { hash } = useLocation();

  // Veio da busca (/primeiros-passos#passo-agua): rola até o item quando a lista chega.
  useEffect(() => {
    if (!dados || !hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [dados, hash]);
  // Itens feitos: { 'agua': true, ... } — e o perfil da casa.
  const [feitos, setFeitos] = useLocalStorage('cc:checklist', {});
  const [perfil, setPerfil] = useLocalStorage('cc:perfil', {
    criancas: true,
    carro: true,
    pet: true,
  });

  const itens = (dados?.itens ?? []).filter((item) => itemSeAplica(item, perfil));
  const total = itens.filter((item) => feitos[item.id]).length;

  return (
    <div data-categoria="passos">
      <section className="container pagina-topo passos-topo">
        <h1 className="titulo-pagina">Primeiros passos em Indaiatuba</h1>
        <p className="texto-apoio">
          O que quase todo mundo precisa resolver ao se mudar para a cidade. Marque o que já fez: o
          progresso fica salvo neste navegador.
        </p>

        {/* Perfil: esconde os itens que não se aplicam (sem crianças, sem carro...). */}
        <fieldset className="passos-perfil sem-impressao">
          <legend>Mostrar itens para:</legend>
          {PERFIS.map((p) => (
            <label key={p.id}>
              <input
                type="checkbox"
                checked={Boolean(perfil[p.id])}
                onChange={() => setPerfil((anterior) => ({ ...anterior, [p.id]: !anterior[p.id] }))}
              />
              {p.rotulo}
            </label>
          ))}
        </fieldset>

        {dados && (
          <div className="passos-progresso-area">
            {/* <progress> é a barra de progresso nativa; o texto ao lado repete o valor. */}
            <progress
              className="passos-barra"
              max={itens.length}
              value={total}
              aria-hidden="true"
            />
            <p className="passos-progresso" role="status">
              Você já resolveu {total} de {itens.length}
            </p>
            <button
              type="button"
              className="botao-secundario sem-impressao"
              onClick={() => window.print()}
            >
              Imprimir / salvar PDF
            </button>
          </div>
        )}
      </section>

      <EstadoDados carregando={carregando} erro={erro} recarregar={recarregar}>
        {dados && (
          <div className="container passos">
            {dados.grupos.map((grupo) => {
              const doGrupo = itens.filter((item) => item.grupo === grupo.id);
              if (doGrupo.length === 0) return null;
              return (
                <section
                  key={grupo.id}
                  className="passos-grupo"
                  aria-labelledby={`grupo-${grupo.id}`}
                  data-categoria={grupo.categoria}
                >
                  <h2 id={`grupo-${grupo.id}`} className="passos-grupo-titulo">
                    <IconeCategoria slug={grupo.categoria} />
                    {grupo.nome}
                  </h2>
                  <ol className="passos-lista">
                    {doGrupo.map((item) => (
                      <ItemChecklist
                        key={item.id}
                        item={item}
                        feito={Boolean(feitos[item.id])}
                        alternar={() =>
                          setFeitos((anterior) => ({ ...anterior, [item.id]: !anterior[item.id] }))
                        }
                      />
                    ))}
                  </ol>
                </section>
              );
            })}
            <InfoFonte atualizadoEm={dados.atualizadoEm} />
            <p className="info-fonte">
              Documentos e prazos só aparecem quando a fonte oficial informa. Quando não aparecem:
              Informação não disponível — confira no órgão responsável.
            </p>
          </div>
        )}
      </EstadoDados>
    </div>
  );
}

/** Um item do checklist (cartão com o passo a passo). */
function ItemChecklist({ item, feito, alternar }) {
  return (
    <li id={`passo-${item.id}`} className={`painel passo${feito ? ' passo--feito' : ''}`}>
      <div className="passo-topo">
        <h3>{item.titulo}</h3>
        {item.online !== null && (
          <span className="etiqueta">{item.online ? 'Dá para fazer online' : 'Presencial'}</span>
        )}
      </div>

      <dl className="passo-detalhes">
        <dt>O que é</dt>
        <dd>{item.oQueE}</dd>
        <dt>Por que importa</dt>
        <dd>{item.porQue}</dd>
        <dt>Como fazer</dt>
        <dd>{item.comoFazer}</dd>
        <dt>Documentos</dt>
        <dd>
          {item.documentos ? (
            <ul>
              {item.documentos.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          ) : (
            <span className="nao-disponivel">
              Informação não disponível — confira no órgão responsável.
            </span>
          )}
        </dd>
        {item.prazo && (
          <>
            <dt>Prazo</dt>
            <dd>{item.prazo}</dd>
          </>
        )}
      </dl>

      <div className="passo-acoes">
        {item.pagina && (
          <Link className="botao-secundario" to={item.pagina.rota}>
            {item.pagina.nome}
          </Link>
        )}
        {item.links.map((link) => (
          <a
            key={link.url}
            className="botao-secundario"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.nome} ↗
          </a>
        ))}
      </div>

      <div className="passo-rodape">
        <label className="passo-feito">
          <input type="checkbox" checked={feito} onChange={alternar} />
          {feito ? 'Feito' : 'Marcar como feito'}
        </label>
        <Link
          className="passo-lembrete sem-impressao"
          to={`/lembretes?texto=${encodeURIComponent(item.titulo)}`}
        >
          Criar lembrete
        </Link>
      </div>
      <InfoFonte fontes={item.fonte} />
    </li>
  );
}
