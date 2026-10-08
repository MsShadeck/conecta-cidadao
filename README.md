# Conecta Cidadão — Indaiatuba

Guia **não oficial** para quem acabou de se mudar para **Indaiatuba (SP)**. A pergunta que o site
responde: _"Acabei de chegar. O que eu preciso resolver, e onde fica o que eu preciso perto de casa?"_

- **Primeiros passos:** checklist da mudança (cartão SUS, escola, água, luz, IPTU, título de eleitor...),
  com documentos e prazos só quando a fonte oficial informa;
- **Meu bairro:** pelo CEP, endereço, localização ou bairro, a UBS, a escola, o mercado, a farmácia, o
  ônibus e o parque mais perto, e o dia da coleta de lixo quando a Prefeitura publica;
- **Serviços públicos, Dia a dia, Ônibus e bike, Lazer e cultura e Conheça Indaiatuba**, com endereço,
  telefone, horário ("Aberto agora") e os botões **Ir com Waze** e **Google Maps** em cada lugar.

Projeto Integrador do curso de DSM da Fatec Indaiatuba, em React 18 + Vite 5 + React Router 6.
Sem vínculo com a Prefeitura: todos os dados vêm de fontes públicas, citadas em cada página.

## Como rodar

Você precisa do [Node.js](https://nodejs.org) 18 ou superior instalado.

```bash
npm install     # instala as dependências (só na primeira vez)
npm run dev     # abre em http://localhost:5173
```

| Comando                                | Para quê                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run build`                        | Gera o `sitemap.xml` e a versão de produção em `dist/`                                       |
| `npm run preview`                      | Serve a pasta `dist/` para conferir antes de publicar                                        |
| `npm run lint`                         | ESLint (inclui as regras dos hooks do React)                                                 |
| `npm run format`                       | Prettier em todo o projeto                                                                   |
| `npm test`                             | Vitest: normalizadores de dados, busca, "aberto agora", distância, `.ics`, esquema dos dados |
| `npm run dados`                        | Atualiza `public/api/*.json` a partir das fontes (ver abaixo)                                |
| `npm run dados:prefeitura`             | Relê as fichas oficiais no portal da Prefeitura (lento de propósito: 1 página a cada 1,2 s)  |
| `npm run dados:prefeitura -- --coleta` | Relê só a tabela oficial de coleta de lixo por bairro                                        |
| `npm run integra`                      | Traz o roteamento e o viário do Indaiatuba Integra (usado pela `api/rota.js`, da v2)         |
| `npm run imagens`                      | Gera as versões WebP das fotos, os ícones e a imagem de prévia                               |
| `npm run contraste`                    | Confere o contraste das cores (WCAG AA)                                                      |

## Rotas

| Página                                                             | Endereço                                                                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Início (CEP ou bairro, Seu bairro, diferenças para quem vem de SP) | `/`                                                                                               |
| Primeiros passos: checklist da mudança                             | `/primeiros-passos` (aceita `#passo-<id>`)                                                        |
| Meu bairro: o que tem perto (CEP, endereço, GPS ou bairro)         | `/meu-bairro` (aceita `?cep=`, `?bairro=`), `/bairros/:slug` (`/perto-de-mim` redireciona)        |
| Serviços públicos (saúde, educação, segurança, assistência)        | `/servicos`                                                                                       |
| Dia a dia (mercados, padarias, farmácias, feiras...)               | `/dia-a-dia` (aceita `?grupo=`, `?q=`, `?aberto=1`, `?ordem=`)                                    |
| Conheça Indaiatuba (IBGE, bairros, diferenças para quem vem de SP) | `/conheca`                                                                                        |
| Mapa de todos os serviços                                          | `/mapa` (aceita `?bairro=`)                                                                       |
| Como chegar (botões Waze e Google Maps)                            | `/como-chegar` (aceita `?destino=id`)                                                             |
| Categorias (com busca por texto, filtros, lista/mapa)              | `/saude`, `/educacao`, `/seguranca`, `/lazer`, `/cidadania` (aceitam `?q=`, `?tipo=`, `?bairro=`) |
| Ônibus e bike                                                      | `/mobilidade`                                                                                     |
| Detalhe de um local                                                | `/:categoria/:id` (ex.: `/saude/ubs-jd-california`)                                               |
| Serviços online da Prefeitura                                      | `/servicos-online`                                                                                |
| Telefones úteis                                                    | `/contatos`                                                                                       |
| Lembretes (com data, local e `.ics`)                               | `/lembretes` (aceita `?local=id` e `?texto=`)                                                     |
| Sobre, fontes e créditos                                           | `/sobre`                                                                                          |

Todas abrem por URL direta e com F5: o `vercel.json` manda tudo para o `index.html` (menos `/api/`).
As páginas são carregadas sob demanda (`React.lazy`), e o mapa (Leaflet) só nas páginas que têm mapa.

## Estrutura

```
api/rota.js                função serverless da v2: rota a pé e de bike (Integra); a v3 não a usa mais
api/_integra/              gerado por npm run integra (não editar)
docs/                      fontes de dados e integração com o Indaiatuba Integra
public/api/                dados que o site lê com fetch (gerados por npm run dados)
public/img/                fotos (JPG + WebP), ícones e CREDITOS.md
scripts/
  atualizar-dados.mjs      junta curadoria + Prefeitura + CNES + OSM (+ Nominatim)
  dados/                   acesso às fontes (com cache), normalizadores e testes, coletor da Prefeitura
  sincronizar-integra.mjs  empacota o roteamento do Integra
src/
  data/servicos.js         categorias (nome, cor, ícone, texto) e equipe
  data/curadoria/          correções e acréscimos feitos à mão (prioridade sobre as fontes)
  context/AppContext.jsx   estado global: busca, avisos e ponto de partida (origem)
  hooks/                   useDados, useLocalStorage, useMetadados, useTituloPagina
  utils/                   texto, horário (aberto agora), geo, busca, CEP, .ics, navegação (Waze/Google),
                           proximidade (o que fica mais perto de um ponto)
  components/              Cabecalho, BuscaOverlay, CardLocal, BotoesNavegacao, MapaWaze, mapa/…
  pages/                   uma pasta por rota
  styles/global.css        tokens de cor (claro e escuro), reset e classes compartilhadas
```

## De onde vêm os dados

O site não tem banco de dados. `npm run dados` gera arquivos JSON em `public/api/`, e as páginas leem
com `fetch('/api/...')` (o mesmo padrão da aula de useEffect, agora no hook `useDados`).

| Arquivo                                         | Conteúdo                                                                                                                      | Fontes                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `locais.json`                                   | 212 locais (inclui faculdades e shoppings) com endereço, telefones, horários, serviços, coordenadas, `fonte` e `atualizadoEm` | Fichas da Prefeitura, CNES, OpenStreetMap, Nominatim  |
| `contatos.json`                                 | Telefones úteis (cada um com a página onde foi conferido)                                                                     | Prefeitura, gov.br                                    |
| `servicos-online.json`                          | Links oficiais (IPTU, Minha Vacina, multas, iluminação...)                                                                    | Prefeitura e órgãos responsáveis                      |
| `mobilidade.json`                               | Ônibus (links oficiais, cartão SOU, novidades com data), Ecobike                                                              | Prefeitura, OSM, imprensa                             |
| `feriados.json`                                 | Feriados nacionais e municipais (usados no "Aberto agora")                                                                    | BrasilAPI, edital CSM/TJ-SP                           |
| `ciclovias.geojson`, `limite-municipio.geojson` | Ciclovias e contorno da cidade                                                                                                | OSM (via Integra), IBGE                               |
| `checklist.json`                                | Primeiros passos: 16 itens com o que é, por quê, como fazer, documentos e prazo (só com fonte)                                | Prefeitura, SAAE, CPFL, TSE, Detran-SP, imprensa      |
| `bairros.json`                                  | 118 bairros (ponto de referência) e a coleta de lixo dos que a Prefeitura publica                                             | OSM, Prefeitura (coleta domiciliar)                   |
| `comercio.json`                                 | Dia a dia: mercados, padarias, farmácias, restaurantes, feiras, bancos e postos                                               | OSM (Overpass, só no build), Prefeitura (Ponto Verde) |
| `cidade.json`                                   | População, área e densidade (Indaiatuba e capital) e as diferenças para quem vem de SP, cada uma com fonte                    | IBGE (API de agregados), curadoria com fontes         |
| `pendencias.json`                               | Locais da v1 sem fonte oficial (não publicados)                                                                               | —                                                     |

Regras: **nada é inventado** (campo sem fonte = `null` = "Informação não disponível"), **nenhuma chave de
API** (todas as fontes são abertas), Nominatim com no máximo 1 req/s e cache, e Overpass só no build.
Detalhes, licenças, datas e limitações: [`docs/fontes-de-dados.md`](docs/fontes-de-dados.md).

**Comércio:** vem do OpenStreetMap (© OpenStreetMap contributors, ODbL), gerado no build e nunca
consultado a cada visita. A página mostra o aviso "Dados colaborativos. Horários de estabelecimentos
podem mudar.", não tem ranking, nota nem destaque pago, e cada lugar tem o link "Corrigir no
OpenStreetMap".

**Ônibus:** Indaiatuba não publica linhas, paradas e horários em formato aberto. O site leva à
previsão oficial de chegadas, mostra terminais, cartão SOU, Ecobike e ciclovias, e o botão
"De ônibus" abre o Google Maps, que mostra as linhas reais da cidade. A integração com o sistema da
operadora depende de autorização (ver `docs/fontes-de-dados.md`).

### Navegação: Waze e Google Maps

O site não calcula rotas. Cada lugar tem os botões **Ir com Waze** (`https://waze.com/ul`, rota de
carro) e **Google Maps** (`https://www.google.com/maps/dir/?api=1`, a pé, de bicicleta, de carro ou de
ônibus), montados em `src/utils/navegacao.js`, sem chave de API. Quando a pessoa informou de onde sai
(CEP ou localização), o Google Maps já abre com esse ponto de partida.

Os mapas de **um ponto** (página de um local, Meu bairro, trânsito na página de ônibus) usam o
**iFrame oficial do Waze** (`embed.waze.com`), com trânsito ao vivo.

**Exceção — mapas com vários pontos:** o iFrame do Waze mostra um único ponto e não aceita vários
marcadores. Por isso, o Mapa geral, as categorias em modo mapa, Ônibus e bike (Ecobike e ciclovias)
e Conheça Indaiatuba (bairros e contorno do município) continuam com **Leaflet + OpenStreetMap**, sem
nenhuma marca ou nome do Waze nesses mapas, como pedem as regras de marca do Waze.

A v2 calculava rotas a pé e de bicicleta no próprio site com o **Indaiatuba Integra**. Esse código
ficou comentado em `components/PlanejadorRota.jsx` ("VERSÃO ANTERIOR (v2)"), e a função `api/rota.js`
continua no projeto. Veja [`docs/integracao-indaiatuba-integra.md`](docs/integracao-indaiatuba-integra.md).

## Como adicionar ou corrigir um local

1. **Se o local tem página no portal da Prefeitura**, rode `npm run dados:prefeitura` e depois `npm run dados`.
   Ele entra sozinho, se a seção já estiver na lista `SECOES` de `scripts/dados/coletar-prefeitura.mjs`.
2. **Para corrigir ou completar** um local, edite `src/data/curadoria/<categoria>.json`, em `ajustes`,
   usando como chave a URL da ficha (`origem`). Dá para trocar nome, `id`, foto (`imagem`) e endereço,
   ou acrescentar uma `observacao`.
3. **Para acrescentar um local sem ficha** na Prefeitura, use `extras` no mesmo arquivo. A `fonte`
   (lista de URLs) é **obrigatória**: o teste `src/data/esquema.test.js` falha sem ela.
4. **Foto:** coloque o JPG em `public/img/<categoria>/`, rode `npm run imagens` e registre a origem em
   `public/img/CREDITOS.md`.
5. Rode `npm run dados`, `npm test` e confira a página do local.

Locais sem fonte confirmada vão para `pendentes` e aparecem na página Sobre como "Dados em conferência".

## Acessibilidade, PWA e desempenho

- Meta WCAG 2.1 AA: contraste conferido (`npm run contraste`), foco visível, "Pular para o conteúdo",
  anúncio da página nova para leitores de tela, menu com foco preso e Esc, lista em texto equivalente
  a cada mapa e alvos de toque de pelo menos 40 px.
- No **Menu**: tamanho da letra (A, A+, A++; as fontes usam `rem`), tema automático, claro ou escuro,
  e o **VLibras** (Libras), carregado só quando a pessoa ativa.
- **PWA** (`vite-plugin-pwa`): instala no celular e abre sem internet com os locais, os telefones, os
  serviços online e os lembretes. As fotos entram no cache conforme são vistas.
- **SEO:** título, descrição, Open Graph e canonical por página (`useMetadados`), mais `sitemap.xml`
  (gerado no build) e `robots.txt`.
- **Lighthouse no celular** (build local, 08/10/2026), na ordem Desempenho / Acessibilidade / Boas
  práticas / SEO:
  - Home: 95 / 100 / 100 / 100
  - Saúde: 85 / 100 / 100 / 100
  - Página de uma UBS: 86 / 100 / 100 / 100
  - Mapa geral: 75 / 100 / 96 / 100. O maior elemento da tela é um tile PNG do OpenStreetMap.

## Atividades das aulas de React

O código praticado nas aulas **"Review + Rotas"** e **"useEffect + Consumo de API"** foi
aplicado ao tema do Conecta Cidadão. Como a professora pediu, as versões intermediárias
não foram apagadas: ficam comentadas com `/* */` ou `{/* */}` acima da versão ativa.
Quando um desses arquivos evoluiu depois das aulas (v2), a última versão feita em aula também
ficou comentada, com o título **VERSÃO DA AULA**, e a versão nova é a ativa.

| Exemplo do material                                                         | Onde está no projeto                                                                                                                   |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Rotas (`BrowserRouter`, `Routes`, `Link`)                                   | `App.jsx`, `Cabecalho.jsx`, `Rodape.jsx`                                                                                               |
| LikeButton (useState)                                                       | `components/BotaoUtil.jsx`: bloco "VERSÃO DA AULA" (a v2 ativa guarda um voto por página no `localStorage`)                            |
| ListaAlunos (3 etapas: lista fixa, lista vazia com `&&`, input + ternário)  | `components/SugestaoLocais.jsx`: Etapas 1 e 2 e bloco "ETAPA 3 — VERSÃO DA AULA" (a v2 ativa usa `id` e `localStorage`)                |
| Exemplo 1: useEffect sem array, com `[]` e com dependência                  | `hooks/useTituloPagina.js`: variações A, B e C comentadas (a v2 ativa chama o `useMetadados`, que também cuida da descrição e do SEO)  |
| Tecla: addEventListener + cleanup                                           | `context/AppContext.jsx` (atalho Ctrl + K)                                                                                             |
| Exemplos 2 a 5: fetch, loading e erro, filtro, SearchBar                    | `components/ListaContatos.jsx` e `components/BarraBusca.jsx`, página `/contatos`                                                       |
| Atividades propostas: exibir contato, recarregar, "nenhum encontrado", erro | Bloco "VERSÃO DA AULA" de `ListaContatos.jsx` (a v2 ativa acrescenta `AbortController`, busca sem acento e chips)                      |
| Exemplo 6: lista de tarefas                                                 | `pages/Lembretes.jsx`: bloco "VERSÃO DA AULA" (a v2 ativa usa `id`, `localStorage`, data, local e exporta `.ics`), página `/lembretes` |

A página Telefones úteis busca os dados com `fetch('/api/contatos.json')`, arquivo que fica
em `public/api/`. É o mesmo código usado com a API JSONPlaceholder no material, agora com os
telefones de utilidade pública e da Prefeitura, cada um com a sua fonte.

## Publicar na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Na Vercel, clique em **Add New… → Project** e importe esse repositório.
3. A Vercel reconhece o Vite sozinha. Se pedir para confirmar, use:

   | Campo            | Valor           |
   | ---------------- | --------------- |
   | Framework Preset | Vite            |
   | Build Command    | `npm run build` |
   | Output Directory | `dist`          |
   | Install Command  | `npm install`   |

4. Clique em **Deploy**. Cada `git push` na branch principal gera um novo deploy.

O `vercel.json` faz três coisas:

- **Rotas da SPA:** manda as rotas para o `index.html`. Sem isso, abrir `/saude` direto ou apertar F5 daria 404.
- **Função de rota:** inclui `api/_integra/**` no pacote da função `api/rota.js`.
- **Cache:** define os cabeçalhos de `/assets`, `/img` e `/api/*.json`.

Os arquivos estáticos de `public/api/` e a função `api/rota.js` convivem sem conflito.

## Paleta

Todas as cores ficam em `src/styles/global.css`, no bloco `:root`. O tema escuro redefine os mesmos
tokens, e cada categoria tem um par fundo/tinta definido pelo atributo `data-categoria`.

| Uso               | Claro                 | Escuro                |
| ----------------- | --------------------- | --------------------- |
| Fundo             | `#c9e8f5`             | `#0e1621`             |
| Azul da marca     | `#1a6faf`             | `#8cc8f2`             |
| Texto             | `#1a1a2e` / `#3a3a5c` | `#e6edf3` / `#b6c3d1` |
| Saúde             | `#d4edda` / `#1a6f3a` | `#173323` / `#8fdca8` |
| Segurança         | `#fde8d8` / `#a0460a` | `#3a2417` / `#f6b48a` |
| Educação          | `#d8eafd` / `#1a4faf` | `#172a45` / `#9cc2fb` |
| Lazer             | `#e8d8fd` / `#6a1aaf` | `#2c1d45` / `#d1b3fb` |
| Cidadania         | `#d3f0ec` / `#0b6158` | `#123430` / `#86ddd2` |
| Mobilidade        | `#fdefc8` / `#855400` | `#3a2c10` / `#f2c96b` |
| Primeiros passos  | `#dceffa` / `#0b5a8a` | `#13283a` / `#8ccaf5` |
| Meu bairro        | `#fbe0ea` / `#9c1f55` | `#3a1626` / `#f5a8c6` |
| Dia a dia         | `#e7f1d3` / `#49650f` | `#22301a` / `#bfe08a` |
| Conheça           | `#e3e3fb` / `#3b3bb0` | `#1f1f45` / `#b9b9ff` |
| Serviços públicos | `#e2ecf3` / `#2c5470` | `#1a2836` / `#a9c8de` |

## Equipe

Moisés Globekener de Almeida Shadeck · Homer Betinatti Gomes
