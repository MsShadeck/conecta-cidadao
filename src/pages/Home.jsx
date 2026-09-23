/**
 * Home.jsx — Página inicial ("/").
 *
 * Três blocos: chamada com o botão de busca, faixa da marca e a grade com as
 * quatro categorias de serviço.
 */

import { categorias } from '../data/servicos.js';
import { useBusca } from '../context/AppContext.jsx';
import CardServico from '../components/CardServico.jsx';
import IconeLupa from '../components/IconeLupa.jsx';
import useTituloPagina from '../hooks/useTituloPagina.js';
import './Home.css';

export default function Home() {
  const { abrirBusca } = useBusca();
  // Define o título da aba do navegador para esta página.
  useTituloPagina('Conecta Cidadão');

  return (
    <>
      <section className="container home-topo">
        {/* Só um <h1> por página: é o título principal do documento. */}
        <h1 className="titulo-pagina">
          Encontre os serviços públicos que você precisa
        </h1>
        <p className="texto-apoio">
          Saúde, segurança, educação e lazer da cidade reunidos em um só lugar, de forma
          fácil e prática.
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

      <section className="container home-marca">
        <img src="/img/interface/logo.png" alt="" className="home-marca-logo" />
        <div>
          <h2 className="home-marca-titulo">Serviços Sociais</h2>
          <p className="home-marca-frase">Cuidado que transforma vidas</p>
        </div>
      </section>

      <section className="container home-servicos">
        <h2 className="home-servicos-titulo">Escolha o serviço desejado</h2>
        <div className="grade-servicos">
          {/* map() transforma cada categoria dos dados em um card na tela.
              Acrescentar uma categoria em servicos.js já faz surgir o card aqui. */}
          {categorias.map((categoria) => (
            <CardServico key={categoria.slug} categoria={categoria} />
          ))}
        </div>
      </section>
    </>
  );
}
