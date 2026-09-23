/**
 * CardLocal.jsx — Card de uma unidade (UBS, escola, parque...).
 *
 * Usado na grade das páginas de categoria. Como o projeto ainda não tem página
 * de detalhe, o clique apenas dispara um aviso na tela.
 *
 * @param {{local: object, categoriaSlug: string}} props
 *   local         - { nome, imagem } vindo de src/data/servicos.js
 *   categoriaSlug - usado no data-categoria para colorir a borda do card
 */

import { useAviso } from '../context/AppContext.jsx';
import './CardLocal.css';

export default function CardLocal({ local, categoriaSlug }) {
  const { mostrarAviso } = useAviso();

  return (
    // É <button> e não <div> porque o elemento é clicável: assim já vem com
    // foco por teclado, ativação pelo Enter/Espaço e semântica correta.
    <button
      type="button"
      className="card-local"
      data-categoria={categoriaSlug}
      // Template string (crases) monta o texto com o nome do local dentro.
      onClick={() => mostrarAviso(`Abrindo: ${local.nome}`)}
    >
      <span className="card-local-moldura">
        {/* Aqui o alt é preenchido: a foto identifica o local.
            loading="lazy" adia o download das imagens fora da tela. */}
        <img className="card-local-imagem" src={local.imagem} alt={local.nome} loading="lazy" />
      </span>
      <span className="card-local-nome">{local.nome}</span>
    </button>
  );
}
