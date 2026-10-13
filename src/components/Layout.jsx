/**
 * Layout.jsx — Moldura fixa do site.
 *
 * Tudo o que aparece em TODAS as páginas mora aqui: link de acessibilidade,
 * cabeçalho, rodapé, overlay de busca e a área de avisos. O conteúdo variável
 * de cada rota entra no <Outlet />.
 *
 * Registrado no App.jsx como rota "pai" — por isso não precisa receber props.
 */

import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
// Motion (antigo Framer Motion): animações em React.
// MotionConfig reducedMotion="user" desliga os deslocamentos para quem pediu
// ao sistema para reduzir movimento (mesma regra do global.css).
import { MotionConfig, animate, useReducedMotion } from 'motion/react';
import Cabecalho from './Cabecalho.jsx';
import Rodape from './Rodape.jsx';
import BuscaOverlay from './BuscaOverlay.jsx';
import Aviso from './Aviso.jsx';

export default function Layout() {
  // pathname = caminho atual da URL (ex.: '/saude').
  const { pathname } = useLocation();

  const mainRef = useRef(null);
  // Texto lido pelo leitor de tela ao trocar de página (ver região aria-live abaixo).
  const [anuncio, setAnuncio] = useState('');
  // Na primeira carga o leitor de tela já lê a página sozinho; só anunciamos as trocas.
  const primeiraCarga = useRef(true);
  // true quando o sistema pede "reduzir movimento".
  const reduzirMovimento = useReducedMotion();

  // Ao trocar de rota o React apenas substitui o conteúdo; o navegador mantém a
  // rolagem onde estava e o foco no link clicado. Este efeito:
  //  1. devolve a página ao topo;
  //  2. leva o foco para o <main>, para o Tab seguinte começar no conteúdo novo;
  //  3. anuncia o título da página nova;
  //  4. faz a página nova surgir com um fade curto (Motion).
  // O efeito do Layout roda DEPOIS dos efeitos das páginas filhas, então o
  // document.title já está atualizado pelo useTituloPagina quando chegamos aqui.
  useEffect(() => {
    window.scrollTo(0, 0);
    if (primeiraCarga.current) {
      primeiraCarga.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
    setAnuncio(`Página carregada: ${document.title}`);
    // animate() anima o elemento direto, sem recriar a página (o estado dela,
    // como filtros e campos digitados, continua o mesmo). Com movimento
    // reduzido, sobra só o fade.
    animate(
      mainRef.current,
      reduzirMovimento ? { opacity: [0, 1] } : { opacity: [0, 1], y: [8, 0] },
      { duration: 0.28, ease: [0.2, 0.7, 0.3, 1] }
    );
  }, [pathname, reduzirMovimento]);

  return (
    // MotionConfig no lugar do Fragment: vale para todas as animações do site.
    <MotionConfig reducedMotion="user">
      {/* Acessibilidade: link invisível que só aparece ao receber foco pelo Tab.
          Permite a quem navega por teclado pular o cabeçalho e ir direto ao conteúdo. */}
      <a className="pular-para-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>

      <Cabecalho />

      {/* <main> é a marcação semântica do conteúdo principal; o id é o alvo do link acima.
          tabIndex={-1} permite receber foco por código (link "Pular" e troca de rota)
          sem entrar na ordem normal do Tab. */}
      <main id="conteudo" className="conteudo" tabIndex={-1} ref={mainRef}>
        {/* Outlet: espaço onde o React Router desenha a página da rota atual. */}
        <Outlet />
      </main>

      <Rodape />

      {/* Ficam por último porque são camadas sobrepostas (overlay e toast).
          Ambos se escondem sozinhos quando não há nada a exibir. */}
      <BuscaOverlay />
      <Aviso />

      {/* Região invisível na tela, mas lida pelos leitores de tela a cada troca de página. */}
      <p className="somente-leitor" aria-live="polite" aria-atomic="true">
        {anuncio}
      </p>
    </MotionConfig>
  );
}
