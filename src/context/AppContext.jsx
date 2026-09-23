/**
 * AppContext.jsx — Estado global da aplicação (Context API do React).
 *
 * Guarda duas informações que precisam ser acessadas por componentes distantes
 * uns dos outros na árvore:
 *   • buscaAberta → se o overlay de busca está visível;
 *   • aviso       → a mensagem temporária ("toast") exibida no rodapé da tela.
 *
 * Sem o Context seria necessário repassar essas informações de componente em
 * componente por props (o chamado "prop drilling").
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

// O contexto nasce com null. Se algum componente tentar usá-lo fora do
// <AppProvider>, esse null é detectado em usarApp() e vira um erro claro.
const AppContext = createContext(null);

/**
 * Provedor que envolve a aplicação e distribui o estado global.
 * @param {{children: React.ReactNode}} props - componentes que ficam "dentro" do provedor.
 */
export function AppProvider({ children }) {
  // Controla a abertura do overlay de busca (false = fechado).
  const [buscaAberta, setBuscaAberta] = useState(false);
  // Aviso atual: null quando não há nada para mostrar.
  const [aviso, setAviso] = useState(null);
  // useRef guarda o id do setTimeout entre renderizações SEM causar nova
  // renderização quando muda (diferente do useState).
  const tempoRef = useRef(null);

  // useCallback evita recriar a função a cada renderização, o que manteria
  // o objeto "valor" (mais abaixo) sempre diferente e re-renderizaria tudo.
  const abrirBusca = useCallback(() => setBuscaAberta(true), []);
  const fecharBusca = useCallback(() => setBuscaAberta(false), []);

  /** Exibe um aviso temporário na tela por 2,6 segundos. */
  const mostrarAviso = useCallback((texto) => {
    // Cancela o aviso anterior: se o usuário clicar em vários cards seguidos,
    // o contador reinicia em vez de o aviso sumir no meio.
    window.clearTimeout(tempoRef.current);
    // O id (Date.now) serve de "key" no componente Aviso: mudando a key, o React
    // recria o elemento e a animação de entrada roda de novo.
    setAviso({ texto, id: Date.now() });
    tempoRef.current = window.setTimeout(() => setAviso(null), 2600);
  }, []);

  // Limpeza: se o provedor for desmontado, cancela o timer pendente para não
  // tentar atualizar o estado de um componente que não existe mais.
  useEffect(() => () => window.clearTimeout(tempoRef.current), []);

  // Atalho de teclado: Ctrl/Cmd + K abre a busca em qualquer página.
  useEffect(() => {
    function aoTeclar(evento) {
      // metaKey cobre o Command do macOS; ctrlKey cobre Windows e Linux.
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') {
        // Impede a ação padrão do navegador para esse atalho.
        evento.preventDefault();
        setBuscaAberta(true);
      }
    }
    // Mesmo padrão do componente Tecla da aula de useEffect: addEventListener
    // na montagem e removeEventListener no cleanup.
    window.addEventListener('keydown', aoTeclar);
    // A função retornada pelo useEffect remove o listener quando o componente sai
    // de tela, evitando vazamento de memória e listeners duplicados.
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []); // [] = registra uma única vez, na montagem.

  // useMemo monta o objeto do contexto só quando algum valor realmente muda.
  const valor = useMemo(
    () => ({ buscaAberta, abrirBusca, fecharBusca, aviso, mostrarAviso }),
    [buscaAberta, abrirBusca, fecharBusca, aviso, mostrarAviso]
  );

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}

/**
 * Hook interno (não exportado) que lê o contexto e garante que ele existe.
 * Centralizar essa checagem aqui evita repeti-la nos hooks públicos abaixo.
 */
function usarApp() {
  const contexto = useContext(AppContext);
  if (!contexto) {
    throw new Error('Os hooks do app precisam estar dentro de <AppProvider>.');
  }
  return contexto;
}

/** Hook público para quem só precisa controlar a busca (Cabeçalho, Home, Overlay). */
export function useBusca() {
  const { buscaAberta, abrirBusca, fecharBusca } = usarApp();
  return { buscaAberta, abrirBusca, fecharBusca };
}

/** Hook público para quem só precisa dos avisos (CardLocal, Aviso, Overlay). */
export function useAviso() {
  const { aviso, mostrarAviso } = usarApp();
  return { aviso, mostrarAviso };
}
