/**
 * Entrar.jsx — Entrar, criar conta e "Minha conta" (UC13). Rota /entrar.
 *
 * A conta guarda no banco (pela API) os lembretes, as sugestões, o checklist e os
 * votos, para a pessoa ver os mesmos dados em qualquer aparelho. Sem conta, o site
 * continua funcionando e guarda tudo só no navegador.
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useSessao } from '../context/SessaoContext.jsx';
import useTituloPagina from '../hooks/useTituloPagina.js';
import './Entrar.css';

/** Campo com rótulo e a mensagem de erro que a API devolveu para ele. */
function Campo({ rotulo, erro, ...props }) {
  const id = `campo-${props.name}`;
  return (
    <label className="entrar-campo" htmlFor={id}>
      <span>{rotulo}</span>
      <input
        id={id}
        className="campo"
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? `${id}-erro` : undefined}
        {...props}
      />
      {erro && (
        <small id={`${id}-erro`} className="entrar-campo-erro">
          {erro}
        </small>
      )}
    </label>
  );
}

function MinhaConta() {
  const { usuario, ehAdmin, sair, requisicao } = useSessao();
  const [confirmar, setConfirmar] = useState(false);
  const [erro, setErro] = useState(null);
  const navegar = useNavigate();

  async function excluirConta() {
    try {
      await requisicao('/auth/me', { metodo: 'DELETE' });
      sair();
      navegar('/');
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <div className="painel entrar-conta">
      <h2 className="entrar-titulo">Olá, {usuario.nome.split(' ')[0]}</h2>
      <dl className="entrar-dados">
        <dt>E-mail</dt>
        <dd>{usuario.email}</dd>
        <dt>Perfil</dt>
        <dd>{ehAdmin ? 'Administrador' : 'Cidadão'}</dd>
      </dl>
      <p className="texto-apoio">
        Seus <Link to="/lembretes">lembretes</Link>, o progresso dos{' '}
        <Link to="/primeiros-passos">Primeiros passos</Link>, as sugestões de locais e os votos
        ficam salvos na sua conta.
      </p>
      <div className="entrar-acoes">
        {ehAdmin && (
          <Link to="/admin" className="botao-primario">
            <ShieldCheck size={16} /> Painel do administrador
          </Link>
        )}
        <button type="button" className="botao-secundario" onClick={sair}>
          <LogOut size={16} /> Sair
        </button>
      </div>

      <div className="entrar-perigo">
        {!confirmar ? (
          <button type="button" className="entrar-link-perigo" onClick={() => setConfirmar(true)}>
            Excluir minha conta e meus dados
          </button>
        ) : (
          <p role="alert">
            Isso apaga a conta, os lembretes, as sugestões, o checklist e os votos. Não dá para
            desfazer.{' '}
            <button type="button" className="entrar-botao-perigo" onClick={excluirConta}>
              Excluir de vez
            </button>{' '}
            <button type="button" className="botao-secundario" onClick={() => setConfirmar(false)}>
              Cancelar
            </button>
          </p>
        )}
        {erro && <p className="entrar-erro">{erro}</p>}
      </div>
    </div>
  );
}

export default function Entrar() {
  useTituloPagina('Entrar — Conecta Cidadão');
  const { apiAtiva, usuario, entrar, cadastrar } = useSessao();
  const [modo, setModo] = useState('entrar');
  const [form, setForm] = useState({ nome: '', email: '', senha: '' });
  const [erro, setErro] = useState(null);
  const [campos, setCampos] = useState({});
  const [enviando, setEnviando] = useState(false);
  const navegar = useNavigate();
  const { state } = useLocation();

  const mudar = (evento) => setForm((f) => ({ ...f, [evento.target.name]: evento.target.value }));

  async function enviar(evento) {
    evento.preventDefault();
    setErro(null);
    setCampos({});
    setEnviando(true);
    try {
      if (modo === 'entrar') await entrar(form.email.trim(), form.senha);
      else await cadastrar(form.nome.trim(), form.email.trim(), form.senha);
      navegar(state?.voltarPara ?? '/lembretes');
    } catch (e) {
      setErro(e.message);
      setCampos(e.campos ?? {});
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <section className="container pagina-topo">
        <h1 className="titulo-pagina">{usuario ? 'Minha conta' : 'Entrar'}</h1>
        {!usuario && (
          <p className="texto-apoio">
            Com uma conta, seus lembretes, o checklist da mudança e as sugestões ficam salvos em
            qualquer aparelho. O site continua funcionando sem conta.
          </p>
        )}
      </section>

      <section className="container entrar">
        {!apiAtiva && (
          <p className="painel entrar-aviso">
            O cadastro está desligado nesta versão do site, que guarda tudo só no navegador. Para
            usar contas, rode a API (pasta <code>backend</code>) e defina <code>VITE_API_URL</code>.
          </p>
        )}

        {apiAtiva && usuario && <MinhaConta />}

        {apiAtiva && !usuario && (
          <div className="painel entrar-caixa">
            <div className="entrar-abas" role="tablist" aria-label="Entrar ou criar conta">
              {[
                ['entrar', 'Entrar'],
                ['cadastro', 'Criar conta'],
              ].map(([valor, rotulo]) => (
                <button
                  key={valor}
                  type="button"
                  role="tab"
                  aria-selected={modo === valor}
                  className="entrar-aba"
                  onClick={() => {
                    setModo(valor);
                    setErro(null);
                    setCampos({});
                  }}
                >
                  {rotulo}
                </button>
              ))}
            </div>

            <form className="entrar-form" onSubmit={enviar} noValidate>
              {modo === 'cadastro' && (
                <Campo
                  rotulo="Nome"
                  name="nome"
                  autoComplete="name"
                  value={form.nome}
                  onChange={mudar}
                  required
                  maxLength={120}
                  erro={campos.nome}
                />
              )}
              <Campo
                rotulo="E-mail"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={mudar}
                required
                erro={campos.email}
              />
              <Campo
                rotulo={modo === 'cadastro' ? 'Senha (mínimo 8 caracteres)' : 'Senha'}
                name="senha"
                type="password"
                autoComplete={modo === 'cadastro' ? 'new-password' : 'current-password'}
                value={form.senha}
                onChange={mudar}
                required
                minLength={modo === 'cadastro' ? 8 : undefined}
                erro={campos.senha}
              />
              {erro && (
                <p className="entrar-erro" role="alert">
                  {erro}
                </p>
              )}
              <button type="submit" className="botao-primario" disabled={enviando}>
                {enviando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
              </button>
            </form>
          </div>
        )}
      </section>
    </>
  );
}
