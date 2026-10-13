/**
 * ListaBairros.jsx — Escolha do bairro em "Meu bairro".
 *
 * 75 dos 118 bairros começam com "Jardim". Para a lista não virar uma parede de
 * "Jardim, Jardim, Jardim...", ela é organizada assim:
 *  - abas por tipo (Jardins, Vilas, Parques...), cada uma com a contagem;
 *  - cartões em grade: o tipo pequeno em cima ("JARDIM") e o nome em destaque
 *    embaixo ("América");
 *  - divisórias por letra dentro dos grupos grandes;
 *  - filtro enquanto digita (sem acento; aceita "Jd.", "Pq.", "Vl.").
 * O bairro aberto fica destacado (aria-current) e a marca "coleta" indica que a
 * Prefeitura publica o dia da coleta de lixo naquele bairro.
 *
 * @param {{bairros: Array, atual?: string}} props  atual = slug do bairro aberto
 */

import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { normalizar } from '../utils/texto.js';
import IconeLupa from './IconeLupa.jsx';

/** Tipos de bairro, na ordem das abas. "prefixo" é tirado do nome no cartão. */
const TIPOS = [
  { id: 'jardim', nome: 'Jardins', prefixo: /^Jardim\s+/ },
  { id: 'vila', nome: 'Vilas', prefixo: /^Vila\s+/ },
  { id: 'parque', nome: 'Parques', prefixo: /^Parque\s+/ },
  { id: 'residencial', nome: 'Residenciais', prefixo: /^Residencial\s+/ },
  { id: 'distrito', nome: 'Distritos industriais', prefixo: /^Distrito Industrial\s+/ },
  { id: 'outros', nome: 'Outros', prefixo: null },
];

/** Grupos com mais bairros que isso ganham divisórias por letra. */
const MINIMO_PARA_LETRAS = 16;

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

/** Bairro → { ...bairro, tipo, rotuloTipo, nomeCurto } (ex.: Jardim América → "Jardim" + "América"). */
function classificar(bairro) {
  const tipo = TIPOS.find((t) => t.prefixo?.test(bairro.nome)) ?? TIPOS[TIPOS.length - 1];
  if (!tipo.prefixo) return { ...bairro, tipo: tipo.id, rotuloTipo: null, nomeCurto: bairro.nome };
  const nomeCurto = bairro.nome.replace(tipo.prefixo, '');
  return {
    ...bairro,
    tipo: tipo.id,
    rotuloTipo: bairro.nome.slice(0, bairro.nome.length - nomeCurto.length).trim(),
    nomeCurto,
  };
}

/** Lista → [[letra, bairros]], pela inicial do nome curto. */
function porLetra(lista) {
  const mapa = new Map();
  for (const b of lista) {
    const letra = normalizar(b.nomeCurto).charAt(0).toUpperCase();
    if (!mapa.has(letra)) mapa.set(letra, []);
    mapa.get(letra).push(b);
  }
  return [...mapa];
}

