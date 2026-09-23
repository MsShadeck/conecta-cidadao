/**
 * Cabecalho.jsx — Barra superior fixa (logo, navegação e botão de busca).
 */

import { Link, useLocation } from 'react-router-dom';
import { useBusca } from '../context/AppContext.jsx';
import IconeLupa from './IconeLupa.jsx';
import './Cabecalho.css';

export default function Cabecalho() {
  // Função do contexto global que abre o overlay de busca.
  const { abrirBusca } = useBusca();
  const { pathname } = useLocation();
  // Na própria Home o link "Início" seria redundante, então ele some.
  const naHome = pathname === '/';

  return (
    <div className="cabecalho-area">
      <div className="container">
        <header className="cabecalho">
          {/* <Link> troca a rota sem recarregar a página (diferente de <a href>).
              aria-label descreve o destino para leitores de tela, já que o
              conteúdo visual é logo + nome quebrado em duas linhas. */}
          <Link to="/" className="cabecalho-marca" aria-label="Conecta Cidadão, ir para o início">
            <span className="cabecalho-selo">
              {/* alt="" porque a imagem é decorativa: o nome já vem escrito ao lado.
                  width/height evitam o "pulo" do layout enquanto a imagem carrega. */}
              <img src="/img/interface/logo.png" alt="" width="32" height="32" />
            </span>
            <span className="cabecalho-nome">
              Conecta
              <br />
              Cidadão
            </span>
          </Link>

          <nav className="cabecalho-nav">
            {/* Renderização condicional com &&: se naHome for false, mostra o link;
                se for true, não desenha nada. */}
            {!naHome && (
              <Link to="/" className="cabecalho-link">
                Início
              </Link>
            )}
            {/* Páginas da aula "useEffect + Consumo de API". No celular o CSS
                esconde estes dois links; eles continuam acessíveis pelo rodapé. */}
            <Link to="/contatos" className="cabecalho-link cabecalho-link--extra">
              Telefones
            </Link>
            <Link to="/lembretes" className="cabecalho-link cabecalho-link--extra">
              Lembretes
            </Link>
            <Link to="/sobre" className="cabecalho-link">
              Sobre nós
            </Link>

            <button
              type="button"
              className="cabecalho-busca"
              onClick={abrirBusca}
              aria-label="Buscar um serviço"
            >
              <IconeLupa />
              {/* Em telas pequenas o CSS esconde esta palavra e sobra só a lupa. */}
              <span className="cabecalho-atalho">Buscar</span>
            </button>
          </nav>
        </header>
      </div>
    </div>
  );
}
