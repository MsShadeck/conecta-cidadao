/**
 * MapaWaze.jsx — Mapa ao vivo do Waze (Waze iFrame), com o trânsito.
 *
 * Documentação: https://developers.google.com/waze/iframe
 * Limitações do Waze iFrame (por isso o site também tem mapas Leaflet):
 *  - mostra um centro e no máximo UM pin (no centro);
 *  - não aceita vários marcadores, traçados de linhas nem cliques nos pontos.
 * Regra da marca Waze: não associar o Waze a mapas que não sejam dele. Por isso
 * o crédito "Mapa: Waze" aparece só junto deste componente.
 *
 * @param {{lat:number, lng:number, zoom?:number, pin?:boolean, titulo:string, altura?:number}} props
 */

import { linkWazeIframe } from '../utils/navegacao.js';
import './MapaWaze.css';

export default function MapaWaze({ lat, lng, zoom = 16, pin = true, titulo, altura = 360 }) {
  if (lat === undefined || lng === undefined) return null;
  return (
    <figure className="mapa-waze">
      {/* title descreve o conteúdo do iframe para leitores de tela.
          loading="lazy": o mapa só carrega quando chega perto da tela. */}
      <iframe
        className="mapa-waze-quadro"
        src={linkWazeIframe({ lat, lng, zoom, pin })}
        title={titulo}
        loading="lazy"
        style={{ height: altura }}
        allowFullScreen
      />
      <figcaption className="mapa-waze-credito">Mapa e trânsito ao vivo: Waze</figcaption>
    </figure>
  );
}
