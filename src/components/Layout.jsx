/**
 * Layout.jsx — Moldura fixa do site.
 *
 * Tudo o que aparece em TODAS as páginas mora aqui: link de acessibilidade,
 * cabeçalho, rodapé, overlay de busca e a área de avisos. O conteúdo variável
 * de cada rota entra no <Outlet />.
 *
 * Registrado no App.jsx como rota "pai" — por isso não precisa receber props.
 */

import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Cabecalho from './Cabecalho.jsx';
import Rodape from './Rodape.jsx';
import BuscaOverlay from './BuscaOverlay.jsx';
import Aviso from './Aviso.jsx';

export default function Layout() {
  // pathname = caminho atual da URL (ex.: '/saude').
  const { pathname } = useLocation();

  // Ao trocar de rota o React apenas substitui o conteúdo; o navegador mantém a
  // rolagem onde estava. Este efeito devolve a página ao topo a cada navegação.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    // <>...</> é um Fragment: agrupa elementos sem criar uma <div> extra no HTML.
    <>
      {/* Acessibilidade: link invisível que só aparece ao receber foco pelo Tab.
          Permite a quem navega por teclado pular o cabeçalho e ir direto ao conteúdo. */}
      <a className="pular-para-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>

      <Cabecalho />

      {/* <main> é a marcação semântica do conteúdo principal; o id é o alvo do link acima. */}
      <main id="conteudo" className="conteudo">
        {/* Outlet: espaço onde o React Router desenha a página da rota atual. */}
        <Outlet />
      </main>

      <Rodape />

      {/* Ficam por último porque são camadas sobrepostas (overlay e toast).
          Ambos se escondem sozinhos quando não há nada a exibir. */}
      <BuscaOverlay />
      <Aviso />
    </>
  );
}
