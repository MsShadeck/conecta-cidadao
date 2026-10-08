/**
 * CampoDestino.jsx — "Para onde você quer ir?" com busca por texto.
 *
 * É um "combobox": um campo de texto com uma lista de sugestões embaixo.
 * A pessoa digita qualquer pedaço do nome, do tipo ou do bairro ("ubs",
 * "shopping", "faculdade", "morada do sol") e escolhe na lista com o mouse,
 * o dedo ou o teclado (setas, Enter e Esc).
 *
 * Acessibilidade (padrão WAI-ARIA de combobox):
 *  - role="combobox" + aria-expanded no campo;
 *  - role="listbox" na lista e role="option" em cada item;
 *  - aria-activedescendant diz ao leitor de tela qual opção está destacada.
 *
 * @param {{locais: Array, valor: string, aoEscolher: Function}} props
 *   locais     - locais que podem ser destino (com coordenadas)
 *   valor      - id do destino escolhido ('' = nenhum)
 *   aoEscolher - chamada com o id escolhido ('' ao limpar)
 */

import { useId, useMemo, useState } from 'react';
import { buscarCategoria } from '../data/servicos.js';
import { normalizar } from '../utils/texto.js';
import { pontuarLocal } from '../utils/busca.js';
import IconeLupa from './IconeLupa.jsx';
import './CampoDestino.css';

const LIMITE = 12;

export default function CampoDestino({ locais, valor, aoEscolher }) {
  const escolhido = locais.find((l) => l.id === valor);
  // O texto do campo começa com o nome do destino já escolhido (ex.: vindo da URL).
  const [texto, setTexto] = useState(escolhido?.nome ?? '');
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const idLista = useId();

  // Sugestões: as mais relevantes para o texto (mesma pontuação da busca global).
  const sugestoes = useMemo(() => {
    const palavras = normalizar(texto).split(/\s+/).filter(Boolean);
    if (!palavras.length || (escolhido && texto === escolhido.nome)) return [];
    return locais
      .map((local) => ({ local, pontos: pontuarLocal(local, palavras) }))
      .filter((r) => r.pontos > 0)
      .sort((a, b) => b.pontos - a.pontos || a.local.nome.localeCompare(b.local.nome, 'pt-BR'))
      .slice(0, LIMITE)
      .map((r) => r.local);
  }, [texto, locais, escolhido]);

  const mostrarLista = aberto && sugestoes.length > 0;

  function escolher(local) {
    setTexto(local.nome);
    setAberto(false);
    aoEscolher(local.id);
  }

  function aoDigitar(evento) {
    setTexto(evento.target.value);
    setAtivo(0);
    setAberto(true);
    if (valor) aoEscolher(''); // mudou o texto: o destino anterior deixa de valer
  }

  function aoTeclar(evento) {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      setAberto(true);
      setAtivo((i) => (sugestoes.length ? (i + 1) % sugestoes.length : 0));
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      setAtivo((i) => (sugestoes.length ? (i - 1 + sugestoes.length) % sugestoes.length : 0));
    } else if (evento.key === 'Enter' && mostrarLista) {
      evento.preventDefault();
      escolher(sugestoes[ativo]);
    } else if (evento.key === 'Escape') {
      setAberto(false);
    }
  }

  function limpar() {
    setTexto('');
    setAberto(false);
    aoEscolher('');
  }

  return (
    <div className="campo-destino">
      <label className="campo-destino-rotulo" htmlFor={`${idLista}-campo`}>
        Para onde você quer ir?
      </label>
      <div className="campo campo-busca">
        <IconeLupa />
        <input
          id={`${idLista}-campo`}
          type="text"
          role="combobox"
          aria-expanded={mostrarLista}
          aria-controls={`${idLista}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={mostrarLista ? `${idLista}-opcao-${ativo}` : undefined}
          autoComplete="off"
          placeholder="Digite: UBS, escola, shopping, faculdade, bairro..."
          value={texto}
          onChange={aoDigitar}
          onKeyDown={aoTeclar}
          onFocus={() => setAberto(true)}
          // Fecha depois de um instante, para o clique numa opção ainda contar.
          onBlur={() => window.setTimeout(() => setAberto(false), 150)}
        />
        {texto && (
          <button
            type="button"
            className="campo-busca-limpar"
            onClick={limpar}
            aria-label="Limpar destino"
          >
            ×
          </button>
        )}
      </div>

      {mostrarLista && (
        <ul
          id={`${idLista}-lista`}
          role="listbox"
          className="campo-destino-lista"
          aria-label="Destinos encontrados"
        >
          {sugestoes.map((local, indice) => (
            <li
              key={local.id}
              id={`${idLista}-opcao-${indice}`}
              role="option"
              aria-selected={indice === ativo}
              data-categoria={local.categoria}
              className={`campo-destino-opcao${indice === ativo ? ' campo-destino-opcao--ativa' : ''}`}
              // onMouseDown (e não onClick): acontece antes de o campo perder o foco.
              onMouseDown={(evento) => {
                evento.preventDefault();
                escolher(local);
              }}
              onMouseEnter={() => setAtivo(indice)}
            >
              <span className="campo-destino-cor" aria-hidden="true" />
              <span>
                <strong>{local.nome}</strong>
                <small>
                  {[buscarCategoria(local.categoria)?.nome, local.tipo, local.endereco?.bairro]
                    .filter(Boolean)
                    .join(' · ')}
                </small>
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Anuncia quantas sugestões apareceram (ou que nada foi encontrado). */}
      <p className="somente-leitor" role="status">
        {aberto && texto && !escolhido
          ? sugestoes.length
            ? `${sugestoes.length} destinos encontrados. Use as setas para escolher.`
            : 'Nenhum destino encontrado.'
          : ''}
      </p>
      {aberto && texto && !escolhido && sugestoes.length === 0 && (
        <p className="campo-destino-vazio">Nenhum destino encontrado para “{texto}”.</p>
      )}
    </div>
  );
}
