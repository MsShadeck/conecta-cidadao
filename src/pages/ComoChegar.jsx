/**
 * ComoChegar.jsx — Página "/como-chegar": trajeto até qualquer local do site.
 *
 * A pessoa escolhe o destino numa lista (agrupada por categoria) e informa de
 * onde sai (localização ou CEP). O cálculo é o mesmo do bloco "Como chegar"
 * da página de cada local (componente PlanejadorRota).
 *
 * O destino fica na URL (?destino=ubs-jd-california) para o link poder ser
 * compartilhado e para outras páginas abrirem esta já com o destino escolhido.
 */

import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { categorias } from '../data/servicos.js';
import useDados from '../hooks/useDados.js';
import useTituloPagina from '../hooks/useTituloPagina.js';
import EstadoDados from '../components/EstadoDados.jsx';
import PlanejadorRota from '../components/PlanejadorRota.jsx';
import './Categoria.css'; // campo de seleção (.filtro)
import './Mobilidade.css';

export default function ComoChegar() {
  useTituloPagina(
    'Como chegar — Conecta Cidadão',
    'Trajeto a pé ou de bicicleta pelas ruas de Indaiatuba até postos de saúde, escolas, parques e serviços públicos.'
  );
  const { dados, carregando, erro, recarregar } = useDados('/api/locais.json');
  const [parametros, setParametros] = useSearchParams();
  const idDestino = parametros.get('destino') ?? '';

  // Só entram na lista os locais que têm posição no mapa (sem ela não há rota).
  const porCategoria = useMemo(() => {
    const comPosicao = (dados?.locais ?? []).filter((l) => l.coordenadas);
    return categorias
      .map((c) => ({
        ...c,
        locais: comPosicao
          .filter((l) => l.categoria === c.slug)
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
      }))
      .filter((c) => c.locais.length);
  }, [dados]);

  const destino = dados?.locais.find((l) => l.id === idDestino);

  return (
    <>
      <section className="container pagina-topo">
        <h1 className="titulo-pagina">Como chegar</h1>
        <p className="texto-apoio">
          Trajeto a pé ou de bicicleta pelas ruas de Indaiatuba até um posto de saúde, escola,
          parque ou serviço público. Para ônibus, mostramos o caminho até a previsão oficial de
          chegadas.
        </p>
      </section>

      <section className="container">
        <EstadoDados carregando={carregando} erro={erro} recarregar={recarregar}>
          <div className="painel mobilidade-bloco">
            <label className="filtro como-chegar-destino">
              <span>Para onde você quer ir?</span>
              <select
                className="campo"
                value={idDestino}
                onChange={(e) =>
                  setParametros(e.target.value ? { destino: e.target.value } : {}, {
                    replace: true,
                  })
                }
              >
                <option value="">Escolha um destino...</option>
                {/* optgroup agrupa as opções por categoria dentro do select. */}
                {porCategoria.map((c) => (
                  <optgroup key={c.slug} label={c.nome}>
                    {c.locais.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome}
                        {l.endereco?.bairro ? ` (${l.endereco.bairro})` : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            {destino && (
              <>
                <p>
                  Destino: <Link to={`/${destino.categoria}/${destino.id}`}>{destino.nome}</Link>
                  {destino.enderecoTexto && ` — ${destino.enderecoTexto}`}
                </p>
                <PlanejadorRota destino={destino} />
              </>
            )}
          </div>
        </EstadoDados>
      </section>
    </>
  );
}
