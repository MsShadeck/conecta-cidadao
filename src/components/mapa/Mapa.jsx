/**
 * Mapa.jsx — Mapa interativo (Leaflet + OpenStreetMap), sem chave de API.
 *
 * Este arquivo é carregado com React.lazy: o Leaflet (≈150 KB) só é baixado
 * nas páginas que mostram mapa. Use sempre pelo componente MapaPreguicoso.
 *
 * O Leaflet não é um componente React: ele desenha direto num <div>. Por isso:
 *  - o mapa é criado UMA vez num useEffect com [] e destruído no cleanup;
 *  - outros useEffects atualizam marcadores, rotas e camadas quando as props mudam.
 *
 * @param {object} props
 * @param {Array}  props.marcadores - [{ id, lat, lng, titulo, detalhe, categoria, rota }]
 * @param {Array}  props.rotas      - [{ pontos: [[lat, lng]...], cor, espessura, tracejado, titulo }]
 * @param {Array}  props.camadas    - [{ geojson, cor, titulo }] (ex.: ciclovias, limite da cidade)
 * @param {object} props.origem     - { lat, lng } ponto "Você está aqui"
 * @param {boolean} props.agrupar   - agrupa marcadores próximos (mapa geral)
 * @param {string} props.selecionado - id do marcador em destaque (abre o balão)
 * @param {string} props.rotulo     - descrição do mapa para leitores de tela
 * @param {Function} props.aoAbrir  - chamado com a rota do local ao clicar em "Ver detalhes"
 */

import { useEffect, useRef } from 'react';
import L from './leafletGlobal.js';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import './Mapa.css';

const CENTRO_INDAIATUBA = [-23.09, -47.218];

/** Alfinete desenhado em HTML/CSS: herda a cor da categoria pelo data-categoria. */
function iconeAlfinete(categoria, destaque) {
  return L.divIcon({
    className: '',
    html: `<span class="mapa-alfinete${destaque ? ' mapa-alfinete--destaque' : ''}" data-categoria="${categoria ?? ''}"></span>`,
    iconSize: [26, 34],
    iconAnchor: [13, 32],
    popupAnchor: [0, -30],
  });
}

/** Conteúdo do balão, montado com DOM (sem innerHTML com dados externos). */
function conteudoBalao(marcador, aoAbrir) {
  const caixa = document.createElement('div');
  caixa.className = 'mapa-balao';
  const titulo = document.createElement('strong');
  titulo.textContent = marcador.titulo;
  caixa.append(titulo);
  if (marcador.detalhe) {
    const detalhe = document.createElement('span');
    detalhe.textContent = marcador.detalhe;
    caixa.append(detalhe);
  }
  if (marcador.rota && aoAbrir) {
    const link = document.createElement('a');
    link.href = marcador.rota;
    link.textContent = 'Ver detalhes';
    // Navega pelo React Router (sem recarregar a página).
    link.addEventListener('click', (evento) => {
      evento.preventDefault();
      aoAbrir(marcador.rota);
    });
    caixa.append(link);
  }
  return caixa;
}

