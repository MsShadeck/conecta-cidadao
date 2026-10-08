/**
 * useMetadados.js — Título, descrição e prévia de compartilhamento de cada página.
 *
 * Evolução do useTituloPagina (aula "useEffect + Consumo de API", Exemplo 1).
 * Além do <title>, atualiza:
 *   - <meta name="description">  → texto que o Google mostra no resultado;
 *   - og:title / og:description / og:url → prévia no WhatsApp e redes sociais;
 *   - <link rel="canonical">      → endereço "oficial" da página para buscadores.
 *
 * Mesmo padrão da aula: useEffect com as dependências [titulo, descricao].
 *
 * Uso: useMetadados({ titulo: 'Saúde — Conecta Cidadão', descricao: 'UBS, UPA...' });
 */

import { useEffect } from 'react';

const SITE = 'https://conecta-cidadao.vercel.app';
const DESCRICAO_PADRAO =
  'Guia não oficial dos serviços públicos de Indaiatuba/SP: saúde, escolas, segurança, lazer, ônibus e serviços online.';

/** Acha (ou cria) uma tag no <head> e define um atributo dela. */
function definirNoHead(seletor, criar, atributo, valor) {
  let tag = document.head.querySelector(seletor);
  if (!tag) {
    tag = criar();
    document.head.append(tag);
  }
  tag.setAttribute(atributo, valor);
}

const meta = (nome, propriedade) => () => {
  const tag = document.createElement('meta');
  if (nome) tag.setAttribute('name', nome);
  if (propriedade) tag.setAttribute('property', propriedade);
  return tag;
};

export default function useMetadados({ titulo, descricao = DESCRICAO_PADRAO }) {
  useEffect(() => {
    document.title = titulo;
    const url = SITE + window.location.pathname;
    definirNoHead('meta[name="description"]', meta('description'), 'content', descricao);
    definirNoHead('meta[property="og:title"]', meta(null, 'og:title'), 'content', titulo);
    definirNoHead(
      'meta[property="og:description"]',
      meta(null, 'og:description'),
      'content',
      descricao
    );
    definirNoHead('meta[property="og:url"]', meta(null, 'og:url'), 'content', url);
    definirNoHead(
      'link[rel="canonical"]',
      () => {
        const link = document.createElement('link');
        link.rel = 'canonical';
        return link;
      },
      'href',
      url
    );
  }, [titulo, descricao]);
}
