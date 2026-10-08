/**
 * Sobre.jsx — Página "/sobre": o projeto, o aviso de site não oficial, as
 * fontes de dados com licença e créditos, os dados em conferência e a equipe.
 *
 * A lista de pendências vem de /api/pendencias.json (gerado por npm run dados):
 * são os locais que existiam na v1 mas não foram confirmados em fonte oficial.
 */

import { Link } from 'react-router-dom';
import { categorias, equipe } from '../data/servicos.js';
import useDados from '../hooks/useDados.js';
import useTituloPagina from '../hooks/useTituloPagina.js';
import { formatarData } from '../utils/datas.js';
import './Sobre.css';

const URL_OUVIDORIA = 'https://www.indaiatuba.sp.gov.br/fale-conosco/';

/** Fontes de dados, o que veio de cada uma e a licença ou condição de uso. */
const FONTES = [
  {
    nome: 'Prefeitura de Indaiatuba',
    url: 'https://www.indaiatuba.sp.gov.br/',
    uso: 'Endereço, telefone, horário e serviços de cada unidade (fichas oficiais), telefones úteis, Ecobike, cartão SOU e links dos serviços online.',
    licenca:
      'Informação pública. Coletada uma vez, página por página, com intervalo entre os acessos; sempre citada como fonte.',
  },
  {
    nome: 'CNES — Ministério da Saúde',
    url: 'https://apidadosabertos.saude.gov.br/',
    uso: 'Localização no mapa, CEP e código das unidades públicas de saúde.',
    licenca: 'Dados abertos do Governo Federal.',
  },
  {
    nome: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/copyright',
    uso: 'Mapa de fundo, posição de escolas, parques e terminais, ruas e ciclovias usadas no "Como chegar".',
    licenca: '© OpenStreetMap contributors, licença ODbL.',
  },
  {
    nome: 'Nominatim (OpenStreetMap)',
    url: 'https://nominatim.org/',
    uso: 'Localização no mapa a partir do endereço, quando nenhuma outra fonte tinha a posição (marcada como aproximada).',
    licenca:
      'Política de uso do Nominatim: no máximo 1 consulta por segundo, com resultados guardados.',
  },
  {
    nome: 'Indaiatuba Integra',
    uso: 'Cálculo das rotas a pé e de bicicleta pelas ruas reais (algoritmo do projeto Integra, da mesma equipe).',
    licenca: 'Projeto da equipe. Só os dados reais do OpenStreetMap são usados; nada simulado.',
  },
  {
    nome: 'IBGE',
    url: 'https://servicodados.ibge.gov.br/api/docs/',
    uso: 'Contorno do município no mapa.',
    licenca: 'Dados abertos do IBGE.',
  },
  {
    nome: 'BrasilAPI e ViaCEP',
    url: 'https://brasilapi.com.br/',
    uso: 'Feriados nacionais e conversão de CEP em localização.',
    licenca: 'APIs públicas e gratuitas.',
  },
  {
    nome: 'Open-Meteo',
    url: 'https://open-meteo.com/',
    uso: 'Tempo agora e previsão do dia na página inicial.',
    licenca: 'CC BY 4.0.',
  },
  {
    nome: 'VLibras',
    url: 'https://vlibras.gov.br/',
    uso: 'Tradução do conteúdo para Libras, quando a pessoa ativa no menu.',
    licenca: 'Ferramenta do Governo Federal.',
  },
];

