/**
 * CardServico.jsx — Card de uma categoria, usado na grade da Home.
 *
 * É um componente de apresentação: recebe os dados prontos por prop e só
 * desenha. O card inteiro é um link para a página da categoria.
 *
 * @param {{categoria: object}} props - objeto vindo de src/data/servicos.js.
 */

import { Link } from 'react-router-dom';
import './CardServico.css';

export default function CardServico({ categoria }) {
  return (
    // data-categoria é um atributo personalizado lido pelo CSS global, que
    // define --cat-fundo e --cat-tinta. É assim que cada card ganha a cor
    // do seu serviço sem precisar de uma classe diferente para cada um.
    <Link to={categoria.rota} className="card-servico" data-categoria={categoria.slug}>
      <span className="card-servico-icone">
        {/* alt="" porque o nome da categoria aparece logo abaixo em texto. */}
        <img src={categoria.icone} alt="" />
      </span>
      <span className="card-servico-nome">{categoria.nome}</span>
      <span className="card-servico-resumo">{categoria.resumo}</span>
      {/* A contagem é calculada na hora a partir da lista, então nunca fica
          desatualizada quando um local novo é cadastrado. */}
      <span className="etiqueta card-servico-contagem">{categoria.locais.length} locais</span>
    </Link>
  );
}
