/**
 * ItemProximo.jsx — Um lugar perto de casa (Meu bairro).
 *
 * Mostra nome, tipo, distância em linha reta, o selo "aberto agora" (só quando
 * a fonte informa o horário) e os botões Waze / Google Maps. Para o comércio
 * (dados do OpenStreetMap), também o link "Corrigir no OpenStreetMap".
 *
 * @param {{item: object, ponto: {lat:number,lng:number}|null, comercio: boolean, className?: string, children?: any}} props
 *   children: detalhes extras (endereço, telefone...) entre o nome e os botões.
 */

import { Link } from 'react-router-dom';
import { formatarDistancia } from '../utils/geo.js';
import BotoesNavegacao from './BotoesNavegacao.jsx';
import SeloAberto from './SeloAberto.jsx';

/** 'node/123' → link de edição do OpenStreetMap (qualquer pessoa pode corrigir). */
export function linkCorrigirOsm(osm) {
  if (!osm) return null;
  const [tipo, id] = osm.split('/');
  return `https://www.openstreetmap.org/edit?${tipo}=${id}`;
}

export default function ItemProximo({ item, ponto, comercio = false, className = '', children }) {
  // Perto (até ~1,5 km): o Google abre a pé; longe: de ônibus.
  const modo = item.distancia !== undefined && item.distancia < 1500 ? 'walking' : 'transit';
  return (
    <li className={`item-proximo ${className}`}>
      <div className="item-proximo-topo">
        {comercio ? (
          <strong>{item.nome}</strong>
        ) : (
          <Link to={`/${item.categoria}/${item.id}`}>
            <strong>{item.nome}</strong>
          </Link>
        )}
        <span className="item-proximo-detalhe">
          {[item.tipo, item.distancia !== undefined && `${formatarDistancia(item.distancia)} em linha reta`]
            .filter(Boolean)
            .join(' · ')}
        </span>
        <SeloAberto horarios={item.horarios} />
      </div>
      {children}
      <BotoesNavegacao local={item} compacto modoPadrao={modo} origem={ponto} />
      {comercio && item.osm && (
        <a className="item-proximo-osm" href={linkCorrigirOsm(item.osm)} target="_blank" rel="noopener noreferrer">
          Corrigir no OpenStreetMap
        </a>
      )}
    </li>
  );
}
