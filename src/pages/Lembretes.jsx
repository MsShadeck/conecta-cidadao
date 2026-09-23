/**
 * Lembretes.jsx — Página "/lembretes": lista de pendências do cidadão.
 *
 * Aula "useEffect + Consumo de API" — Exemplo 6 (Todo do material) adaptado ao
 * tema: adicionar com prev => [...prev, tarefa], remover com filter pelo
 * índice e um useEffect com [lista] que registra a lista no console.
 */

import { useEffect, useState } from 'react';
import useTituloPagina from '../hooks/useTituloPagina.js';
import './Lembretes.css';

export default function Lembretes() {
  useTituloPagina('Lembretes — Conecta Cidadão');

  const [tarefa, setTarefa] = useState('');
  const [lista, setLista] = useState([]);

  function adicionar() {
    if (tarefa.trim() === '') return;
    // prev = lista atual; cria uma nova lista com a tarefa no final.
    setLista((prev) => [...prev, tarefa]);
    setTarefa('');
  }

  function remover(index) {
    // Mantém todas as tarefas, menos a do índice clicado.
    setLista((prev) => prev.filter((_, i) => i !== index));
  }

  // Executa sempre que a lista mudar (abra o console com F12 para ver).
  useEffect(() => {
    console.log('Lista atualizada:', lista);
  }, [lista]);

  return (
    <>
      <section className="container pagina-topo">
        <h1 className="titulo-pagina">Meus lembretes</h1>
        <p className="texto-apoio">
          Anote o que você precisa resolver nos serviços da cidade, como agendar uma consulta
          ou fazer a matrícula na escola.
        </p>
      </section>

      <section className="container">
        <div className="painel lembretes">
          <form
            className="lembretes-form"
            onSubmit={(evento) => {
              evento.preventDefault();
              adicionar();
            }}
          >
            <input
              className="campo lembretes-input"
              type="text"
              placeholder="Ex.: Levar o cartão do SUS na UBS"
              aria-label="Novo lembrete"
              value={tarefa}
              onChange={(evento) => setTarefa(evento.target.value)}
            />
            <button type="submit" className="botao-primario">
              Adicionar
            </button>
          </form>

          <p className="lembretes-total">Total de lembretes: {lista.length}</p>

          {lista.length === 0 && <p className="lembretes-vazio">Nenhum lembrete</p>}

          <ul className="lembretes-lista">
            {lista.map((item, index) => (
              <li key={index} className="lembrete">
                <span>{item}</span>
                <button
                  type="button"
                  className="lembrete-remover"
                  onClick={() => remover(index)}
                  aria-label={`Remover lembrete: ${item}`}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
