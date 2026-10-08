/**
 * ServicosPublicos.jsx — Página "/servicos": agrupa as categorias de serviço público.
 *
 * As páginas de cada categoria continuam nos mesmos endereços (/saude,
 * /educacao, /seguranca, /cidadania); esta página só reúne os atalhos, com a
 * contagem real de locais, mais os serviços online e os telefones úteis.
 */

import { Link } from 'react-router-dom';
import { buscarCategoria } from '../data/servicos.js';
import useDados from '../hooks/useDados.js';
import useTituloPagina from '../hooks/useTituloPagina.js';
import CardServico from '../components/CardServico.jsx';
import IconeCategoria from '../components/IconeCategoria.jsx';
import '../pages/Home.css'; // grade de cards (.grade-servicos)
import './ServicosPublicos.css';

const SLUGS = ['saude', 'educacao', 'seguranca', 'cidadania'];

export default function ServicosPublicos() {
  useTituloPagina(
    'Serviços públicos de Indaiatuba — Conecta Cidadão',
    'Postos de saúde, escolas e creches, segurança e atendimento ao cidadão em Indaiatuba, com endereço, telefone e horário.'
  );
  const { dados } = useDados('/api/locais.json');
  const totais = {};
  for (const local of dados?.locais ?? [])
    totais[local.categoria] = (totais[local.categoria] ?? 0) + 1;

  return (
    <div data-categoria="servicos">
      <section className="container pagina-topo">
        <h1 className="titulo-pagina">Serviços públicos</h1>
        <p className="texto-apoio">
          Onde ficam e como funcionam os serviços da Prefeitura, do Estado e da União em Indaiatuba.
        </p>
      </section>

      <section className="container">
        <div className="grade-servicos">
          {SLUGS.map((slug) => (
            <CardServico
              key={slug}
              categoria={buscarCategoria(slug)}
              total={dados ? (totais[slug] ?? 0) : undefined}
            />
          ))}
        </div>

        <ul className="servicos-publicos-atalhos">
          <li>
            <Link to="/servicos-online" className="servicos-publicos-atalho">
              <IconeCategoria slug="servicos" />
              <span>
                <strong>Serviços online</strong> IPTU, Minha Vacina, multas, iluminação pública e
                mais
              </span>
            </Link>
          </li>
          <li>
            <Link to="/contatos" className="servicos-publicos-atalho">
              <IconeCategoria slug="seguranca" />
              <span>
                <strong>Telefones úteis</strong> Emergência, Prefeitura, Ouvidoria, SAAE e Conselho
                Tutelar
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
