/**
 * BotaoUtil.jsx — Botão "Esta página foi útil?" das páginas de categoria.
 *
 * Aula "Review + Rotas": é o LikeButton do material (useState + função que
 * soma 1), adaptado ao tema do Conecta Cidadão.
 */

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
      {/* Ao mudar o estado, o React desenha o componente de novo com o número atualizado */}
      <span className="botao-util-contagem">{likes} curtidas</span>
    </div>
  );
}
