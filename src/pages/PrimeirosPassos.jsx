/**
 * PrimeirosPassos.jsx — Página "/primeiros-passos": roteiro para quem acabou
 * de se mudar para Indaiatuba.
 *
 * Cada passo junta o que a pessoa precisa resolver, onde (link para a página
 * do site ou para o serviço oficial) e a fonte da informação. Só entram
 * informações conferidas nas páginas oficiais (ver docs/fontes-de-dados.md).
 */

import { Link } from 'react-router-dom';
import useTituloPagina from '../hooks/useTituloPagina.js';
import useLocalStorage from '../hooks/useLocalStorage.js';
import './PrimeirosPassos.css';

const PREFEITURA = 'https://www.indaiatuba.sp.gov.br';

/** Os passos, na ordem em que costumam ser necessários. */
const PASSOS = [
  {
    id: 'saude',
    icone: '🩺',
    titulo: 'Encontre a sua UBS e faça o Cartão SUS',
    texto:
      'As Unidades Básicas de Saúde (UBS) fazem consultas, vacinas e emitem o Cartão SUS. Procure a UBS mais perto de casa; a UBS de referência do seu endereço é definida pela Secretaria de Saúde.',
    acoes: [
      { rotulo: 'UBS mais perto de mim', rota: '/perto-de-mim' },
      {
        rotulo: 'Como tirar o Cartão SUS (Prefeitura)',
        url: `${PREFEITURA}/saude/cartao-nacional-de-saude/`,
      },
      { rotulo: 'Minha Vacina', url: `${PREFEITURA}/saude/minha-vacina/` },
    ],
    fonte: `${PREFEITURA}/saude/atencao-basica/`,
  },
  {
    id: 'urgencia',
    icone: '🚑',
    titulo: 'Saiba onde ir numa urgência',
    texto:
      'Para urgência e emergência, a Prefeitura indica a UPA 24h (Av. Eng. Fábio Roberto Barnabé, 6020) e o Pronto-Socorro do HAOC. O Hospital Dia não atende urgência. Em emergência, ligue 192 (SAMU).',
    acoes: [
      { rotulo: 'UPA 24h', rota: '/saude/upa-24h' },
      { rotulo: 'HAOC', rota: '/saude/haoc' },
      { rotulo: 'Telefones de emergência', rota: '/contatos' },
    ],
    fonte: `${PREFEITURA}/saude/atencao-especializada/hospital-dia/`,
  },
  {
    id: 'escola',
    icone: '🏫',
    titulo: 'Escola e creche para as crianças',
    texto:
      'A rede municipal tem EMEBs (pré-escola e ensino fundamental) e creches. Para vagas e matrícula, fale com a Secretaria Municipal de Educação: (19) 3801-9191.',
    acoes: [
      { rotulo: 'Escolas e creches no mapa', rota: '/educacao?ver=mapa' },
      { rotulo: 'Escola mais perto de mim', rota: '/perto-de-mim' },
    ],
    fonte: `${PREFEITURA}/telefones-uteis/`,
  },
  {
    id: 'onibus',
    icone: '🚌',
    titulo: 'Faça o cartão SOU do ônibus',
    texto:
      'O cartão do ônibus municipal é emitido no guichê da SOU Indaiatuba, no Ponto Cidadão (Rua Vinte e Quatro de Maio, 1.670), de segunda a sexta, das 9h às 17h. A primeira via é gratuita. Leve RG, CPF e comprovante de endereço.',
    acoes: [
      { rotulo: 'Ônibus, terminais e previsão de chegada', rota: '/mobilidade' },
      { rotulo: 'Ponto Cidadão', rota: '/cidadania/ponto-cidadao' },
    ],
    fonte: `${PREFEITURA}/mobilidade-urbana/terminais-de-transporte-publico/ponto-cidadao/`,
  },
  {
    id: 'bike',
    icone: '🚲',
    titulo: 'Use as bicicletas grátis do Ecobike',
    texto:
      'O cadastro é presencial, numa das estações, com CPF, comprovante de endereço no seu nome e documento com foto. Cada uso pode durar até 4 horas, renováveis.',
    acoes: [{ rotulo: 'Ecobike e ciclovias', rota: '/mobilidade#ecobike' }],
    fonte: `${PREFEITURA}/mobilidade-urbana/ecobike/`,
  },
  {
    id: 'casa',
    icone: '🏠',
    titulo: 'Água, IPTU e serviços da casa',
    texto:
      'Água e esgoto são do SAAE (0800 772 2195). O IPTU e outros serviços da Prefeitura ficam no portal Minha Indaiatuba e na página de Tributos. Lâmpada de poste apagada? Peça o conserto pela Iluminação Pública.',
    acoes: [
      { rotulo: 'Serviços online', rota: '/servicos-online' },
      { rotulo: 'Minha Indaiatuba', url: 'https://minha.indaiatuba.sp.gov.br/' },
    ],
    fonte: `${PREFEITURA}/tributos/`,
  },
  {
    id: 'documentos',
    icone: '🪪',
    titulo: 'Documentos, título de eleitor e emprego',
    texto:
      'No Ponto Cidadão funcionam o PAT (vagas de emprego), o Procon e a Junta de Serviço Militar. RG e CNH são no Poupatempo (Governo do Estado). Para transferir o título de eleitor, procure o Cartório Eleitoral: (19) 3834-6378.',
    acoes: [
      { rotulo: 'Cidadania e documentos', rota: '/cidadania' },
      { rotulo: 'Poupatempo (agendamento)', url: 'https://www.poupatempo.sp.gov.br/' },
    ],
    fonte: `${PREFEITURA}/mobilidade-urbana/terminais-de-transporte-publico/ponto-cidadao/`,
  },
  {
    id: 'social',
    icone: '🤝',
    titulo: 'Programas sociais',
    texto:
      'Os CRAS (Centros de Referência de Assistência Social) atendem as famílias e orientam sobre os programas sociais do território. Procure o CRAS mais perto de casa.',
    acoes: [{ rotulo: 'CRAS mais perto de mim', rota: '/perto-de-mim' }],
    fonte: `${PREFEITURA}/assistencia-social/protecao-basica/cras-1/`,
  },
];