export default function ListaBairros({ bairros, atual = null }) {
  const [filtro, setFiltro] = useState('');
  const [aba, setAba] = useState('todos');
  // useId devolve algo como ":r1:"; sem os dois-pontos, vira um id seguro.
  const id = useId().replace(/:/g, '');

  const classificados = useMemo(
    () => bairros.map(classificar).sort((a, b) => a.nomeCurto.localeCompare(b.nomeCurto, 'pt-BR')),
    [bairros]
  );
  const contagem = useMemo(() => {
    const total = {};
    for (const b of classificados) total[b.tipo] = (total[b.tipo] ?? 0) + 1;
    return total;
  }, [classificados]);

  // Com texto no filtro, procura em todos os tipos (a aba não esconde o que foi digitado).
  const palavras = termoDoFiltro(filtro);
  const visiveis = classificados.filter(
    (b) =>
      (palavras.length > 0 || aba === 'todos' || b.tipo === aba) &&
      palavras.every((p) => normalizar(b.nome).includes(p))
  );
  const secoes = TIPOS.map((t) => ({
    ...t,
    bairros: visiveis.filter((b) => b.tipo === t.id),
  })).filter((s) => s.bairros.length > 0);

  return (
    <section className="lista-bairros" aria-labelledby={`${id}-titulo`}>
      <div className="lista-bairros-topo">
        <div>
          <h2 id={`${id}-titulo`} className="lista-bairros-titulo">
            Escolha o seu bairro
          </h2>
          <p className="info-fonte">
            {bairros.length} bairros do OpenStreetMap.{' '}
            <span className="lista-bairros-coleta">coleta</span> = a Prefeitura publica o dia da
            coleta de lixo.
          </p>
        </div>
        <label className="campo campo-busca lista-bairros-filtro">
          <IconeLupa />
          <span className="somente-leitor">Filtrar bairros pelo nome</span>
          <input
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
              <X size={16} strokeWidth={2} />
            </button>
          )}
        </label>
      </div>

      {/* Abas por tipo: botões de alternância (aria-pressed), como em Lista/Mapa nas categorias. */}
      {!filtro && (
        <div className="lista-bairros-abas" role="group" aria-label="Tipo de bairro">
          <button type="button" aria-pressed={aba === 'todos'} onClick={() => setAba('todos')}>
            Todos <span>{bairros.length}</span>
          </button>
          {TIPOS.filter((t) => contagem[t.id]).map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={aba === t.id}
              onClick={() => setAba(t.id)}
            >
              {t.nome} <span>{contagem[t.id]}</span>
            </button>
          ))}
        </div>
      )}

      <p className="somente-leitor" role="status">
        {visiveis.length} {visiveis.length === 1 ? 'bairro' : 'bairros'}
      </p>
      {visiveis.length === 0 && (
        <p className="painel lista-bairros-vazio">
          Nenhum bairro com esse nome na lista. Digite o CEP no campo lá em cima: ele encontra a sua
          rua mesmo que o bairro não esteja aqui.
        </p>
      )}

      {secoes.map((secao) => (
        <div key={secao.id} className="lista-bairros-secao">
          {/* Na aba "Todos" (ou com filtro), cada tipo ganha um título. */}
          {(aba === 'todos' || filtro) && (
            <h3 className="lista-bairros-secao-titulo">
              {secao.nome} <span>{secao.bairros.length}</span>
            </h3>
          )}
          {secao.bairros.length >= MINIMO_PARA_LETRAS && !filtro ? (
            porLetra(secao.bairros).map(([letra, lista]) => (
              <div key={letra} className="lista-bairros-letra-grupo">
                <span className="lista-bairros-letra" aria-hidden="true">
                  {letra}
                </span>
                <Cartoes bairros={lista} atual={atual} />
              </div>
            ))
          ) : (
            <Cartoes bairros={secao.bairros} atual={atual} />
          )}
        </div>
      ))}
    </section>
  );
}

/** Grade de cartões de bairro. */
function Cartoes({ bairros, atual }) {
  return (
    <ul className="lista-bairros-grade">
      {bairros.map((b) => (
        <li key={b.slug}>
          <Link
            to={`/bairros/${b.slug}`}
            className="lista-bairros-cartao"
            aria-current={b.slug === atual ? 'page' : undefined}
          >
            {/* O nome completo vai para o leitor de tela; na tela, tipo + nome curto. */}
            <span className="somente-leitor">{b.nome}</span>
            <span aria-hidden="true" className="lista-bairros-cartao-texto">
              {b.rotuloTipo && <span className="lista-bairros-tipo">{b.rotuloTipo}</span>}
              <span className="lista-bairros-nome">{b.nomeCurto}</span>
            </span>
            {b.coleta && <span className="lista-bairros-coleta">coleta</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
