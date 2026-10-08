/**
 * Lembretes.jsx — Página "/lembretes": lista de pendências do cidadão.
 *
 * Aula "useEffect + Consumo de API" — Exemplo 6 (Todo do material) adaptado ao
 * tema: adicionar com prev => [...prev, tarefa], remover com filter e um
 * useEffect com [lista] que registra a lista no console.
 *
 * A versão da aula ficou comentada logo abaixo; a versão ativa vem depois.
 */

/* VERSÃO DA AULA — Exemplo 6 (lista de tarefas)
   Problemas que a versão ativa corrige:
     - key={index} e remoção pelo índice: ao apagar um item do meio, o React
       reaproveita os elementos errados;
     - a lista sumia ao recarregar a página (F5).

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
*/

// VERSÃO ATIVA — cada lembrete tem id único, data opcional, pode ser ligado a
// um local do site e pode ir para o calendário do celular (.ics).
// A lista fica salva no navegador (useLocalStorage).
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage.js';
import useTituloPagina from '../hooks/useTituloPagina.js';
import useDados from '../hooks/useDados.js';
import { formatarData } from '../utils/datas.js';
import { baixarArquivo, gerarIcs } from '../utils/ics.js';
import './Lembretes.css';

export default function Lembretes() {
  useTituloPagina('Lembretes — Conecta Cidadão');
  const [parametros] = useSearchParams();
  const { dados } = useDados('/api/locais.json');

  // ?texto=... (vindo do "Criar lembrete" do checklist) já preenche o campo.
  const [tarefa, setTarefa] = useState(() => parametros.get('texto') ?? '');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  // ?local=ubs-cecap (vindo do botão "Criar lembrete" da página do local) já
  // chega selecionado.
  const [localId, setLocalId] = useState(() => parametros.get('local') ?? '');
  // useLocalStorage no lugar do useState: a lista sobrevive ao F5.
  // Cada item é { id, texto, data?, hora?, localId? }. Os lembretes salvos pela
  // versão anterior ({ id, texto }) continuam funcionando.
  const [lista, setLista] = useLocalStorage('cc:lembretes', []);

  const locaisPorId = useMemo(() => new Map((dados?.locais ?? []).map((l) => [l.id, l])), [dados]);
  const localEscolhido = locaisPorId.get(localId);

  // Ordem: primeiro os que têm data (da mais próxima para a mais distante), depois os sem data.
  const ordenada = useMemo(
    () =>
      [...lista].sort((a, b) => {
        if (a.data && b.data)
          return `${a.data}${a.hora ?? ''}`.localeCompare(`${b.data}${b.hora ?? ''}`);
        if (a.data) return -1;
        if (b.data) return 1;
        return 0;
      }),
    [lista]
  );

  function adicionar() {
    const texto = tarefa.trim();
    if (texto === '') return;
    // crypto.randomUUID() cria um id único, usado como key e para remover.
    const novo = { id: crypto.randomUUID(), texto };
    if (data) novo.data = data;
    if (data && hora) novo.hora = hora;
    if (localId) novo.localId = localId;
    setLista((prev) => [...prev, novo]);
    setTarefa('');
    setData('');
    setHora('');
  }

  function remover(id) {
    // Remove pelo id: apagar um item do meio não afeta os outros.
    setLista((prev) => prev.filter((item) => item.id !== id));
  }

  /** Junta o local completo (nome e endereço) para o arquivo de calendário. */
  function comLocal(item) {
    const local = locaisPorId.get(item.localId);
    return local ? { ...item, local } : item;
  }

  function exportar(itens, nome) {
    baixarArquivo(gerarIcs(itens.map(comLocal)), nome);
  }

  const comData = lista.filter((item) => item.data);

  return (
    <>
      <section className="container pagina-topo">
        <h1 className="titulo-pagina">Meus lembretes</h1>
        <p className="texto-apoio">
          Anote o que você precisa resolver nos serviços de Indaiatuba, como agendar uma consulta ou
          fazer a matrícula na escola. Os lembretes ficam salvos só neste navegador; os que têm data
          podem ir para a agenda do celular.
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
            <label className="lembretes-campo lembretes-campo--texto">
              <span>O que fazer</span>
              <input
                className="campo"
                type="text"
                placeholder="Ex.: Levar o cartão do SUS na UBS"
                value={tarefa}
                onChange={(evento) => setTarefa(evento.target.value)}
                required
              />
            </label>
            <label className="lembretes-campo">
              <span>Data (opcional)</span>
              <input
                className="campo"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </label>
            <label className="lembretes-campo">
              <span>Hora (opcional)</span>
              <input
                className="campo"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                disabled={!data}
              />
            </label>
            <label className="lembretes-campo lembretes-campo--texto">
              <span>Local (opcional)</span>
              <select
                className="campo"
                value={localId}
                onChange={(e) => setLocalId(e.target.value)}
              >
                <option value="">Nenhum</option>
                {(dados?.locais ?? []).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="botao-primario">
              Adicionar
            </button>
          </form>
          {localEscolhido && (
            <p className="lembretes-dica">
              Ligado a: <strong>{localEscolhido.nome}</strong>
              {localEscolhido.enderecoTexto && ` — ${localEscolhido.enderecoTexto}`}
            </p>
          )}

          <div className="lembretes-barra">
            <p className="lembretes-total">Total de lembretes: {lista.length}</p>
            {comData.length > 0 && (
              <button
                type="button"
                className="botao-secundario"
                onClick={() => exportar(comData, 'lembretes.ics')}
              >
                Baixar todos para o calendário (.ics)
              </button>
            )}
          </div>

          {lista.length === 0 && <p className="lembretes-vazio">Nenhum lembrete</p>}

          <ul className="lembretes-lista">
            {ordenada.map((item) => {
              const local = locaisPorId.get(item.localId);
              return (
                <li key={item.id} className="lembrete">
                  <div className="lembrete-texto">
                    <span>{item.texto}</span>
                    {(item.data || local) && (
                      <small>
                        {item.data &&
                          `📅 ${formatarData(item.data)}${item.hora ? ` às ${item.hora}` : ''}`}
                        {item.data && local && ' · '}
                        {local && (
                          <Link to={`/${local.categoria}/${local.id}`}>📍 {local.nome}</Link>
                        )}
                      </small>
                    )}
                  </div>
                  <div className="lembrete-acoes">
                    {item.data && (
                      <button
                        type="button"
                        className="lembrete-calendario"
                        onClick={() => exportar([item], 'lembrete.ics')}
                        aria-label={`Adicionar ao calendário: ${item.texto}`}
                      >
                        Calendário
                      </button>
                    )}
                    <button
                      type="button"
                      className="lembrete-remover"
                      onClick={() => remover(item.id)}
                      aria-label={`Remover lembrete: ${item.texto}`}
                    >
                      Remover
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
