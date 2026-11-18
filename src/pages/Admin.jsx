/**
 * Admin.jsx — Painel do administrador (rota /admin).
 *
 *  - Locais (UC14): incluir, consultar, alterar e excluir — o CRUD do catálogo no banco;
 *  - Sugestões (UC15): aprovar ou recusar o que os usuários sugeriram;
 *  - Votos: quantas pessoas marcaram cada página como útil.
 *
 * Tudo passa pela API (Spring Boot), que confere o perfil ADMIN no token antes de
 * gravar. Esconder o painel no menu é só conforto: a proteção de verdade é a API.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useSessao } from '../context/SessaoContext.jsx';
import useTituloPagina from '../hooks/useTituloPagina.js';
import './Admin.css';

const DIAS = [
  ['seg', 'Seg'],
  ['ter', 'Ter'],
  ['qua', 'Qua'],
  ['qui', 'Qui'],
  ['sex', 'Sex'],
  ['sab', 'Sáb'],
  ['dom', 'Dom'],
];

const FORM_VAZIO = {
  nome: '',
  tipoLocalId: '',
  logradouro: '',
  numero: '',
  bairroNome: '',
  cep: '',
  latitude: '',
  longitude: '',
  horarioTexto: '',
  vinteQuatroHoras: false,
  site: '',
  observacao: '',
  telefones: '',
  fontes: '',
  servicos: '',
  palavrasChave: '',
  horarios: [],
};

const linhas = (texto) =>
  texto
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
const vazioParaNulo = (s) => (String(s ?? '').trim() === '' ? null : String(s).trim());

/** LocalDTO da API (formato do locais.json) → estado do formulário. */
function paraFormulario(local, tipos) {
  const tipo = tipos.find((t) => t.nome === local.tipo && t.categoria === local.categoria);
  return {
    ...FORM_VAZIO,
    nome: local.nome,
    tipoLocalId: tipo ? String(tipo.id) : '',
    logradouro: local.endereco?.logradouro ?? '',
    numero: local.endereco?.numero ?? '',
    bairroNome: local.endereco?.bairro ?? '',
    cep: local.endereco?.cep ?? '',
    latitude: local.coordenadas?.lat ?? '',
    longitude: local.coordenadas?.lng ?? '',
    horarioTexto: local.horarioTexto ?? '',
    vinteQuatroHoras: Boolean(local.horarios?.vinteQuatroHoras),
    site: local.site ?? '',
    observacao: local.observacao ?? '',
    telefones: (local.telefones ?? []).join('\n'),
    fontes: (local.fonte ?? []).join('\n'),
    servicos: (local.servicos ?? []).join('\n'),
    palavrasChave: (local.palavrasChave ?? []).join(', '),
    horarios: (local.horarios?.faixas ?? []).flatMap((f) =>
      f.dias.map((dia) => ({ dia, abre: f.abre, fecha: f.fecha }))
    ),
  };
}

/** Estado do formulário → corpo do POST/PUT (LocalForm da API). */
function paraApi(f) {
  return {
    nome: f.nome.trim(),
    tipoLocalId: f.tipoLocalId ? Number(f.tipoLocalId) : null,
    logradouro: vazioParaNulo(f.logradouro),
    numero: vazioParaNulo(f.numero),
    bairroNome: vazioParaNulo(f.bairroNome),
    cep: vazioParaNulo(f.cep),
    latitude: f.latitude === '' ? null : Number(f.latitude),
    longitude: f.longitude === '' ? null : Number(f.longitude),
    horarioTexto: vazioParaNulo(f.horarioTexto),
    vinteQuatroHoras: f.vinteQuatroHoras,
    site: vazioParaNulo(f.site),
    observacao: vazioParaNulo(f.observacao),
    telefones: linhas(f.telefones),
    fontes: linhas(f.fontes),
    servicos: linhas(f.servicos),
    palavrasChave: f.palavrasChave
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    horarios: f.horarios,
  };
}

