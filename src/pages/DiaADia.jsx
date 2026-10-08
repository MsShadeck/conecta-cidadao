/**
 * DiaADia.jsx — Página "/dia-a-dia": mercados, padarias, farmácias,
 * restaurantes, feiras, bancos e postos.
 *
 * Os dados vêm do OpenStreetMap (gerados no build por `npm run dados`, nunca
 * consultados a cada visita) e de fontes da Prefeitura (feiras). Regras:
 *  - aviso "Dados colaborativos..." e crédito do OSM sempre visíveis;
 *  - sem ranking, nota ou destaque pago: a ordem é por nome ou por distância;
 *  - cada item tem o link "Corrigir no OpenStreetMap".
 * Os filtros ficam na URL (?grupo=&aberto=1&q=&ordem=), como em Categoria.jsx.
 */

import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useOrigem } from '../context/AppContext.jsx';
import useDados from '../hooks/useDados.js';
import useLocalStorage from '../hooks/useLocalStorage.js';
import useTituloPagina from '../hooks/useTituloPagina.js';
import { ordenarPorDistancia } from '../utils/geo.js';
import { situacaoAgora, textoHorario } from '../utils/horario.js';
import { normalizar, plural } from '../utils/texto.js';
import EstadoDados from '../components/EstadoDados.jsx';
import IconeLupa from '../components/IconeLupa.jsx';
import ItemProximo from '../components/ItemProximo.jsx';
import './Categoria.css';
import './MeuBairro.css';
import './DiaADia.css';

