# Integração com o Indaiatuba Integra

Consulta feita em 08/10/2026 na cópia local `../indaiatuba-integra/indaiatuba-integra`
(commit `5a1cd81`; o repositório não tem remoto configurado nem arquivo `LICENSE`).

## O que é o Integra

Protótipo de hackathon (Desafio 1.3, "última milha") de jornada integrada estilo MaaS: ônibus ao vivo,
Ecobike, patinetes, rotas seguras de bike, alertas, CO₂ e modo totem.

**Stack:** monorepo npm em **TypeScript**.

- `server/`: Node + Express + Socket.IO. Na Vercel roda como função.
- `web/`: React + Vite + Leaflet.

## Dados que ele tem

| Dado                                                     | Arquivo                         | Formato        | Real?                                                | Usado aqui?    |
| -------------------------------------------------------- | ------------------------------- | -------------- | ---------------------------------------------------- | -------------- |
| Linhas, paradas, viagens, horários e traçados            | `server/data/gtfs/*.txt`        | GTFS           | **Não, é fictício** (4 linhas, "Operadora Simulada") | **Não**        |
| Posição dos ônibus e atrasos                             | `server/src/realtime.ts`        | GTFS-RT (JSON) | **Não, é simulado**                                  | **Não**        |
| Estações Ecobike, bikes e vagas; patinetes               | `gbfs/…`, `gbfs.ts`             | GBFS           | **Não, é simulado**                                  | **Não**        |
| Viário de Indaiatuba (ruas, mão de direção, tipo de via) | `server/data/viario.json`       | JSON próprio   | **Sim** (OSM, ODbL)                                  | **Sim**        |
| Ciclovias e ciclofaixas                                  | `server/data/ciclovias.geojson` | GeoJSON        | **Sim** (OSM, ODbL)                                  | **Sim**        |
| Zonas industriais e velocidades médias                   | `server/data/config.json`       | JSON           | aproximado (só pondera a rota de bike)               | Só esse trecho |

## Lógica de rota

- `server/src/grafo.ts` → `rotear(a, b, perfil)` faz um **A\*** sobre o viário real.
  - Perfil `caminhada`: qualquer sentido, calçadas e caminhos de pedestre.
  - Perfil `micro` (bike/patinete): respeita mão única e pondera o custo por infraestrutura (×0,55 em ciclovia, ×0,7 em ciclofaixa, ×1,0 em rua compartilhada, ×1,8 em via sem infraestrutura).
  - Devolve os trechos já classificados e o percentual feito em ciclovia.
- `server/src/planner.ts` → `planejar()` combina ônibus e micromobilidade, mas **depende do GTFS fictício**, então não é usado.

## Integração escolhida (sem duplicar lógica)

```
../indaiatuba-integra ──(npm run integra)──▶ api/_integra/roteador.mjs   (grafo.ts + geo.ts empacotados com esbuild)
                                         ├─▶ api/_integra/data/viario.json, config.json (trecho)
                                         ├─▶ public/api/ciclovias.geojson
                                         └─▶ api/_integra/ORIGEM.json     (commit e data)

navegador ──GET /api/rota?de=lat,lng&para=lat,lng──▶ api/rota.js (função serverless da Vercel)
                                                    └─ rotear(de, para, 'caminhada' | 'micro')
```

- **O código de rota não é reescrito.** O `grafo.ts` original é empacotado tal como está. O único arquivo trocado é o `dados.ts` do Integra, substituído por `scripts/integra/dados-shim.mjs`, porque o original também carregaria os dados simulados.
- **Atualizar** é rodar `npm run integra` de novo. Para usar outra pasta: `INTEGRA_DIR=/caminho npm run integra`.
- **No `npm run dev`**, um plugin do `vite.config.js` executa a mesma função para `/api/rota`. Na Vercel, `vercel.json` inclui `api/_integra/**` no pacote da função.
- **Teste de desempenho:** a rota do Terminal Central até a UBS X sai em cerca de 15 ms depois do carregamento (35.587 nós, 39.973 segmentos).

## O que o "Como chegar" mostra

| Modo                     | Fonte                        | Observação                                                                         |
| ------------------------ | ---------------------------- | ---------------------------------------------------------------------------------- |
| A pé                     | Integra (perfil `caminhada`) | 5 km/h                                                                             |
| Bicicleta                | Integra (perfil `micro`)     | 15 km/h; trechos coloridos por infraestrutura e % em ciclovia; link para o Ecobike |
| Ônibus                   | Previsão oficial (link)      | Sem dados abertos de linhas, o site não indica linha                               |
| Patinete / autopropelido | —                            | Não há serviço real de patinete compartilhado conhecido em Indaiatuba              |

## Próximo passo (depende de autorização)

Com o GTFS oficial (pedido à SOU Indaiatuba ou à Secretaria de Mobilidade) ou com a autorização para usar
a API do Cittati, o caminho natural é trocar o GTFS fictício do Integra pelo real (o leitor `gtfs.ts` já
entende o formato) e passar a usar o `planejar()` do Integra para o trecho de ônibus.
