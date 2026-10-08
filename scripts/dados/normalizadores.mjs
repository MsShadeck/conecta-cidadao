/**
 * normalizadores.mjs — Funções puras que transformam o texto "cru" das fontes
 * no formato único de local do Conecta Cidadão.
 *
 * "Pura" = não acessa internet nem arquivos: recebe um valor e devolve outro.
 * Por isso todas são testadas no Vitest (normalizadores.test.mjs).
 *
 * Regra de ouro: se o texto da fonte não permite concluir algo com segurança,
 * a função devolve null em vez de adivinhar. A interface mostra "Informação
 * não disponível" nesses casos.
 */

/** Sem acento, minúsculo e sem espaços sobrando (mesma regra do front). */
export function normalizar(texto) {
  return (texto ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function criarSlug(texto) {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ------------------------------------------------------------------ */
/* Telefones                                                           */
/* ------------------------------------------------------------------ */

/** Formata só os dígitos: 1938945375 → (19) 3894-5375; 0800... → 0800 770 7702. */
function formatarNumero(digitos) {
  if (/^0800\d{7}$/.test(digitos)) {
    return `0800 ${digitos.slice(4, 7)} ${digitos.slice(7)}`;
  }
  if (digitos.length === 3) return digitos; // 190, 192, 153...
  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);
  const meio = resto.length - 4;
  return `(${ddd}) ${resto.slice(0, meio)}-${resto.slice(meio)}`;
}

/**
 * Transforma o campo "Telefone" das fichas numa lista padronizada.
 *   "3894-5375/5345"                → ['(19) 3894-5375', '(19) 3894-5345']
 *   "(19) 3816-6961 / (19) 99906-9434 whatsapp" → ['(19) 3816-6961', '(19) 99906-9434']
 *   "19-3875.5501"                  → ['(19) 3875-5501']
 * Números de Indaiatuba sem DDD recebem o 19.
 */
export function normalizarTelefones(texto) {
  if (!texto) return [];
  const resultado = [];
  // Separa por barra, vírgula, " e ", ponto e vírgula. Sufixo "/5345" reaproveita o prefixo anterior.
  const partes = texto
    .replace(/whats\s*app|whatsapp|celular|fixo/gi, ' ')
    .split(/\s*(?:\/|,|;|\be\b|\s-\s)\s*/);
  let anterior = null;
  for (const parte of partes) {
    let digitos = parte.replace(/\D/g, '');
    if (!digitos) continue;
    // Formato internacional do OpenStreetMap: +55 19 3825 3785.
    if (/^\+?\s*55/.test(parte.trim()) && (digitos.length === 12 || digitos.length === 13)) {
      digitos = digitos.slice(2);
    }
    if (digitos.startsWith('0') && !digitos.startsWith('0800'))
      digitos = digitos.replace(/^0+/, '');
    if (digitos.length === 4 && anterior) {
      // "3894-5375/5345": troca os 4 últimos dígitos do número anterior.
      digitos = anterior.slice(0, -4) + digitos;
    } else if (digitos.length === 8 || digitos.length === 9) {
      digitos = `19${digitos}`;
    }
    const valido =
      digitos.length === 3 ||
      /^0800\d{7}$/.test(digitos) ||
      digitos.length === 10 ||
      digitos.length === 11;
    if (!valido) continue;
    anterior = digitos;
    const formatado = formatarNumero(digitos);
    if (!resultado.includes(formatado)) resultado.push(formatado);
  }
  return resultado;
}

/* ------------------------------------------------------------------ */
/* Endereço                                                            */
/* ------------------------------------------------------------------ */

const TIPOS_LOGRADOURO = [
  ['avenida', 'Avenida'],
  ['av', 'Avenida'],
  ['rua', 'Rua'],
  ['r', 'Rua'],
  ['praca', 'Praça'],
  ['estrada', 'Estrada'],
  ['rodovia', 'Rodovia'],
  ['alameda', 'Alameda'],
  ['travessa', 'Travessa'],
];

/**
 * "Rua Basílio Martins, 830 - Jardim Califórnia" →
 *   { logradouro: 'Rua Basílio Martins', numero: '830', bairro: 'Jardim Califórnia' }
 * Partes que não aparecem no texto ficam null.
 */
export function interpretarEndereco(texto) {
  if (!texto) return null;
  // Tira observações entre parênteses ("(em frente ao HAOC)") e o "Rua :" mal digitado.
  const limpo = texto
    .replace(/\(.*?\)/g, '')
    .replace(/^Rua\s*:\s*/i, 'Rua ')
    .replace(/^Av\s*:\s*/i, 'Av. ')
    .replace(/\s+/g, ' ')
    .trim();
  const [principal, ...resto] = limpo.split(/\s+[-–]\s+/);
  const bairro =
    resto
      .join(' - ')
      .replace(/^Bairro\s+/i, '')
      .trim() || null;
  const partes = principal.split(',').map((p) => p.trim());
  let logradouro = partes[0] || null;
  // Número = primeiro número depois da vírgula ("181 Quadra N" → 181; "1367/1473" → 1367).
  let numero = null;
  if (partes[1]) {
    if (/^s\s*\/?\s*n/i.test(partes[1])) numero = 's/n';
    else numero = partes[1].replace(/\./g, '').match(/^(\d+[A-Za-z]?)\b/)?.[1] ?? null;
  }
  // Padroniza "Av." → "Avenida" e afins (e "Coronel Julio..." sem tipo continua como veio).
  if (logradouro) {
    const [primeira, ...demais] = logradouro.split(' ');
    const chave = normalizar(primeira).replace(/\./g, '');
    const tipo = TIPOS_LOGRADOURO.find(([abrev]) => abrev === chave);
    if (tipo) logradouro = [tipo[1], ...demais].join(' ');
  }
  return { logradouro, numero, bairro: bairro && !/^\d/.test(bairro) ? bairro : null };
}

/** Palavras significativas de um nome de rua, para comparar fontes diferentes. */
export function chaveLogradouro(logradouro) {
  return normalizar(logradouro)
    .replace(/[.,]/g, ' ')
    .split(' ')
    .filter(
      (p) =>
        p &&
        ![
          'rua',
          'r',
          'av',
          'avenida',
          'praca',
          'estrada',
          'rodovia',
          'alameda',
          'de',
          'da',
          'do',
          'dos',
          'das',
          'eng',
          'engenheiro',
          'dr',
          'doutor',
          'prof',
          'cel',
          'coronel',
        ].includes(p)
    );
}

/* ------------------------------------------------------------------ */
/* Horário de funcionamento                                            */
/* ------------------------------------------------------------------ */

export const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

const NOMES_DIA = [
  [/^(domingos?|dom)$/, 0],
  [/^(2a|segunda|segundas|seg)$/, 1],
  [/^(3a|terca|tercas|ter)$/, 2],
  [/^(4a|quarta|quartas|qua)$/, 3],
  [/^(5a|quinta|quintas|qui)$/, 4],
  [/^(6a|sexta|sextas|sex)$/, 5],
  [/^(sabados?|sab)$/, 6],
];

function numeroDoDia(palavra) {
  const p = normalizar(palavra)
    .replace(/ª|º/g, 'a')
    .replace(/\s*-?\s*feiras?$/, '')
    .trim();
  for (const [regra, numero] of NOMES_DIA) if (regra.test(p)) return numero;
  return null;
}

const PALAVRA_DIA =
  // Só nomes completos e ordinais: abreviações como "dom" e "ter" aparecem em
  // nomes de lugares ("Terminal Dom Pedro") e gerariam falsos dias.
  '(?:2ª|3ª|4ª|5ª|6ª|2a|3a|4a|5a|6a|segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)s?(?:\\s*-?\\s*feiras?)?';
// \b e (?![a-z]) garantem palavra inteira: "ter" não casa com "terminal",
// nem "dom" com "Dom Pedro".
const RE_INTERVALO_DIAS = new RegExp(
  `\\b(${PALAVRA_DIA})(?![a-z])\\s*(?:a|à|até|ate|-)\\s*\\b(${PALAVRA_DIA})(?![a-z])`,
  'gi'
);
const RE_DIA_SOLTO = new RegExp(`\\b(${PALAVRA_DIA})(?![a-z])`, 'gi');

/** "7", "00" → "07:00"; "0" ou "24" no fechamento → "24:00". */
function hora(h, m, ehFechamento) {
  let horas = Number(h);
  if (ehFechamento && horas === 0) horas = 24;
  return `${String(horas).padStart(2, '0')}:${m ?? '00'}`;
}

/**
 * Interpreta o texto de horário das fichas oficiais.
 *
 * Devolve { faixas: [{ dias: ['seg',...], abre: '07:00', fecha: '17:00' }],
 *           feriados: 'aberto' | null, vinteQuatroHoras: boolean }
 * ou null quando o texto não informa OS DIAS — sem os dias não dá para
 * calcular "aberto agora" sem chutar (ex.: "das 7:00 às 17:00h").
 */
export function interpretarHorario(texto) {
  if (!texto) return null;
  let t = ` ${normalizar(texto)} `;

  if (/\b24\s*(h|horas)\b|aberto 24/.test(t)) {
    return {
      faixas: [{ dias: [...DIAS], abre: '00:00', fecha: '24:00' }],
      feriados: 'aberto',
      vinteQuatroHoras: true,
    };
  }

  // Corta observações que trazem OUTROS horários (sala de vacina, farmácia, lojas...).
  t = t.split(
    /vacina|farmacia|permanencia|coleta|lojas|administrativo|odontolog|missas|parque aquatico/
  )[0];
  const feriados =
    /feriado/.test(t) && !/fechad[oa]s? (?:aos |nos |em )?feriado/.test(t) ? 'aberto' : null;
  // Expressões que valem por um intervalo de dias.
  t = t
    .replace(/todos os dias/g, ' domingo a sabado ')
    .replace(/(?:aos |nos )?finais? de semana/g, ' sabado a domingo ');

  // 1. Acha os grupos de dias e troca por marcadores §0§, §1§..., para que os
  //    números de "2ª a 6ª" não sejam confundidos com horas.
  const grupos = [];
  t = t.replace(RE_INTERVALO_DIAS, (_, inicio, fim) => {
    const a = numeroDoDia(inicio);
    const b = numeroDoDia(fim);
    if (a === null || b === null) return _;
    const dias = [];
    for (let d = a; ; d = (d + 1) % 7) {
      dias.push(DIAS[d]);
      if (d === b) break;
    }
    grupos.push(dias);
    return ` §${grupos.length - 1}§ `;
  });
  t = t.replace(RE_DIA_SOLTO, (palavra) => {
    const d = numeroDoDia(palavra);
    if (d === null) return palavra;
    grupos.push([DIAS[d]]);
    return ` §${grupos.length - 1}§ `;
  });
  if (grupos.length === 0) return null;

  // 2. Percorre o texto: cada intervalo de horas pertence ao último grupo de
  //    dias visto (ou ao primeiro, se a hora vier antes de qualquer dia).
  const RE_TOKEN =
    /§(\d+)§|(\d{1,2})(?::(\d{2})|h(\d{2})?)?\s*(?:hs?)?\s*(as|ate|a|-|–)\s*(\d{1,2})(?::(\d{2})|h(\d{2})?)?|fechad/g;
  const porGrupo = new Map();
  const fechados = new Set();
  let atual = null;
  let anteriorEraDia = false;
  const absorvidos = new Set();
  const pendentes = [];
  for (const m of t.matchAll(RE_TOKEN)) {
    if (m[1] !== undefined) {
      const novo = Number(m[1]);
      // "sábados e domingos das 9 às 12": dois grupos seguidos, sem hora no
      // meio, dividem o mesmo horário. Junta o anterior no novo.
      if (anteriorEraDia && atual !== null && !fechados.has(atual)) {
        grupos[novo] = [...grupos[atual], ...grupos[novo]];
        absorvidos.add(atual);
      }
      atual = novo;
      anteriorEraDia = true;
      continue;
    }
    anteriorEraDia = false;
    if (m[0] === 'fechad') {
      if (atual !== null) fechados.add(atual);
      continue;
    }
    const [, , h1, m1a, m1b, separador, h2, m2a, m2b] = m;
    const min1 = m1a ?? m1b;
    const min2 = m2a ?? m2b;
    // Hífen só vale como "até" quando os dois lados têm minutos (07:00-17:00).
    if ((separador === '-' || separador === '–') && (min1 === undefined || min2 === undefined))
      continue;
    if (Number(h1) > 24 || Number(h2) > 24) continue;
    const faixa = { abre: hora(h1, min1, false), fecha: hora(h2, min2, true) };
    if (faixa.abre >= faixa.fecha) continue;
    if (atual === null) pendentes.push(faixa);
    else porGrupo.set(atual, [...(porGrupo.get(atual) ?? []), faixa]);
  }
  if (pendentes.length) {
    const primeiro = [...grupos.keys()].find((g) => !fechados.has(g) && !absorvidos.has(g)) ?? 0;
    porGrupo.set(primeiro, [...pendentes, ...(porGrupo.get(primeiro) ?? [])]);
  }

  const faixas = [];
  for (const [g, lista] of porGrupo) {
    if (fechados.has(g) || absorvidos.has(g)) continue;
    for (const f of lista) faixas.push({ dias: grupos[g], ...f });
  }
  if (faixas.length === 0) return null;
  return { faixas, feriados, vinteQuatroHoras: false };
}

const DIAS_OSM = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };

/**
 * Interpreta o formato opening_hours do OpenStreetMap (só o caso simples):
 *   "Mo-Fr 08:00-17:00; Sa 08:00-12:00; PH off"
 * Formatos mais complexos devolvem null (melhor nada do que errado).
 */
export function interpretarHorarioOsm(texto) {
  if (!texto) return null;
  if (texto.trim() === '24/7') return interpretarHorario('24 horas');
  const faixas = [];
  let feriados = null;
  for (const regra of texto
    .split(';')
    .map((r) => r.trim())
    .filter(Boolean)) {
    if (/^PH\s+off$/i.test(regra)) {
      feriados = 'fechado';
      continue;
    }
    const m = regra.match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:[-,](?:Mo|Tu|We|Th|Fr|Sa|Su))*)\s+(.+)$/);
    if (!m) return null;
    const dias = [];
    for (const parte of m[1].split(',')) {
      const [a, b = a] = parte.split('-').map((d) => DIAS_OSM[d]);
      for (let d = a; ; d = (d + 1) % 7) {
        dias.push(DIAS[d]);
        if (d === b) break;
      }
    }
    for (const intervalo of m[2].split(',')) {
      const h = intervalo.trim().match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
      if (!h) return null;
      faixas.push({
        dias,
        abre: `${h[1]}:${h[2]}`,
        fecha: h[3] === '00' ? '24:00' : `${h[3]}:${h[4]}`,
      });
    }
  }
  return faixas.length ? { faixas, feriados, vinteQuatroHoras: false } : null;
}

