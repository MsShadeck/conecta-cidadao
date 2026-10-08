/**
 * leafletGlobal.js — Deixa o Leaflet disponível como variável global "L".
 *
 * O plugin leaflet.markercluster (agrupamento de marcadores) foi escrito para o
 * Leaflet "global" do navegador. Este módulo é importado ANTES do plugin, então
 * quando o plugin roda, window.L já existe.
 */
import L from 'leaflet';

window.L = L;

export default L;
