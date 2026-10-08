/**
 * SeuBairro.jsx — Bloco da Home para quem já salvou o bairro em "Meu bairro".
 *
 * Lê o ponto salvo no localStorage ('cc:meu-bairro') e mostra o mais próximo de
 * quatro necessidades do dia a dia. Sem bairro salvo, não mostra nada.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useDados from '../hooks/useDados.js';
import useLocalStorage from '../hooks/useLocalStorage.js';
import { maisProximos } from '../utils/proximidade.js';
import { formatarDistancia } from '../utils/geo.js';
import BotoesNavegacao from './BotoesNavegacao.jsx';
import IconeCategoria from './IconeCategoria.jsx';

const NA_HOME = ['ubs', 'escola', 'mercado', 'farmacia'];

export default function SeuBairro() {
  const [salvo] = useLocalStorage('cc:meu-bairro', null);
  const locais = useDados('/api/locais.json');
  const comercio = useDados('/api/comercio.json');

  const perto = useMemo(() => {
    if (!salvo || !locais.dados || !comercio.dados) return [];
    return maisProximos(
      { locais: locais.dados.locais, comercio: comercio.dados.itens },
      salvo,
      1
    ).filter((n) => NA_HOME.includes(n.id));
  }, [salvo, locais.dados, comercio.dados]);

  if (!salvo) return null;
  return (
    <section
      className="container home-seu-bairro"
      data-categoria="bairro"
      aria-labelledby="titulo-seu-bairro"
    >
      <div className="home-seu-bairro-topo">
        <h2 id="titulo-seu-bairro" className="home-servicos-titulo">
          <IconeCategoria slug="bairro" />
          Seu bairro: {salvo.bairro ?? salvo.rotulo}
        </h2>
        <Link to="/meu-bairro">Ver tudo perto de casa</Link>
      </div>
      <ul className="home-seu-bairro-lista">
        {perto.map((n) => {
          const item = n.itens[0];
          return (
            <li key={n.id} className="painel" data-categoria={n.categoria}>
              <span className="home-seu-bairro-tipo">{n.titulo}</span>
              <strong>{item.nome}</strong>
              <span className="info-fonte">{formatarDistancia(item.distancia)} em linha reta</span>
              <BotoesNavegacao
                local={item}
                compacto
                modoPadrao={item.distancia < 1500 ? 'walking' : 'transit'}
                origem={salvo}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
