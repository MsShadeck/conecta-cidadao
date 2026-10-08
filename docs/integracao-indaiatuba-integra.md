# Integração com o Indaiatuba Integra

Consulta feita em 08/10/2026 na cópia local `D:\Projetos\Fatec\indaiatuba-integra\indaiatuba-integra`
(último commit `5a1cd81`, sem remoto configurado no git).

## O que é

Protótipo de hackathon (Desafio 1.3, "última milha") de jornada integrada estilo MaaS:
ônibus ao vivo, Ecobike, patinetes, rotas seguras para bike, alertas, CO₂ e modo totem.

**Stack:** monorepo npm com dois pacotes em **TypeScript**.

- `server/`: Node + Express + Socket.IO. Na Vercel roda como função (`api/index.ts`).
- `web/`: React + Vite + Leaflet, com tiles do **Waze**.

**Licença:** o repositório não tem arquivo `LICENSE`. Como é da mesma equipe, o reaproveitamento
é interno, mas convém definir uma licença antes de publicar código copiado.

## Dados que ele tem

| Dado | Arquivo | Formato | Origem | Real? |
|---|---|---|---|---|
| Linhas, paradas, viagens, horários e traçados | `server/data/gtfs/*.txt` | GTFS | gerado por `scripts/gerar-gtfs.ts` | **Não, é fictício.** São 4 linhas (101 a 104), agência "Operadora Simulada (dados fictícios)", `https://example.org` |
| Posição dos ônibus e atrasos | `server/src/realtime.ts` | GTFS-RT em JSON | simulador em memória | **Não, é simulado** |
| Estações Ecobike, bikes e vagas | `server/data/gbfs/station_information.json` + `gbfs.ts` | GBFS | simulador | **Não, é simulado** (as posições foram "reposicionadas com base no OSM") |
| Patinetes e bateria | `gbfs.ts` | GBFS v2/v3 | simulador | **Não.** Indaiatuba não tem serviço real de patinete compartilhado conhecido |
| Terminais Central e Rodoviário | `server/data/config.json` | JSON | OSM (`amenity=bus_station`) | Real, mas o próprio arquivo diz "coordenadas APROXIMADAS, CONFIRA" |
| Viário (ruas, mão de direção) | `server/data/viario.json` (1,5 MB) | JSON próprio | Overpass/OSM (`scripts/baixar-viario.ts`) | **Real** (ODbL) |
| Ciclovias e ciclofaixas | `server/data/ciclovias.geojson` | GeoJSON | Overpass/OSM | **Real** (ODbL) |
| Lugares para busca offline | `server/data/lugares.json` | JSON | curadoria | coordenadas aproximadas |
| Fatores de CO₂ | `server/data/emissoes.json` | JSON | valores de referência | aproximados, segundo o README |

## Lógica de rota

- `server/src/grafo.ts` → `rotear(a, b, perfil)`: **A\*** sobre o viário real do OSM, com os perfis
  `caminhada`, `micro` (bike/patinete, priorizando ciclovias com pesos ×0,55 / ×0,7 / ×1,0 / ×1,8) e
  `onibus`. Devolve `{ pontos, segmentos[{infra}], distanciaM, percentualCiclovia }`. **Não depende de dado
  simulado**: só de `viario.json`.
- `server/src/planner.ts` → `planejar(de, para)`: combina [caminhada/Ecobike/patinete] → ônibus →
  [caminhada/Ecobike/patinete]. **Depende do GTFS fictício e dos simuladores** (próximo ônibus, bikes livres).
  Considera um ônibus só, sem baldeação.
- HTTP: `POST /api/planejar`, `GET /api/rede`, `GET /api/ciclovias`, `GET /api/geocode` etc. (lista no README).
  O deploy na Vercel existe pelo histórico de commits, mas a URL publicada não está no repositório.

## Conclusão e forma de integração

**Pendente de decisão da equipe** (ver a pergunta no fim do plano). O ponto central é que a regra
"não inventar dados" do Conecta Cidadão é incompatível com publicar as linhas, horários, bikes e
patinetes do integra, porque eles são fictícios. Não existe GTFS público de Indaiatuba, e o OSM não tem
nenhuma relação `route=bus` na cidade (consulta Overpass de 08/10/2026).

Proposta, sem duplicar lógica:

1. **Reaproveitar o que é real**: o grafo do viário e o A\* (`grafo.ts` + `viario.json`) para os trechos
   a pé e de bicicleta do "Como chegar", além das ciclovias (`ciclovias.geojson`) para o mapa de Mobilidade.
2. **Como reaproveitar:** um script `scripts/sincronizar-integra.mjs` que copia `viario.json` e
   `ciclovias.geojson` para `public/api/` e grava a data e o commit de origem. A rota roda numa função
   serverless `api/rota.js` que importa o `grafo.ts` do integra. Alternativa: chamar a API publicada do
   integra, se ela expuser um endpoint de rota pura, o que hoje ela não faz.
3. **Ônibus:** sem dado aberto, o site mostra só o que é verificável: terminais (OSM + Prefeitura), link para
   a **previsão de chegadas oficial** (Cittati, linkada na página de horários da Prefeitura), link para o
   app SOU e as notícias sobre linhas novas e Tarifa Zero, com fonte e data. O planejador de ônibus do
   integra só entraria com aviso explícito de "simulação", se a equipe aceitar.
