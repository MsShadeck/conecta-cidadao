-- =============================================================================
-- Conecta Cidadão — Testes de integridade dos dados
-- Cada comando da PARTE 1 DEVE FALHAR: é o banco recusando um dado inválido.
-- Rode com:  mysql -u root --force conecta_cidadao < database/04-testes-integridade.sql
-- (--force continua depois de cada erro) ou execute um por um no phpMyAdmin.
-- A PARTE 2 confere a carga: todas as contagens de "problemas" devem dar 0.
-- =============================================================================

USE conecta_cidadao;

-- PARTE 1 — restrições -------------------------------------------------------

-- T01 PK duplicada: já existe um local com esse id            → ERROR 1062
INSERT INTO local (id, nome, tipo_local_id, atualizado_em)
VALUES ('ubs-jd-california', 'Duplicado', 1, CURDATE());

-- T02 FK inexistente: tipo de local 9999 não existe            → ERROR 1452
INSERT INTO local (id, nome, tipo_local_id, atualizado_em)
VALUES ('teste-fk', 'Teste FK', 9999, CURDATE());

-- T03 NOT NULL: local sem nome                                 → ERROR 1048
INSERT INTO local (id, nome, tipo_local_id, atualizado_em)
VALUES ('teste-nulo', NULL, 1, CURDATE());

-- T04 CHECK: CEP fora do formato 00000-000                     → ERROR 4025 (MariaDB) / 3819 (MySQL)
INSERT INTO local (id, nome, tipo_local_id, cep, atualizado_em)
VALUES ('teste-cep', 'Teste CEP', 1, '1333', CURDATE());

-- T05 CHECK: latitude impossível                               → ERROR 4025 / 3819
INSERT INTO bairro (slug, nome, latitude, longitude) VALUES ('teste-lat', 'Teste', 123, -47);

-- T06 ENUM: dia da semana inválido                             → ERROR 1265
INSERT INTO horario_funcionamento (local_id, dia_semana, abre, fecha)
VALUES ('ubs-jd-california', 'segunda', '08:00', '17:00');

-- T07 UNIQUE: dois usuários com o mesmo e-mail                 → ERROR 1062 no 2º INSERT
INSERT INTO usuario (nome, email, senha_hash) VALUES ('Teste', 'teste@exemplo.com', REPEAT('x', 60));
INSERT INTO usuario (nome, email, senha_hash) VALUES ('Outro', 'teste@exemplo.com', REPEAT('y', 60));

-- T08 CHECK: e-mail sem @                                      → ERROR 4025 / 3819
INSERT INTO usuario (nome, email, senha_hash) VALUES ('Teste', 'email-invalido', REPEAT('x', 60));

-- T09 RESTRICT: apagar uma categoria que tem tipos de local    → ERROR 1451
DELETE FROM categoria WHERE slug = 'saude';

-- T10 CHECK: lembrete com hora, mas sem data                   → ERROR 4025 / 3819
INSERT INTO lembrete (usuario_id, texto, hora)
VALUES ((SELECT id FROM usuario WHERE email = 'teste@exemplo.com'), 'Sem data', '09:00');

-- Limpeza do usuário criado no T07
DELETE FROM usuario WHERE email = 'teste@exemplo.com';

-- PARTE 2 — conferência da carga (todas devem retornar 0) ---------------------

SELECT 'locais sem fonte' AS verificacao, COUNT(*) AS problemas
  FROM local l WHERE NOT EXISTS (SELECT 1 FROM fonte_local f WHERE f.local_id = l.id)
UNION ALL
SELECT 'horário que fecha antes de abrir', COUNT(*)
  FROM horario_funcionamento WHERE fecha <= abre
UNION ALL
SELECT 'tipos sem nenhum local', COUNT(*)
  FROM tipo_local t WHERE NOT EXISTS (SELECT 1 FROM local l WHERE l.tipo_local_id = t.id)
UNION ALL
SELECT 'itens do checklist sem link oficial', COUNT(*)
  FROM checklist_item i WHERE NOT EXISTS (SELECT 1 FROM checklist_link k WHERE k.item_id = i.id);

-- Totais carregados (devem bater com public/api/*.json)
SELECT (SELECT COUNT(*) FROM local)           AS locais,
       (SELECT COUNT(*) FROM bairro)          AS bairros,
       (SELECT COUNT(*) FROM estabelecimento) AS estabelecimentos,
       (SELECT COUNT(*) FROM contato)         AS contatos,
       (SELECT COUNT(*) FROM servico_online)  AS servicos_online,
       (SELECT COUNT(*) FROM checklist_item)  AS itens_checklist,
       (SELECT COUNT(*) FROM feriado)         AS feriados;