/* ------------------------------------------------------------------ */
/* Comparação de nomes e geografia                                     */
/* ------------------------------------------------------------------ */

const PALAVRAS_VAZIAS = new Set([
  'emeb',
  'escola',
  'municipal',
  'de',
  'educacao',
  'basica',
  'prof',
  'profa',
  'professor',
  'professora',
  'do',
  'da',
  'dos',
  'das',
  'e',
  'creche',
  'complexo',
  'educacional',
  'dr',
  'dona',
  'dom',
  'a',
  'o',
  'ubs',
  'unidade',
  'saude',
]);

/** Palavras que identificam um nome (sem "EMEB", "Prof.ª" etc.). */
export function palavrasDoNome(nome) {
  return normalizar(nome)
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(' ')
    .filter((p) => p.length > 1 && !PALAVRAS_VAZIAS.has(p));
}

/**
 * Semelhança entre dois nomes (0 a 1): fração das palavras do nome MENOR que
 * aparecem no outro. "EMEB Prof.ª Yolanda Steffen" × "Yolanda Steffen" = 1.
 */
export function semelhancaNomes(a, b) {
  const pa = palavrasDoNome(a);
  const pb = new Set(palavrasDoNome(b));
  if (pa.length === 0 || pb.size === 0) return 0;
  const [menor, maior] = pa.length <= pb.size ? [pa, pb] : [[...pb], new Set(pa)];
  const comuns = menor.filter((p) => maior.has(p)).length;
  return comuns / menor.length;
}

