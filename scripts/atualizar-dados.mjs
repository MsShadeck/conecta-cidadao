/**
 * atualizar-dados.mjs — Monta os arquivos de dados do site (npm run dados).
 *
 * Junta, nesta ordem de prioridade:
 *   1. a curadoria manual (src/data/curadoria/*.json)        ← sempre vence
 *   2. as fichas oficiais da Prefeitura (scripts/dados/prefeitura-paginas.json,
 *      coletadas por `npm run dados:prefeitura`)
 *   3. o CNES do Ministério da Saúde (unidades de saúde, com coordenadas)
 *   4. o OpenStreetMap via Overpass (coordenadas de escolas, parques, terminais...)
 *   5. o Nominatim, só para achar no mapa o que sobrou (1 req/s, com cache)
 * e grava em public/api/:
 *   locais.json, contatos.json, servicos-online.json, mobilidade.json,
 *   feriados.json, limite-municipio.geojson, pendencias.json,
 *   comercio.json (Dia a dia) e bairros.json (Meu bairro).
 *
 * O site continua lendo tudo com fetch('/api/...'), como na aula de useEffect.
 * Nada é inventado: o que nenhuma fonte informa fica null.
 */

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buscar, buscarCnes, buscarOverpass } from './dados/fontes.mjs';
import {
  chaveLogradouro,
  criarSlug,
  dentroDoMunicipio,
  distanciaMetros,
  interpretarEndereco,
  interpretarHorario,
  interpretarHorarioOsm,
  normalizar,
  normalizarCnes,
  normalizarOsm,
  normalizarTelefones,
  semelhancaNomes,
} from './dados/normalizadores.mjs';

const HOJE = new Date().toISOString().slice(0, 10);
const IBGE_MUNICIPIO = '3520509';
const CNES_MUNICIPIO = '352050'; // a API do CNES usa o código com 6 dígitos
const PASTA_SAIDA = path.resolve('public/api');
const PASTA_CURADORIA = path.resolve('src/data/curadoria');
const URL_CNES = (codigo) => `https://apidadosabertos.saude.gov.br/cnes/estabelecimentos/${codigo}`;
const URL_OSM = (osm) => `https://www.openstreetmap.org/${osm}`;

const lerJson = async (arquivo) => JSON.parse(await readFile(arquivo, 'utf8'));
// compacto = sem espaços: o locais.json é o maior arquivo e quase toda página o baixa.
const gravarJson = (nome, dados, { compacto = false } = {}) =>
  writeFile(path.join(PASTA_SAIDA, nome), `${JSON.stringify(dados, null, compacto ? 0 : 1)}\n`);

/* ------------------------------------------------------------------ */
/* Classificação das fichas da Prefeitura                              */
/* ------------------------------------------------------------------ */

/**
 * Decide categoria e tipo de uma ficha pelo endereço da página.
 * Devolve null para páginas que não são um lugar que a pessoa visita.
 */
export function classificar(pagina) {
  const caminho = pagina.url.replace('https://www.indaiatuba.sp.gov.br', '');
  const slug = caminho.split('/').filter(Boolean).pop();
  const nome = normalizar(pagina.nomeNoMapa ?? pagina.titulo);
  if (slug === 'unidades-escolares') return null; // página-índice, não é uma escola

  if (caminho.startsWith('/saude/atencao-basica/')) {
    if (/^ubs-/.test(slug)) return { categoria: 'saude', tipo: 'UBS' };
    return null; // eMulti e Psicologia são programas, não endereços de atendimento
  }
  if (caminho.startsWith('/saude/assistencia-farmaceutica/')) {
    return { categoria: 'saude', tipo: 'Farmácia municipal' };
  }
  if (caminho.startsWith('/saude/atencao-especializada/')) {
    const tipos = {
      upa: 'Pronto atendimento 24h',
      'caps-ad': 'CAPS',
      'caps-ii': 'CAPS',
      capsij: 'CAPS',
      'hospital-dia': 'Hospital Dia',
      'centro-odontologico': 'Odontologia',
      'especialidades-odontologicas': 'Odontologia',
      'laboratorio-de-analises-clinicas': 'Laboratório',
    };
    if (
      [
        'laboratorio-de-proteses-dentaria',
        'verificacao-de-obitos',
        'central-de-ambulancias',
      ].includes(slug)
    ) {
      return null; // serviços internos, sem atendimento direto ao público
    }
    return { categoria: 'saude', tipo: tipos[slug] ?? 'Especialidades' };
  }
  if (caminho.includes('/ensino-fundamental/ensino-regular/')) {
    if (slug === 'unidades-escolares') return null;
    if (slug === 'apae-indaiatuba')
      return { categoria: 'educacao', tipo: 'Educação especial', nivel: 'Educação especial' };
    if (slug === 'escola-ambiental')
      return { categoria: 'educacao', tipo: 'Educação ambiental', nivel: 'Educação ambiental' };
    return { categoria: 'educacao', tipo: 'EMEB', nivel: 'Ensino fundamental' };
  }
  if (caminho.includes('/educacao-infantil/pre-escola/')) {
    return { categoria: 'educacao', tipo: 'EMEB', nivel: 'Pré-escola' };
  }
  if (caminho.includes('/educacao-infantil/creche/')) {
    return { categoria: 'educacao', tipo: 'Creche', nivel: 'Creche' };
  }
  if (caminho.startsWith('/seguranca/')) {
    return {
      categoria: 'seguranca',
      tipo: slug === 'defesa-civil' ? 'Defesa Civil' : 'Guarda Civil',
    };
  }
  if (caminho.startsWith('/assistencia-social/')) {
    if (/^cras/.test(slug)) return { categoria: 'cidadania', tipo: 'CRAS' };
    if (slug === 'creas') return { categoria: 'cidadania', tipo: 'CREAS' };
    if (/conselho-tutelar/.test(slug)) return { categoria: 'cidadania', tipo: 'Conselho Tutelar' };
    return { categoria: 'cidadania', tipo: 'Assistência social' };
  }
  if (caminho.endsWith('/pat/')) return { categoria: 'cidadania', tipo: 'Trabalho e emprego' };
  if (caminho.includes('/turismo/pontos-turisticos/')) {
    let tipo = 'Ponto turístico';
    if (/parque|bosque|nascente/.test(nome)) tipo = 'Parque';
    else if (/museu|casarao/.test(nome)) tipo = 'Museu';
    else if (/teatro|cultural|criarte|estacao/.test(nome)) tipo = 'Cultura';
    else if (/igreja|santuario|mosteiro|paroquia|colonia/.test(nome)) tipo = 'Patrimônio religioso';
    else if (/velodromo|esportivo|rota dos cavaleiros/.test(nome)) tipo = 'Esporte';
    else if (/cemiterio/.test(nome)) tipo = 'Patrimônio histórico';
    return { categoria: 'lazer', tipo };
  }
  if (caminho.startsWith('/cultura/administrativo/')) {
    return { categoria: 'lazer', tipo: slug === 'biblioteca' ? 'Biblioteca' : 'Cultura' };
  }
  if (caminho.startsWith('/esportes/nucleos-esportivos/'))
    return { categoria: 'lazer', tipo: 'Esporte' };
  if (caminho.startsWith('/mobilidade-urbana/terminais-de-transporte-publico/')) {
    if (slug === 'ponto-cidadao') return null; // tratado na curadoria (Ponto Cidadão + Terminal Central)
    return { categoria: 'mobilidade', tipo: 'Terminal rodoviário' };
  }
  if (caminho.startsWith('/mobilidade-urbana/transportes/transporte-coletivo/')) {
    return { categoria: 'mobilidade', tipo: 'Atendimento' };
  }
  return null;
}

