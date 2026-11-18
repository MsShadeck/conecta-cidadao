-- =============================================================================
-- Conecta Cidadão — Operações CRUD e consultas do sistema
-- Execute depois de 01-criacao.sql e 02-carga-dados.sql.
-- Cada bloco indica o requisito (RF) e a tela do site que usa a consulta.
-- =============================================================================

USE conecta_cidadao;

-- -----------------------------------------------------------------------------
-- CONSULTAS (READ) usadas pelas páginas
-- -----------------------------------------------------------------------------

-- RF01 — Busca por texto (nome, tipo ou palavra-chave), como a busca Ctrl + K
SELECT DISTINCT r.id, r.nome, r.categoria, r.tipo, r.endereco_completo
  FROM vw_local_resumo r
  LEFT JOIN palavra_chave_local p ON p.local_id = r.id
 WHERE r.nome  LIKE '%ubs%'
    OR r.tipo  LIKE '%ubs%'
    OR p.palavra LIKE '%posto de saúde%'
 ORDER BY r.nome;

-- RF02 — Página de um local (/saude/:id): dados, telefones, horários e fontes
SELECT * FROM vw_local_resumo WHERE id = 'ubs-jd-california';
SELECT numero FROM telefone_local WHERE local_id = 'ubs-jd-california';
SELECT dia_semana, abre, fecha FROM horario_funcionamento
 WHERE local_id = 'ubs-jd-california' ORDER BY FIELD(dia_semana,'seg','ter','qua','qui','sex','sab','dom');
SELECT url FROM fonte_local WHERE local_id = 'ubs-jd-california';

-- RF03 — Filtro por categoria, tipo e bairro (/saude?tipo=UBS&bairro=...)
SELECT r.id, r.nome, r.tipo, r.bairro
  FROM vw_local_resumo r
 WHERE r.categoria = 'saude' AND r.tipo = 'UBS'
 ORDER BY r.bairro, r.nome;

-- RF03 — "Aberto agora": locais abertos no dia e hora atuais
-- (no site isso é calculado em src/utils/horario.js; aqui a mesma regra em SQL)
SELECT l.id, l.nome, h.abre, h.fecha
  FROM local l
  JOIN horario_funcionamento h ON h.local_id = l.id
 WHERE h.dia_semana = ELT(DAYOFWEEK(CURDATE()), 'dom','seg','ter','qua','qui','sex','sab')
   AND CURTIME() BETWEEN h.abre AND h.fecha
   -- em feriado, só aparece o que a fonte diz que abre
   AND (l.abre_feriados = 'aberto'
        OR NOT EXISTS (SELECT 1 FROM feriado f
                        WHERE f.data = CURDATE() AND f.tipo <> 'ponto facultativo'))
UNION
SELECT l.id, l.nome, '00:00:00', '23:59:59' FROM local l WHERE l.vinte_quatro_horas = TRUE;

-- RF06 — Meu bairro: o local de cada categoria mais perto de um ponto (distância de Haversine)
SET @lat := -23.0905, @lng := -47.2181;   -- ponto de exemplo (centro de Indaiatuba)
SELECT categoria, nome, ROUND(distancia_m) AS distancia_m
  FROM (
    SELECT r.categoria, r.nome,
           6371000 * 2 * ASIN(SQRT(
             POW(SIN(RADIANS(r.latitude - @lat) / 2), 2) +
             COS(RADIANS(@lat)) * COS(RADIANS(r.latitude)) *
             POW(SIN(RADIANS(r.longitude - @lng) / 2), 2))) AS distancia_m,
           ROW_NUMBER() OVER (PARTITION BY r.categoria ORDER BY
             POW(r.latitude - @lat, 2) + POW(r.longitude - @lng, 2)) AS posicao
      FROM vw_local_resumo r
     WHERE r.latitude IS NOT NULL
  ) perto
 WHERE posicao = 1
 ORDER BY distancia_m;

-- RF06 — Dia da coleta de lixo de um bairro
SELECT b.nome, c.localidade, c.programacao, c.vigencia
  FROM bairro b JOIN coleta_lixo c ON c.bairro_id = b.id
 ORDER BY b.nome;

-- RF09 — Telefones de emergência primeiro (página /contatos)
SELECT nome, telefone, grupo FROM contato ORDER BY emergencia DESC, grupo, nome;

-- Relatório: quantidade de locais por categoria e tipo
SELECT c.nome AS categoria, t.nome AS tipo, COUNT(l.id) AS quantidade
  FROM categoria c
  JOIN tipo_local t ON t.categoria_slug = c.slug
  LEFT JOIN local l ON l.tipo_local_id = t.id
 GROUP BY c.nome, t.nome
 ORDER BY c.nome, quantidade DESC;

-- Qualidade dos dados: locais sem coordenadas (não aparecem no mapa)
SELECT id, nome FROM local WHERE latitude IS NULL OR longitude IS NULL;

-- -----------------------------------------------------------------------------
-- CRUD DO ADMINISTRADOR (RF15) — manutenção do catálogo de locais
-- -----------------------------------------------------------------------------

