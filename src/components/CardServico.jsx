/**
 * CardServico.jsx — Card de uma categoria, usado na grade da Home.
 *
 * É um componente de apresentação: recebe os dados prontos por prop e só
 * desenha. O card inteiro é um link para a página da categoria.
 *
 * @param {{categoria: object, total?: number}} props
 *   categoria - objeto vindo de src/data/servicos.js
 *   total     - quantidade de locais (de /api/locais.json); some enquanto carrega
 */

import { Link } from 'react-router-dom';
import { plural } from '../utils/texto.js';
import IconeCategoria from './IconeCategoria.jsx';
import './CardServico.css';

export default function CardServico({ categoria, total }) {
  return (
    // data-categoria é um atributo personalizado lido pelo CSS global, que
    // define --cat-fundo e --cat-tinta. É assim que cada card ganha a cor
    // do seu serviço sem precisar de uma classe diferente para cada um.
    <Link to={categoria.rota} className="card-servico" data-categoria={categoria.slug}>
      <span className="card-servico-icone">
        {/* Ícone SVG decorativo: o nome da categoria aparece logo abaixo em texto. */}
        <IconeCategoria slug={categoria.slug} tamanho={30} />
      </span>
      <span className="card-servico-nome">{categoria.nome}</span>
      <span className="card-servico-resumo">{categoria.resumo}</span>
      {/* A contagem vem dos dados reais: nunca fica desatualizada quando um
          local novo entra no locais.json. */}
      {total !== undefined && (
        <span className="etiqueta card-servico-contagem">{plural(total, 'local', 'locais')}</span>
      )}
    </Link>
  );
}
