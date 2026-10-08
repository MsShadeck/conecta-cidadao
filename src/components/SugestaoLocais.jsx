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

/* ETAPA 3 — VERSÃO DA AULA: input controlado + botão Adicionar + ternário
   (Nos comentários JSX deste bloco, o fechamento foi escrito com uma barra
   invertida extra para não encerrar o comentário de fora antes da hora.)
   Problemas que a versão ativa corrige:
     - key={index}: ao remover/reordenar, o React confunde os itens;
     - as sugestões sumiam ao recarregar a página.

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
          preventDefault impede o formulário de recarregar a página. *\/}
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

      {/* Ternário: sem sugestões mostra a mensagem, senão mostra a lista *\/}
      {listaSugestoes.length === 0 ? (
        <p className="sugestao-vazio">Nenhuma sugestão cadastrada</p>
      ) : (
        <ul className="sugestao-lista">
          {/* (nome, index) em vez de reaproveitar o nome da lista, como no material *\/}
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
*/

// VERSÃO ATIVA — Etapa 3 com id único, botão Remover e localStorage.
import { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage.js';
import './SugestaoLocais.css';

/** @param {{categoriaSlug: string, categoriaNome: string}} props */
export default function SugestaoLocais({ categoriaSlug, categoriaNome }) {
  const [sugestao, setSugestao] = useState('');
  // Cada categoria tem a sua lista salva: cc:sugestoes:saude, cc:sugestoes:lazer...
  // Cada item agora é um objeto { id, nome } em vez de só o texto.
  const [listaSugestoes, setListaSugestoes] = useLocalStorage(`cc:sugestoes:${categoriaSlug}`, []);

  function adicionarSugestao() {
    const nome = sugestao.trim();
    if (nome === '') return;
    // crypto.randomUUID() gera um identificador único (ex.: "3b2f…"), que vira a key.
    // Diferente do índice, o id não muda quando outro item é removido.
    setListaSugestoes((prev) => [...prev, { id: crypto.randomUUID(), nome }]);
    setSugestao('');
  }

  function removerSugestao(id) {
    setListaSugestoes((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="sugestao">
      <h2 className="sugestao-titulo">Sentiu falta de algum local de {categoriaNome}?</h2>
      <p className="sugestao-ajuda">
        Anote aqui para não esquecer. A lista fica só neste navegador; para pedir a inclusão de um
        local, use o botão “Informar erro” na página de qualquer local.
      </p>

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

      {listaSugestoes.length === 0 ? (
        <p className="sugestao-vazio">Nenhuma sugestão cadastrada</p>
      ) : (
        <ul className="sugestao-lista">
          {listaSugestoes.map((item) => (
            <li key={item.id} className="etiqueta sugestao-item">
              {item.nome}
              <button
                type="button"
                className="sugestao-remover"
                onClick={() => removerSugestao(item.id)}
                aria-label={`Remover sugestão: ${item.nome}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
