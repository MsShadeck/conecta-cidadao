/**
 * useTituloPagina.js — Hook personalizado que troca o título da aba do navegador.
 *
 * Como o site é uma SPA (uma única página HTML), a tag <title> do index.html
 * não muda sozinha ao navegar. Este hook faz esse ajuste manualmente, o que
 * ajuda o usuário a se localizar no histórico e nas abas.
 *
 * Aula "useEffect + Consumo de API" — Exemplo 1: as três formas do array de
 * dependências. As duas primeiras ficaram comentadas; a terceira é a ativa.
 *
 * Uso: useTituloPagina('Saúde — Conecta Cidadão');
 */

import { useEffect } from 'react';

export default function useTituloPagina(titulo) {
  /* VARIAÇÃO A — SEM array de dependências
     Executa SEMPRE: na montagem e a cada renderização do componente que usa o hook.

  useEffect(() => {
    document.title = `${titulo}`;
  });
  */

  /* VARIAÇÃO B — array VAZIO []
     Executa SÓ UMA VEZ, quando o componente é montado. Se o título mudar
     depois (ex.: trocar de /saude para /lazer), a aba não acompanha.

  useEffect(() => {
    document.title = `${titulo}`;
  }, []);
  */

  // VARIAÇÃO C (ATIVA) — array com dependência [titulo]
  // Executa na montagem E toda vez que o texto do título mudar.
  useEffect(() => {
    // Efeito colateral no DOM: precisa ficar dentro do useEffect, não no corpo
    // do componente, para rodar depois que a tela é desenhada.
    document.title = `${titulo}`;
  }, [titulo]);
}
