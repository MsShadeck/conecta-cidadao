/**
 * ListaBairros.jsx — Escolha do bairro em "Meu bairro".
 *
 * Os 118 bairros (pontos do OpenStreetMap) aparecem agrupados pela letra
 * inicial, como uma agenda, com:
 *  - um campo para filtrar enquanto digita (sem acento: "jd" acha "Jardim");
 *  - atalhos A–Z que levam ao grupo da letra;
 *  - o bairro atual destacado (aria-current) e a marca "coleta" nos bairros
 *    cujo dia de coleta a Prefeitura publica.
 *
 * @param {{bairros: Array, atual?: string}} props  atual = slug do bairro aberto
 */

import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { normalizar } from '../utils/texto.js';
import IconeLupa from './IconeLupa.jsx';

/** "Jd." e "Pq." como as pessoas escrevem → nome completo, para o filtro. */
const ABREVIACOES = {
  jd: 'jardim',
  pq: 'parque',
  vl: 'vila',
  res: 'residencial',
  cond: 'condominio',
};

function termoDoFiltro(texto) {
  return normalizar(texto)
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => ABREVIACOES[p.replace('.', '')] ?? p);
}

export default function ListaBairros({ bairros, atual = null }) {
  const [filtro, setFiltro] = useState('');
  // useId devolve algo como ":r1:"; sem os dois-pontos, vira um id seguro para os links "#".
  const idCampo = useId().replace(/:/g, '');

  // Agrupa por letra inicial (sem acento), já em ordem alfabética.
  const grupos = useMemo(() => {
    const palavras = termoDoFiltro(filtro);
    const mapa = new Map();
    [...bairros]
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      .filter((b) => palavras.every((p) => normalizar(b.nome).includes(p)))
      .forEach((b) => {
        const letra = normalizar(b.nome).charAt(0).toUpperCase();
        if (!mapa.has(letra)) mapa.set(letra, []);
        mapa.get(letra).push(b);
      });
    return [...mapa];
  }, [bairros, filtro]);

  const total = grupos.reduce((soma, [, lista]) => soma + lista.length, 0);

  return (
    <section className="lista-bairros" aria-labelledby={`${idCampo}-titulo`}>
      <div className="lista-bairros-topo">
        <h2 id={`${idCampo}-titulo`} className="lista-bairros-titulo">
          Escolha o seu bairro
        </h2>
        <label className="campo campo-busca lista-bairros-filtro">
          <IconeLupa />
          <span className="somente-leitor">Filtrar bairros</span>
          <input
            id={idCampo}
            type="search"
            placeholder="Filtrar: Morada do Sol, Jd. América..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
          {filtro && (
            <button
              type="button"
              className="campo-busca-limpar"
              onClick={() => setFiltro('')}
              aria-label="Limpar filtro"
            >
              ×
            </button>
          )}
        </label>
      </div>

      {/* Atalhos de letra: só quando a lista está completa (com filtro ela já é curta). */}
      {!filtro && (
        <nav className="lista-bairros-letras" aria-label="Ir para a letra">
          {grupos.map(([letra]) => (
            <a key={letra} href={`#${idCampo}-${letra}`}>
              {letra}
            </a>
          ))}
        </nav>
      )}

      <p className="info-fonte" role="status">
        {total === 0
          ? 'Nenhum bairro com esse nome. Tente digitar o CEP no campo lá em cima.'
          : `${total} ${total === 1 ? 'bairro' : 'bairros'}. Os nomes vêm do OpenStreetMap; "coleta" indica que a Prefeitura publica o dia da coleta de lixo.`}
      </p>

      <div className="lista-bairros-grupos">
        {grupos.map(([letra, lista]) => (
          <div key={letra} className="lista-bairros-grupo" id={`${idCampo}-${letra}`}>
            <span className="lista-bairros-letra" aria-hidden="true">
              {letra}
            </span>
            <ul className="lista-bairros-chips">
              {lista.map((b) => (
                <li key={b.slug}>
                  <Link
                    to={`/bairros/${b.slug}`}
                    className="lista-bairros-chip"
                    aria-current={b.slug === atual ? 'page' : undefined}
                  >
                    {b.nome}
                    {b.coleta && <span className="lista-bairros-coleta">coleta</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
