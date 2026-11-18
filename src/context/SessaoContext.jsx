/**
 * SessaoContext.jsx — Quem está logado e como falar com a API em nome dessa pessoa.
 *
 *   const { usuario, entrar, cadastrar, sair, requisicao } = useSessao();
 *
 * - usuario: null (visitante) ou { id, nome, email, perfil, ... };
 * - requisicao(caminho, opcoes): chama a API já com o token; se o servidor responder
 *   401 (token vencido), encerra a sessão sozinha;
 * - apiAtiva: false quando o site foi publicado sem VITE_API_URL (modo só navegador).
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { apiAtiva, gravarSessao, lerSessao, requisitar } from '../services/api.js';

const SessaoContext = createContext(null);

export function SessaoProvider({ children }) {
  const [sessao, setSessao] = useState(() => (apiAtiva ? lerSessao() : null));

  const guardar = useCallback((nova) => {
    gravarSessao(nova);
    setSessao(nova);
  }, []);

  const sair = useCallback(() => guardar(null), [guardar]);

  const requisicao = useCallback(
    async (caminho, opcoes = {}) => {
      try {
        return await requisitar(caminho, { ...opcoes, token: sessao?.token });
      } catch (erro) {
        if (erro.status === 401 && sessao) sair();
        throw erro;
      }
    },
    [sessao, sair]
  );

  const entrar = useCallback(
    async (email, senha) => {
      guardar(await requisitar('/auth/login', { metodo: 'POST', corpo: { email, senha } }));
    },
    [guardar]
  );

  const cadastrar = useCallback(
    async (nome, email, senha) => {
      guardar(
        await requisitar('/auth/cadastro', { metodo: 'POST', corpo: { nome, email, senha } })
      );
    },
    [guardar]
  );

  /** Atualiza os dados do usuário guardados (depois de PUT /auth/me). */
  const atualizarUsuario = useCallback(
    (usuario) => {
      if (sessao) guardar({ ...sessao, usuario });
    },
    [sessao, guardar]
  );

  const valor = useMemo(
    () => ({
      apiAtiva,
      usuario: sessao?.usuario ?? null,
      ehAdmin: sessao?.usuario?.perfil === 'ADMIN',
      entrar,
      cadastrar,
      sair,
      requisicao,
      atualizarUsuario,
    }),
    [sessao, entrar, cadastrar, sair, requisicao, atualizarUsuario]
  );

  return <SessaoContext.Provider value={valor}>{children}</SessaoContext.Provider>;
}

export function useSessao() {
  const contexto = useContext(SessaoContext);
  if (!contexto) throw new Error('useSessao precisa estar dentro do <SessaoProvider>.');
  return contexto;
}
