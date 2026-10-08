/**
 * Home.jsx — Página inicial ("/").
 *
 * Blocos: chamada com o botão de busca, atalhos para quem acabou de chegar,
 * tempo agora (Open-Meteo), faixa da marca e a grade com as categorias.
 */

import { categorias } from '../data/servicos.js';
import { useBusca } from '../context/AppContext.jsx';
import { Link } from 'react-router-dom';
import CardServico from '../components/CardServico.jsx';
import Clima from '../components/Clima.jsx';
import IconeLupa from '../components/IconeLupa.jsx';
import useTituloPagina from '../hooks/useTituloPagina.js';
import useDados from '../hooks/useDados.js';
import './Home.css';

/** Atalhos da Home: o que quem acabou de chegar mais procura. */
const ATALHOS = [
  {
    rota: '/primeiros-passos',
    icone: '🧭',
    titulo: 'Primeiros passos',
    texto: 'Cartão SUS, escola, cartão do ônibus e mais.',
  },
  {
    rota: '/perto-de-mim',
    icone: '📍',
    titulo: 'O que tem perto de mim',
    texto: 'UBS, escola, CRAS e terminal mais próximos.',
  },
  {
    rota: '/mapa',
    icone: '🗺️',
    titulo: 'Mapa dos serviços',
    texto: 'Todos os locais públicos no mapa.',
  },
  {
    rota: '/servicos-online',
    icone: '💻',
    titulo: 'Serviços online',
    texto: 'IPTU, vacina, multas e outros links oficiais.',
  },
];

export default function Home() {
  const { abrirBusca } = useBusca();
  // Contagem real de locais por categoria, a partir de /api/locais.json.
  const { dados } = useDados('/api/locais.json');
  const totais = {};
  for (const local of dados?.locais ?? [])
    totais[local.categoria] = (totais[local.categoria] ?? 0) + 1;
  // Define o título da aba do navegador para esta página.
  useTituloPagina('Conecta Cidadão — Serviços públicos de Indaiatuba');

  return (
    <>
      <section className="container home-topo">
        {/* Só um <h1> por página: é o título principal do documento. */}
        <h1 className="titulo-pagina">Os serviços públicos de Indaiatuba em um só lugar</h1>
        <p className="texto-apoio">
          Postos de saúde, escolas, segurança, lazer, ônibus e serviços online da Prefeitura, com
          endereço, telefone e como chegar. Feito para quem mora ou acabou de chegar na cidade.
        </p>

        {/* Parece um campo de texto, mas é um botão: clicar abre o overlay de
            busca, que tem o input de verdade. Evita dois campos concorrentes. */}
        <button type="button" className="home-busca" onClick={abrirBusca}>
          <IconeLupa />
          <span className="home-busca-texto">Buscar uma unidade, escola ou parque</span>
          {/* <kbd> é a tag semântica para teclas do teclado. */}
          <kbd className="home-busca-atalho">Ctrl K</kbd>
        </button>
      </section>

      {/* Faixa da marca: deixa claro de qual cidade o site trata e que ele não é oficial. */}
      {/* Atalhos pensados para quem acabou de se mudar para Indaiatuba. */}
      <section className="container home-atalhos" aria-labelledby="titulo-atalhos">
        <h2 id="titulo-atalhos" className="home-servicos-titulo">
          Novo em Indaiatuba?
        </h2>
        <ul className="home-atalhos-lista">
          {ATALHOS.map((atalho) => (
            <li key={atalho.rota}>
              <Link to={atalho.rota} className="home-atalho">
                <span className="home-atalho-icone" aria-hidden="true">
                  {atalho.icone}
                </span>
                <strong>{atalho.titulo}</strong>
                <span>{atalho.texto}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="container home-clima">
        <Clima />
      </div>

      <section className="container home-marca">
        <img
          src="/img/interface/logo.png"
          alt=""
          className="home-marca-logo"
          width="62"
          height="50"
        />
        <div>
          <h2 className="home-marca-titulo">Conecta Cidadão · Indaiatuba/SP</h2>
          <p className="home-marca-frase">
            Projeto acadêmico da Fatec Indaiatuba, sem vínculo com a Prefeitura. Os dados vêm de
            fontes públicas e cada página mostra de onde veio a informação.
          </p>
        </div>
      </section>

      <section className="container home-servicos">
        <h2 className="home-servicos-titulo">Escolha o serviço desejado</h2>
        <div className="grade-servicos">
          {/* map() transforma cada categoria dos dados em um card na tela.
              Acrescentar uma categoria em servicos.js já faz surgir o card aqui. */}
          {categorias.map((categoria) => (
            <CardServico
              key={categoria.slug}
              categoria={categoria}
              total={dados ? (totais[categoria.slug] ?? 0) : undefined}
            />
          ))}
        </div>
      </section>
    </>
  );
}
