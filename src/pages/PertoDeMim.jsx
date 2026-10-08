/**
 * PertoDeMim.jsx — Página "/perto-de-mim": "Qual o mais perto de mim?".
 *
 * A pessoa usa a localização ou digita o CEP e vê, para cada tipo de serviço
 * do dia a dia, o local mais próximo, com a distância e o botão "Como chegar".
 * Pensada para quem acabou de se mudar e ainda não conhece a cidade.
 *
 * A distância é em linha reta; o tempo real a pé/de bike aparece no "Como chegar".
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOrigem } from '../context/AppContext.jsx';
import useDados from '../hooks/useDados.js';
import useTituloPagina from '../hooks/useTituloPagina.js';
import { formatarDistancia, ordenarPorDistancia } from '../utils/geo.js';
import EstadoDados from '../components/EstadoDados.jsx';
import SeletorOrigem from '../components/SeletorOrigem.jsx';
import SeloAberto from '../components/SeloAberto.jsx';
import InfoFonte from '../components/InfoFonte.jsx';
import './PertoDeMim.css';

/** O que a pessoa costuma procurar primeiro, e como reconhecer nos dados. */
const NECESSIDADES = [
  { titulo: 'Posto de saúde (UBS)', icone: '🩺', filtro: (l) => l.tipo === 'UBS' },
  {
    titulo: 'Pronto atendimento / urgência',
    icone: '🚑',
    filtro: (l) => ['Pronto atendimento 24h', 'Hospital'].includes(l.tipo),
  },
  { titulo: 'Escola municipal (EMEB)', icone: '🏫', filtro: (l) => l.tipo === 'EMEB' },
  { titulo: 'Creche', icone: '🧸', filtro: (l) => l.tipo === 'Creche' },
  { titulo: 'Assistência social (CRAS)', icone: '🤝', filtro: (l) => l.tipo === 'CRAS' },
  { titulo: 'Segurança', icone: '🛡️', filtro: (l) => l.categoria === 'seguranca' },
  { titulo: 'Terminal de ônibus', icone: '🚌', filtro: (l) => l.tipo === 'Terminal de ônibus' },
  { titulo: 'Parque', icone: '🌳', filtro: (l) => l.tipo === 'Parque' },
];

export default function PertoDeMim() {
  useTituloPagina('O que tem perto de mim — Conecta Cidadão');
  const { dados, carregando, erro, recarregar } = useDados('/api/locais.json');
  const { origem } = useOrigem();

  // Para cada necessidade: os 2 locais mais próximos da origem.
  const resultados = useMemo(() => {
    if (!origem || !dados) return [];
    return NECESSIDADES.map((n) => ({
      ...n,
      locais: ordenarPorDistancia(dados.locais.filter(n.filtro), origem).slice(0, 2),
    }));
  }, [dados, origem]);

  return (
    <>
      <section className="container pagina-topo">
        <h1 className="titulo-pagina">O que tem perto de mim?</h1>
        <p className="texto-apoio">
          Acabou de chegar em Indaiatuba? Diga de onde você sai e veja o posto de saúde, a escola, a
          creche, o CRAS e o terminal de ônibus mais próximos.
        </p>
      </section>

      <section className="container perto">
        <div className="painel">
          <SeletorOrigem titulo="Onde você está ou mora?" />
        </div>

        <EstadoDados carregando={carregando} erro={erro} recarregar={recarregar}>
          {origem && (
            <ul className="perto-grade">
              {resultados.map((r) => (
                <li key={r.titulo} className="painel perto-cartao">
                  <h2>
                    <span aria-hidden="true">{r.icone}</span> {r.titulo}
                  </h2>
                  {r.locais.length === 0 ? (
                    <p className="nao-disponivel">Nenhum local com posição no mapa.</p>
                  ) : (
                    <ol>
                      {r.locais.map((l, i) => (
                        <li key={l.id} data-categoria={l.categoria}>
                          <Link to={`/${l.categoria}/${l.id}`} className="perto-nome">
                            {l.nome}
                          </Link>
                          <span className="perto-detalhe">
                            {formatarDistancia(l.distancia)} em linha reta
                            {l.endereco?.bairro ? ` · ${l.endereco.bairro}` : ''}
                          </span>
                          <SeloAberto horarios={l.horarios} />
                          {i === 0 && (
                            <Link
                              className="botao-secundario perto-rota"
                              to={`/como-chegar?destino=${l.id}`}
                            >
                              Como chegar
                            </Link>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ul>
          )}
          {origem && dados && (
            <InfoFonte fontes={dados.fontes.map((f) => f.url)} atualizadoEm={dados.atualizadoEm} />
          )}
        </EstadoDados>

        {origem && (
          <p className="info-fonte">
            Atenção: a UBS de referência de cada endereço é definida pela Secretaria de Saúde (pelo
            território), e não necessariamente é a mais próxima. Na dúvida, ligue para a UBS ou para
            a Secretaria de Saúde.
          </p>
        )}
      </section>
    </>
  );
}
