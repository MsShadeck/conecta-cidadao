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
import PreferenciasTela from './PreferenciasTela.jsx';
import IconeCategoria from './IconeCategoria.jsx';
import './Cabecalho.css';

/**
 * Barra do topo: só o caminho de quem está chegando à cidade (poucas
 * entradas, para caber no celular). O resto do site fica no Menu.
 */
const LINKS_PRINCIPAIS = [
  { rota: '/primeiros-passos', nome: 'Primeiros passos' },
  { rota: '/meu-bairro', nome: 'Meu bairro' },
  { rota: '/mobilidade', nome: 'Transporte' },
  { rota: '/mapa', nome: 'Mapa' },
];

/** Menu completo, na ordem da jornada de quem acabou de se mudar. */
const LINKS_MENU = [
  { rota: '/', nome: 'Início' },
  { rota: '/primeiros-passos', nome: 'Primeiros passos', icone: 'passos' },
  { rota: '/meu-bairro', nome: 'Meu bairro', icone: 'bairro' },
  { rota: '/servicos', nome: 'Serviços públicos', icone: 'servicos' },
  { rota: '/dia-a-dia', nome: 'Dia a dia (mercados, farmácias...)', icone: 'dia-a-dia' },
  { rota: '/mobilidade', nome: 'Transporte (ônibus, bike, trânsito)', icone: 'mobilidade' },
  { rota: '/lazer', nome: 'Lazer e cultura', icone: 'lazer' },
  { rota: '/conheca', nome: 'Conheça Indaiatuba', icone: 'conheca' },
  { rota: '/mapa', nome: 'Mapa' },
  { rota: '/como-chegar', nome: 'Como chegar' },
  { rota: '/servicos-online', nome: 'Serviços online' },
  { rota: '/contatos', nome: 'Telefones úteis' },
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
    const focaveis = painel.querySelectorAll('a, button:not([disabled]), select');
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
          {/* Sem aria-label: o nome acessível do link é o próprio texto visível
              ("Conecta Cidadão Indaiatuba"), como recomenda a WCAG (2.5.3). */}
          <Link to="/" className="cabecalho-marca">
            <span className="cabecalho-selo">
              {/* alt="" porque a imagem é decorativa: o nome já vem escrito ao lado.
                  width/height evitam o "pulo" do layout enquanto a imagem carrega. */}
              <img src="/img/interface/pequeno/logo.png" alt="" width="30" height="24" />
            </span>
            <span className="cabecalho-nome">
              Conecta Cidadão <span className="cabecalho-cidade">Indaiatuba</span>
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
                  <NavLink
                    to={link.rota}
                    end
                    className="menu-celular-link"
                    data-categoria={link.icone}
                  >
                    {link.icone && <IconeCategoria slug={link.icone} tamanho={20} />}
                    {link.nome}
                  </NavLink>
                </li>
              ))}
            </ul>
            {/* Acessibilidade: tamanho da letra, tema claro/escuro e Libras. */}
            <div className="menu-celular-preferencias">
              <h2 className="menu-celular-titulo">Acessibilidade</h2>
              <PreferenciasTela />
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
