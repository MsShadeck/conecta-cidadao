/**
 * Cabecalho.jsx — Barra superior fixa (logo, navegação, busca e menu).
 *
 * No computador os links principais aparecem direto na barra. O botão "Menu"
 * abre um painel lateral com todos os destinos do site e as opções de
 * acessibilidade.
 *
 * O painel é um Dialog do Radix UI (@radix-ui/react-dialog). O Radix cuida do
 * que antes era feito à mão: prender o Tab dentro do painel, fechar com Esc ou
 * clique fora, travar a rolagem do fundo, avisar o leitor de tela (role
 * "dialog" + aria-modal) e devolver o foco ao botão "Menu" ao fechar.
 * A animação de entrada e saída é do Motion.
 */

import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bookmark,
  Globe,
  House,
  Info,
  Map as IconeMapa,
  Menu,
  Navigation,
  Phone,
  X,
} from 'lucide-react';
import { useBusca } from '../context/AppContext.jsx';
import IconeLupa from './IconeLupa.jsx';
import PreferenciasTela from './PreferenciasTela.jsx';
import IconeCategoria from './IconeCategoria.jsx';
import './Cabecalho.css';

/**
 * Barra do topo: só o caminho de quem está chegando à cidade (poucas
 * entradas, para caber na barra). O resto do site fica no Menu.
 */
const LINKS_PRINCIPAIS = [
  { rota: '/primeiros-passos', nome: 'Primeiros passos' },
  { rota: '/meu-bairro', nome: 'Meu bairro' },
  { rota: '/mobilidade', nome: 'Transporte' },
  { rota: '/mapa', nome: 'Mapa' },
];

/**
 * Menu completo, na ordem da jornada de quem acabou de se mudar.
 * "icone" é o slug de uma seção (IconeCategoria); "Icone" é um ícone Lucide
 * para os destinos que não são seções.
 */
const LINKS_MENU = [
  { rota: '/', nome: 'Início', Icone: House },
  { rota: '/primeiros-passos', nome: 'Primeiros passos', icone: 'passos' },
  { rota: '/meu-bairro', nome: 'Meu bairro', icone: 'bairro' },
  { rota: '/servicos', nome: 'Serviços públicos', icone: 'servicos' },
  { rota: '/dia-a-dia', nome: 'Dia a dia (mercados, farmácias...)', icone: 'dia-a-dia' },
  { rota: '/mobilidade', nome: 'Transporte (ônibus, bike, trânsito)', icone: 'mobilidade' },
  { rota: '/lazer', nome: 'Lazer e cultura', icone: 'lazer' },
  { rota: '/conheca', nome: 'Conheça Indaiatuba', icone: 'conheca' },
  { rota: '/mapa', nome: 'Mapa', Icone: IconeMapa },
  { rota: '/como-chegar', nome: 'Como chegar', Icone: Navigation },
  { rota: '/servicos-online', nome: 'Serviços online', Icone: Globe },
  { rota: '/contatos', nome: 'Telefones úteis', Icone: Phone },
  { rota: '/lembretes', nome: 'Lembretes', Icone: Bookmark },
  { rota: '/sobre', nome: 'Sobre', Icone: Info },
];

export default function Cabecalho() {
  const { abrirBusca } = useBusca();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  // Trocou de página: fecha o menu (o clique num link do menu também navega).
  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  return (
    <div className="cabecalho-area">
      <header className="container cabecalho">
        {/* <Link> troca a rota sem recarregar a página (diferente de <a href>). */}
        {/* Sem aria-label: o nome acessível do link é o próprio texto visível
            ("Conecta Cidadão Indaiatuba"), como recomenda a WCAG (2.5.3). */}
        <Link to="/" className="cabecalho-marca">
          <span className="cabecalho-selo">
            {/* alt="" porque a imagem é decorativa: o nome já vem escrito ao lado.
                width/height evitam o "pulo" do layout enquanto a imagem carrega. */}
            <img src="/img/interface/pequeno/logo.png" alt="" width="26" height="21" />
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
        </nav>

        <div className="cabecalho-acoes">
          <button
            type="button"
            className="cabecalho-busca"
            onClick={abrirBusca}
            aria-label="Buscar um serviço"
          >
            <IconeLupa />
            {/* Em telas pequenas o CSS esconde estes textos e sobra só a lupa. */}
            <span className="cabecalho-atalho">Buscar</span>
            <kbd className="cabecalho-tecla" aria-hidden="true">
              Ctrl K
            </kbd>
          </button>

          {/* Dialog.Root controlado: o estado menuAberto decide se o painel aparece. */}
          <Dialog.Root open={menuAberto} onOpenChange={setMenuAberto}>
            {/* Trigger: o Radix coloca aria-expanded e aria-controls sozinho. */}
            <Dialog.Trigger className="cabecalho-menu-botao">
              <Menu size={18} strokeWidth={2} />
              <span>Menu</span>
            </Dialog.Trigger>

            {/* AnimatePresence + forceMount: o Radix deixa o Motion decidir
                quando o painel sai da tela, para a animação de saída tocar. */}
            <AnimatePresence>
              {menuAberto && (
                <Dialog.Portal forceMount>
                  <Dialog.Overlay asChild forceMount>
                    <motion.div
                      className="menu-fundo"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    />
                  </Dialog.Overlay>
                  <Dialog.Content asChild forceMount aria-describedby={undefined}>
                    <motion.nav
                      id="menu-celular"
                      className="menu-celular"
                      aria-label="Menu"
                      initial={{ x: 32, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 32, opacity: 0 }}
                      transition={{ duration: 0.24, ease: [0.2, 0.7, 0.3, 1] }}
                    >
                      <div className="menu-celular-topo">
                        {/* Título exigido pelo Dialog: é o nome do painel para o leitor de tela. */}
                        <Dialog.Title className="menu-celular-titulo">Navegar</Dialog.Title>
                        <Dialog.Close className="menu-celular-fechar" aria-label="Fechar menu">
                          <X size={18} strokeWidth={2} />
                        </Dialog.Close>
                      </div>
                      <ul>
                        {LINKS_MENU.map((link) => (
                          <li key={link.rota}>
                            <NavLink
                              to={link.rota}
                              end
                              className="menu-celular-link"
                              data-categoria={link.icone}
                            >
                              <span className="menu-celular-icone">
                                {link.icone ? (
                                  <IconeCategoria slug={link.icone} tamanho={18} />
                                ) : (
                                  <link.Icone size={18} strokeWidth={1.75} />
                                )}
                              </span>
                              {link.nome}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                      {/* Acessibilidade: tamanho da letra, tema claro/escuro e Libras. */}
                      <div className="menu-celular-preferencias">
                        <h2 className="menu-celular-subtitulo">Acessibilidade</h2>
                        <PreferenciasTela />
                      </div>
                    </motion.nav>
                  </Dialog.Content>
                </Dialog.Portal>
              )}
            </AnimatePresence>
          </Dialog.Root>
        </div>
      </header>
    </div>
  );
}