export default function PrimeirosPassos() {
  useTituloPagina('Primeiros passos em Indaiatuba — Conecta Cidadão');
  // A pessoa pode marcar o que já resolveu; fica salvo no navegador.
  const [feitos, setFeitos] = useLocalStorage('cc:primeiros-passos', {});
  const total = PASSOS.filter((p) => feitos[p.id]).length;

  return (
    <>
      <section className="container pagina-topo">
        <h1 className="titulo-pagina">Primeiros passos em Indaiatuba</h1>
        <p className="texto-apoio">
          Mudou para a cidade? Este roteiro reúne o que quase todo mundo precisa resolver nas
          primeiras semanas. Marque o que já fez: a lista fica salva neste navegador.
        </p>
        <p className="passos-progresso" role="status">
          {total} de {PASSOS.length} passos concluídos
        </p>
      </section>

      <section className="container">
        <ol className="passos">
          {PASSOS.map((passo) => (
            <li key={passo.id} className={`painel passo${feitos[passo.id] ? ' passo--feito' : ''}`}>
              <div className="passo-topo">
                <span className="passo-icone" aria-hidden="true">
                  {passo.icone}
                </span>
                <h2>{passo.titulo}</h2>
              </div>
              <p>{passo.texto}</p>
              <div className="passo-acoes">
                {passo.acoes.map((acao) =>
                  acao.rota ? (
                    <Link key={acao.rotulo} className="botao-secundario" to={acao.rota}>
                      {acao.rotulo}
                    </Link>
                  ) : (
                    <a
                      key={acao.rotulo}
                      className="botao-secundario"
                      href={acao.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {acao.rotulo} ↗
                    </a>
                  )
                )}
              </div>
              <label className="passo-feito">
                <input
                  type="checkbox"
                  checked={Boolean(feitos[passo.id])}
                  onChange={() =>
                    setFeitos((anterior) => ({ ...anterior, [passo.id]: !anterior[passo.id] }))
                  }
                />
                Já resolvi
              </label>
              <p className="info-fonte">
                Fonte:{' '}
                <a href={passo.fonte} target="_blank" rel="noreferrer">
                  Prefeitura de Indaiatuba
                </a>
              </p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
