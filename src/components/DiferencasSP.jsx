/**
 * DiferencasSP.jsx — Bloco da Home "Diferenças para quem vem de São Paulo".
 *
 * Mostra os títulos e textos de /api/cidade.json (cada um com fonte) e leva
 * para a lista completa em Conheça Indaiatuba.
 */

import { Link } from 'react-router-dom';
import useDados from '../hooks/useDados.js';
import IconeCategoria from './IconeCategoria.jsx';

const NA_HOME = 4;

export default function DiferencasSP() {
  const { dados } = useDados('/api/cidade.json');
  if (!dados?.diferencas?.length) return null;
  return (
    <section
      className="container home-diferencas"
      data-categoria="conheca"
      aria-labelledby="titulo-diferencas-sp"
    >
      <div className="home-seu-bairro-topo">
        <h2 id="titulo-diferencas-sp" className="home-servicos-titulo">
          <IconeCategoria slug="conheca" />
          Diferenças para quem vem de São Paulo
        </h2>
        <Link to="/conheca#diferencas">Ver todas, com as fontes</Link>
      </div>
      <ul className="home-seu-bairro-lista">
        {dados.diferencas.slice(0, NA_HOME).map((d) => (
          <li key={d.id} className="painel">
            <strong>{d.titulo}</strong>
            <span>{d.texto}</span>
            <a className="info-fonte" href={d.fonte} target="_blank" rel="noopener noreferrer">
              Fonte
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
