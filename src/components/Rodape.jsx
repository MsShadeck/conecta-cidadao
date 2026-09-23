/**
 * Rodape.jsx — Rodapé do site: marca e atalhos para as categorias.
 *
 * Os links são gerados a partir de src/data/servicos.js, então uma nova
 * categoria aparece aqui automaticamente.
 */

import { Link } from 'react-router-dom';
import { categorias } from '../data/servicos.js';
import './Rodape.css';

export default function Rodape() {
  return (
    <footer className="rodape">
      <div className="container rodape-interno">
        <div className="rodape-marca">
          <img src="/img/interface/logo.png" alt="" width="34" height="34" />
          <div>
            <p className="rodape-nome">Conecta Cidadão</p>
            <p className="rodape-frase">Cuidado que transforma vidas</p>
          </div>
        </div>

        {/* aria-label identifica este bloco de navegação, já que a página tem
            mais de um <nav> (cabeçalho, chips e rodapé). */}
        <nav className="rodape-links" aria-label="Serviços">
          {categorias.map((categoria) => (
            // key: identificador estável exigido pelo React em listas.
            // O slug é único, então serve bem para isso.
            <Link key={categoria.slug} to={categoria.rota}>
              {categoria.nome}
            </Link>
          ))}
          <Link to="/contatos">Telefones úteis</Link>
          <Link to="/lembretes">Lembretes</Link>
          <Link to="/sobre">Sobre nós</Link>
        </nav>
      </div>
    </footer>
  );
}