-- CREATE: novo local, com telefone, horário e fonte (em uma transação)
START TRANSACTION;
INSERT INTO local (id, nome, tipo_local_id, logradouro, numero, bairro_nome, cep,
                   endereco_completo, latitude, longitude, horario_texto, atualizado_em)
VALUES ('ubs-exemplo', 'UBS Exemplo',
        (SELECT id FROM tipo_local WHERE nome = 'UBS' AND categoria_slug = 'saude'),
        'Rua de Exemplo', '100', 'Centro', '13330-000',
        'Rua de Exemplo, 100 - Centro', -23.090000, -47.218000,
        'De 2ª a 6ª feira, das 7h às 17h', CURDATE());
INSERT INTO telefone_local (local_id, numero) VALUES ('ubs-exemplo', '(19) 3000-0000');
INSERT INTO horario_funcionamento (local_id, dia_semana, abre, fecha) VALUES
  ('ubs-exemplo','seg','07:00','17:00'), ('ubs-exemplo','ter','07:00','17:00'),
  ('ubs-exemplo','qua','07:00','17:00'), ('ubs-exemplo','qui','07:00','17:00'),
  ('ubs-exemplo','sex','07:00','17:00');
INSERT INTO fonte_local (local_id, url) VALUES ('ubs-exemplo', 'https://www.indaiatuba.sp.gov.br/saude/');
COMMIT;

-- READ
SELECT * FROM vw_local_resumo WHERE id = 'ubs-exemplo';

-- UPDATE: novo horário e telefone
UPDATE local SET horario_texto = 'De 2ª a 6ª feira, das 7h às 19h', atualizado_em = CURDATE()
 WHERE id = 'ubs-exemplo';
UPDATE horario_funcionamento SET fecha = '19:00' WHERE local_id = 'ubs-exemplo';
UPDATE telefone_local SET numero = '(19) 3000-0001' WHERE local_id = 'ubs-exemplo';

-- DELETE: telefones, horários e fontes saem juntos (ON DELETE CASCADE)
DELETE FROM local WHERE id = 'ubs-exemplo';
SELECT COUNT(*) AS restos FROM telefone_local WHERE local_id = 'ubs-exemplo';  -- 0

-- -----------------------------------------------------------------------------
-- CRUD DO CIDADÃO — cadastro, lembretes, sugestões, checklist e votos
-- -----------------------------------------------------------------------------

-- RF14 — CREATE usuário (a senha chega já com hash BCrypt do back-end)
INSERT INTO usuario (nome, email, senha_hash, bairro_id)
VALUES ('Maria Exemplo', 'maria@exemplo.com',
        '$2a$10$7EqJtq98hPqEX7fNZaFWoO5rJ6m1Qe1Wq8R1M3f6Jx9bQ2d3k4l5S',
        (SELECT id FROM bairro WHERE slug = 'centro'));
SET @usuario := LAST_INSERT_ID();

-- RF08 — Lembretes
INSERT INTO lembrete (usuario_id, texto, data, hora, local_id)
VALUES (@usuario, 'Levar documentos para o Cartão SUS', CURDATE() + INTERVAL 3 DAY, '09:00', 'ubs-jd-california');
SELECT l.texto, l.data, l.hora, lo.nome AS local
  FROM lembrete l LEFT JOIN local lo ON lo.id = l.local_id
 WHERE l.usuario_id = @usuario ORDER BY l.data IS NULL, l.data, l.hora;
UPDATE lembrete SET hora = '10:00' WHERE usuario_id = @usuario;
DELETE FROM lembrete WHERE usuario_id = @usuario AND texto LIKE 'Levar documentos%';

-- RF11 — Sugestões de locais e moderação pelo administrador
INSERT INTO sugestao_local (usuario_id, categoria_slug, nome) VALUES (@usuario, 'lazer', 'Praça da Fonte');
UPDATE sugestao_local SET status = 'APROVADA' WHERE usuario_id = @usuario AND nome = 'Praça da Fonte';
SELECT s.nome, s.status, c.nome AS categoria FROM sugestao_local s JOIN categoria c ON c.slug = s.categoria_slug;

-- RF07 — Progresso do checklist "Primeiros passos"
INSERT INTO progresso_checklist (usuario_id, item_id) VALUES (@usuario, 'ubs-cartao-sus');
SELECT g.nome AS grupo, COUNT(i.id) AS itens, COUNT(p.item_id) AS feitos
  FROM checklist_grupo g
  JOIN checklist_item i ON i.grupo_id = g.id
  LEFT JOIN progresso_checklist p ON p.item_id = i.id AND p.usuario_id = @usuario
 GROUP BY g.id, g.nome, g.ordem ORDER BY g.ordem;

-- RF12 — "Esta página foi útil?" (um voto por pessoa e página)
INSERT INTO avaliacao_pagina (usuario_id, pagina) VALUES (@usuario, '/saude/ubs-jd-california');
SELECT pagina, COUNT(*) AS votos FROM avaliacao_pagina GROUP BY pagina ORDER BY votos DESC;

-- DELETE usuário: lembretes, sugestões, progresso e votos dele saem juntos (CASCADE)
DELETE FROM usuario WHERE id = @usuario;
