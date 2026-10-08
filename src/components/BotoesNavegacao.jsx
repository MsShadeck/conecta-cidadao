/**
 * BotoesNavegacao.jsx — "Ir com Waze" e "Ir com Google Maps" de um local.
 *
 * Usado em todo lugar que leva a pessoa até um endereço: página do local,
 * Meu bairro, Dia a dia, Mapa, Como chegar e checklist. O site não desenha
 * rotas; o app de mapas da pessoa faz isso.
 *
 *  - Waze: só de carro/moto (o Waze não traça rota a pé nem de ônibus).
 *  - Google Maps: a pé, de ônibus (linhas reais da operadora), de bicicleta e de carro.
 *
 * @param {object} props
 * @param {object} props.local   - item com coordenadas e/ou enderecoTexto
 * @param {boolean} [props.compacto] - versão curta para listas: Waze + Google (modo padrão)
 * @param {string} [props.modoPadrao] - modo do botão do Google no formato compacto
 * @param {{lat:number,lng:number}} [props.origem] - ponto de partida para o Google Maps
 */

import { linkGoogleMaps, linkWaze, MODOS_GOOGLE, podeNavegar } from '../utils/navegacao.js';
import './BotoesNavegacao.css';

export default function BotoesNavegacao({
  local,
  compacto = false,
  modoPadrao = 'transit',
  origem = null,
}) {
  // Sem coordenada nem endereço não há como navegar: os botões não aparecem.
  if (!podeNavegar(local)) return null;
  const nome = local.nome ?? 'o local';

  // Atributos comuns: nova aba e sem passar informações da página para o site de destino.
  // Os aria-label começam pelo texto visível do botão (WCAG 2.5.3) e dizem o destino.
  const externo = { target: '_blank', rel: 'noopener noreferrer' };

  if (compacto) {
    return (
      <div className="navegacao navegacao--compacta">
        <a
          className="navegacao-botao navegacao-botao--waze"
          href={linkWaze(local)}
          aria-label={`Waze: rota de carro até ${nome}`}
          {...externo}
        >
          Waze
        </a>
        <a
          className="navegacao-botao"
          href={linkGoogleMaps(local, modoPadrao, origem)}
          aria-label={`Google Maps: rota até ${nome}, ${MODOS_GOOGLE[modoPadrao].toLowerCase()}`}
          {...externo}
        >
          Google Maps
        </a>
      </div>
    );
  }

  return (
    <div className="navegacao">
      <a
        className="navegacao-botao navegacao-botao--waze"
        href={linkWaze(local)}
        aria-label={`Ir com Waze de carro até ${nome}`}
        {...externo}
      >
        Ir com Waze <small>de carro</small>
      </a>
      <div className="navegacao-google" role="group" aria-label="Ir com Google Maps">
        <span className="navegacao-rotulo">Ir com Google Maps:</span>
        {Object.entries(MODOS_GOOGLE).map(([modo, rotulo]) => (
          <a
            key={modo}
            className="navegacao-botao"
            href={linkGoogleMaps(local, modo, origem)}
            aria-label={`${rotulo} até ${nome}, pelo Google Maps`}
            {...externo}
          >
            {rotulo}
          </a>
        ))}
      </div>
    </div>
  );
}
