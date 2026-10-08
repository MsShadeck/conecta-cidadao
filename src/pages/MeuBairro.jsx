/**
 * MeuBairro.jsx — Páginas "/meu-bairro" e "/bairros/:slug".
 *
 * A pessoa informa onde mora (CEP, endereço, localização do aparelho ou um
 * bairro da lista) e vê, do mais perto ao mais longe:
 *  - serviços públicos (UBS, urgência, escola, creche, segurança, CRAS);
 *  - ônibus (terminal mais próximo e a rota até o Terminal Central no Google Maps);
 *  - dia a dia (mercado, padaria, farmácia, restaurante, feira);
 *  - parques e o dia da coleta de lixo (quando a Prefeitura publica).
 * Cada item tem os botões "Waze" e "Google Maps".
 *
 * Privacidade: o CEP e a localização ficam no navegador. Só saem dele nas
 * consultas de CEP/endereço (BrasilAPI, ViaCEP, Nominatim), e o site não guarda nada.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useOrigem } from '../context/AppContext.jsx';
import useDados from '../hooks/useDados.js';
import useLocalStorage from '../hooks/useLocalStorage.js';
import useTituloPagina from '../hooks/useTituloPagina.js';
import { limparCep, localizarCep, localizarEndereco } from '../utils/cep.js';
import { distanciaMetros, formatarDistancia } from '../utils/geo.js';
import { bairroDoPonto, maisProximos, procurarBairro } from '../utils/proximidade.js';
import { linkGoogleMaps } from '../utils/navegacao.js';
import EstadoDados from '../components/EstadoDados.jsx';
import MapaWaze from '../components/MapaWaze.jsx';
import ItemProximo from '../components/ItemProximo.jsx';
import IconeCategoria from '../components/IconeCategoria.jsx';
import './MeuBairro.css';

const BLOCOS = [
  { id: 'publicos', titulo: 'Serviços públicos', categoria: 'servicos' },
  { id: 'onibus', titulo: 'Ônibus', categoria: 'mobilidade' },
  { id: 'dia', titulo: 'Dia a dia', categoria: 'dia-a-dia' },
  { id: 'lazer', titulo: 'Lazer', categoria: 'lazer' },
];

// Retângulo de Indaiatuba (IBGE): a localização do aparelho precisa cair dentro dele.
const dentroDeIndaiatuba = ({ lat, lng }) =>
  lat > -23.226 && lat < -22.997 && lng > -47.306 && lng < -47.083;

export default function MeuBairro() {
  const { slug } = useParams();
  const [parametros, setParametros] = useSearchParams();
  const locais = useDados('/api/locais.json');
  const comercio = useDados('/api/comercio.json');
  const bairros = useDados('/api/bairros.json');
  const listaBairros = useMemo(() => bairros.dados?.bairros ?? [], [bairros.dados]);
  const { setOrigem } = useOrigem();
  const [salvo, setSalvo] = useLocalStorage('cc:meu-bairro', null);

  const [ponto, setPonto] = useState(null); // { lat, lng, rotulo, bairro, aproximada }
  const [entrada, setEntrada] = useState('');
  const [status, setStatus] = useState(null); // { tipo: 'carregando'|'erro', texto }
  const controleRef = useRef(null);

  const bairroDaPagina = slug ? listaBairros.find((b) => b.slug === slug) : null;
  useTituloPagina(
    bairroDaPagina
      ? `${bairroDaPagina.nome} — Meu bairro — Conecta Cidadão`
      : 'Meu bairro — Conecta Cidadão',
    bairroDaPagina
      ? `O que tem perto de ${bairroDaPagina.nome}, em Indaiatuba: UBS, escola, creche, mercado, farmácia, ônibus e parques.`
      : 'Digite seu CEP ou bairro e veja a UBS, a escola, o mercado, a farmácia e o ônibus mais perto de casa em Indaiatuba.'
  );

  /** Define o ponto pesquisado (e compartilha com o "Como chegar" pelo contexto). */
  function usarPonto(novo) {
    setPonto(novo);
    setOrigem({ lat: novo.lat, lng: novo.lng, rotulo: novo.rotulo, aproximada: novo.aproximada });
    setStatus(null);
  }

  /** Interpreta o que foi digitado: CEP, nome de bairro ou endereço. */
  async function pesquisar(texto) {
    controleRef.current?.abort();
    const controle = new AbortController();
    controleRef.current = controle;
    try {
      if (limparCep(texto)) {
        setStatus({ tipo: 'carregando', texto: 'Procurando o CEP...' });
        const r = await localizarCep(texto, controle.signal);
        if (r.lat === null) {
          // A rua não está no mapa: usa o ponto do bairro do CEP, se ele estiver na lista.
          const doCep = procurarBairro(listaBairros, r.bairro);
          if (!doCep)
            throw new Error(
              'Não achamos esse CEP no mapa. Tente o nome do bairro ou a sua localização.'
            );
          usarPonto({
            ...doCep.coordenadas,
            rotulo: `CEP ${texto} — ${r.rotulo} (centro do bairro)`,
            bairro: doCep.nome,
            aproximada: true,
          });
          return;
        }
        usarPonto({ ...r, rotulo: `CEP ${texto} — ${r.rotulo}` });
        return;
      }
      const bairro = procurarBairro(listaBairros, texto);
      if (bairro) {
        usarPonto({
          ...bairro.coordenadas,
          rotulo: bairro.nome,
          bairro: bairro.nome,
          aproximada: true,
        });
        return;
      }
      setStatus({ tipo: 'carregando', texto: 'Procurando o endereço...' });
      usarPonto(await localizarEndereco(texto, controle.signal));
    } catch (erro) {
      if (erro.name !== 'AbortError') setStatus({ tipo: 'erro', texto: erro.message });
    }
  }

  // Ponto inicial: /bairros/:slug → ?cep= / ?bairro= → bairro salvo.
  useEffect(() => {
    if (!listaBairros.length || ponto) return;
    if (bairroDaPagina) {
      usarPonto({
        ...bairroDaPagina.coordenadas,
        rotulo: bairroDaPagina.nome,
        bairro: bairroDaPagina.nome,
        aproximada: true,
      });
    } else if (parametros.get('cep') || parametros.get('bairro')) {
      pesquisar(parametros.get('cep') ?? parametros.get('bairro'));
    } else if (salvo) {
      usarPonto(salvo);
    }
    // Roda quando a lista de bairros chega; as funções acima só leem estado atual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaBairros, bairroDaPagina]);

  // Cancela a consulta pendente se a pessoa sair da página.
  useEffect(() => () => controleRef.current?.abort(), []);

  function usarLocalizacao() {
    if (!('geolocation' in navigator)) {
      setStatus({ tipo: 'erro', texto: 'Este navegador não informa a localização. Use o CEP.' });
      return;
    }
    setStatus({ tipo: 'carregando', texto: 'Pedindo a sua localização ao navegador...' });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const novo = {
          lat: coords.latitude,
          lng: coords.longitude,
          rotulo: 'Sua localização atual',
          aproximada: coords.accuracy > 200,
        };
        if (!dentroDeIndaiatuba(novo)) {
          setStatus({
            tipo: 'erro',
            texto: 'Você parece estar fora de Indaiatuba. Digite um CEP ou bairro da cidade.',
          });
          return;
        }
        usarPonto(novo);
      },
      () =>
        setStatus({
          tipo: 'erro',
          texto: 'Não foi possível usar a localização. Digite o CEP ou o bairro.',
        }),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  const carregando = locais.carregando || comercio.carregando || bairros.carregando;
  const erro = locais.erro || comercio.erro || bairros.erro;

  const resultado = useMemo(() => {
    if (!ponto || !locais.dados || !comercio.dados) return null;
    return maisProximos({ locais: locais.dados.locais, comercio: comercio.dados.itens }, ponto);
  }, [ponto, locais.dados, comercio.dados]);

  const bairro = ponto ? bairroDoPonto(listaBairros, ponto, ponto.bairro) : null;
  const terminalCentral = locais.dados?.locais.find((l) => l.id === 'terminal-central');
  const ehSalvo = salvo && ponto && salvo.lat === ponto.lat && salvo.lng === ponto.lng;

  return (
    <div data-categoria="bairro">
      <section className="container pagina-topo">
        <h1 className="titulo-pagina">{bairroDaPagina ? bairroDaPagina.nome : 'Meu bairro'}</h1>
        <p className="texto-apoio">
          Digite o CEP, o endereço ou o bairro onde você mora (ou vai morar) e veja o que tem perto:
          posto de saúde, escola, mercado, farmácia, ônibus e parques.
        </p>

        <form
          className="bairro-busca"
          onSubmit={(e) => {
            e.preventDefault();
            if (entrada.trim()) {
              setParametros({}, { replace: true });
              pesquisar(entrada.trim());
            }
          }}
        >
          <label className="somente-leitor" htmlFor="bairro-entrada">
            CEP, endereço ou bairro
          </label>
          <input
            id="bairro-entrada"
            className="campo"
            placeholder="CEP, endereço ou bairro (ex.: 13334-100, Cidade Nova)"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            list="lista-bairros"
            autoComplete="off"
          />
          {/* <datalist>: o navegador sugere os bairros conforme a pessoa digita. */}
          <datalist id="lista-bairros">
            {listaBairros.map((b) => (
              <option key={b.slug} value={b.nome} />
            ))}
          </datalist>
          <button type="submit" className="botao-primario">
            Ver o que tem perto
          </button>
          <button type="button" className="botao-secundario" onClick={usarLocalizacao}>
            Usar minha localização
          </button>
        </form>

        {status && (
          <p
            className={`bairro-status bairro-status--${status.tipo}`}
            role={status.tipo === 'erro' ? 'alert' : 'status'}
          >
            {status.texto}
          </p>
        )}
        <p className="info-fonte">
          Privacidade: o CEP, o endereço e a sua localização ficam só no seu navegador. Eles são
          enviados apenas para localizar o ponto (BrasilAPI, ViaCEP ou OpenStreetMap) e não são
          guardados por este site.
        </p>
      </section>

      <EstadoDados carregando={carregando} erro={erro} recarregar={locais.recarregar}>
        {ponto && resultado && (
          <div className="container bairro-resultado">
            <div className="painel bairro-cabeca">
              <div>
                <p className="bairro-ponto">
                  <strong>Perto de:</strong> {ponto.rotulo}
                  {ponto.aproximada && <span className="info-fonte"> (posição aproximada)</span>}
                </p>
                {/* O nome que veio do CEP vale mais que o ponto de bairro mais próximo no mapa. */}
                {bairro?.porNome ? (
                  <p className="info-fonte">
                    Bairro: <Link to={`/bairros/${bairro.bairro.slug}`}>{bairro.bairro.nome}</Link>
                  </p>
                ) : ponto.bairro ? (
                  <p className="info-fonte">Bairro: {ponto.bairro} (pelo CEP)</p>
                ) : (
                  bairro && (
                    <p className="info-fonte">
                      Bairro mais próximo no mapa do OpenStreetMap:{' '}
                      <Link to={`/bairros/${bairro.bairro.slug}`}>{bairro.bairro.nome}</Link>
                    </p>
                  )
                )}
              </div>
              <button
                type="button"
                className={ehSalvo ? 'botao-secundario' : 'botao-primario'}
                aria-pressed={Boolean(ehSalvo)}
                onClick={() =>
                  setSalvo(
                    ehSalvo
                      ? null
                      : {
                          ...ponto,
                          bairro: bairro?.porNome ? bairro.bairro.nome : (ponto.bairro ?? null),
                        }
                  )
                }
              >
                {ehSalvo ? 'Salvo como meu bairro ✓' : 'Salvar como meu bairro'}
              </button>
            </div>

            <MapaWaze
              lat={ponto.lat}
              lng={ponto.lng}
              zoom={15}
              titulo={`Mapa do Waze centralizado em ${ponto.rotulo}`}
              altura={320}
            />

            {BLOCOS.map((bloco) => {
              const doBloco = resultado.filter((n) => n.bloco === bloco.id);
              if (!doBloco.length && bloco.id !== 'onibus') return null;
              return (
                <section
                  key={bloco.id}
                  className="bairro-bloco"
                  data-categoria={bloco.categoria}
                  aria-labelledby={`b-${bloco.id}`}
                >
                  <h2 id={`b-${bloco.id}`} className="bairro-bloco-titulo">
                    <IconeCategoria slug={bloco.categoria} />
                    {bloco.titulo}
                  </h2>

                  {bloco.id === 'onibus' && terminalCentral && (
                    <div className="painel bairro-onibus">
                      <p>
                        Até o <strong>Terminal Central</strong>:{' '}
                        {formatarDistancia(distanciaMetros(ponto, terminalCentral.coordenadas))} em
                        linha reta. O Google Maps mostra qual linha pegar, onde embarcar e o
                        horário.
                      </p>
                      <div className="bairro-onibus-links">
                        <a
                          className="botao-primario"
                          href={linkGoogleMaps(terminalCentral, 'transit', ponto)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          De ônibus até o Terminal Central (Google Maps)
                        </a>
                        <Link className="botao-secundario" to="/mobilidade">
                          Cartão SOU e previsão oficial
                        </Link>
                      </div>
                    </div>
                  )}

                  {bloco.id === 'dia' && (
                    <p className="info-fonte">
                      {comercio.dados.aviso} Fonte: {comercio.dados.credito}. Sem ranking nem
                      destaque pago.
                    </p>
                  )}

                  <div className="bairro-grade">
                    {doBloco.map((n) => (
                      <div
                        key={n.id}
                        className="painel bairro-necessidade"
                        data-categoria={n.categoria}
                      >
                        <h3>{n.titulo}</h3>
                        <ul>
                          {n.itens.map((item) => (
                            <ItemProximo
                              key={item.id}
                              item={item}
                              ponto={ponto}
                              comercio={Boolean(n.comercio)}
                            />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            <section className="bairro-bloco" data-categoria="servicos" aria-labelledby="b-coleta">
              <h2 id="b-coleta" className="bairro-bloco-titulo">
                <IconeCategoria slug="servicos" />
                Coleta de lixo
              </h2>
              <div className="painel">
                {/* Só mostra a coleta quando o bairro bate pelo nome: por proximidade, o
                    endereço pode estar no bairro vizinho, com outro dia de coleta. */}
                {bairro?.porNome && bairro.bairro.coleta ? (
                  <p>
                    Segundo a Prefeitura, para <strong>{bairro.bairro.coleta.localidade}</strong>, a
                    partir de {bairro.bairro.coleta.vigencia}: {bairro.bairro.coleta.programacao}.
                  </p>
                ) : (
                  <p>
                    Informação não disponível para este bairro — a Prefeitura publica só os locais
                    que mudaram de programação. Confira na SEMURB:{' '}
                    <a href="tel:1938255410">(19) 3825-5410</a>.
                  </p>
                )}
                <p className="info-fonte">
                  {bairros.dados.coletaGeral.horarios}{' '}
                  <a
                    href={bairros.dados.coletaGeral.fonte}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Fonte: Prefeitura
                  </a>
                </p>
              </div>
            </section>
          </div>
        )}

        {!ponto && !status && (
          <div className="container">
            <p className="info-fonte">Ou escolha um bairro:</p>
            <ul className="bairro-lista">
              {listaBairros.map((b) => (
                <li key={b.slug}>
                  <Link to={`/bairros/${b.slug}`}>{b.nome}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </EstadoDados>
    </div>
  );
}
