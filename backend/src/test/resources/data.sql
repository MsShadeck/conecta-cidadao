-- Dados mínimos para os testes (os reais vêm de database/02-carga-dados.sql).
INSERT INTO categoria (slug, nome, rota, resumo) VALUES
  ('saude', 'Saúde', '/saude', 'UBS e hospitais'),
  ('lazer', 'Lazer e cultura', '/lazer', 'Parques e museus');

INSERT INTO tipo_local (id, nome, categoria_slug) VALUES (1, 'UBS', 'saude'), (2, 'Parque', 'lazer');

INSERT INTO bairro (id, slug, nome, latitude, longitude) VALUES
  (1, 'jardim-california', 'Jardim California', -23.1, -47.2),
  (2, 'centro', 'Centro', -23.09, -47.21);

INSERT INTO local (id, nome, tipo_local_id, logradouro, numero, bairro_nome, bairro_id, cep, endereco_completo,
                   latitude, longitude, coordenada_aproximada, coordenada_fonte, horario_texto, vinte_quatro_horas, atualizado_em)
VALUES ('ubs-jd-california', 'UBS X – Jardim Califórnia', 1, 'Rua Basílio Martins', '830', 'Jardim California', 1,
        '13344-321', 'Rua Basílio Martins, 830', -23.105477, -47.214656, TRUE, 'nominatim', 'das 7h às 17h', FALSE, DATE '2026-10-08'),
       ('parque-ecologico', 'Parque Ecológico', 2, NULL, NULL, NULL, NULL, NULL, NULL,
        NULL, NULL, FALSE, NULL, NULL, TRUE, DATE '2026-10-08');

INSERT INTO telefone_local (local_id, numero, ordem) VALUES ('ubs-jd-california', '(19) 3894-5375', 0), ('ubs-jd-california', '(19) 3894-5345', 1);
INSERT INTO horario_funcionamento (local_id, dia_semana, abre, fecha) VALUES
  ('ubs-jd-california', 'seg', '07:00', '17:00'), ('ubs-jd-california', 'ter', '07:00', '17:00'),
  ('ubs-jd-california', 'sab', '08:00', '12:00'),
  ('ubs-jd-california', 'sex', '18:00', '24:00');
INSERT INTO fonte_local (local_id, url, ordem) VALUES
  ('ubs-jd-california', 'https://www.indaiatuba.sp.gov.br/saude/atencao-basica/ubs-x/', 0),
  ('parque-ecologico', 'https://www.indaiatuba.sp.gov.br/', 0);
INSERT INTO palavra_chave_local (local_id, palavra) VALUES ('ubs-jd-california', 'posto de saúde');

INSERT INTO checklist_item (id, titulo) VALUES ('ubs-cartao-sus', 'Encontre a sua UBS e faça o Cartão SUS');
