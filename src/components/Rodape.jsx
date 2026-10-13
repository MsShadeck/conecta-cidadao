/**
 * Rodape.jsx — Rodapé do site: marca, atalhos e aviso de projeto não oficial.
 *
 * Os links de serviço são gerados a partir de src/data/servicos.js, então uma
 * nova categoria aparece aqui automaticamente.
 */

import { Link } from 'react-router-dom';
import { categorias } from '../data/servicos.js';
import './Rodape.css';

/** Atalhos da jornada de quem está chegando (segunda coluna). */
const LINKS_CIDADE = [
  { rota: '/primeiros-passos', nome: 'Primeiros passos' },
  { rota: '/meu-bairro', nome: 'Meu bairro' },
  { rota: '/dia-a-dia', nome: 'Dia a dia' },
  { rota: '/conheca', nome: 'Conheça Indaiatuba' },
];

/** Ferramentas e informações do site (terceira coluna). */
const LINKS_SITE = [
  { rota: '/contatos', nome: 'Telefones úteis' },
  { rota: '/lembretes', nome: 'Lembretes' },
  { rota: '/sobre', nome: 'Sobre nós' },
];

export default function Rodape() {
  return (
    <footer className="rodape">
      <div className="container rodape-interno">
        <div className="rodape-marca">
          <span className="rodape-selo">
            <img src="/img/interface/pequeno/logo.png" alt="" width="26" height="21" />
          </span>
          <div>
            <p className="rodape-nome">Conecta Cidadão · Indaiatuba</p>
            <p className="rodape-frase">
              Projeto acadêmico não oficial da Fatec Indaiatuba. Cada página mostra a fonte da
              informação.
            </p>
          </div>
        </div>

        {/* aria-label identifica cada bloco de navegação, já que a página tem
            mais de um <nav> (cabeçalho, chips e rodapé). */}
        <nav className="rodape-coluna" aria-label="Serviços">
          <p className="rodape-titulo">Serviços</p>
          {categorias.map((categoria) => (
            // key: identificador estável exigido pelo React em listas.
            // O slug é único, então serve bem para isso.
            <Link key={categoria.slug} to={categoria.rota}>
              {categoria.nome}
            </Link>
          ))}
        </nav>
        <nav className="rodape-coluna" aria-label="A cidade">
          <p className="rodape-titulo">A cidade</p>
          {LINKS_CIDADE.map((link) => (
            <Link key={link.rota} to={link.rota}>
              {link.nome}
            </Link>
          ))}
        </nav>
        <nav className="rodape-coluna" aria-label="O site">
          <p className="rodape-titulo">O site</p>
          {LINKS_SITE.map((link) => (
            <Link key={link.rota} to={link.rota}>
              {link.nome}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
