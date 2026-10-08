/**
 * Home.jsx — Página inicial ("/").
 *
 * Pensada para quem está se mudando para Indaiatuba:
 *  1. chamada "Chegou agora? Comece por aqui" com dois caminhos (o que
 *     resolver e o que tem no meu bairro);
 *  2. campo "Digite seu CEP ou bairro", que leva ao Meu bairro;
 *  3. o bairro salvo (se a pessoa já salvou um) com os serviços mais próximos;
 *  4. atalhos das seções, tempo agora, diferenças para quem vem de São Paulo
 *     e a grade com as categorias de serviço público.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categorias } from '../data/servicos.js';
import { useBusca } from '../context/AppContext.jsx';
import CardServico from '../components/CardServico.jsx';
import Clima from '../components/Clima.jsx';
import IconeLupa from '../components/IconeLupa.jsx';
import IconeCategoria from '../components/IconeCategoria.jsx';
import SeuBairro from '../components/SeuBairro.jsx';
import DiferencasSP from '../components/DiferencasSP.jsx';
import useTituloPagina from '../hooks/useTituloPagina.js';
import useDados from '../hooks/useDados.js';
import { limparCep } from '../utils/cep.js';
import './Home.css';

/** Atalhos das seções, na ordem da jornada de quem acabou de chegar. */
const ATALHOS = [
  {
    rota: '/servicos',
    slug: 'servicos',
    titulo: 'Serviços públicos',
    texto: 'UBS, escolas, creches, segurança e cidadania.',
  },
  {
    rota: '/dia-a-dia',
    slug: 'dia-a-dia',
    titulo: 'Dia a dia',
    texto: 'Mercados, padarias, farmácias e restaurantes.',
  },
  {
    rota: '/mobilidade',
    slug: 'mobilidade',
    titulo: 'Transporte',
    texto: 'Ônibus, cartão SOU, Ecobike, ciclovias e trânsito.',
  },
  {
    rota: '/lazer',
    slug: 'lazer',
    titulo: 'Lazer e cultura',
    texto: 'Parques, museus, shoppings e esporte.',
  },
  {
    rota: '/conheca',
    slug: 'conheca',
    titulo: 'Conheça Indaiatuba',
    texto: 'A cidade para quem vem de fora.',
  },
  {
    rota: '/servicos-online',
    slug: 'servicos',
    titulo: 'Serviços online',
    texto: 'IPTU, vacina, multas e links oficiais.',
  },
];

export default function Home() {
  useTituloPagina(
    'Conecta Cidadão — Guia para quem está chegando a Indaiatuba',
    'Mudou para Indaiatuba? O que resolver primeiro, o que tem perto de casa, ônibus, serviços públicos e o comércio do dia a dia.'
  );
  const { abrirBusca } = useBusca();
  const navigate = useNavigate();
  const [entrada, setEntrada] = useState('');

  // Contagem real de locais por categoria, a partir de /api/locais.json.
  const { dados } = useDados('/api/locais.json');
  const totais = {};
  for (const local of dados?.locais ?? [])
    totais[local.categoria] = (totais[local.categoria] ?? 0) + 1;

  /** CEP (8 números) vai como ?cep=; qualquer outro texto é tratado como bairro. */
  function irParaMeuBairro(evento) {
    evento.preventDefault();
    const texto = entrada.trim();
    if (!texto) return navigate('/meu-bairro');
    const cep = limparCep(texto);
    navigate(cep ? `/meu-bairro?cep=${cep}` : `/meu-bairro?bairro=${encodeURIComponent(texto)}`);
  }

  return (
    <>
      <section className="container home-topo">
        {/* Só um <h1> por página: é o título principal do documento. */}
        <h1 className="titulo-pagina">Chegou agora em Indaiatuba? Comece por aqui</h1>
        <p className="texto-apoio">
          O que resolver na mudança, o que tem perto da sua casa, como funciona o ônibus e onde
          ficam os serviços públicos e o comércio do dia a dia. Tudo com a fonte de cada informação.
        </p>

        {/* Os dois caminhos principais, em botões grandes (fáceis de tocar no celular). */}
        <div className="home-caminhos">
          <Link to="/primeiros-passos" className="home-caminho" data-categoria="passos">
            <IconeCategoria slug="passos" tamanho={30} />
            <span>
              <strong>Ver o que preciso resolver</strong>
              Cartão SUS, escola, água, título de eleitor...
            </span>
          </Link>
          <Link to="/meu-bairro" className="home-caminho" data-categoria="bairro">
            <IconeCategoria slug="bairro" tamanho={30} />
            <span>
              <strong>Descobrir meu bairro</strong>
              UBS, escola, mercado e ônibus perto de casa
            </span>
          </Link>
        </div>

        <form className="home-cep" onSubmit={irParaMeuBairro} role="search" aria-label="Meu bairro">
          <label className="campo campo-busca">
            <IconeLupa />
            <input
              type="text"
              inputMode="text"
              placeholder="Digite seu CEP ou bairro"
              aria-label="Digite seu CEP ou bairro"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
            />
          </label>
          <button type="submit" className="botao-primario">
            Ver meu bairro
          </button>
        </form>

        {/* Parece um campo de texto, mas é um botão: clicar abre o overlay de
            busca, que tem o input de verdade. Evita dois campos concorrentes. */}
        <button type="button" className="home-busca" onClick={abrirBusca}>
          <IconeLupa />
          <span className="home-busca-texto">
            Buscar no site: UBS, matrícula, título de eleitor...
          </span>
          {/* <kbd> é a tag semântica para teclas do teclado. */}
          <kbd className="home-busca-atalho">Ctrl K</kbd>
        </button>
      </section>

      {/* Só aparece para quem salvou o bairro em "Meu bairro". */}
      <SeuBairro />

      <section className="container home-atalhos" aria-labelledby="titulo-atalhos">
        <h2 id="titulo-atalhos" className="home-servicos-titulo">
          Explore a cidade
        </h2>
        <ul className="home-atalhos-lista">
          {ATALHOS.map((atalho) => (
            <li key={atalho.rota}>
              <Link to={atalho.rota} className="home-atalho" data-categoria={atalho.slug}>
                <IconeCategoria slug={atalho.slug} tamanho={26} />
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

      {/* Faixa da marca: deixa claro de qual cidade o site trata e que ele não é oficial. */}
      <DiferencasSP />

      <section className="container home-marca">
        <img
          src="/img/interface/pequeno/logo.png"
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
        <h2 className="home-servicos-titulo">Todas as categorias</h2>
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