/** Palavras que a busca deve reconhecer, conforme o tipo do local. */
const PALAVRAS_POR_TIPO = {
  UBS: [
    'posto de saúde',
    'postinho',
    'vacina',
    'vacinação',
    'consulta',
    'cartão sus',
    'médico',
    'dentista',
  ],
  'Pronto atendimento 24h': ['pronto socorro', 'urgência', 'emergência', '24 horas', 'upa'],
  Hospital: ['hospital', 'pronto socorro', 'internação'],
  CAPS: ['saúde mental', 'psicólogo', 'psiquiatra', 'álcool', 'drogas'],
  'Farmácia municipal': ['remédio', 'medicamento', 'farmácia'],
  Odontologia: ['dentista', 'odontologia'],
  Laboratório: ['exame de sangue', 'coleta', 'laboratório'],
  EMEB: ['escola', 'matrícula', 'vaga', 'ensino fundamental', 'pré-escola'],
  Creche: ['creche', 'berçário', 'educação infantil', 'matrícula', 'vaga'],
  'Guarda Civil': ['guarda', 'segurança', '153'],
  'Defesa Civil': ['enchente', 'alagamento', 'árvore caída', 'chuva', '199'],
  CRAS: ['assistência social', 'cadastro único', 'cadúnico', 'bolsa família', 'benefício'],
  CREAS: ['violência', 'violação de direitos', 'assistência social'],
  'Conselho Tutelar': ['criança', 'adolescente', 'direitos da criança'],
  'Trabalho e emprego': [
    'emprego',
    'vaga de emprego',
    'currículo',
    'seguro desemprego',
    'carteira de trabalho',
  ],
  Parque: ['parque', 'passeio', 'caminhada', 'lazer', 'piquenique'],
  'Ensino superior': ['faculdade', 'universidade', 'graduação', 'curso superior', 'vestibular'],
  'Ensino técnico': ['curso técnico', 'curso profissionalizante', 'qualificação profissional'],
  Shopping: ['shopping', 'compras', 'lojas'],
  Museu: ['museu', 'passeio', 'história'],
  Esporte: ['esporte', 'quadra', 'academia', 'futebol'],
  Biblioteca: ['livros', 'leitura', 'biblioteca'],
  'Terminal de ônibus': ['ônibus', 'terminal', 'transporte'],
  'Terminal rodoviário': ['rodoviária', 'ônibus intermunicipal', 'viagem'],
};

/* ------------------------------------------------------------------ */
/* Auxiliares de cruzamento                                            */
/* ------------------------------------------------------------------ */

/** A rua é a mesma? Compara as palavras significativas do nome da rua. */
function mesmaRua(a, b) {
  if (!a?.logradouro || !b?.logradouro) return false;
  const ka = chaveLogradouro(a.logradouro);
  const kb = new Set(chaveLogradouro(b.logradouro));
  if (ka.length === 0 || kb.size === 0) return false;
  return ka.filter((p) => kb.has(p)).length / Math.min(ka.length, kb.size) >= 0.6;
}

/** Mesmo endereço? Mesma rua e mesmo número. */
function mesmoEndereco(a, b) {
  if (!mesmaRua(a, b)) return false;
  const na = String(a.numero ?? '').replace(/\D/g, '');
  const nb = String(b.numero ?? '').replace(/\D/g, '');
  return na !== '' && na === nb;
}

/**
 * Registro do CNES que corresponde a uma ficha de saúde: mesmo endereço, ou
 * mesma rua com nome muito parecido (cobre os "s/n" e números divergentes,
 * como "UBS V Itaici": s/n na Prefeitura e nº 11 no CNES).
 */
