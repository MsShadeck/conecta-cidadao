/**
 * ComoChegar.jsx — Página "/como-chegar": trajeto até qualquer local do site.
 *
 * A pessoa digita o destino (nome, tipo ou bairro) e escolhe numa lista de
 * sugestões (componente CampoDestino), e informa de onde sai (localização ou
 * CEP). O cálculo é o mesmo do bloco "Como chegar" da página de cada local
 * (componente PlanejadorRota).
 *
 * O destino fica na URL (?destino=ubs-jd-california) para o link poder ser
 * compartilhado e para outras páginas abrirem esta já com o destino escolhido.
 */

import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useDados from '../hooks/useDados.js';
import useTituloPagina from '../hooks/useTituloPagina.js';
import EstadoDados from '../components/EstadoDados.jsx';
import PlanejadorRota from '../components/PlanejadorRota.jsx';
import CampoDestino from '../components/CampoDestino.jsx';
import './Mobilidade.css';

export default function ComoChegar() {
  useTituloPagina(
    'Como chegar — Conecta Cidadão',
    'Trajeto a pé ou de bicicleta pelas ruas de Indaiatuba até postos de saúde, escolas, parques e serviços públicos.'
  );
  const { dados, carregando, erro, recarregar } = useDados('/api/locais.json');
  const [parametros, setParametros] = useSearchParams();
  const idDestino = parametros.get('destino') ?? '';

  // Só podem ser destino os locais que têm posição no mapa (sem ela não há rota).
  const comPosicao = useMemo(() => (dados?.locais ?? []).filter((l) => l.coordenadas), [dados]);

  const destino = dados?.locais.find((l) => l.id === idDestino);

  return (
    <>
      <section className="container pagina-topo">
        <h1 className="titulo-pagina">Como chegar</h1>
        <p className="texto-apoio">
          Trajeto a pé ou de bicicleta pelas ruas de Indaiatuba até um posto de saúde, escola,
          parque, faculdade, shopping ou serviço público. Para ônibus, mostramos o caminho até a
          previsão oficial de chegadas.
        </p>
      </section>

      <section className="container">
        <EstadoDados carregando={carregando} erro={erro} recarregar={recarregar}>
          <div className="painel mobilidade-bloco">
            {/* Campo com busca: digita parte do nome, do tipo ou do bairro e escolhe. */}
            <CampoDestino
              locais={comPosicao}
              valor={idDestino}
              aoEscolher={(id) => setParametros(id ? { destino: id } : {}, { replace: true })}
            />

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