export default function Mapa({
  marcadores = [],
  rotas = [],
  camadas = [],
  origem = null,
  agrupar = false,
  selecionado = null,
  rotulo = 'Mapa',
  aoAbrir,
  altura = 360,
}) {
  const divRef = useRef(null);
  const mapaRef = useRef(null);
  const grupoMarcadoresRef = useRef(null);
  const grupoRotasRef = useRef(null);
  const grupoCamadasRef = useRef(null);
  const marcadoresPorIdRef = useRef(new Map());

  // 1. Cria o mapa uma única vez.
  useEffect(() => {
    const mapa = L.map(divRef.current, {
      center: CENTRO_INDAIATUBA,
      zoom: 13,
      scrollWheelZoom: false, // a roda do mouse rola a página, não o mapa
    });
    // Tiles do OpenStreetMap: uso permitido com crédito e sem abuso (não pede chave).
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapa);
    grupoCamadasRef.current = L.layerGroup().addTo(mapa);
    grupoRotasRef.current = L.layerGroup().addTo(mapa);
    mapaRef.current = mapa;

    // O mapa pode nascer dentro de um bloco ainda sem tamanho final: recalcula.
    const observador = new ResizeObserver(() => mapa.invalidateSize());
    observador.observe(divRef.current);

    return () => {
      observador.disconnect();
      mapa.remove();
      mapaRef.current = null;
    };
  }, []);

  // 2. Marcadores (com ou sem agrupamento) — refeitos quando a lista muda.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    grupoMarcadoresRef.current?.remove();
    const grupo = agrupar
      ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 45 })
      : L.featureGroup();
    marcadoresPorIdRef.current = new Map();
    for (const m of marcadores) {
      const marcador = L.marker([m.lat, m.lng], {
        icon: iconeAlfinete(m.categoria, m.id === selecionado),
        title: m.titulo, // vira o texto alternativo do alfinete
        alt: m.titulo,
        keyboard: true,
      }).bindPopup(() => conteudoBalao(m, aoAbrir));
      marcadoresPorIdRef.current.set(m.id, marcador);
      grupo.addLayer(marcador);
    }
    if (origem) {
      grupo.addLayer(
        L.circleMarker([origem.lat, origem.lng], {
          radius: 9,
          color: '#ffffff',
          weight: 3,
          fillColor: '#1a6faf',
          fillOpacity: 1,
        }).bindTooltip('Você está aqui')
      );
    }
    grupo.addTo(mapa);
    grupoMarcadoresRef.current = grupo;
  }, [marcadores, origem, agrupar, selecionado, aoAbrir]);

  // 3. Rotas desenhadas (Como chegar) e camadas GeoJSON (ciclovias, limite).
  useEffect(() => {
    const grupo = grupoRotasRef.current;
    if (!grupo) return;
    grupo.clearLayers();
    for (const rota of rotas) {
      L.polyline(rota.pontos, {
        color: rota.cor ?? '#1a6faf',
        weight: rota.espessura ?? 6,
        opacity: 0.9,
        dashArray: rota.tracejado ? '2 10' : null,
        lineCap: 'round',
      })
        .bindTooltip(rota.titulo ?? '')
        .addTo(grupo);
    }
  }, [rotas]);

  useEffect(() => {
    const grupo = grupoCamadasRef.current;
    if (!grupo) return;
    grupo.clearLayers();
    for (const camada of camadas) {
      if (!camada.geojson) continue;
      L.geoJSON(camada.geojson, {
        style: {
          color: camada.cor ?? '#1a6faf',
          weight: camada.espessura ?? 3,
          fill: camada.preencher ?? false,
          opacity: 0.8,
        },
        interactive: false,
      }).addTo(grupo);
    }
  }, [camadas]);

  // 4. Enquadra tudo o que está no mapa (rotas têm prioridade).
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    const limites = L.latLngBounds([]);
    grupoRotasRef.current.eachLayer((camada) => limites.extend(camada.getBounds()));
    if (!limites.isValid()) {
      for (const m of marcadores) limites.extend([m.lat, m.lng]);
      if (origem) limites.extend([origem.lat, origem.lng]);
    }
    if (!limites.isValid()) return;
    if (limites.getNorthEast().equals(limites.getSouthWest()))
      mapa.setView(limites.getCenter(), 16);
    else mapa.fitBounds(limites, { padding: [30, 30], maxZoom: 16 });
  }, [marcadores, rotas, origem]);

  // 5. Abre o balão do local selecionado (lista sincronizada com o mapa).
  useEffect(() => {
    if (!selecionado) return;
    const marcador = marcadoresPorIdRef.current.get(selecionado);
    const grupo = grupoMarcadoresRef.current;
    if (!marcador) return;
    if (grupo?.zoomToShowLayer) grupo.zoomToShowLayer(marcador, () => marcador.openPopup());
    else marcador.openPopup();
  }, [selecionado, marcadores]);

  return (
    <div
      ref={divRef}
      className="mapa"
      style={{ height: altura }}
      role="region"
      aria-label={`${rotulo}. A mesma informação está na lista desta página.`}
    />
  );
}
