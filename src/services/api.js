/**
 * api.js — Cliente da API REST do Conecta Cidadão (back-end Spring Boot em /backend).
 *
 * O endereço vem da variável VITE_API_URL (arquivo .env.local), por exemplo:
 *   VITE_API_URL=http://localhost:8080
 * Sem ela, o site funciona como antes: lê os JSON de public/api e guarda os dados
 * de cada pessoa só no navegador (localStorage). Com ela, os dados vão para o MySQL.
 */

const BASE = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '');

/** A API está configurada neste build? */
export const apiAtiva = BASE !== '';

/** Endereço completo de um recurso da API (ex.: urlDaApi('/locais')). */
export const urlDaApi = (caminho) => `${BASE}/api${caminho}`;

/** Erro com o status HTTP e as mensagens por campo que a API devolve. */
export class ErroApi extends Error {
  constructor(status, mensagem, campos = {}) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
    this.campos = campos;
  }
}

const MENSAGENS = {
  401: 'Sua sessão expirou. Entre de novo.',
  403: 'Você não tem permissão para fazer isso.',
  404: 'Não encontrado.',
  409: 'Conflito com um dado que já existe.',
};

/**
 * Faz uma requisição à API.
 * @param {string} caminho - ex.: '/lembretes'
 * @param {{metodo?: string, corpo?: object, token?: string, signal?: AbortSignal}} opcoes
 */
export async function requisitar(caminho, { metodo = 'GET', corpo, token, signal } = {}) {
  const cabecalhos = {};
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(urlDaApi(caminho), {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal,
    });
  } catch (erro) {
    if (erro.name === 'AbortError') throw erro;
    throw new ErroApi(0, 'Não foi possível falar com o servidor. Confira a sua internet.');
  }

  if (resposta.status === 204) return null;
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new ErroApi(
      resposta.status,
      dados?.mensagem ?? MENSAGENS[resposta.status] ?? `Erro ${resposta.status} no servidor.`,
      dados?.campos ?? {}
    );
  }
  return dados;
}

// ---------------------------------------------------------------- sessão no navegador

const CHAVE_SESSAO = 'cc:sessao';

/** Sessão salva ({ token, expiraEm, usuario }) ou null se não houver ou se expirou. */
export function lerSessao() {
  try {
    const sessao = JSON.parse(window.localStorage.getItem(CHAVE_SESSAO));
    if (!sessao?.token) return null;
    if (sessao.expiraEm && Date.parse(sessao.expiraEm) <= Date.now()) {
      window.localStorage.removeItem(CHAVE_SESSAO);
      return null;
    }
    return sessao;
  } catch {
    return null;
  }
}

export function gravarSessao(sessao) {
  try {
    if (sessao) window.localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    else window.localStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // Sem armazenamento (aba anônima com cota zero): a sessão vale só até fechar a aba.
  }
}
