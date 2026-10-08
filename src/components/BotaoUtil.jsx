/**
 * BotaoUtil.jsx — Botão "Esta página foi útil?" das páginas de categoria e de local.
 *
 * Aula "Review + Rotas": é o LikeButton do material (useState + função que
 * soma 1), adaptado ao tema do Conecta Cidadão. A versão da aula ficou
 * comentada logo abaixo; a versão ativa vem depois dela.
 */

/* VERSÃO DA AULA — LikeButton (useState + soma 1)
   Problemas que a versão ativa corrige:
     - mostrava "1 curtidas" (plural errado);
     - dava para clicar infinitas vezes;
     - o número voltava a zero ao recarregar a página.

import { useState } from 'react';
import './BotaoUtil.css';

export default function BotaoUtil() {
  // likes = valor atual | setLikes = função que altera o valor
  const [likes, setLikes] = useState(0);

  function curtir() {
    setLikes(likes + 1);
  }

  return (
    <div className="botao-util">
      <span className="botao-util-pergunta">Esta página foi útil?</span>
      <button type="button" className="botao-util-botao" onClick={curtir}>
        👍 Útil
      </button>
      {/* Ao mudar o estado, o React desenha o componente de novo com o número atualizado *\/}
      <span className="botao-util-contagem">{likes} curtidas</span>
    </div>
  );
}
*/

// VERSÃO ATIVA — um voto por página, guardado no navegador.
// Como o site não tem servidor, o voto é só desta pessoa neste navegador:
// por isso a mensagem fala em "você" em vez de mostrar um total de curtidas.
import useLocalStorage from '../hooks/useLocalStorage.js';
import './BotaoUtil.css';

/**
 * Monta o texto da contagem com o plural certo: "1 curtida", "2 curtidas", "0 curtidas".
 * Exportada para ser testada no Vitest.
 */
export function textoCurtidas(quantidade) {
  return `${quantidade} ${quantidade === 1 ? 'curtida' : 'curtidas'}`;
}

/** @param {{pagina: string}} props - identificador da página, ex.: 'saude' ou 'saude/ubs-x'. */
export default function BotaoUtil({ pagina }) {
  // Um objeto { 'saude': true, 'lazer': true } com as páginas já votadas.
  const [votos, setVotos] = useLocalStorage('cc:paginas-uteis', {});
  const votou = Boolean(votos[pagina]);

  // O mesmo botão marca e desmarca: clicar de novo desfaz o voto.
  function alternar() {
    // Copia o objeto antigo (...prev) e troca só a chave desta página.
    setVotos((prev) => ({ ...prev, [pagina]: !prev[pagina] }));
  }

  return (
    <div className="botao-util">
      <span className="botao-util-pergunta">Esta página foi útil?</span>
      {/* aria-pressed transforma o botão em "botão de alternância" para leitores de tela. */}
      <button type="button" className="botao-util-botao" aria-pressed={votou} onClick={alternar}>
        {votou ? '👍 Marcada como útil' : '👍 Útil'}
      </button>
      <span className="botao-util-contagem" role="status">
        {textoCurtidas(votou ? 1 : 0)}
        {votou && ' · obrigado! Seu voto fica salvo neste navegador.'}
      </span>
    </div>
  );
}
