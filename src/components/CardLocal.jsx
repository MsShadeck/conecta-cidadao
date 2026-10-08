/**
 * CardLocal.jsx — Card de uma unidade (UBS, escola, parque...).
 *
 * Na v1 o clique só mostrava um aviso ("Abrindo: X"). Agora o card inteiro é
 * um link para a página de detalhe do local (/saude/ubs-jd-california).
 *
 * @param {{local: object, distancia?: number}} props
 *   local     - um item de /api/locais.json
 *   distancia - em metros; aparece quando a pessoa informou de onde sai
 */

import { Link } from 'react-router-dom';
import Foto from './Foto.jsx';
import SeloAberto from './SeloAberto.jsx';
import { buscarCategoria } from '../data/servicos.js';
import { formatarDistancia } from '../utils/geo.js';
import './CardLocal.css';

export default function CardLocal({ local, distancia }) {
  const categoria = buscarCategoria(local.categoria);
  return (
    // data-categoria: a borda e o selo do tipo herdam a cor do serviço.
    <Link
      to={`/${local.categoria}/${local.id}`}
      className="card-local"
      data-categoria={local.categoria}
    >
      <span className="card-local-moldura">
        {local.imagem ? (
          // alt="" porque o nome do local já está escrito logo abaixo da foto.
          <Foto className="card-local-imagem" src={local.imagem} alt="" />
        ) : (
          // Sem foto: o ícone da categoria num fundo colorido (decorativo).
          <span className="card-local-imagem card-local-sem-foto" aria-hidden="true">
            <img src={categoria?.icone} alt="" width="56" height="56" />
          </span>
        )}
      </span>
      <span className="card-local-corpo">
        <span className="card-local-nome">{local.nome}</span>
        <span className="card-local-detalhe">
          {[local.tipo, local.endereco?.bairro].filter(Boolean).join(' · ')}
        </span>
        <span className="card-local-rodape">
          <SeloAberto horarios={local.horarios} />
          {distancia !== undefined && (
            <span className="card-local-distancia">{formatarDistancia(distancia)}</span>
          )}
        </span>
      </span>
    </Link>
  );
}
