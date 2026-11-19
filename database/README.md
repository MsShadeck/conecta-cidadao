# Banco de dados — Conecta Cidadão

Banco relacional do PI 2 (disciplina Banco de Dados Relacional). Guarda os mesmos dados que o site
lê em `public/api/*.json` e os dados de cada usuário (conta, lembretes, sugestões, checklist e
votos). Quem lê e grava é a API em [`../backend`](../backend/README.md) (Spring Boot + JPA).

- **SGBD:** MySQL 8 ou MariaDB 10.4+ (o do XAMPP, administrado pelo phpMyAdmin). A versão publicada
  usa PostgreSQL 17 no Neon, com o mesmo modelo (arquivos em `postgres/`)
- **Banco:** `conecta_cidadao` · 25 tabelas + 1 visão · InnoDB · utf8mb4
- **Diagramas:** `docs/diagramas/der-conceitual.png` e `der-logico-*.png` (código Mermaid nos `.mmd`)

| Arquivo                     | Conteúdo                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `01-criacao.sql`            | Cria o banco, as tabelas, as restrições, o índice e a visão `vw_local_resumo`               |
| `02-carga-dados.sql`        | Dados reais do site. **Gerado** por `npm run sql`; não edite à mão                          |
| `03-crud-e-consultas.sql`   | INSERT, SELECT, UPDATE e DELETE de cada requisito (busca, "Aberto agora", mais perto, CRUD) |
| `04-testes-integridade.sql` | 10 comandos que o banco deve recusar e conferências da carga                                |
| `postgres/`                 | Versão PostgreSQL de 01 e 02 para o banco publicado (Neon). **Gerada** por `npm run sql:postgres` |

## Como rodar

No phpMyAdmin: aba **Importar**, um arquivo de cada vez, na ordem 01 → 04. Pelo terminal:

```bash
mysql -u root < database/01-criacao.sql
mysql -u root < database/02-carga-dados.sql
mysql -u root -t < database/03-crud-e-consultas.sql
mysql -u root -t --force < database/04-testes-integridade.sql   # --force: os erros são esperados
```

Depois de `npm run dados`, rode `npm run sql` para o `02-carga-dados.sql` acompanhar o JSON.

## Grupos de tabelas

- **A) Catálogo:** `categoria`, `tipo_local`, `bairro`, `coleta_lixo`, `local`, `telefone_local`,
  `horario_funcionamento`, `servico_local`, `nivel_ensino_local`, `palavra_chave_local`, `fonte_local`
- **B) Apoio:** `contato`, `categoria_servico_online`, `servico_online`, `checklist_grupo`, `checklist_item`,
  `checklist_link`, `feriado`, `grupo_comercio`, `estabelecimento`
- **C) Usuários:** `usuario`, `lembrete`, `sugestao_local`, `progresso_checklist`, `avaliacao_pagina`

## Decisões que vieram dos dados reais

- Coordenadas em `DECIMAL(10,7)`: o OpenStreetMap usa 7 casas decimais (cerca de 1 cm).
- Horário até `24:00` ("até a meia-noite") é aceito pelo `TIME` do MySQL.
- Um local pode ter duas faixas no mesmo dia começando na mesma hora (ex.: 07–12 e 07–18):
  a chave única de `horario_funcionamento` inclui `abre` **e** `fecha`.
- `telefone_local`, `servico_local` e `fonte_local` têm a coluna `ordem` (o 1º telefone é o principal).

A API lendo este banco devolve os 212 locais **idênticos** ao `public/api/locais.json`
(comparação campo a campo, 0 diferenças). O dicionário de dados completo está na documentação do
PI 2 (seção 5.3.5), em `documentacao/`.