/** Distância em metros entre dois pontos (fórmula de Haversine). */
export function distanciaMetros(a, b) {
  const R = 6371000;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * O ponto está dentro do polígono do município? (algoritmo do "raio": conta
 * quantas vezes uma linha horizontal saindo do ponto cruza a borda).
 * Aceita GeoJSON Polygon ou MultiPolygon (coordenadas em [lng, lat]).
 */
export function dentroDoMunicipio(ponto, geometria) {
  if (!ponto || !geometria) return false;
  const poligonos = geometria.type === 'Polygon' ? [geometria.coordinates] : geometria.coordinates;
  const { lat: y, lng: x } = ponto;
  return poligonos.some(([anel]) => {
    let dentro = false;
    for (let i = 0, j = anel.length - 1; i < anel.length; j = i, i += 1) {
      const [xi, yi] = anel[i];
      const [xj, yj] = anel[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
    }
    return dentro;
  });
}

/* ------------------------------------------------------------------ */
/* Fontes específicas                                                  */
/* ------------------------------------------------------------------ */

/** Tipos do CNES que interessam ao cidadão (código → nome exibido). */
export const TIPOS_CNES = {
  1: 'Posto de saúde',
  2: 'UBS',
  4: 'Policlínica',
  5: 'Hospital',
  7: 'Hospital especializado',
  36: 'Clínica especializada',
  62: 'Hospital Dia',
  70: 'CAPS',
  73: 'Pronto atendimento',
};

/** Natureza jurídica 1xxx = administração pública (no CNES, 1244 = Município). */
export function cnesEhPublico(estabelecimento) {
  return /^1\d{3}$/.test(String(estabelecimento.descricao_natureza_juridica_estabelecimento ?? ''));
}

/** Registro do CNES → campos do modelo de local (só o que o CNES informa). */
export function normalizarCnes(e) {
  const lat = Number(e.latitude_estabelecimento_decimo_grau);
  const lng = Number(e.longitude_estabelecimento_decimo_grau);
  const cep = String(e.codigo_cep_estabelecimento ?? '').replace(/\D/g, '');
  return {
    cnes: String(e.codigo_cnes),
    nome: titulo(e.nome_fantasia),
    tipo: TIPOS_CNES[e.codigo_tipo_unidade] ?? null,
    endereco: {
      logradouro: e.endereco_estabelecimento ? titulo(e.endereco_estabelecimento) : null,
      numero:
        e.numero_estabelecimento && e.numero_estabelecimento !== 'S/N'
          ? e.numero_estabelecimento
          : 's/n',
      // O CNES corta o bairro em 20 caracteres ("NUCLEO HAB BRIGADEIR"): nesse caso não usa.
      bairro:
        e.bairro_estabelecimento && e.bairro_estabelecimento.length < 20
          ? titulo(e.bairro_estabelecimento)
          : null,
      cep: cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : null,
    },
    coordenadas: Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 ? { lat, lng } : null,
    telefones: normalizarTelefones(e.numero_telefone_estabelecimento),
    ativo: !e.codigo_motivo_desabilitacao_estabelecimento,
    publico: cnesEhPublico(e),
    atualizadoNaFonte: e.data_atualizacao ?? null,
  };
}

/** Elemento do Overpass (node/way/relation) → campos do modelo de local. */
export function normalizarOsm(el) {
  const t = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  return {
    osm: `${el.type}/${el.id}`,
    nome: t.name ?? null,
    endereco: t['addr:street']
      ? {
          logradouro: t['addr:street'],
          numero: t['addr:housenumber'] ?? null,
          bairro: t['addr:suburb'] ?? null,
          cep: t['addr:postcode'] ?? null,
        }
      : null,
    coordenadas: lat !== undefined && lng !== undefined ? { lat, lng } : null,
    telefones: normalizarTelefones(t.phone ?? t['contact:phone']),
    horarioOsm: t.opening_hours ?? null,
    site: t.website ?? t['contact:website'] ?? null,
    cadeirante: t.wheelchair ?? null,
  };
}

/** "UBS JD JOAO PIOLI" → "Ubs Jd Joao Pioli" (só para exibir dados que vêm em CAIXA ALTA). */
export function titulo(texto) {
  const minusculas = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);
  const siglas = new Set([
    'UBS',
    'CAPS',
    'UPA',
    'SUS',
    'AD',
    'II',
    'IV',
    'IX',
    'X',
    'XII',
    'VII',
    'V',
    'I',
    'SAE',
    'DR',
    'CEREST',
  ]);
  return (texto ?? '')
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => {
      if (siglas.has(p.toUpperCase()) && p.length <= 6 && !['de', 'da', 'do', 'e'].includes(p)) {
        return p.toUpperCase() === 'DR' ? 'Dr.' : p.toUpperCase();
      }
      if (i > 0 && minusculas.has(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(' ')
    .trim();
}
