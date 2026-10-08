/**
 * Cabecalho.jsx — Barra superior fixa (logo, navegação, busca e menu do celular).
 *
 * No computador os links aparecem direto na barra. Em telas estreitas eles
 * não cabem, então somem e dão lugar ao botão "Menu", que abre um painel com
 * todos os destinos do site.
 */

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useBusca } from '../context/AppContext.jsx';
import IconeLupa from './IconeLupa.jsx';
import './Cabecalho.css';

/** Destinos do menu. Ficam numa lista para o menu do celular e o da barra usarem os mesmos. */
const LINKS_PRINCIPAIS = [
  { rota: '/mapa', nome: 'Mapa' },
  { rota: '/mobilidade', nome: 'Ônibus e bike' },
  { rota: '/servicos-online', nome: 'Serviços online' },
  { rota: '/contatos', nome: 'Telefones' },
];

const LINKS_MENU = [
  { rota: '/', nome: 'Início' },
  { rota: '/primeiros-passos', nome: 'Primeiros passos (novo na cidade)' },
  { rota: '/perto-de-mim', nome: 'O que tem perto de mim' },
  { rota: '/como-chegar', nome: 'Como chegar' },
  ...LINKS_PRINCIPAIS,
  { rota: '/lembretes', nome: 'Lembretes' },
  { rota: '/sobre', nome: 'Sobre' },
];

export default function Cabecalho() {
  const { abrirBusca } = useBusca();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const botaoMenuRef = useRef(null);
  const painelRef = useRef(null);

  // Trocou de página: fecha o menu (o clique num link do menu também navega).
  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  // Enquanto o menu está aberto: Esc fecha e o Tab fica "preso" dentro dele,
  // para o foco do teclado não escapar para a página escondida atrás.
  useEffect(() => {
    if (!menuAberto) return undefined;
    const painel = painelRef.current;
    const focaveis = painel.querySelectorAll('a, button');
    focaveis[0]?.focus();

    function aoTeclar(evento) {
      if (evento.key === 'Escape') {
        setMenuAberto(false);
        botaoMenuRef.current?.focus(); // devolve o foco a quem abriu o menu
        return;
      }
      if (evento.key !== 'Tab' || focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      // Shift+Tab no primeiro volta para o último; Tab no último volta ao primeiro.
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [menuAberto]);

  return (
    <div className="cabecalho-area">
      <div className="container">
        <header className="cabecalho">
          {/* <Link> troca a rota sem recarregar a página (diferente de <a href>). */}
          <Link
            to="/"
            className="cabecalho-marca"
            aria-label="Conecta Cidadão Indaiatuba, ir para o início"
          >
            <span className="cabecalho-selo">
              {/* alt="" porque a imagem é decorativa: o nome já vem escrito ao lado.
                  width/height evitam o "pulo" do layout enquanto a imagem carrega. */}
              <img src="/img/interface/logo.png" alt="" width="30" height="24" />
            </span>
            <span className="cabecalho-nome">
              Conecta Cidadão
              <span className="cabecalho-cidade">Indaiatuba</span>
            </span>
          </Link>

          <nav className="cabecalho-nav" aria-label="Principal">
            {/* Links da barra: aparecem só em telas largas (o CSS esconde no celular). */}
            {LINKS_PRINCIPAIS.map((link) => (
              <NavLink
                key={link.rota}
                to={link.rota}
                className={({ isActive }) =>
                  `cabecalho-link cabecalho-link--extra${isActive ? ' cabecalho-link--ativo' : ''}`
                }
              >
                {link.nome}
              </NavLink>
            ))}

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

            {/* aria-expanded diz ao leitor de tela se o menu está aberto;
                aria-controls aponta qual elemento o botão abre. */}
            <button
              ref={botaoMenuRef}
              type="button"
              className="cabecalho-menu-botao"
              aria-expanded={menuAberto}
              aria-controls="menu-celular"
              onClick={() => setMenuAberto((aberto) => !aberto)}
            >
              <span className="cabecalho-menu-icone" aria-hidden="true" />
              {menuAberto ? 'Fechar' : 'Menu'}
            </button>
          </nav>
        </header>

        {menuAberto && (
          <nav id="menu-celular" className="menu-celular" ref={painelRef} aria-label="Menu">
            <ul>
              {LINKS_MENU.map((link) => (
                <li key={link.rota}>
                  <NavLink to={link.rota} end className="menu-celular-link">
                    {link.nome}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
