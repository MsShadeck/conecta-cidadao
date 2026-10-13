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
import { MapPin } from 'lucide-react';
import Foto from './Foto.jsx';
import SeloAberto from './SeloAberto.jsx';
import IconeCategoria from './IconeCategoria.jsx';
import { formatarDistancia } from '../utils/geo.js';
import './CardLocal.css';

export default function CardLocal({ local, distancia }) {
  return (
    // data-categoria: a borda e o selo do tipo herdam a cor do serviço.
    <Link
      to={`/${local.categoria}/${local.id}`}
      className={`card-local${local.imagem ? '' : ' card-local--sem-foto'}`}
      data-categoria={local.categoria}
    >
      {local.imagem && (
        <span className="card-local-moldura">
          {/* alt="" porque o nome do local já está escrito logo abaixo da foto. */}
          <Foto className="card-local-imagem" src={local.imagem} alt="" />
        </span>
      )}
      <span className="card-local-corpo">
        {/* Sem foto: em vez de um bloco vazio do tamanho da foto, só o ícone
            da categoria num quadrado colorido (decorativo). */}
        {!local.imagem && (
          <span className="card-local-icone" aria-hidden="true">
            <IconeCategoria slug={local.categoria} tamanho={20} />
          </span>
        )}
        <span className="card-local-nome">{local.nome}</span>
        <span className="card-local-detalhe">
          {[local.tipo, local.endereco?.bairro].filter(Boolean).join(' · ')}
        </span>
        <span className="card-local-rodape">
          <SeloAberto horarios={local.horarios} />
          {distancia !== undefined && (
            <span className="card-local-distancia">
              <MapPin size={12} strokeWidth={2.25} />
              {formatarDistancia(distancia)}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}
