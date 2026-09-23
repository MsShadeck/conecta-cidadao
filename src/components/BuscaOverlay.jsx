/**
 * BuscaOverlay.jsx — Janela de busca que abre sobre a página.
 *
 * É o componente mais complexo do projeto. Ele cuida de:
 *   • montar a lista exibida (categorias quando o campo está vazio, locais quando há texto);
 *   • foco automático no campo e bloqueio da rolagem do fundo ao abrir;
 *   • navegação por teclado (setas, Enter e Esc) além do clique do mouse;
 *   • fechar ao clicar fora do painel;
 *   • navegar até a página escolhida.
 *
 * A visibilidade é controlada pelo estado global (useBusca), pois o overlay é
 * aberto de vários lugares: cabeçalho, botão da Home e atalho Ctrl/Cmd + K.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categorias, filtrarLocais } from '../data/servicos.js';
import { useAviso, useBusca } from '../context/AppContext.jsx';
import IconeLupa from './IconeLupa.jsx';
import './BuscaOverlay.css';

export default function BuscaOverlay() {
  const { buscaAberta, fecharBusca } = useBusca();
  const { mostrarAviso } = useAviso();
  // navigate() muda de rota por código (aqui, depois de escolher um resultado).
  const navigate = useNavigate();

  const [termo, setTermo] = useState('');   // texto digitado no campo
  const [ativo, setAtivo] = useState(0);    // índice do item destacado na lista

  // Referências para elementos reais do DOM:
  const campoRef = useRef(null);  // o <input>, para dar foco nele
  const listaRef = useRef(null);  // a <ul>, para rolar até o item destacado

  /**
   * Lista de resultados. O useMemo só recalcula quando o termo muda, evitando
   * refazer o filtro a cada renderização.
   *
   * Os dois casos produzem objetos com os MESMOS campos (nome, detalhe, rota...),
   * o que permite renderizar tudo com um único map() lá embaixo.
   */
  const itens = useMemo(() => {
    // Campo vazio: sugere as quatro categorias como ponto de partida.
    if (!termo.trim()) {
      return categorias.map((categoria) => ({
        tipo: 'categoria',
        chave: categoria.slug,
        nome: categoria.nome,
        detalhe: `${categoria.locais.length} locais`,
        rota: categoria.rota,
        categoriaSlug: categoria.slug,
        icone: categoria.icone,
      }));
    }
    // Com texto digitado: busca os locais (sem acento e sem diferenciar maiúsculas).
    return filtrarLocais(termo).map((local) => ({
      tipo: 'local',
      // Nome sozinho poderia repetir entre categorias; junto do slug fica único.
      chave: `${local.categoriaSlug}-${local.nome}`,
      nome: local.nome,
      detalhe: local.categoriaNome,
      rota: local.rota,
      categoriaSlug: local.categoriaSlug,
      imagem: local.imagem,
    }));
  }, [termo]);

  // A cada letra digitada, o destaque volta para o primeiro resultado —
  // senão o índice poderia apontar para uma posição que não existe mais.
  useEffect(() => {
    setAtivo(0);
  }, [termo]);

  // Efeitos de abertura e fechamento do overlay.
  useEffect(() => {
    if (!buscaAberta) {
      // Fechou: limpa o campo para a próxima abertura começar em branco.
      setTermo('');
      return undefined;
    }
    // Pequeno atraso antes do foco: dá tempo de a animação de entrada começar.
    // O "?." evita erro caso o elemento ainda não exista.
    const foco = window.setTimeout(() => campoRef.current?.focus(), 60);

    // Trava a rolagem da página de trás enquanto o overlay está aberto,
    // guardando o valor anterior para restaurá-lo depois.
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Função de limpeza: roda ao fechar o overlay ou ao desmontar o componente.
    return () => {
      window.clearTimeout(foco);
      document.body.style.overflow = overflowAnterior;
    };
  }, [buscaAberta]);

  // Mantém o item destacado visível ao navegar com as setas em listas longas.
  // block: 'nearest' rola o mínimo necessário, sem "pular" a lista inteira.
  useEffect(() => {
    const item = listaRef.current?.children[ativo];
    item?.scrollIntoView({ block: 'nearest' });
  }, [ativo]);

  // Retornar null = não desenha nada. Fica DEPOIS dos hooks porque as regras do
  // React exigem que todos os hooks sejam chamados em toda renderização.
  if (!buscaAberta) return null;

  /** Fecha o overlay, navega até a rota do item escolhido e avisa na tela. */
  function escolher(item) {
    fecharBusca();
    navigate(item.rota);
    // Categoria já leva à página certa; para um local, o aviso indica qual foi escolhido.
    if (item.tipo === 'local') {
      mostrarAviso(`Abrindo: ${item.nome}`);
    }
  }

  /** Teclas de atalho dentro do painel de busca. */
  function aoTeclar(evento) {
    if (evento.key === 'Escape') {
      fecharBusca();
      return;
    }
    if (evento.key === 'ArrowDown') {
      // preventDefault impede que a seta role a página em vez de mover o destaque.
      evento.preventDefault();
      // O resto (%) faz a lista dar a volta: do último item retorna ao primeiro.
      setAtivo((indice) => (itens.length ? (indice + 1) % itens.length : 0));
      return;
    }
    if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      // Soma-se itens.length antes do % para o resultado não ficar negativo.
      setAtivo((indice) => (itens.length ? (indice - 1 + itens.length) % itens.length : 0));
      return;
    }
    if (evento.key === 'Enter' && itens[ativo]) {
      evento.preventDefault();
      escolher(itens[ativo]);
    }
  }

  return (
    // Fundo escurecido. role="dialog" + aria-modal avisam ao leitor de tela que
    // o conteúdo de trás está temporariamente indisponível.
    <div
      className="busca-fundo"
      role="dialog"
      aria-modal="true"
      aria-label="Buscar serviços"
      onMouseDown={(evento) => {
        // Só fecha se o clique foi no fundo (target === currentTarget).
        // Sem essa checagem, clicar dentro do painel também fecharia,
        // porque o evento sobe pela árvore até chegar aqui.
        if (evento.target === evento.currentTarget) fecharBusca();
      }}
    >
      {/* O onKeyDown fica no painel: assim funciona com o foco no campo ou em
          qualquer botão da lista. */}
      <div className="busca-painel" onKeyDown={aoTeclar}>
        <div className="busca-campo">
          <IconeLupa />
          {/* Campo controlado: o valor vem do estado e o onChange o atualiza.
              O React passa a ser a única fonte da verdade do que está digitado. */}
          <input
            ref={campoRef}
            className="busca-input"
            type="text"
            value={termo}
            placeholder="Buscar por uma unidade, escola, parque..."
            // O placeholder some ao digitar; o aria-label descreve o campo o tempo todo.
            aria-label="Buscar por uma unidade, escola ou parque"
            onChange={(evento) => setTermo(evento.target.value)}
          />
          <button type="button" className="busca-fechar" onClick={fecharBusca} aria-label="Fechar busca">
            Esc
          </button>
        </div>

        {/* Operador ternário: com resultados mostra a lista; sem resultados,
            uma mensagem de ajuda. */}
        {itens.length > 0 ? (
          <ul className="busca-lista" ref={listaRef}>
            {itens.map((item, indice) => (
              <li key={item.chave}>
                <button
                  type="button"
                  // Template string monta a classe: acrescenta o modificador
                  // apenas no item destacado.
                  className={`busca-item${indice === ativo ? ' busca-item--ativo' : ''}`}
                  data-categoria={item.categoriaSlug}
                  // Mouse e teclado compartilham o mesmo destaque: passar o mouse
                  // por um item move o "ativo" para ele.
                  onMouseEnter={() => setAtivo(indice)}
                  onClick={() => escolher(item)}
                >
                  {/* Local mostra a foto; categoria mostra o ícone dentro de um selo colorido. */}
                  {item.tipo === 'local' ? (
                    <img className="busca-miniatura" src={item.imagem} alt="" loading="lazy" />
                  ) : (
                    <span className="busca-miniatura busca-miniatura--icone">
                      <img src={item.icone} alt="" />
                    </span>
                  )}
                  <span className="busca-texto">
                    <span className="busca-nome">{item.nome}</span>
                    {/* Detalhe: nome da categoria (local) ou contagem de locais (categoria). */}
                    <span className="busca-detalhe">{item.detalhe}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="busca-vazio">
            Nada encontrado para “{termo}”. Tente o nome do bairro ou do serviço.
          </p>
        )}
      </div>
    </div>
  );
}
