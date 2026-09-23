/**
 * SugestaoLocais.jsx — "Sugira um local" nas páginas de categoria.
 *
 * Aula "Review + Rotas": é o ListaAlunos do material adaptado ao tema — em vez
 * de alunos, o cidadão sugere locais que ainda não aparecem na categoria.
 * As três etapas da prática foram mantidas: as duas primeiras comentadas.
 *
 * @param {{categoriaNome: string}} props - nome da categoria, ex.: 'Saúde'.
 */

/* ETAPA 1 — Lista fixa renderizada com map (key={index})

export default function SugestaoLocais() {
  const sugestoes = ['Nova UBS', 'Nova escola', 'Novo parque', 'Nova base da Guarda'];

  return (
    <ul>
      {sugestoes.map((sugestao, index) => (
        <li key={index}>{sugestao}</li>
      ))}
    </ul>
  );
}
*/

/* ETAPA 2 — Lista vazia + renderização condicional com &&

export default function SugestaoLocais() {
  const sugestoes = [];

  return (
    <div>
      {sugestoes.length === 0 && <p>Nenhuma sugestão cadastrada</p>}

      <ul>
        {sugestoes.map((sugestao, index) => (
          <li key={index}>{sugestao}</li>
        ))}
      </ul>
    </div>
  );
}
*/

// ETAPA 3 (ATIVA) — input controlado + botão Adicionar + ternário
import { useState } from 'react';
import './SugestaoLocais.css';

export default function SugestaoLocais({ categoriaNome }) {
  // sugestao = texto digitado no campo (input controlado)
  const [sugestao, setSugestao] = useState('');
  // listaSugestoes = sugestões já adicionadas
  const [listaSugestoes, setListaSugestoes] = useState([]);

  function adicionarSugestao() {
    if (sugestao.trim() === '') return; // não adiciona texto vazio
    setListaSugestoes([...listaSugestoes, sugestao]);
    // Limpa o campo. (No material estava setNome(""), função que não existia.)
    setSugestao('');
  }

  return (
    <div className="sugestao">
      <h2 className="sugestao-titulo">Sentiu falta de algum local de {categoriaNome}?</h2>

      {/* onSubmit permite adicionar tanto pelo botão quanto pela tecla Enter.
          preventDefault impede o formulário de recarregar a página. */}
      <form
        className="sugestao-form"
        onSubmit={(evento) => {
          evento.preventDefault();
          adicionarSugestao();
        }}
      >
        <input
          className="campo sugestao-input"
          type="text"
          placeholder="Nome do local"
          aria-label="Nome do local sugerido"
          value={sugestao}
          onChange={(evento) => setSugestao(evento.target.value)}
        />
        <button type="submit" className="botao-primario">
          Adicionar
        </button>
      </form>

      {/* Ternário: sem sugestões mostra a mensagem, senão mostra a lista */}
      {listaSugestoes.length === 0 ? (
        <p className="sugestao-vazio">Nenhuma sugestão cadastrada</p>
      ) : (
        <ul className="sugestao-lista">
          {/* (nome, index) em vez de reaproveitar o nome da lista, como no material */}
          {listaSugestoes.map((nome, index) => (
            <li key={index} className="etiqueta">
              {nome}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