/** Campo do formulário com a mensagem de erro do servidor. */
function Campo({ rotulo, erro, children, largo }) {
  return (
    <label className={`admin-campo${largo ? ' admin-campo--largo' : ''}`}>
      <span>{rotulo}</span>
      {children}
      {erro && <small className="admin-campo-erro">{erro}</small>}
    </label>
  );
}

function FormularioLocal({ inicial, idEdicao, tipos, bairros, aoSalvar, aoCancelar }) {
  const { requisicao } = useSessao();
  const [f, setF] = useState(inicial);
  const [campos, setCampos] = useState({});
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const mudar = (evento) => {
    const { name, value, type, checked } = evento.target;
    setF((anterior) => ({ ...anterior, [name]: type === 'checkbox' ? checked : value }));
  };
  const mudarFaixa = (i, chave, valor) =>
    setF((a) => ({
      ...a,
      horarios: a.horarios.map((h, j) => (j === i ? { ...h, [chave]: valor } : h)),
    }));

  async function salvar(evento) {
    evento.preventDefault();
    setErro(null);
    setCampos({});
    setSalvando(true);
    try {
      const salvo = await requisicao(idEdicao ? `/locais/${idEdicao}` : '/locais', {
        metodo: idEdicao ? 'PUT' : 'POST',
        corpo: paraApi(f),
      });
      aoSalvar(salvo, Boolean(idEdicao));
    } catch (e) {
      setErro(e.message);
      setCampos(e.campos ?? {});
    } finally {
      setSalvando(false);
    }
  }

  const porCategoria = useMemo(() => {
    const grupos = {};
    for (const t of tipos) (grupos[t.categoria] ??= []).push(t);
    return grupos;
  }, [tipos]);

  return (
    <form className="painel admin-form" onSubmit={salvar} noValidate>
      <div className="admin-form-topo">
        <h2>{idEdicao ? 'Alterar local' : 'Novo local'}</h2>
        <button type="button" className="admin-icone" onClick={aoCancelar} aria-label="Fechar">
          <X size={18} />
        </button>
      </div>

      <div className="admin-grade">
        <Campo rotulo="Nome *" erro={campos.nome} largo>
          <input
            className="campo"
            name="nome"
            value={f.nome}
            onChange={mudar}
            required
            maxLength={150}
          />
        </Campo>
        <Campo rotulo="Tipo *" erro={campos.tipoLocalId}>
          <select
            className="campo"
            name="tipoLocalId"
            value={f.tipoLocalId}
            onChange={mudar}
            required
          >
            <option value="">Escolha...</option>
            {Object.entries(porCategoria).map(([categoria, lista]) => (
              <optgroup key={categoria} label={categoria}>
                {lista.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Logradouro" erro={campos.logradouro}>
          <input className="campo" name="logradouro" value={f.logradouro} onChange={mudar} />
        </Campo>
        <Campo rotulo="Número" erro={campos.numero}>
          <input className="campo" name="numero" value={f.numero} onChange={mudar} />
        </Campo>
        <Campo rotulo="Bairro" erro={campos.bairroNome}>
          <input
            className="campo"
            name="bairroNome"
            value={f.bairroNome}
            onChange={mudar}
            list="admin-bairros"
          />
          <datalist id="admin-bairros">
            {bairros.map((b) => (
              <option key={b.id} value={b.nome} />
            ))}
          </datalist>
        </Campo>
        <Campo rotulo="CEP (00000-000)" erro={campos.cep}>
          <input className="campo" name="cep" value={f.cep} onChange={mudar} inputMode="numeric" />
        </Campo>
        <Campo rotulo="Latitude" erro={campos.latitude}>
          <input
            className="campo"
            name="latitude"
            value={f.latitude}
            onChange={mudar}
            inputMode="decimal"
          />
        </Campo>
        <Campo rotulo="Longitude" erro={campos.longitude}>
          <input
            className="campo"
            name="longitude"
            value={f.longitude}
            onChange={mudar}
            inputMode="decimal"
          />
        </Campo>
        <Campo rotulo="Telefones (um por linha)" erro={campos.telefones}>
          <textarea
            className="campo"
            name="telefones"
            rows={2}
            value={f.telefones}
            onChange={mudar}
          />
        </Campo>
        <Campo rotulo="Site oficial" erro={campos.site}>
          <input className="campo" name="site" value={f.site} onChange={mudar} type="url" />
        </Campo>
        <Campo rotulo="Horário como a fonte publica" erro={campos.horarioTexto} largo>
          <input className="campo" name="horarioTexto" value={f.horarioTexto} onChange={mudar} />
        </Campo>
      </div>

      <fieldset className="admin-faixas">
        <legend>Horário por dia (usado no “Aberto agora”)</legend>
        <label className="admin-check">
          <input
            type="checkbox"
            name="vinteQuatroHoras"
            checked={f.vinteQuatroHoras}
            onChange={mudar}
          />
          Funciona 24 horas
        </label>
        {f.horarios.map((h, i) => (
          <div key={i} className="admin-faixa">
            <select
              className="campo"
              aria-label="Dia"
              value={h.dia}
              onChange={(e) => mudarFaixa(i, 'dia', e.target.value)}
            >
              {DIAS.map(([v, r]) => (
                <option key={v} value={v}>
                  {r}
                </option>
              ))}
            </select>
            <input
              className="campo"
              type="time"
              aria-label="Abre"
              value={h.abre}
              onChange={(e) => mudarFaixa(i, 'abre', e.target.value)}
            />
            <input
              className="campo"
              aria-label="Fecha (até 24:00)"
              value={h.fecha}
              placeholder="17:00"
              onChange={(e) => mudarFaixa(i, 'fecha', e.target.value)}
            />
            <button
              type="button"
              className="admin-icone"
              aria-label="Remover faixa"
              onClick={() =>
                setF((a) => ({ ...a, horarios: a.horarios.filter((_, j) => j !== i) }))
              }
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="botao-secundario"
          onClick={() =>
            setF((a) => ({
              ...a,
              horarios: [...a.horarios, { dia: 'seg', abre: '08:00', fecha: '17:00' }],
            }))
          }
        >
          <Plus size={16} /> Faixa de horário
        </button>
      </fieldset>

      <div className="admin-grade">
        <Campo rotulo="Fontes oficiais * (um link por linha)" erro={campos.fontes} largo>
          <textarea
            className="campo"
            name="fontes"
            rows={2}
            value={f.fontes}
            onChange={mudar}
            required
          />
        </Campo>
        <Campo rotulo="Serviços oferecidos (um por linha)" erro={campos.servicos}>
          <textarea
            className="campo"
            name="servicos"
            rows={3}
            value={f.servicos}
            onChange={mudar}
          />
        </Campo>
        <Campo
          rotulo="Palavras-chave para a busca (separe por vírgula)"
          erro={campos.palavrasChave}
        >
          <textarea
            className="campo"
            name="palavrasChave"
            rows={3}
            value={f.palavrasChave}
            onChange={mudar}
          />
        </Campo>
        <Campo rotulo="Observação" erro={campos.observacao} largo>
          <textarea
            className="campo"
            name="observacao"
            rows={2}
            value={f.observacao}
            onChange={mudar}
          />
        </Campo>
      </div>

      {erro && (
        <p className="admin-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="admin-form-acoes">
        <button type="submit" className="botao-primario" disabled={salvando}>
          {salvando ? 'Salvando...' : idEdicao ? 'Salvar alterações' : 'Incluir local'}
        </button>
        <button type="button" className="botao-secundario" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function AbaLocais() {
  const { requisicao } = useSessao();
  const [busca, setBusca] = useState('');
  const [termo, setTermo] = useState('');
  const [locais, setLocais] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [bairros, setBairros] = useState([]);
  const [edicao, setEdicao] = useState(null); // null | { id?: string, inicial }
  const [excluindo, setExcluindo] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    requisicao('/tipos')
      .then(setTipos)
      .catch(() => {});
    requisicao('/bairros')
      .then(setBairros)
      .catch(() => {});
  }, [requisicao]);

  const carregar = useCallback(
    (signal) =>
      requisicao(`/locais${termo ? `?q=${encodeURIComponent(termo)}` : ''}`, { signal })
        .then((d) => setLocais(d.locais))
        .catch((e) => e.name !== 'AbortError' && setErro(e.message)),
    [requisicao, termo]
  );

  useEffect(() => {
    const controle = new AbortController();
    carregar(controle.signal);
    return () => controle.abort();
  }, [carregar]);

  async function excluir(id) {
    setErro(null);
    try {
      await requisicao(`/locais/${id}`, { metodo: 'DELETE' });
      setLocais((l) => l.filter((x) => x.id !== id));
      setMensagem('Local excluído.');
    } catch (e) {
      setErro(e.message);
    } finally {
      setExcluindo(null);
    }
  }

  function aoSalvar(local, alterado) {
    setEdicao(null);
    setMensagem(alterado ? `“${local.nome}” foi alterado.` : `“${local.nome}” foi incluído.`);
    carregar();
  }

  return (
    <div className="admin-aba">
      <div className="admin-barra">
        <form
          className="campo campo-busca admin-busca"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setTermo(busca.trim());
          }}
        >
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar por nome, tipo ou palavra-chave"
            aria-label="Buscar locais"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </form>
        <button
          type="button"
          className="botao-primario"
          onClick={() => {
            setMensagem(null);
            setEdicao({ inicial: FORM_VAZIO });
          }}
        >
          <Plus size={16} /> Novo local
        </button>
      </div>

      {mensagem && (
        <p className="admin-ok" role="status">
          {mensagem}
        </p>
      )}
      {erro && (
        <p className="admin-erro" role="alert">
          {erro}
        </p>
      )}

      {edicao && (
        <FormularioLocal
          key={edicao.id ?? 'novo'}
          inicial={edicao.inicial}
          idEdicao={edicao.id}
          tipos={tipos}
          bairros={bairros}
          aoSalvar={aoSalvar}
          aoCancelar={() => setEdicao(null)}
        />
      )}

      {locais === null ? (
        <p role="status">Carregando...</p>
      ) : (
        <>
          <p className="admin-total">{locais.length} locais</p>
          <div className="admin-tabela-rolagem">
            <table className="admin-tabela">
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Bairro</th>
                  <th scope="col">Atualizado</th>
                  <th scope="col">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {locais.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Link to={`/${l.categoria}/${l.id}`}>{l.nome}</Link>
                    </td>
                    <td>{l.tipo}</td>
                    <td>{l.endereco?.bairro ?? '—'}</td>
                    <td>{l.atualizadoEm?.split('-').reverse().join('/')}</td>
                    <td className="admin-acoes">
                      {excluindo === l.id ? (
                        <>
                          <button
                            type="button"
                            className="admin-botao-perigo"
                            onClick={() => excluir(l.id)}
                          >
                            Confirmar exclusão
                          </button>
                          <button
                            type="button"
                            className="admin-icone"
                            aria-label="Cancelar"
                            onClick={() => setExcluindo(null)}
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="admin-icone"
                            aria-label={`Alterar ${l.nome}`}
                            onClick={() => {
                              setMensagem(null);
                              setEdicao({ id: l.id, inicial: paraFormulario(l, tipos) });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="admin-icone"
                            aria-label={`Excluir ${l.nome}`}
                            onClick={() => setExcluindo(l.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const STATUS = [
  ['PENDENTE', 'Pendentes'],
  ['APROVADA', 'Aprovadas'],
  ['RECUSADA', 'Recusadas'],
  ['', 'Todas'],
];

function AbaSugestoes() {
  const { requisicao } = useSessao();
  const [status, setStatus] = useState('PENDENTE');
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const controle = new AbortController();
    setLista(null);
    requisicao(`/admin/sugestoes${status ? `?status=${status}` : ''}`, { signal: controle.signal })
      .then(setLista)
      .catch((e) => e.name !== 'AbortError' && setErro(e.message));
    return () => controle.abort();
  }, [requisicao, status]);

  async function moderar(id, novo) {
    setErro(null);
    try {
      const atualizada = await requisicao(`/admin/sugestoes/${id}`, {
        metodo: 'PATCH',
        corpo: { status: novo },
      });
      setLista((l) =>
        status ? l.filter((s) => s.id !== id) : l.map((s) => (s.id === id ? atualizada : s))
      );
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <div className="admin-aba">
      <div className="admin-filtros" role="group" aria-label="Filtrar por situação">
        {STATUS.map(([v, r]) => (
          <button
            key={v}
            type="button"
            className="admin-filtro"
            aria-pressed={status === v}
            onClick={() => setStatus(v)}
          >
            {r}
          </button>
        ))}
      </div>
      {erro && (
        <p className="admin-erro" role="alert">
          {erro}
        </p>
      )}
      {lista === null ? (
        <p role="status">Carregando...</p>
      ) : lista.length === 0 ? (
        <p className="admin-vazio">Nenhuma sugestão aqui.</p>
      ) : (
        <ul className="admin-sugestoes">
          {lista.map((s) => (
            <li key={s.id} className="admin-sugestao">
              <div>
                <strong>{s.nome}</strong>
                <small>
                  {s.categoria} · por {s.autor} ·{' '}
                  {s.criadoEm?.slice(0, 10).split('-').reverse().join('/')}
                </small>
              </div>
              {s.status === 'PENDENTE' ? (
                <div className="admin-acoes">
                  <button
                    type="button"
                    className="botao-primario"
                    onClick={() => moderar(s.id, 'APROVADA')}
                  >
                    Aprovar
                  </button>
                  <button
                    type="button"
                    className="botao-secundario"
                    onClick={() => moderar(s.id, 'RECUSADA')}
                  >
                    Recusar
                  </button>
                </div>
              ) : (
                <span className="etiqueta">
                  {s.status === 'APROVADA' ? 'Aprovada' : 'Recusada'}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AbaVotos() {
  const { requisicao } = useSessao();
  const [votos, setVotos] = useState(null);
  useEffect(() => {
    requisicao('/admin/avaliacoes')
      .then(setVotos)
      .catch(() => setVotos([]));
  }, [requisicao]);
  if (votos === null) return <p role="status">Carregando...</p>;
  if (votos.length === 0) return <p className="admin-vazio">Ainda não há votos.</p>;
  return (
    <table className="admin-tabela admin-tabela--curta">
      <thead>
        <tr>
          <th scope="col">Página</th>
          <th scope="col">Votos “foi útil”</th>
        </tr>
      </thead>
      <tbody>
        {votos.map((v) => (
          <tr key={v.pagina}>
            <td>
              <Link to={`/${v.pagina}`}>/{v.pagina}</Link>
            </td>
            <td>{v.votos}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const ABAS = [
  ['locais', 'Locais', AbaLocais],
  ['sugestoes', 'Sugestões', AbaSugestoes],
  ['votos', 'Votos', AbaVotos],
];

export default function Admin() {
  useTituloPagina('Administração — Conecta Cidadão');
  const { apiAtiva, usuario, ehAdmin } = useSessao();
  const [aba, setAba] = useState('locais');
  const Conteudo = ABAS.find(([v]) => v === aba)[2];

  return (
    <>
      <section className="container pagina-topo">
        <h1 className="titulo-pagina">Administração</h1>
        <p className="texto-apoio">
          Manutenção do catálogo de locais no banco de dados e moderação das sugestões. Todo local
          precisa de ao menos uma fonte oficial.
        </p>
      </section>
      <section className="container admin">
        {!apiAtiva || !usuario ? (
          <p className="painel">
            {apiAtiva ? (
              <>
                <Link to="/entrar" state={{ voltarPara: '/admin' }}>
                  Entre
                </Link>{' '}
                com uma conta de administrador.
              </>
            ) : (
              'O painel precisa da API ligada (VITE_API_URL).'
            )}
          </p>
        ) : !ehAdmin ? (
          <p className="painel">Esta área é só para administradores.</p>
        ) : (
          <>
            <div className="admin-abas" role="tablist" aria-label="Seções do painel">
              {ABAS.map(([v, r]) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={aba === v}
                  className="admin-aba-botao"
                  onClick={() => setAba(v)}
                >
                  {r}
                </button>
              ))}
            </div>
            <Conteudo />
          </>
        )}
      </section>
    </>
  );
}
