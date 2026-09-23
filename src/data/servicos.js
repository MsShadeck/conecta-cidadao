/**
 * servicos.js — Fonte única de dados do Conecta Cidadão.
 *
 * Todo o conteúdo do site (categorias, locais e equipe) mora neste arquivo.
 * Nenhum componente escreve informação "na mão": todos importam daqui. Assim,
 * para incluir um novo local basta adicionar um objeto em "locais" e colocar a
 * imagem em public/img/<categoria>/ — nada mais precisa ser alterado.
 *
 * Estrutura de uma categoria:
 *   slug   → identificador sem acento, usado na URL e no atributo data-categoria (cores do CSS)
 *   nome   → texto exibido ao usuário
 *   rota   → caminho registrado no App.jsx
 *   icone  → imagem da pasta public/ (caminho começa em "/" = raiz do site)
 *   resumo → frase curta mostrada no card da Home
 *   locais → lista de unidades daquela categoria
 */

export const categorias = [
  {
    slug: 'saude',
    nome: 'Saúde',
    rota: '/saude',
    icone: '/img/interface/cuidados-de-saude.png',
    resumo: 'Unidades básicas, hospital dia e pronto atendimento.',
    locais: [
      { nome: 'UBS Jd. Califórnia', imagem: '/img/saude/ubs-jd-california.jpg' },
      { nome: 'UBS Jd. Morada do Sol', imagem: '/img/saude/ubs-jd-morada-do-sol.jpg' },
      { nome: 'UBS Vila Todos os Santos', imagem: '/img/saude/ubs-vila-todos-os-santos.jpg' },
      { nome: 'Hospital Dia', imagem: '/img/saude/hospital-dia.jpg' },
      { nome: 'UBS Cecap', imagem: '/img/saude/ubs-cecap.jpg' },
      { nome: 'HAOC', imagem: '/img/saude/haoc.jpg' },
    ],
  },
  {
    slug: 'seguranca',
    nome: 'Segurança',
    rota: '/seguranca',
    icone: '/img/interface/social-security.png',
    resumo: 'Delegacias, guarda municipal, polícia militar e bombeiros.',
    locais: [
      { nome: 'Guarda Municipal', imagem: '/img/seguranca/guarda-municipal.jpg' },
      { nome: '1º Distrito Policial', imagem: '/img/seguranca/1-dp.jpg' },
      { nome: 'Delegacia da Mulher', imagem: '/img/seguranca/dp-da-mulher.jpg' },
      { nome: 'Base da PM', imagem: '/img/seguranca/base-da-pm.jpg' },
      { nome: 'Delegacia de Polícia', imagem: '/img/seguranca/dp-do-municipio.jpg' },
      { nome: 'Corpo de Bombeiros', imagem: '/img/seguranca/bombeiros.jpg' },
    ],
  },
  {
    slug: 'educacao',
    nome: 'Educação',
    rota: '/educacao',
    icone: '/img/interface/universidade.png',
    resumo: 'Escolas municipais de educação básica (EMEBs).',
    locais: [
      { nome: 'EMEB Janette Vieira', imagem: '/img/educacao/janette-vieira.jpg' },
      { nome: 'EMEB Maria Ignez', imagem: '/img/educacao/maria-ignez.jpg' },
      { nome: 'EMEB Maria José Ambiel', imagem: '/img/educacao/maria-jose-ambiel.jpg' },
      { nome: 'EMEB Maria José de Campos', imagem: '/img/educacao/maria-jose-de-campos.jpg' },
      { nome: 'EMEB Osório Germano', imagem: '/img/educacao/osorio-germano.jpg' },
      { nome: 'EMEB Yolanda Steffen', imagem: '/img/educacao/yolanda-steffen.jpg' },
    ],
  },
  {
    slug: 'lazer',
    nome: 'Lazer',
    rota: '/lazer',
    icone: '/img/interface/bicicleta.png',
    resumo: 'Parques, museus e espaços de convivência da cidade.',
    locais: [
      { nome: 'Parque Ecológico', imagem: '/img/lazer/parque-eco.jpg' },
      { nome: 'Parque Mirim', imagem: '/img/lazer/parque-do-mirim.jpg' },
      { nome: 'Parque da Criança', imagem: '/img/lazer/parque-da-crianca.jpg' },
      { nome: 'Parque Pet', imagem: '/img/lazer/parque-pet.jpg' },
      { nome: 'Museu da Água', imagem: '/img/lazer/museu-da-agua.jpg' },
      { nome: 'Casarão Pau Preto', imagem: '/img/lazer/museu-casarao.jpg' },
    ],
  },
];

/**
 * Lista única com todos os locais, já com a categoria embutida.
 *
 * flatMap = map + achatamento: percorre as 4 categorias, gera uma lista de locais
 * para cada uma e junta tudo em um array só (24 itens, sem listas aninhadas).
 * O operador spread (...local) copia nome e imagem do local original e as demais
 * linhas acrescentam de qual categoria ele veio — informação que a busca precisa
 * para exibir o rótulo e saber para onde navegar.
 */
export const todosOsLocais = categorias.flatMap((categoria) =>
  categoria.locais.map((local) => ({
    ...local,
    categoriaSlug: categoria.slug,
    categoriaNome: categoria.nome,
    rota: categoria.rota,
  }))
);

/**
 * Procura uma categoria pelo slug.
 * @param {string} slug - ex.: 'saude'
 * @returns {object|undefined} a categoria ou undefined se o slug não existir.
 */
export function buscarCategoria(slug) {
  return categorias.find((categoria) => categoria.slug === slug);
}

/**
 * Remove acentos e caixa para a busca não depender de digitação exata.
 * Assim "saude", "SAÚDE" e "Saúde" viram todos "saude".
 *
 * normalize('NFD') separa a letra do acento (ç → c + ̧ ) e o replace apaga
 * os sinais soltos usando o intervalo Unicode dos acentos combinantes.
 */
export function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim(); // tira espaços sobrando nas pontas
}

/**
 * Filtra os locais pelo termo digitado, comparando com o nome do local
 * e também com o nome da categoria (digitar "lazer" lista todos os parques).
 * @param {string} termo - texto digitado no campo de busca.
 * @returns {Array} locais encontrados; array vazio se o termo estiver em branco.
 */
export function filtrarLocais(termo) {
  const alvo = normalizar(termo);
  // Busca vazia não deve devolver os 24 locais de uma vez.
  if (!alvo) return [];
  return todosOsLocais.filter(
    (local) =>
      normalizar(local.nome).includes(alvo) ||
      normalizar(local.categoriaNome).includes(alvo)
  );
}

/** Integrantes do grupo, exibidos na página Sobre (iniciais usadas no avatar). */
export const equipe = [
  { iniciais: 'MS', nome: 'Moisés Globekener de Almeida Shadeck' },
  { iniciais: 'HB', nome: 'Homer Betinatti Gomes' },
];
