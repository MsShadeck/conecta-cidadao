/**
 * BuscaOverlay.jsx — Janela de busca que abre sobre a página.
 *
 * É o componente mais complexo do projeto. Ele cuida de:
 *   • montar a lista exibida (categorias quando o campo está vazio; resultados
 *     agrupados — locais, bairros, telefones e serviços online — quando há texto);
 *   • foco automático no campo e bloqueio da rolagem do fundo ao abrir;
 *   • navegação por teclado (setas, Enter e Esc) além do clique do mouse;
 *   • fechar ao clicar fora do painel;
 *   • navegar até a página escolhida (ou ligar / abrir o serviço online).
 *
 * A visibilidade é controlada pelo estado global (useBusca), pois o overlay é
 * aberto de vários lugares: cabeçalho, botão da Home e atalho Ctrl/Cmd + K.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categorias } from '../data/servicos.js';
import { useBusca } from '../context/AppContext.jsx';
import useDados from '../hooks/useDados.js';
import { buscarTudo } from '../utils/busca.js';
import IconeLupa from './IconeLupa.jsx';
import Foto from './Foto.jsx';
import IconeCategoria from './IconeCategoria.jsx';
import './BuscaOverlay.css';

export default function BuscaOverlay() {
  const { buscaAberta, fecharBusca } = useBusca();
  // navigate() muda de rota por código (aqui, depois de escolher um resultado).
  const navigate = useNavigate();

  const [termo, setTermo] = useState(''); // texto digitado no campo
  const [ativo, setAtivo] = useState(0); // índice do item destacado na lista

  // Os dados só são pedidos quando a busca abre pela primeira vez (url null = não busca).
  const { dados: locais } = useDados(buscaAberta ? '/api/locais.json' : null);
  const { dados: contatos } = useDados(buscaAberta ? '/api/contatos.json' : null);
  const { dados: servicos } = useDados(buscaAberta ? '/api/servicos-online.json' : null);

  // Referências para elementos reais do DOM:
  const campoRef = useRef(null); // o <input>, para dar foco nele
  const listaRef = useRef(null); // a lista, para rolar até o item destacado

  /**
   * Grupos de resultados. O useMemo só recalcula quando o termo ou os dados mudam.
   * Todos os itens têm os MESMOS campos (nome, detalhe, rota ou href...), o que
   * permite renderizar tudo com um único map() lá embaixo.
   */
  const grupos = useMemo(() => {
    // Campo vazio: sugere as categorias como ponto de partida.
    if (!termo.trim()) {
      return [
        {
          titulo: 'Categorias',
          itens: categorias.map((categoria) => ({
            tipo: 'categoria',
            chave: categoria.slug,
            nome: categoria.nome,
            detalhe: categoria.resumo,
            rota: categoria.rota,
            categoriaSlug: categoria.slug,
          })),
        },
      ];
    }
    return buscarTudo(termo, {
      locais: locais?.locais,
      contatos: contatos?.contatos,
      servicos: servicos?.servicos,
    });
  }, [termo, locais, contatos, servicos]);

  // Lista "achatada" para a navegação por setas atravessar os grupos.
  const itens = useMemo(() => grupos.flatMap((grupo) => grupo.itens), [grupos]);

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
    listaRef.current
      ?.querySelector(`[data-indice="${ativo}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [ativo]);

  // Retornar null = não desenha nada. Fica DEPOIS dos hooks porque as regras do
  // React exigem que todos os hooks sejam chamados em toda renderização.
  if (!buscaAberta) return null;

  /** Fecha o overlay e abre o item: página do site, ligação ou serviço online. */
  function escolher(item) {
    fecharBusca();
    if (item.rota) {
      navigate(item.rota);
    } else if (item.href?.startsWith('tel:')) {
      window.location.href = item.href;
    } else if (item.href) {
      window.open(item.href, '_blank', 'noopener');
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

  const carregandoDados = termo.trim() && !locais;
  let indice = -1; // contador que atravessa os grupos (cada item tem um índice único)

  return (
    // Fundo escurecido. role="dialog" + aria-modal avisam ao leitor de tela que
    // o conteúdo de trás está temporariamente indisponível.
    <div
      className="busca-fundo"
      role="dialog"
      aria-modal="true"
      aria-label="Buscar serviços em Indaiatuba"
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
            type="search"
            value={termo}
            placeholder="UBS, escola, bairro, vacina, ônibus, IPTU..."
            // O placeholder some ao digitar; o aria-label descreve o campo o tempo todo.
            aria-label="Buscar por local, bairro, serviço ou telefone"
            onChange={(evento) => setTermo(evento.target.value)}
          />
          <button
            type="button"
            className="busca-fechar"
            onClick={fecharBusca}
            aria-label="Fechar busca"
          >
            Esc
          </button>
        </div>

        {/* Operador ternário: com resultados mostra a lista; sem resultados,
            uma mensagem de ajuda. */}
        {itens.length > 0 ? (
          <div className="busca-lista" ref={listaRef}>
            {grupos.map((grupo) => (
              <section key={grupo.titulo} className="busca-grupo" aria-label={grupo.titulo}>
                <h2 className="busca-grupo-titulo">{grupo.titulo}</h2>
                <ul>
                  {grupo.itens.map((item) => {
                    indice += 1;
                    const meuIndice = indice;
                    return (
                      <li key={item.chave}>
                        <button
                          type="button"
                          data-indice={meuIndice}
                          // Template string monta a classe: acrescenta o modificador
                          // apenas no item destacado.
                          className={`busca-item${meuIndice === ativo ? ' busca-item--ativo' : ''}`}
                          data-categoria={item.categoriaSlug}
                          // Mouse e teclado compartilham o mesmo destaque: passar o mouse
                          // por um item move o "ativo" para ele.
                          onMouseEnter={() => setAtivo(meuIndice)}
                          onClick={() => escolher(item)}
                        >
                          {/* Local mostra a foto; os outros mostram um ícone num selo colorido. */}
                          {item.tipo === 'local' && item.imagem ? (
                            <Foto
                              className="busca-miniatura"
                              src={item.imagem}
                              alt=""
                              sizes="52px"
                              largura={52}
                              altura={40}
                            />
                          ) : (
                            <span
                              className="busca-miniatura busca-miniatura--icone"
                              aria-hidden="true"
                            >
                              {item.tipo === 'categoria' ? (
                                <IconeCategoria slug={item.categoriaSlug} />
                              ) : (
                                SIMBOLOS[item.tipo]
                              )}
                            </span>
                          )}
                          <span className="busca-texto">
                            <span className="busca-nome">{item.nome}</span>
                            <span className="busca-detalhe">{item.detalhe}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <p className="busca-vazio" role="status">
            {carregandoDados
              ? 'Carregando...'
              : `Nada encontrado para “${termo}”. Tente o nome do lugar, o bairro ou o que você precisa (ex.: vacina, matrícula, ônibus).`}
          </p>
        )}
      </div>
    </div>
  );
}

/** Símbolo decorativo de cada tipo de resultado sem foto. */
const SIMBOLOS = { local: '📍', bairro: '🏘️', contato: '📞', servico: '🌐' };