export default function Sobre() {
  useTituloPagina(
    'Sobre o projeto — Conecta Cidadão',
    'Projeto acadêmico da Fatec Indaiatuba, sem vínculo com a Prefeitura. Fontes de dados, créditos e equipe.'
  );
  const { dados: pendencias } = useDados('/api/pendencias.json');

  return (
    <>
      <section className="container sobre-topo">
        <h1 className="titulo-pagina">Sobre o projeto</h1>
        <p className="texto-apoio">
          Conheça o Conecta Cidadão, de onde vêm as informações e a equipe que fez o site.
        </p>
      </section>

      <section className="container sobre-grade">
        {/* <article>: bloco de conteúdo com sentido próprio. */}
        <article className="sobre-card">
          {/* Logo sem texto: é decorativa, o nome do projeto vem logo abaixo. */}
          <img
            src="/img/interface/logo.png"
            alt=""
            className="sobre-logo"
            width="160"
            height="128"
          />
          <h2 className="sobre-subtitulo">O projeto</h2>
          <p className="sobre-texto">
            O <strong>Conecta Cidadão</strong> é uma plataforma criada para facilitar o acesso da
            população de <strong>Indaiatuba (SP)</strong> aos serviços públicos de forma simples,
            rápida e prática, pensada também para quem acabou de se mudar para a cidade.
          </p>
          <p className="sobre-texto">
            {/* As etiquetas reaproveitam a classe global "etiqueta" com o
                data-categoria de cada serviço, herdando a cor correspondente. */}
            Em uma única interface, o cidadão encontra informações sobre{' '}
            {categorias.map((c, i) => (
              <span key={c.slug}>
                {i > 0 && (i === categorias.length - 1 ? ' e ' : ', ')}
                <span className="etiqueta" data-categoria={c.slug}>
                  {c.nome}
                </span>
              </span>
            ))}{' '}
            — sem burocracia e sem complicação.
          </p>
          <p className="sobre-texto">
            Nossa missão é aproximar as pessoas dos recursos públicos disponíveis em Indaiatuba,
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
          <p className="sobre-texto">
            Projeto Integrador do curso de Desenvolvimento de Software Multiplataforma (DSM) da
            Fatec Indaiatuba.
          </p>
        </aside>
      </section>

      <section className="container sobre-secoes">
        {/* Aviso importante: este site NÃO é da Prefeitura. */}
        <div className="painel sobre-aviso" role="note">
          <h2 className="sobre-subtitulo sobre-subtitulo--esquerda">Site não oficial</h2>
          <p className="sobre-texto">
            O Conecta Cidadão é um <strong>projeto acadêmico</strong>, sem vínculo com a Prefeitura
            de Indaiatuba nem com outros órgãos públicos, e não usa o brasão nem a identidade visual
            oficial. As informações vêm de fontes públicas, citadas em cada página, mas podem mudar:
            confirme por telefone antes de ir, principalmente horários.
          </p>
          <p className="sobre-texto">
            Achou um erro? Avise a Prefeitura pela{' '}
            <a href={URL_OUVIDORIA} target="_blank" rel="noreferrer">
              Ouvidoria (Fale conosco)
            </a>{' '}
            ou pelo telefone 0800 770 7702.
          </p>
        </div>

        <div className="painel">
          <h2 className="sobre-subtitulo sobre-subtitulo--esquerda">Fontes de dados e créditos</h2>
          <p className="sobre-texto">
            Nenhum dado é inventado: o que nenhuma fonte informa aparece como “Informação não
            disponível”. Cada local mostra as próprias fontes e a data da última atualização.
          </p>
          <ul className="sobre-fontes">
            {FONTES.map((f) => (
              <li key={f.nome}>
                {/* Fonte sem site público (o Integra) aparece sem link. */}
                {f.url ? (
                  <a href={f.url} target="_blank" rel="noreferrer">
                    <strong>{f.nome}</strong>
                  </a>
                ) : (
                  <strong>{f.nome}</strong>
                )}
                <span>{f.uso}</span>
                <small>{f.licenca}</small>
              </li>
            ))}
          </ul>
          <p className="sobre-texto">
            Linhas, paradas e horários de ônibus não aparecem porque não são publicados em formato
            aberto: a página <Link to="/mobilidade">Ônibus e bike</Link> leva ao sistema oficial de
            previsão de chegadas. As fotos dos locais vêm do projeto original e a origem de cada uma
            está sendo conferida.
          </p>
        </div>

        {pendencias?.pendencias?.length > 0 && (
          <div className="painel">
            <h2 className="sobre-subtitulo sobre-subtitulo--esquerda">Dados em conferência</h2>
            <p className="sobre-texto">
              Estes locais estavam na primeira versão do site, mas não foram encontrados em fonte
              oficial. Eles ficam fora das listas até alguém confirmar (atualizado em{' '}
              {formatarData(pendencias.atualizadoEm)}):
            </p>
            <ul className="sobre-pendencias">
              {pendencias.pendencias.map((p) => (
                <li key={p.nome}>
                  <strong>{p.nome}</strong> — {p.motivo}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}
