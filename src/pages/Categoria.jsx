/**
 * Categoria.jsx — Página de um serviço (/saude, /seguranca, /educacao, /lazer).
 *
 * Um único componente atende às quatro rotas: o App.jsx passa a prop "slug" e
 * ele busca em src/data/servicos.js os dados correspondentes.
 *
 * @param {{slug: string}} props - identificador da categoria, ex.: 'saude'.
 */

import { Navigate } from 'react-router-dom';
import { buscarCategoria } from '../data/servicos.js';
import CardLocal from '../components/CardLocal.jsx';
import ChipsCategorias from '../components/ChipsCategorias.jsx';
import BotaoUtil from '../components/BotaoUtil.jsx';
import SugestaoLocais from '../components/SugestaoLocais.jsx';
import useTituloPagina from '../hooks/useTituloPagina.js';
import './Categoria.css';

export default function Categoria({ slug }) {
  const categoria = buscarCategoria(slug);
  // Título dinâmico: "Saúde — Conecta Cidadão". O hook é chamado antes do
  // possível "return" abaixo porque hooks não podem ficar depois de um desvio.
  useTituloPagina(categoria ? `${categoria.nome} — Conecta Cidadão` : 'Conecta Cidadão');

  // Proteção: se o slug não existir nos dados, redireciona para a Home em vez
  // de quebrar a tela. "replace" troca a entrada no histórico, para o botão
  // Voltar não trazer o usuário de volta à página inválida.
  if (!categoria) {
    return <Navigate to="/" replace />;
  }

  return (
    // data-categoria nesta <div> externa define as variáveis de cor que todos
    // os elementos filhos (etiqueta, cards, chips) herdam pelo CSS.
    <div data-categoria={categoria.slug}>
      <section className="container categoria-topo">
        <ChipsCategorias />
        <div className="categoria-titulo-area">
          <h1 className="titulo-pagina">{categoria.nome}</h1>
          <span className="etiqueta">{categoria.locais.length} locais</span>
        </div>
        <p className="texto-apoio">{categoria.resumo}</p>
      </section>

      <section className="container">
        <div className="grade-locais">
          {/* Um CardLocal para cada unidade da categoria. O slug é repassado
              para que o card pinte a borda com a cor do serviço. */}
          {categoria.locais.map((local) => (
            <CardLocal key={local.nome} local={local} categoriaSlug={categoria.slug} />
          ))}
        </div>
      </section>

      {/* Aula "Review + Rotas": BotaoUtil (LikeButton) e SugestaoLocais (ListaAlunos).
          key={categoria.slug}: as quatro rotas usam o mesmo componente Categoria,
          então sem a key o React manteria o estado (curtidas e sugestões) ao
          trocar de /saude para /lazer. Mudando a key, o estado recomeça do zero. */}
      <section className="container">
        <div className="painel categoria-extra">
          <BotaoUtil key={`util-${categoria.slug}`} />
          <SugestaoLocais key={`sugestao-${categoria.slug}`} categoriaNome={categoria.nome} />
        </div>
      </section>
    </div>
  );
}
