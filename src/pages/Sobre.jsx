/**
 * Sobre.jsx — Página "/sobre": descrição do projeto e integrantes do grupo.
 *
 * Página estática: o único dado externo é a lista "equipe", importada de
 * src/data/servicos.js.
 */

import { equipe } from '../data/servicos.js';
import useTituloPagina from '../hooks/useTituloPagina.js';
import './Sobre.css';

export default function Sobre() {
  useTituloPagina('Sobre — Conecta Cidadão');

  return (
    <>
      <section className="container sobre-topo">
        <h1 className="titulo-pagina">Sobre nós</h1>
        <p className="texto-apoio">
          Conheça o projeto e a equipe por trás do Conecta Cidadão.
        </p>
      </section>

      <section className="container sobre-grade">
        {/* <article>: bloco de conteúdo com sentido próprio. */}
        <article className="sobre-card">
          {/* Imagem informativa (traz o slogan), por isso o alt é preenchido. */}
          <img
            src="/img/interface/logo-de-fundo.png"
            alt="Serviços Sociais — cuidado que transforma vidas"
            className="sobre-logo"
          />
          <h2 className="sobre-subtitulo">O projeto</h2>
          <p className="sobre-texto">
            O <strong>Conecta Cidadão</strong> é uma plataforma criada para facilitar o acesso
            da população aos serviços públicos de forma simples, rápida e prática.
          </p>
          <p className="sobre-texto">
            {/* As etiquetas reaproveitam a classe global "etiqueta" com o
                data-categoria de cada serviço, herdando a cor correspondente.
                O {' '} força um espaço que o JSX apagaria na quebra de linha. */}
            Em uma única interface, o cidadão encontra informações sobre{' '}
            <span className="etiqueta" data-categoria="saude">Saúde</span>,{' '}
            <span className="etiqueta" data-categoria="seguranca">Segurança</span>,{' '}
            <span className="etiqueta" data-categoria="educacao">Educação</span> e{' '}
            <span className="etiqueta" data-categoria="lazer">Lazer</span> — sem burocracia e
            sem complicação.
          </p>
          <p className="sobre-texto">
            Nossa missão é aproximar as pessoas dos recursos públicos disponíveis na cidade,
            promovendo mais qualidade de vida e cidadania ativa.
          </p>
        </article>

        {/* <aside>: conteúdo complementar ao texto principal. */}
        <aside className="sobre-equipe">
          <h2 className="sobre-subtitulo sobre-subtitulo--esquerda">Nossa equipe</h2>
          <ul className="sobre-lista">
            {equipe.map((pessoa) => (
              <li key={pessoa.nome} className="sobre-membro">
                {/* O avatar com as iniciais é decorativo: o nome completo vem ao
                    lado, então aria-hidden evita a leitura de "MS" em voz alta. */}
                <span className="sobre-avatar" aria-hidden="true">
                  {pessoa.iniciais}
                </span>
                <span className="sobre-nome">{pessoa.nome}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </>
  );
}
