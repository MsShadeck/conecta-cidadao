/**
 * BuscaOverlay.jsx — Janela de busca que abre sobre a página.
 *
 * É o componente mais complexo do projeto. Ele cuida de:
 *   • montar a lista exibida (categorias quando o campo está vazio; resultados
 *     agrupados — locais, bairros, telefones e serviços online — quando há texto);
 *   • navegação por teclado (setas e Enter) além do clique do mouse;
 *   • navegar até a página escolhida (ou ligar / abrir o serviço online).
 *
 * A janela em si é um Dialog do Radix UI (@radix-ui/react-dialog), que cuida
 * de: foco preso dentro do painel, Esc e clique fora para fechar, bloqueio da
 * rolagem do fundo, role="dialog" + aria-modal e devolução do foco a quem
 * abriu. A entrada e a saída são animadas com o Motion.
 *
 * A visibilidade é controlada pelo estado global (useBusca), pois o overlay é
 * aberto de vários lugares: cabeçalho, botão da Home e atalho Ctrl/Cmd + K.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { CornerDownLeft, Globe, House, MapPin, Phone } from 'lucide-react';
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
  const { dados: checklist } = useDados(buscaAberta ? '/api/checklist.json' : null);
  const { dados: bairros } = useDados(buscaAberta ? '/api/bairros.json' : null);
  const { dados: comercio } = useDados(buscaAberta ? '/api/comercio.json' : null);

  // Referências para elementos reais do DOM:
  const campoRef = useRef(null); // o <input>, para dar foco nele
  const listaRef = useRef(null); // a lista, para rolar até o item destacado
  // true quando o fechamento veio de uma escolha que troca de página: aí o foco
  // vai para o conteúdo novo (Layout) e não volta para o botão que abriu a busca.
  const navegouRef = useRef(false);
  // Quem tinha o foco antes de a busca abrir (o botão do cabeçalho, da Home...).
  // A busca não tem Dialog.Trigger (abre de vários lugares), então o próprio
  // componente devolve o foco a esse elemento ao fechar.
  const focoAnteriorRef = useRef(null);

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
      checklist: checklist?.itens,
      bairros: bairros?.bairros,
      comercio: comercio?.itens,
    });
  }, [termo, locais, contatos, servicos, checklist, bairros, comercio]);

  // Lista "achatada" para a navegação por setas atravessar os grupos.
  const itens = useMemo(() => grupos.flatMap((grupo) => grupo.itens), [grupos]);

  // A cada letra digitada, o destaque volta para o primeiro resultado —
  // senão o índice poderia apontar para uma posição que não existe mais.
  useEffect(() => {
    setAtivo(0);
  }, [termo]);

  // Fechou: limpa o campo para a próxima abertura começar em branco.
  // (O foco no campo e a trava da rolagem agora são feitos pelo Radix.)
  useEffect(() => {
    if (!buscaAberta) setTermo('');
  }, [buscaAberta]);

  // Mantém o item destacado visível ao navegar com as setas em listas longas.
  // block: 'nearest' rola o mínimo necessário, sem "pular" a lista inteira.
  useEffect(() => {
    listaRef.current
      ?.querySelector(`[data-indice="${ativo}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [ativo]);

  /** Fecha o overlay e abre o item: página do site, ligação ou serviço online. */
  function escolher(item) {
    navegouRef.current = Boolean(item.rota);
    fecharBusca();
    if (item.rota) {
      navigate(item.rota);
    } else if (item.href?.startsWith('tel:')) {
      window.location.href = item.href;
    } else if (item.href) {
      window.open(item.href, '_blank', 'noopener');
    }
  }

  /** Teclas de atalho dentro do painel de busca (o Esc é tratado pelo Radix). */
  function aoTeclar(evento) {
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
    // Dialog.Root controlado pelo estado global: abre pelo cabeçalho, pela Home
    // ou pelo atalho Ctrl/Cmd + K; qualquer pedido de fechar chama fecharBusca.
    <Dialog.Root open={buscaAberta} onOpenChange={(aberto) => !aberto && fecharBusca()}>
      {/* AnimatePresence + forceMount: o Motion toca a saída antes de o Radix
          tirar o painel da tela. */}
      <AnimatePresence>
        {buscaAberta && (
          <Dialog.Portal forceMount>
            {/* Fundo escurecido; clicar nele fecha a busca. */}
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="busca-fundo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              aria-describedby={undefined}
              // Ao abrir, guarda quem tinha o foco e leva o foco para o campo de texto.
              onOpenAutoFocus={(evento) => {
                focoAnteriorRef.current = document.activeElement;
                evento.preventDefault();
                campoRef.current?.focus();
              }}
              // Ao fechar, devolve o foco a quem abriu a busca. Exceção: depois de
              // escolher uma página, o Layout já levou o foco ao conteúdo novo.
              onCloseAutoFocus={(evento) => {
                evento.preventDefault();
                if (!navegouRef.current) focoAnteriorRef.current?.focus();
                navegouRef.current = false;
              }}
            >
              {/* O onKeyDown fica no painel: assim funciona com o foco no campo ou em
                  qualquer botão da lista. */}
              <motion.div
                className="busca-painel"
                onKeyDown={aoTeclar}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.2, 0.7, 0.3, 1] }}
              >
                {/* Nome da janela para o leitor de tela (o Dialog exige um título). */}
                <Dialog.Title className="somente-leitor">
                  Buscar serviços em Indaiatuba
                </Dialog.Title>
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
                  <Dialog.Close className="busca-fechar" aria-label="Fechar busca">
                    Esc
                  </Dialog.Close>
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
                                  // Mouse e teclado compartilham o mesmo destaque: passar o
                                  // mouse por um item move o "ativo" para ele.
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
                                      {/* Ícone da seção para categorias e itens com iconeSlug;
                                          ícone do tipo (local, bairro, telefone...) para o resto. */}
                                      {item.tipo === 'categoria' || item.iconeSlug ? (
                                        <IconeCategoria
                                          slug={item.iconeSlug ?? item.categoriaSlug}
                                          tamanho={20}
                                        />
                                      ) : (
                                        <IconeDoTipo tipo={item.tipo} />
                                      )}
                                    </span>
                                  )}
                                  <span className="busca-texto">
                                    <span className="busca-nome">{item.nome}</span>
                                    <span className="busca-detalhe">{item.detalhe}</span>
                                  </span>
                                  {/* Dica visual da tecla Enter (aparece no item destacado). */}
                                  <CornerDownLeft className="busca-enter" size={16} />
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

                {/* Rodapé com as teclas de atalho (o CSS esconde no celular). */}
                <div className="busca-rodape" aria-hidden="true">
                  <span>
                    <kbd>↑</kbd>
                    <kbd>↓</kbd> navegar
                  </span>
                  <span>
                    <kbd>Enter</kbd> abrir
                  </span>
                  <span>
                    <kbd>Esc</kbd> fechar
                  </span>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/** Ícone (Lucide) de cada tipo de resultado sem foto. */
const ICONES_DO_TIPO = { local: MapPin, bairro: House, contato: Phone, servico: Globe };

function IconeDoTipo({ tipo }) {
  const Icone = ICONES_DO_TIPO[tipo] ?? MapPin;
  return <Icone size={20} strokeWidth={1.75} />;
}