export default function DiaADia() {
  useTituloPagina(
    'Dia a dia — mercados, padarias e farmácias — Conecta Cidadão',
    'Mercados, padarias, farmácias, restaurantes, feiras, bancos e postos de Indaiatuba, com endereço, horário quando informado e rota pelo Waze ou Google Maps.'
  );
  const { dados, carregando, erro, recarregar } = useDados('/api/comercio.json');
  const feriados = useDados('/api/feriados.json');
  const [parametros, setParametros] = useSearchParams();
  const { origem } = useOrigem();
  const [salvo] = useLocalStorage('cc:meu-bairro', null);
  // De onde medir a distância: o ponto escolhido nesta visita ou o bairro salvo.
  const ponto = origem ?? salvo;

  const grupo = parametros.get('grupo') ?? '';
  const soAbertos = parametros.get('aberto') === '1';
  const busca = parametros.get('q') ?? '';
  const ordem = parametros.get('ordem') ?? (ponto ? 'distancia' : 'nome');

  function mudar(chave, valor) {
    const novos = new URLSearchParams(parametros);
    if (valor) novos.set(chave, valor);
    else novos.delete(chave);
    setParametros(novos, { replace: true });
  }

  const visiveis = useMemo(() => {
    if (!dados) return [];
    const agora = new Date();
    const alvo = normalizar(busca);
    const filtrados = dados.itens.filter(
      (item) =>
        (!grupo || item.grupo === grupo) &&
        (!alvo ||
          normalizar(`${item.nome} ${item.tipo} ${item.enderecoTexto ?? ''}`).includes(alvo)) &&
        (!soAbertos ||
          situacaoAgora(item.horarios, feriados.dados?.feriados ?? [], agora).estado === 'aberto')
    );
    if (ordem === 'distancia' && ponto) return ordenarPorDistancia(filtrados, ponto);
    return [...filtrados].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [dados, feriados.dados, grupo, soAbertos, busca, ordem, ponto]);

  const comHorario = dados?.itens.filter((i) => i.horarios).length ?? 0;

  return (
    <div data-categoria="dia-a-dia">
      <section className="container pagina-topo">
        <h1 className="titulo-pagina">Dia a dia</h1>
        <p className="texto-apoio">
          Mercados, padarias, farmácias, restaurantes, feiras, bancos, lotéricas e postos de
          combustível de Indaiatuba. Sem ranking nem anúncio: a lista vai por nome ou pela distância
          de onde você está.
        </p>
        <p className="dia-aviso" role="note">
          <strong>
            {dados?.aviso ?? 'Dados colaborativos. Horários de estabelecimentos podem mudar.'}
          </strong>{' '}
          Fonte: {dados?.credito ?? '© OpenStreetMap contributors (ODbL)'}. Encontrou um erro ou
          falta um lugar? Qualquer pessoa pode corrigir no{' '}
          <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">
            OpenStreetMap
          </a>
          .
        </p>
      </section>

      <section className="container">
        <EstadoDados carregando={carregando} erro={erro} recarregar={recarregar}>
          <div className="painel categoria-filtros">
            <label className="campo campo-busca categoria-busca">
              <IconeLupa />
              <input
                type="search"
                placeholder="Buscar por nome, tipo ou rua"
                aria-label="Buscar no dia a dia"
                value={busca}
                onChange={(e) => mudar('q', e.target.value)}
              />
              {busca && (
                <button
                  type="button"
                  className="campo-busca-limpar"
                  onClick={() => mudar('q', '')}
                  aria-label="Limpar busca"
                >
                  ×
                </button>
              )}
            </label>
            <div className="categoria-filtros-linha">
              <label className="filtro">
                <span>Tipo</span>
                <select
                  className="campo"
                  value={grupo}
                  onChange={(e) => mudar('grupo', e.target.value)}
                >
                  <option value="">Todos</option>
                  {dados?.grupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="filtro">
                <span>Ordem</span>
                <select
                  className="campo"
                  value={ordem}
                  onChange={(e) => mudar('ordem', e.target.value)}
                >
                  <option value="nome">Nome (A–Z)</option>
                  <option value="distancia" disabled={!ponto}>
                    Mais perto{' '}
                    {ponto
                      ? `de ${salvo && !origem ? 'meu bairro' : 'mim'}`
                      : '(escolha seu bairro)'}
                  </option>
                </select>
              </label>
              <label className="filtro dia-aberto">
                <input
                  type="checkbox"
                  checked={soAbertos}
                  onChange={(e) => mudar('aberto', e.target.checked ? '1' : '')}
                />
                <span>Só os abertos agora</span>
              </label>
            </div>
            {!ponto && (
              <p className="info-fonte">
                Para ver o que fica mais perto,{' '}
                <Link to="/meu-bairro">informe seu CEP ou bairro em Meu bairro</Link>.
              </p>
            )}
            {soAbertos && (
              <p className="info-fonte">
                Só {comHorario} dos {dados?.itens.length} lugares têm horário informado no
                OpenStreetMap; os outros não aparecem com este filtro.
              </p>
            )}
            <p className="categoria-contagem" role="status">
              {plural(visiveis.length, 'lugar encontrado', 'lugares encontrados')}
            </p>
          </div>

          {(!grupo || grupo === 'feiras') && dados?.feirasLivres && (
            <div className="painel dia-feiras">
              <h2>Feiras livres</h2>
              <p>{dados.feirasLivres.texto}</p>
              <a href={dados.feirasLivres.fonte} target="_blank" rel="noopener noreferrer">
                Página da Prefeitura sobre as feiras
              </a>
            </div>
          )}

          <ul className="dia-lista">
            {visiveis.map((item) => (
              <ItemProximo
                key={item.id}
                item={item}
                ponto={ponto}
                comercio
                className="painel dia-item"
              >
                {item.enderecoTexto && <p className="dia-endereco">{item.enderecoTexto}</p>}
                {/* Horário em português quando a fonte é estruturada; senão, o texto como está no OSM. */}
                {(item.horarios || item.horarioTexto) && (
                  <p className="info-fonte">
                    Horário: {textoHorario(item.horarios) ?? item.horarioTexto}
                  </p>
                )}
                {item.telefones.length > 0 && (
                  <p className="info-fonte">
                    Telefone:{' '}
                    {item.telefones.map((t, i) => (
                      <span key={t}>
                        {i > 0 && ' · '}
                        <a href={`tel:${t.replace(/\D/g, '')}`}>{t}</a>
                      </span>
                    ))}
                  </p>
                )}
                {item.observacao && <p className="info-fonte">{item.observacao}</p>}
              </ItemProximo>
            ))}
          </ul>
        </EstadoDados>
      </section>
    </div>
  );
}