function registroCnes(local, cnes) {
  if (local.cnes) return cnes.find((e) => e.cnes === local.cnes);
  const publicos = cnes.filter((e) => e.publico);
  return (
    publicos.find((e) => mesmoEndereco(e.endereco, local.endereco)) ??
    publicos.find(
      (e) =>
        mesmaRua(e.endereco, local.endereco) &&
        Math.max(
          semelhancaNomes(e.nome, local.nome),
          semelhancaNomes(e.nome, local.nomeAlternativo ?? '')
        ) >= 0.85
    )
  );
}

/** Categorias do OSM que podem corresponder a cada categoria do site. */
const OSM_POR_CATEGORIA = {
  saude: ['clinic', 'hospital', 'doctors'],
  educacao: ['school', 'kindergarten'],
  seguranca: ['police', 'fire_station'],
  lazer: [
    'park',
    'museum',
    'sports_centre',
    'stadium',
    'attraction',
    'library',
    'community_centre',
    'theatre',
  ],
  cidadania: ['townhall', 'government', 'social_facility', 'community_centre'],
  mobilidade: ['bus_station'],
};

function melhorOsm(local, candidatos) {
  let melhor = null;
  for (const osm of candidatos) {
    if (!osm.nome || !OSM_POR_CATEGORIA[local.categoria]?.includes(osm.classe)) continue;
    const nota = Math.max(
      semelhancaNomes(local.nome, osm.nome),
      local.nomeAlternativo ? semelhancaNomes(local.nomeAlternativo, osm.nome) : 0
    );
    // Exige nome bem parecido E pelo menos duas palavras em comum (ou nome curto idêntico).
    const iguais = normalizar(local.nome) === normalizar(osm.nome);
    if ((nota >= 0.85 || iguais) && (!melhor || nota > melhor.nota)) melhor = { osm, nota };
  }
  return melhor?.osm ?? null;
}

/* ------------------------------------------------------------------ */
/* Geocodificação (Nominatim, último recurso)                          */
/* ------------------------------------------------------------------ */

/**
 * Tenta, em ordem: rua + número (busca estruturada), só a rua, e a busca livre
 * "Rua X, Indaiatuba". Para no primeiro resultado que caia DENTRO do município.
 * Sem o número da casa, o ponto é o meio da rua: fica marcado como aproximado.
 */
