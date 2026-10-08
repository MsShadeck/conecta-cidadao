/**
 * MapaPreguicoso.jsx — Carrega o Mapa sob demanda (code-splitting).
 *
 * React.lazy + import() criam um arquivo JavaScript separado para o mapa.
 * Quem abre só a lista de telefones, por exemplo, nunca baixa o Leaflet.
 * Enquanto o arquivo chega, o Suspense mostra um bloco do mesmo tamanho.
 */
import { Suspense, lazy } from 'react';
import './MapaPreguicoso.css';

const Mapa = lazy(() => import('./Mapa.jsx'));

export default function MapaPreguicoso(props) {
  const altura = props.altura ?? 360;
  return (
    <Suspense
      fallback={
        <div className="mapa mapa--carregando" style={{ height: altura }} role="status">
          Carregando o mapa...
        </div>
      }
    >
      <Mapa {...props} />
    </Suspense>
  );
}
