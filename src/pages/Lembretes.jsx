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
// PI 2 (v3): quem entra na conta grava os lembretes no banco MySQL, pela API
// (hook useColecao); o visitante continua usando o navegador.
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useColecao } from '../hooks/useDadosDoUsuario.js';
import { useSessao } from '../context/SessaoContext.jsx';
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
  // Cada item é { id, texto, data?, hora?, localId? }. Visitante: localStorage
  // (sobrevive ao F5). Logado: tabela lembrete do banco, pela API /api/lembretes.
  const {
    lista,
    adicionar: salvar,
    remover: excluir,
    online,
    carregando,
    erro: erroLista,
    noNavegador,
    importarDoNavegador,
  } = useColecao({ chaveLocal: 'cc:lembretes', caminho: '/lembretes' });
  const { apiAtiva } = useSessao();
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

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

  async function adicionar() {
    const texto = tarefa.trim();
    if (texto === '') return;
    // O id é criado pelo hook (navegador) ou pelo banco (API).
    const novo = { texto };
    if (data) novo.data = data;
    if (data && hora) novo.hora = hora;
    if (localId) novo.localId = localId;
    setErro(null);
    setSalvando(true);
    try {
      await salvar(novo);
      setTarefa('');
      setData('');
      setHora('');
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id) {
    // Remove pelo id: apagar um item do meio não afeta os outros.
    setErro(null);
    try {
      await excluir(id);
    } catch (e) {
      setErro(e.message);
    }
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
          fazer a matrícula na escola. Os que têm data podem ir para a agenda do celular.
        </p>
        <p className="texto-apoio lembretes-onde">
          {online ? (
            'Seus lembretes ficam salvos na sua conta e aparecem em qualquer aparelho em que você entrar.'
          ) : (
            <>
              Os lembretes ficam salvos só neste navegador.
              {apiAtiva && (
                <>
                  {' '}
                  <Link to="/entrar">Entre na sua conta</Link> para guardá-los em qualquer aparelho.
                </>
              )}
            </>
          )}
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
            <button type="submit" className="botao-primario" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Adicionar'}
            </button>
          </form>
          {(erro || erroLista) && (
            <p className="lembretes-erro" role="alert">
              {erro || erroLista}
            </p>
          )}
          {noNavegador > 0 && (
            <p className="lembretes-dica">
              Há {noNavegador} {noNavegador === 1 ? 'lembrete salvo' : 'lembretes salvos'} só neste
              navegador.{' '}
              <button
                type="button"
                className="lembretes-importar"
                onClick={() => importarDoNavegador().catch((e) => setErro(e.message))}
              >
                Levar para a minha conta
              </button>
            </p>
          )}
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

          {carregando && (
            <p className="lembretes-vazio" role="status">
              Carregando seus lembretes...
            </p>
          )}
          {!carregando && lista.length === 0 && <p className="lembretes-vazio">Nenhum lembrete</p>}

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
                          `${formatarData(item.data)}${item.hora ? ` às ${item.hora}` : ''}`}
                        {item.data && local && ' · '}
                        {local && (
                          <Link to={`/${local.categoria}/${local.id}`}>
                            <MapPin size={13} strokeWidth={2.25} /> {local.nome}
                          </Link>
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
