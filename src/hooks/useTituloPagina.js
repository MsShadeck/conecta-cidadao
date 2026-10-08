/**
 * useTituloPagina.js — Hook personalizado que troca o título da aba do navegador.
 *
 * Como o site é uma SPA (uma única página HTML), a tag <title> do index.html
 * não muda sozinha ao navegar. Este hook faz esse ajuste manualmente, o que
 * ajuda o usuário a se localizar no histórico e nas abas.
 *
 * Aula "useEffect + Consumo de API" — Exemplo 1: as três formas do array de
 * dependências. As três ficaram comentadas (a C era a ativa na aula); a versão
 * ativa agora repassa o título e a descrição para o useMetadados, que também
 * atualiza a descrição e a prévia de compartilhamento (SEO).
 *
 * Uso: useTituloPagina('Saúde — Conecta Cidadão', 'Descrição opcional da página');
 */

import useMetadados from './useMetadados.js';

export default function useTituloPagina(titulo, descricao) {
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

  /* VARIAÇÃO C — VERSÃO DA AULA (era a ativa): array com dependência [titulo]
     Executa na montagem E toda vez que o texto do título mudar.

  useEffect(() => {
    // Efeito colateral no DOM: precisa ficar dentro do useEffect, não no corpo
    // do componente, para rodar depois que a tela é desenhada.
    document.title = `${titulo}`;
  }, [titulo]);
  */

  // VERSÃO ATIVA — a mesma ideia da variação C ([titulo] nas dependências),
  // agora dentro do useMetadados, que cuida também da descrição da página.
  useMetadados({ titulo, descricao });
}