async function geocodificar(endereco, limite) {
  if (!endereco?.logradouro) return null;
  const base =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&countrycodes=br';
  const cidade = `&city=Indaiatuba&state=${encodeURIComponent('São Paulo')}`;
  const temNumero = endereco.numero && endereco.numero !== 's/n';
  const tentativas = [
    ...(temNumero
      ? [
          `${base}&street=${encodeURIComponent(`${endereco.numero} ${endereco.logradouro}`)}${cidade}`,
        ]
      : []),
    `${base}&street=${encodeURIComponent(endereco.logradouro)}${cidade}`,
    `${base}&q=${encodeURIComponent(`${endereco.logradouro}, Indaiatuba, SP`)}`,
  ];
  for (const url of tentativas) {
    let resultado;
    try {
      [resultado] = (await buscar(url)) ?? [];
    } catch (erro) {
      console.warn(`  Nominatim falhou para "${endereco.logradouro}": ${erro.message}`);
      return null;
    }
    if (!resultado) continue;
    const ponto = { lat: Number(resultado.lat), lng: Number(resultado.lon) };
    if (!dentroDoMunicipio(ponto, limite)) continue;
    return {
      ...ponto,
      aproximada: !resultado.address?.house_number,
      fonte: 'nominatim',
      bairro: resultado.address?.suburb ?? resultado.address?.neighbourhood ?? null,
      cep: resultado.address?.postcode ?? null,
    };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Programa principal                                                  */
/* ------------------------------------------------------------------ */

async function main() {
  await mkdir(PASTA_SAIDA, { recursive: true });

  // 1. Contorno do município (IBGE): desenha a cidade e filtra pontos fora dela.
  console.log('IBGE: contorno do município...');
  const malha = await buscar(
    `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${IBGE_MUNICIPIO}?formato=application/vnd.geo+json`
  );
  const limite = malha.features[0].geometry;
  await writeFile(
    path.join(PASTA_SAIDA, 'limite-municipio.geojson'),
    JSON.stringify({
      ...malha,
      atualizadoEm: HOJE,
      fonte: `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${IBGE_MUNICIPIO}`,
    })
  );

  // 2. CNES (todas as páginas; ~45 requisições, com cache de 1 dia).
  console.log('CNES: estabelecimentos de saúde...');
  const cnes = (await buscarCnes(CNES_MUNICIPIO)).map(normalizarCnes).filter((e) => e.ativo);
  console.log(`  ${cnes.length} estabelecimentos ativos`);

  // 3. OpenStreetMap (uma consulta só).
  console.log('Overpass: lugares do OpenStreetMap...');
  const consulta = `[out:json][timeout:120];
area["boundary"="administrative"]["admin_level"="8"]["name"="Indaiatuba"]->.a;
(
  nwr["amenity"~"^(school|kindergarten|police|fire_station|townhall|bus_station|bicycle_rental|library|community_centre|social_facility|clinic|hospital|doctors|theatre|university|college)$"](area.a);
  nwr["shop"="mall"]["name"](area.a);
  nwr["leisure"~"^(park|sports_centre|stadium)$"]["name"](area.a);
  nwr["tourism"~"^(museum|attraction)$"](area.a);
  nwr["office"="government"](area.a);
);
out tags center;`;
  const overpass = await buscarOverpass(consulta);
  const osm = overpass.elements.map((el) => ({
    ...normalizarOsm(el),
    classe: el.tags.amenity ?? el.tags.leisure ?? el.tags.tourism ?? el.tags.office ?? el.tags.shop,
  }));
  console.log(`  ${osm.length} elementos`);

  // 4. Fichas oficiais da Prefeitura + curadoria.
  const prefeitura = await lerJson('scripts/dados/prefeitura-paginas.json');
  const curadoria = {};
  for (const arquivo of await readdir(PASTA_CURADORIA)) {
    if (arquivo.endsWith('.json')) {
      curadoria[arquivo.replace('.json', '')] = await lerJson(path.join(PASTA_CURADORIA, arquivo));
    }
  }
  const ajustes = new Map();
  const ignorar = new Set();
  const pendentes = [];
  for (const [categoria, c] of Object.entries(curadoria)) {
    for (const ajuste of c.ajustes ?? []) ajustes.set(ajuste.origem, ajuste);
    for (const url of c.ignorar ?? []) ignorar.add(url);
    for (const p of c.pendentes ?? []) pendentes.push({ categoria, ...p });
  }

  const locais = [];

  // 4a. Uma entrada por ficha classificada.
  for (const pagina of prefeitura.paginas) {
    if (ignorar.has(pagina.url)) continue;
    const classe = classificar(pagina);
    if (!classe) continue;
    const ajuste = ajustes.get(pagina.url) ?? {};
    const endereco = interpretarEndereco(ajuste.endereco ?? pagina.endereco);
    locais.push({
      id: ajuste.id ?? null,
      nome: ajuste.nome ?? pagina.nomeNoMapa ?? pagina.titulo,
      nomeAlternativo: pagina.titulo,
      categoria: classe.categoria,
      tipo: ajuste.tipo ?? classe.tipo,
      niveis: classe.nivel ? [classe.nivel] : undefined,
      endereco,
      enderecoTexto: ajuste.endereco ?? pagina.endereco ?? null,
      telefones: ajuste.telefones ?? normalizarTelefones(pagina.telefone),
      horarioTexto: pagina.horario ?? null,
      servicos: pagina.servicos ?? [],
      site:
        pagina.site && !pagina.site.endsWith(':')
          ? `https://${pagina.site.replace(/^https?:\/\//, '')}`
          : null,
      entrada: pagina.entrada ?? null,
      imagem: ajuste.imagem ?? null,
      observacao: ajuste.observacao ?? null,
      fonte: [pagina.url, ...(ajuste.fonteExtra ?? [])],
      atualizadoEm: prefeitura.coletadoEm,
      palavrasChave: ajuste.palavrasChave ?? [],
    });
  }

  // 4b. Escolas com ficha de pré-escola E de fundamental: vira um local só.
  const unidos = [];
  for (const local of locais) {
    const igual =
      local.categoria === 'educacao' &&
      unidos.find(
        (outro) =>
          outro.categoria === 'educacao' &&
          (mesmoEndereco(outro.endereco, local.endereco) ||
            normalizar(outro.nomeAlternativo) === normalizar(local.nomeAlternativo)) &&
          semelhancaNomes(outro.nome, local.nome) >= 0.8
      );
    if (!igual) {
      unidos.push(local);
      continue;
    }
    // Junta níveis, fontes e o que faltar; o nome "EMEB ..." vence o "Creche ...".
    igual.niveis = [...new Set([...(igual.niveis ?? []), ...(local.niveis ?? [])])];
    igual.fonte = [...new Set([...igual.fonte, ...local.fonte])];
    igual.id ??= local.id;
    igual.imagem ??= local.imagem;
    if (!igual.endereco?.numero && local.endereco?.numero) {
      igual.endereco = local.endereco;
      igual.enderecoTexto = local.enderecoTexto;
    }
    if (!igual.endereco?.bairro && local.endereco?.bairro)
      igual.endereco.bairro = local.endereco.bairro;
    if (igual.telefones.length === 0) igual.telefones = local.telefones;
    if (local.horarioTexto && local.horarioTexto !== igual.horarioTexto) {
      igual.horarioTexto = igual.horarioTexto
        ? `${igual.horarioTexto} · ${local.horarioTexto}`
        : local.horarioTexto;
    }
    if (/^EMEB/i.test(local.nome) && !/^EMEB/i.test(igual.nome)) igual.nome = local.nome;
    if (
      igual.niveis.length > 1 ||
      igual.niveis.includes('Ensino fundamental') ||
      igual.niveis.includes('Pré-escola')
    ) {
      igual.tipo = 'EMEB';
    }
  }

  // 4c. Extras da curadoria (locais sem ficha na Prefeitura).
  for (const [categoria, c] of Object.entries(curadoria)) {
    for (const extra of c.extras ?? []) {
      unidos.push({
        ...extra,
        categoria,
        endereco: extra.endereco
          ? { ...interpretarEndereco(extra.endereco), cep: extra.cep ?? null }
          : null,
        enderecoTexto: extra.endereco ?? null,
        telefones: extra.telefones ?? [],
        // Lista de telefones escrita na curadoria (mesmo vazia) não é completada pelo OSM.
        telefonesDaCuradoria: Array.isArray(extra.telefones),
        servicos: extra.servicos ?? [],
        site: extra.site ?? null,
        imagem: extra.imagem ?? null,
        observacao: extra.observacao ?? null,
        palavrasChave: extra.palavrasChave ?? [],
        atualizadoEm: HOJE,
      });
    }
  }

  // 5. Coordenadas, CEP e o que faltar, na ordem: CNES → OSM → Nominatim.
  console.log('Cruzando com CNES e OSM e localizando no mapa...');
  let geocodificados = 0;
  for (const local of unidos) {
    // 5a. CNES (só saúde): por código, ou por endereço igual.
    if (local.categoria === 'saude') {
      const registro = registroCnes(local, cnes);
      if (registro) {
        local.cnes = registro.cnes;
        local.coordenadas ??= registro.coordenadas
          ? { ...registro.coordenadas, aproximada: false, fonte: 'cnes' }
          : null;
        local.endereco ??= registro.endereco;
        if (local.endereco && !local.endereco.cep) local.endereco.cep = registro.endereco.cep;
        if (local.endereco && !local.endereco.bairro)
          local.endereco.bairro = registro.endereco.bairro;
        if (!local.enderecoTexto && registro.endereco.logradouro) {
          local.enderecoTexto = `${registro.endereco.logradouro}, ${registro.endereco.numero} - ${registro.endereco.bairro}`;
        }
        if (local.telefones.length === 0) local.telefones = registro.telefones;
        local.tipo ??= registro.tipo;
        const url = URL_CNES(registro.cnes);
        if (!local.fonte?.includes(url)) local.fonte = [...(local.fonte ?? []), url];
      }
    }

    // 5b. OSM: pelo nome indicado na curadoria ou por semelhança de nome.
    const candidato = local.osm
      ? osm.find((o) => o.nome && normalizar(o.nome) === normalizar(local.osm))
      : !local.coordenadas
        ? melhorOsm(local, osm)
        : null;
    if (candidato?.coordenadas) {
      local.coordenadas ??= { ...candidato.coordenadas, aproximada: false, fonte: 'osm' };
      if (!local.endereco && candidato.endereco) {
        local.endereco = candidato.endereco;
        local.enderecoTexto = `${candidato.endereco.logradouro}${candidato.endereco.numero ? `, ${candidato.endereco.numero}` : ''}`;
      }
      if (local.telefones.length === 0 && !local.telefonesDaCuradoria)
        local.telefones = candidato.telefones;
      if (local.usarHorarioOsm && candidato.horarioOsm) {
        local.horarioTexto = candidato.horarioOsm;
        local.horarios = interpretarHorarioOsm(candidato.horarioOsm);
      }
      local.site ??= candidato.site;
      local.osmId = candidato.osm; // usado abaixo para achar fichas duplicadas
      const url = URL_OSM(candidato.osm);
      local.fonte = [
        ...(local.fonte ?? []).filter((f) => f !== 'https://www.openstreetmap.org/'),
        url,
      ];
    }
    delete local.osm;
    delete local.usarHorarioOsm;

    // 5c. Nominatim: último recurso, a partir do endereço da ficha.
    if (!local.coordenadas && local.endereco?.logradouro) {
      const ponto = await geocodificar(local.endereco, limite);
      geocodificados += 1;
      if (ponto) {
        local.coordenadas = {
          lat: ponto.lat,
          lng: ponto.lng,
          aproximada: ponto.aproximada,
          fonte: 'nominatim',
        };
        if (!local.endereco.bairro && ponto.bairro) local.endereco.bairro = ponto.bairro;
        if (!local.endereco.cep && ponto.cep && /^\d{5}-?\d{3}$/.test(ponto.cep)) {
          local.endereco.cep = ponto.cep.includes('-')
            ? ponto.cep
            : `${ponto.cep.slice(0, 5)}-${ponto.cep.slice(5)}`;
        }
      }
    }
  }
  console.log(`  Nominatim consultado para ${geocodificados} endereços (cache de 1 dia)`);

  // 5d. O mesmo lugar com duas fichas (ex.: "Velódromo Municipal" no Turismo e
  //     no Esporte) cai no mesmo elemento do OSM: fica só um, com as duas fontes.
  for (const local of unidos) {
    if (!local.osmId || local.duplicado) continue;
    for (const outro of unidos) {
      if (outro === local || outro.duplicado || outro.osmId !== local.osmId) continue;
      if (outro.categoria !== local.categoria || semelhancaNomes(outro.nome, local.nome) < 0.8)
        continue;
      outro.duplicado = true;
      local.fonte = [...new Set([...local.fonte, ...outro.fonte])];
      if (local.telefones.length === 0) local.telefones = outro.telefones;
      local.horarioTexto ??= outro.horarioTexto;
      local.imagem ??= outro.imagem;
      local.id ??= outro.id;
      if (!local.endereco?.numero && outro.endereco?.numero) {
        local.endereco = outro.endereco;
        local.enderecoTexto = outro.enderecoTexto;
      }
    }
  }

  // 6. Acabamento: horário estruturado, palavras-chave, id único, campos ausentes = null.
  const ids = new Set();
  const finais = [];
  for (const local of unidos) {
    if (local.duplicado) continue;
    const outraCidade = /\b(campinas|itupeva|salto|elias fausto|monte mor)\b/i.test(
      local.enderecoTexto ?? ''
    );
    if (outraCidade || (local.coordenadas && !dentroDoMunicipio(local.coordenadas, limite))) {
      // Fora de Indaiatuba (ex.: Colônia Alemã fica em Campinas): não entra.
      pendentes.push({
        categoria: local.categoria,
        nome: local.nome,
        motivo: 'Fica fora do município de Indaiatuba.',
      });
      continue;
    }
    let id = local.id ?? criarSlug(local.nome);
    while (ids.has(id)) id = `${id}-2`;
    ids.add(id);

    const horario =
      local.horarios ??
      (local.vinteQuatroHoras
        ? interpretarHorario('24 horas')
        : interpretarHorario(local.horarioTexto));
    finais.push({
      id,
      nome: local.nome,
      categoria: local.categoria,
      tipo: local.tipo ?? null,
      ...(local.niveis?.length ? { niveis: local.niveis } : {}),
      endereco: local.endereco
        ? {
            logradouro: local.endereco.logradouro ?? null,
            numero: local.endereco.numero ?? null,
            bairro: local.endereco.bairro ?? null,
            cep: local.endereco.cep ?? null,
          }
        : null,
      enderecoTexto: local.enderecoTexto ?? null,
      coordenadas: local.coordenadas ?? null,
      telefones: local.telefones ?? [],
      horarios: horario,
      horarioTexto: local.horarioTexto ?? null,
      servicos: local.servicos ?? [],
      palavrasChave: [
        ...new Set([...(local.palavrasChave ?? []), ...(PALAVRAS_POR_TIPO[local.tipo] ?? [])]),
      ],
      site: local.site ?? null,
      entrada: local.entrada ?? null,
      imagem: local.imagem ?? null,
      observacao: local.observacao ?? null,
      ...(local.cnes ? { cnes: local.cnes } : {}),
      acessibilidade: { rampa: null, banheiroAdaptado: null },
      fonte: [...new Set(local.fonte ?? [])],
      atualizadoEm: local.atualizadoEm ?? HOJE,
    });
  }

  // Avisa no terminal se algum ajuste da curadoria não encontrou a ficha.
  const urls = new Set(prefeitura.paginas.map((p) => p.url));
  for (const origem of ajustes.keys()) {
    if (!urls.has(origem)) console.warn(`  ATENÇÃO: ajuste sem ficha correspondente: ${origem}`);
  }

  finais.sort(
    (a, b) => a.categoria.localeCompare(b.categoria) || a.nome.localeCompare(b.nome, 'pt-BR')
  );
  const fontes = [
    {
      nome: 'Prefeitura de Indaiatuba (fichas das unidades)',
      url: 'https://www.indaiatuba.sp.gov.br/',
      consultadoEm: prefeitura.coletadoEm,
    },
    {
      nome: 'CNES – Ministério da Saúde',
      url: 'https://apidadosabertos.saude.gov.br/',
      consultadoEm: HOJE,
    },
    {
      nome: '© OpenStreetMap contributors (ODbL)',
      url: 'https://www.openstreetmap.org/copyright',
      consultadoEm: HOJE,
    },
    { nome: 'Nominatim (geocodificação OSM)', url: 'https://nominatim.org/', consultadoEm: HOJE },
    {
      nome: 'IBGE – Malha municipal',
      url: 'https://servicodados.ibge.gov.br/api/docs/malhas',
      consultadoEm: HOJE,
    },
  ];
  await gravarJson(
    'locais.json',
    { atualizadoEm: HOJE, fontes, locais: finais },
    { compacto: true }
  );
  await gravarJson('pendencias.json', { atualizadoEm: HOJE, pendencias: pendentes });

  // 7. Ecobike: estações do OSM (posições) + regras da página oficial (curadoria).
  // 8. Feriados, contatos e serviços online: ver funções abaixo.
  await gerarFeriados();
  await gerarArquivosCurados();
  await gerarMobilidade(osm, limite);
  await gerarComercio(limite);
  await gerarBairros(limite);
  await gerarCidade();

  // Resumo no terminal.
  const resumo = {};
  for (const l of finais) {
    resumo[l.categoria] ??= {
      locais: 0,
      comCoordenadas: 0,
      aproximadas: 0,
      comHorarioEstruturado: 0,
    };
    resumo[l.categoria].locais += 1;
    if (l.coordenadas) resumo[l.categoria].comCoordenadas += 1;
    if (l.coordenadas?.aproximada) resumo[l.categoria].aproximadas += 1;
    if (l.horarios) resumo[l.categoria].comHorarioEstruturado += 1;
  }
  console.table(resumo);
  console.log(`Pendências (não publicadas): ${pendentes.length} → public/api/pendencias.json`);
}

// Códigos IBGE dos municípios: Indaiatuba e São Paulo (para a comparação).
const MUNICIPIOS_IBGE = { indaiatuba: '3520509', saoPaulo: '3550308' };

/**
 * Conheça Indaiatuba: números do IBGE (API de agregados do SIDRA) + fatos da
 * curadoria (extras/cidade.json). Cada número leva o ano e a fonte.
 *  - tabela 4714 (Censo 2022): população (93), área em km² (6318), densidade (614);
 *  - tabela 6579: população estimada (9324), último ano publicado.
 */
async function gerarCidade() {
  const ids = Object.values(MUNICIPIOS_IBGE).join(',');
  const base = 'https://servicodados.ibge.gov.br/api/v3/agregados';
  const censo = await buscar(`${base}/4714/periodos/2022/variaveis/93|6318|614?localidades=N6[${ids}]`);
  const estimativa = await buscar(`${base}/6579/periodos/-1/variaveis/9324?localidades=N6[${ids}]`);

  /** Valor de uma variável para um município: { valor, ano }. */
  const valor = (respostas, variavel, codigo) => {
    const v = respostas.find((r) => r.id === String(variavel));
    const serie = v?.resultados[0].series.find((s) => s.localidade.id === codigo)?.serie ?? {};
    const [ano, texto] = Object.entries(serie)[0] ?? [];
    return ano ? { valor: Number(texto), ano: Number(ano) } : null;
  };
  const numeros = (codigo) => ({
    populacaoEstimada: valor(estimativa, 9324, codigo),
    populacaoCenso: valor(censo, 93, codigo),
    areaKm2: valor(censo, 6318, codigo),
    densidade: valor(censo, 614, codigo),
  });

  const curadoria = await lerJson(path.join(PASTA_CURADORIA, 'extras', 'cidade.json'));
  delete curadoria._comentario;
  await gravarJson('cidade.json', {
    atualizadoEm: HOJE,
    ibge: {
      indaiatuba: numeros(MUNICIPIOS_IBGE.indaiatuba),
      saoPaulo: numeros(MUNICIPIOS_IBGE.saoPaulo),
      fontes: [
        { nome: 'IBGE – Censo 2022 (tabela 4714)', url: 'https://sidra.ibge.gov.br/tabela/4714' },
        { nome: 'IBGE – Estimativas de população (tabela 6579)', url: 'https://sidra.ibge.gov.br/tabela/6579' },
      ],
    },
    ...curadoria,
  });
  console.log('cidade.json: números do IBGE e', curadoria.diferencas.length, 'diferenças');
}

/** Feriados nacionais (BrasilAPI) + municipais da curadoria (com fonte). */
async function gerarFeriados() {
  const ano = Number(HOJE.slice(0, 4));
  const municipais = await lerJson(
    path.join(PASTA_CURADORIA, 'extras', 'feriados-municipais.json')
  );
  const feriados = [];
  for (const a of [ano, ano + 1]) {
    for (const f of await buscar(`https://brasilapi.com.br/api/feriados/v1/${a}`)) {
      // A BrasilAPI chama tudo de "national"; aqui corrigimos com a curadoria:
      // Carnaval é ponto facultativo e Corpus Christi é feriado municipal em Indaiatuba.
      let tipo = 'nacional';
      if (municipais.pontosFacultativos.includes(f.name)) tipo = 'ponto facultativo';
      else if (municipais.municipaisMoveis.includes(f.name)) tipo = 'municipal';
      feriados.push({
        data: f.date,
        nome: f.name,
        tipo,
        fonte: `https://brasilapi.com.br/api/feriados/v1/${a}`,
      });
    }
  }
  for (const f of municipais.feriados) {
    for (const a of [ano, ano + 1]) {
      if (f.dataFixa)
        feriados.push({
          data: `${a}-${f.dataFixa}`,
          nome: f.nome,
          tipo: 'municipal',
          fonte: f.fonte,
        });
    }
  }
  feriados.sort((a, b) => a.data.localeCompare(b.data));
  await gravarJson('feriados.json', {
    atualizadoEm: HOJE,
    observacao: municipais._comentario,
    feriados,
  });
}

/** Contatos e serviços online: só copiam a curadoria, carimbando a data. */
async function gerarArquivosCurados() {
  for (const nome of ['contatos', 'servicos-online', 'checklist']) {
    const dados = await lerJson(path.join(PASTA_CURADORIA, 'extras', `${nome}.json`));
    delete dados._comentario;
    await gravarJson(`${nome}.json`, { atualizadoEm: HOJE, ...dados });
  }
}

/** Dados da página Mobilidade: terminais, Ecobike (posições OSM) e links oficiais. */
async function gerarMobilidade(osm, limite) {
  const base = await lerJson(path.join(PASTA_CURADORIA, 'extras', 'mobilidade.json'));
  delete base._comentario;
  const estacoesEcobike = osm
    .filter(
      (o) =>
        o.classe === 'bicycle_rental' && o.coordenadas && dentroDoMunicipio(o.coordenadas, limite)
    )
    .map((o) => ({
      nome: o.nome ?? 'Ecobike',
      coordenadas: o.coordenadas,
      fonte: URL_OSM(o.osm),
    }));
  // Junta estações muito próximas (mesmo ponto mapeado duas vezes).
  const unicas = estacoesEcobike.filter(
    (e, i) =>
      !estacoesEcobike.slice(0, i).some((o) => distanciaMetros(o.coordenadas, e.coordenadas) < 30)
  );
  await gravarJson('mobilidade.json', {
    atualizadoEm: HOJE,
    ...base,
    ecobike: { ...base.ecobike, estacoesNoMapa: unicas },
  });
}


/* ------------------------------------------------------------------ */
/* Dia a dia: comércio do OpenStreetMap                                */
/* ------------------------------------------------------------------ */

/** Tipo de estabelecimento do OSM → nome exibido e grupo do filtro. */
const TIPOS_COMERCIO = {
  'shop=supermarket': ['Mercado', 'mercados'],
  'shop=convenience': ['Mercearia / conveniência', 'mercados'],
  'shop=butcher': ['Açougue', 'mercados'],
  'shop=greengrocer': ['Hortifrúti', 'mercados'],
  'shop=bakery': ['Padaria', 'padarias'],
  'amenity=pharmacy': ['Farmácia', 'farmacias'],
  'amenity=restaurant': ['Restaurante', 'restaurantes'],
  'amenity=cafe': ['Café', 'restaurantes'],
  'amenity=fast_food': ['Lanchonete', 'restaurantes'],
  'amenity=bank': ['Banco', 'servicos'],
  'shop=lottery': ['Lotérica', 'servicos'],
  'amenity=post_office': ['Correios', 'servicos'],
  'amenity=fuel': ['Posto de combustível', 'servicos'],
};

/**
 * Comércio do dia a dia, só do OpenStreetMap (dados colaborativos, ODbL),
 * consultado UMA vez no build (nunca a cada visita), mais a curadoria
 * (feiras com fonte oficial). Sem nota, ranking nem destaque.
 */
async function gerarComercio(limite) {
  const consulta = `[out:json][timeout:120];
area["boundary"="administrative"]["admin_level"="8"]["name"="Indaiatuba"]->.a;
(
  nwr["shop"~"^(supermarket|convenience|bakery|butcher|greengrocer|lottery)$"]["name"](area.a);
  nwr["amenity"~"^(restaurant|cafe|fast_food|pharmacy|fuel|bank|post_office)$"]["name"](area.a);
);
out tags center;`;
  const resposta = await buscarOverpass(consulta);
  const itens = [];
  for (const el of resposta.elements) {
    const t = el.tags;
    const chave = t.shop ? `shop=${t.shop}` : `amenity=${t.amenity}`;
    const [tipo, grupo] = TIPOS_COMERCIO[chave] ?? [];
    const base = normalizarOsm(el);
    if (!tipo || !base.nome || !base.coordenadas || !dentroDoMunicipio(base.coordenadas, limite)) continue;
    const endereco = base.endereco
      ? { ...base.endereco, bairro: base.endereco.bairro ?? null, cep: base.endereco.cep ?? null }
      : null;
    itens.push({
      id: `osm-${el.type}-${el.id}`,
      nome: base.nome,
      tipo,
      grupo,
      endereco,
      enderecoTexto: endereco
        ? [endereco.logradouro, endereco.numero].filter(Boolean).join(', ') +
          (endereco.bairro ? ` - ${endereco.bairro}` : '')
        : null,
      coordenadas: base.coordenadas,
      telefones: base.telefones,
      horarios: interpretarHorarioOsm(base.horarioOsm),
      horarioTexto: base.horarioOsm,
      site: base.site,
      osm: base.osm,
      fonte: [URL_OSM(base.osm)],
      atualizadoEm: HOJE,
    });
  }

  // Curadoria: feiras e mercados com fonte oficial (ex.: Ponto Verde).
  const curados = await lerJson(path.join(PASTA_CURADORIA, 'extras', 'comercio.json'));
  for (const extra of curados.itens) {
    const endereco = { ...interpretarEndereco(extra.endereco), cep: extra.cep ?? null };
    const ponto = extra.coordenadas ?? (await geocodificar(endereco, limite));
    itens.push({
      id: extra.id,
      nome: extra.nome,
      tipo: extra.tipo,
      grupo: extra.grupo,
      endereco,
      enderecoTexto: extra.endereco,
      coordenadas: ponto ? { lat: ponto.lat, lng: ponto.lng } : null,
      telefones: extra.telefones ?? [],
      horarios: extra.horarios ?? null,
      horarioTexto: extra.horarioTexto ?? null,
      site: extra.site ?? null,
      osm: null,
      observacao: extra.observacao ?? null,
      fonte: extra.fonte,
      atualizadoEm: HOJE,
    });
  }

  itens.sort((a, b) => a.grupo.localeCompare(b.grupo) || a.nome.localeCompare(b.nome, 'pt-BR'));
  await gravarJson(
    'comercio.json',
    {
      atualizadoEm: HOJE,
      aviso: 'Dados colaborativos. Horários de estabelecimentos podem mudar.',
      credito: '© OpenStreetMap contributors (ODbL)',
      grupos: [
        { id: 'mercados', nome: 'Mercados' },
        { id: 'padarias', nome: 'Padarias' },
        { id: 'farmacias', nome: 'Farmácias' },
        { id: 'restaurantes', nome: 'Restaurantes e lanches' },
        { id: 'feiras', nome: 'Feiras' },
        { id: 'servicos', nome: 'Bancos, lotéricas e postos' },
      ],
      feirasLivres: curados.feirasLivres,
      itens,
    },
    { compacto: true }
  );
  console.log(`  Dia a dia: ${itens.length} estabelecimentos`);
}

/* ------------------------------------------------------------------ */
/* Meu bairro: bairros do OpenStreetMap + coleta de lixo               */
/* ------------------------------------------------------------------ */

/** "Jd. Monte Verde" → "jardim monte verde" (para comparar com a tabela da coleta). */
export function expandirAbreviacoes(nome) {
  return normalizar(nome)
    .replace(/\bjd\.?\s/g, 'jardim ')
    .replace(/\bvl\.?\s/g, 'vila ')
    .replace(/\bpq\.?\s/g, 'parque ')
    .replace(/\bres\.?\s/g, 'residencial ')
    .replace(/\bcond\.?\s/g, 'condominio ')
    .replace(/\bnucl?\.?\s/g, 'nucleo ')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function gerarBairros(limite) {
  const consulta = `[out:json][timeout:120];
area["boundary"="administrative"]["admin_level"="8"]["name"="Indaiatuba"]->.a;
nwr["place"~"^(suburb|quarter|neighbourhood)$"]["name"](area.a);
out tags center;`;
  const resposta = await buscarOverpass(consulta);
  let coleta = { locais: [], fonte: null, vigencia: null, horariosGerais: null };
  try {
    coleta = await lerJson('scripts/dados/coleta-prefeitura.json');
  } catch {
    console.warn('  Sem coleta-prefeitura.json (rode: npm run dados:prefeitura -- --coleta)');
  }

  const vistos = new Set();
  const bairros = [];
  for (const el of resposta.elements) {
    const base = normalizarOsm(el);
    if (!base.nome || !base.coordenadas || !dentroDoMunicipio(base.coordenadas, limite)) continue;
    const slug = criarSlug(base.nome);
    if (vistos.has(slug)) continue;
    vistos.add(slug);
    // Coleta: só quando o bairro aparece (pelo nome) na tabela oficial de 2026.
    const alvo = expandirAbreviacoes(base.nome);
    const linha = coleta.locais.find((c) => expandirAbreviacoes(c.localidade) === alvo);
    bairros.push({
      slug,
      nome: base.nome,
      coordenadas: base.coordenadas,
      coleta: linha
        ? // localidade exatamente como na tabela: pode ser só um trecho do bairro.
          { localidade: linha.localidade, programacao: linha.nova, vigencia: coleta.vigencia, fonte: coleta.fonte }
        : null,
      fonte: [URL_OSM(base.osm), ...(linha ? [coleta.fonte] : [])],
    });
  }
  bairros.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  await gravarJson('bairros.json', {
    atualizadoEm: HOJE,
    observacao:
      'Bairros do OpenStreetMap (um ponto por bairro, sem contorno). A coleta de lixo aparece só para os locais que a Prefeitura listou na nova programação de 2026.',
    coletaGeral: { horarios: coleta.horariosGerais, fonte: coleta.fonte, telefone: '(19) 3825-5410' },
    bairros,
  });
  console.log(`  Meu bairro: ${bairros.length} bairros, ${bairros.filter((b) => b.coleta).length} com coleta`);
}

// Executa só quando chamado direto (o Vitest importa classificar() sem rodar tudo).
if (process.argv[1]?.endsWith('atualizar-dados.mjs')) {
  await main();
}
