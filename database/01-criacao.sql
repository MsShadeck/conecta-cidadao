-- =============================================================================
-- Conecta Cidadão — Script de criação do banco de dados (DDL)
-- Projeto Integrador 2 (DSM, Fatec Indaiatuba) — Banco de Dados Relacional
--
-- SGBD: MySQL 8 / MariaDB 10.4+ (o MariaDB do XAMPP, administrado pelo phpMyAdmin)
-- Codificação: utf8mb4 (acentos e emojis), collation utf8mb4_unicode_ci
--
-- Ordem de execução:
--   01-criacao.sql            → cria o banco e as tabelas (este arquivo)
--   02-carga-dados.sql        → insere os dados reais do site (gerado por npm run sql)
--   03-crud-e-consultas.sql   → exemplos de INSERT, SELECT, UPDATE e DELETE
--   04-testes-integridade.sql → comandos que DEVEM falhar (PK, FK, UNIQUE, CHECK)
--
-- Organização em três grupos:
--   A) Catálogo de locais    — o que o site mostra hoje (vem de public/api/*.json)
--   B) Conteúdo de apoio     — telefones, serviços online, checklist, feriados, comércio
--   C) Usuários e interação  — o que hoje fica no localStorage e passa para o banco
--                              com o back-end (cadastro, lembretes, sugestões, votos)
-- =============================================================================

DROP DATABASE IF EXISTS conecta_cidadao;
CREATE DATABASE conecta_cidadao
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE conecta_cidadao;

-- -----------------------------------------------------------------------------
-- A) CATÁLOGO DE LOCAIS
-- -----------------------------------------------------------------------------

-- Categorias fixas do site (Saúde, Educação, Segurança, Lazer, Cidadania, Transporte)
CREATE TABLE categoria (
  slug        VARCHAR(20)  NOT NULL,
  nome        VARCHAR(60)  NOT NULL,
  rota        VARCHAR(40)  NOT NULL,
  resumo      VARCHAR(255) NULL,
  CONSTRAINT pk_categoria PRIMARY KEY (slug),
  CONSTRAINT uk_categoria_nome UNIQUE (nome),
  CONSTRAINT uk_categoria_rota UNIQUE (rota)
) ENGINE=InnoDB;

-- Tipo de local (UBS, EMEB, CRAS, Parque...). Cada tipo pertence a uma categoria.
CREATE TABLE tipo_local (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome            VARCHAR(60)  NOT NULL,
  categoria_slug  VARCHAR(20)  NOT NULL,
  CONSTRAINT pk_tipo_local PRIMARY KEY (id),
  CONSTRAINT uk_tipo_local UNIQUE (nome, categoria_slug),
  CONSTRAINT fk_tipo_local_categoria FOREIGN KEY (categoria_slug)
    REFERENCES categoria (slug) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Bairros de Indaiatuba com um ponto de referência (OpenStreetMap)
CREATE TABLE bairro (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(80)   NOT NULL,
  nome        VARCHAR(100)  NOT NULL,
  latitude    DECIMAL(10,7)  NULL,
  longitude   DECIMAL(10,7)  NULL,
  CONSTRAINT pk_bairro PRIMARY KEY (id),
  CONSTRAINT uk_bairro_slug UNIQUE (slug),
  CONSTRAINT ck_bairro_lat CHECK (latitude  IS NULL OR latitude  BETWEEN -90  AND 90),
  CONSTRAINT ck_bairro_lng CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
) ENGINE=InnoDB;

-- Programação da coleta de lixo domiciliar publicada pela Prefeitura (por trecho de bairro)
CREATE TABLE coleta_lixo (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  bairro_id    INT UNSIGNED NOT NULL,
  localidade   VARCHAR(255) NOT NULL,
  programacao  VARCHAR(255) NOT NULL,
  vigencia     VARCHAR(60)  NULL,
  fonte_url    VARCHAR(500) NOT NULL,
  CONSTRAINT pk_coleta_lixo PRIMARY KEY (id),
  CONSTRAINT fk_coleta_bairro FOREIGN KEY (bairro_id)
    REFERENCES bairro (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Local público (UBS, escola, CRAS, parque...). É a entidade central do sistema.
-- O id é o mesmo slug usado na URL do site (ex.: /saude/ubs-jd-california).
CREATE TABLE local (
  id                  VARCHAR(80)   NOT NULL,
  nome                VARCHAR(150)  NOT NULL,
  tipo_local_id       INT UNSIGNED  NOT NULL,
  logradouro          VARCHAR(150)  NULL,
  numero              VARCHAR(20)   NULL,
  bairro_nome         VARCHAR(100)  NULL COMMENT 'Bairro como escrito na fonte oficial',
  bairro_id           INT UNSIGNED  NULL COMMENT 'Bairro cadastrado, quando o nome coincide',
  cep                 CHAR(9)       NULL,
  endereco_completo   VARCHAR(255)  NULL,
  latitude            DECIMAL(10,7)  NULL,
  longitude           DECIMAL(10,7)  NULL,
  coordenada_aproximada BOOLEAN     NOT NULL DEFAULT FALSE COMMENT 'Ponto achado só pela rua, sem o número',
  coordenada_fonte    ENUM('osm','nominatim','cnes','manual') NULL COMMENT 'De onde veio o ponto no mapa',
  horario_texto       VARCHAR(255)  NULL COMMENT 'Horário como a fonte publica',
  vinte_quatro_horas  BOOLEAN       NOT NULL DEFAULT FALSE,
  abre_feriados       ENUM('aberto','fechado') NULL,
  site                VARCHAR(255)  NULL,
  entrada             VARCHAR(100)  NULL COMMENT 'Ex.: Gratuita',
  imagem              VARCHAR(255)  NULL,
  observacao          TEXT          NULL,
  cnes                VARCHAR(10)   NULL COMMENT 'Código do estabelecimento de saúde no CNES',
  tem_rampa           BOOLEAN       NULL,
  tem_banheiro_adaptado BOOLEAN     NULL,
  atualizado_em       DATE          NOT NULL,
  CONSTRAINT pk_local PRIMARY KEY (id),
  CONSTRAINT fk_local_tipo FOREIGN KEY (tipo_local_id)
    REFERENCES tipo_local (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_local_bairro FOREIGN KEY (bairro_id)
    REFERENCES bairro (id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT ck_local_cep CHECK (cep IS NULL OR cep REGEXP '^[0-9]{5}-[0-9]{3}$'),
  CONSTRAINT ck_local_lat CHECK (latitude  IS NULL OR latitude  BETWEEN -90  AND 90),
  CONSTRAINT ck_local_lng CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
) ENGINE=InnoDB;
CREATE INDEX ix_local_nome ON local (nome);

-- Telefones de um local (um local pode ter vários)
CREATE TABLE telefone_local (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  local_id  VARCHAR(80)  NOT NULL,
  numero    VARCHAR(40)  NOT NULL,
  ordem     TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Posição na lista (0 = telefone principal)',
  CONSTRAINT pk_telefone_local PRIMARY KEY (id),
  CONSTRAINT uk_telefone_local UNIQUE (local_id, numero),
  CONSTRAINT fk_telefone_local FOREIGN KEY (local_id)
    REFERENCES local (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Horário de funcionamento: uma linha por dia da semana e faixa (usado no "Aberto agora")
CREATE TABLE horario_funcionamento (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  local_id    VARCHAR(80)  NOT NULL,
  dia_semana  ENUM('seg','ter','qua','qui','sex','sab','dom') NOT NULL,
  abre        TIME NOT NULL,
  fecha       TIME NOT NULL,
  CONSTRAINT pk_horario PRIMARY KEY (id),
  CONSTRAINT uk_horario UNIQUE (local_id, dia_semana, abre, fecha),
  CONSTRAINT fk_horario_local FOREIGN KEY (local_id)
    REFERENCES local (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Serviços oferecidos em um local (ex.: "Procon", "Horta orgânica")
CREATE TABLE servico_local (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  local_id   VARCHAR(80)  NOT NULL,
  descricao  VARCHAR(255) NOT NULL,
  ordem      TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Posição na lista',
  CONSTRAINT pk_servico_local PRIMARY KEY (id),
  CONSTRAINT fk_servico_local FOREIGN KEY (local_id)
    REFERENCES local (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Níveis de ensino atendidos por uma escola (Creche, Pré-escola, Ensino fundamental...)
CREATE TABLE nivel_ensino_local (
  local_id  VARCHAR(80)  NOT NULL,
  nivel     VARCHAR(80)  NOT NULL,
  CONSTRAINT pk_nivel_ensino_local PRIMARY KEY (local_id, nivel),
  CONSTRAINT fk_nivel_local FOREIGN KEY (local_id)
    REFERENCES local (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Palavras-chave usadas pela busca (ex.: "posto de saúde" encontra as UBS)
CREATE TABLE palavra_chave_local (
  local_id  VARCHAR(80)  NOT NULL,
  palavra   VARCHAR(80)  NOT NULL,
  CONSTRAINT pk_palavra_chave_local PRIMARY KEY (local_id, palavra),
  CONSTRAINT fk_palavra_local FOREIGN KEY (local_id)
    REFERENCES local (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Fontes oficiais de cada local (regra do projeto: nenhum dado sem fonte)
CREATE TABLE fonte_local (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  local_id  VARCHAR(80)  NOT NULL,
  url       VARCHAR(500) NOT NULL,
  ordem     TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Posição na lista',
  CONSTRAINT pk_fonte_local PRIMARY KEY (id),
  CONSTRAINT fk_fonte_local FOREIGN KEY (local_id)
    REFERENCES local (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- B) CONTEÚDO DE APOIO
-- -----------------------------------------------------------------------------

-- Telefones úteis e de emergência (página /contatos)
CREATE TABLE contato (
  id          VARCHAR(60)  NOT NULL,
  nome        VARCHAR(120) NOT NULL,
  telefone    VARCHAR(40)  NOT NULL,
  descricao   VARCHAR(255) NULL,
  grupo       VARCHAR(20)  NOT NULL COMMENT 'saude, seguranca, direitos, prefeitura, mobilidade',
  emergencia  BOOLEAN      NOT NULL DEFAULT FALSE,
  fonte_url   VARCHAR(500) NOT NULL,
  CONSTRAINT pk_contato PRIMARY KEY (id),
  CONSTRAINT ck_contato_grupo CHECK (grupo IN ('saude','seguranca','direitos','prefeitura','mobilidade'))
) ENGINE=InnoDB;

-- Categorias dos serviços online (Prefeitura, Impostos, Documentos...)
CREATE TABLE categoria_servico_online (
  slug  VARCHAR(20) NOT NULL,
  nome  VARCHAR(60) NOT NULL,
  CONSTRAINT pk_categoria_servico_online PRIMARY KEY (slug)
) ENGINE=InnoDB;

-- Links oficiais de serviços pela internet (IPTU, Minha Vacina, multas...)
CREATE TABLE servico_online (
  id              VARCHAR(60)  NOT NULL,
  nome            VARCHAR(120) NOT NULL,
  descricao       VARCHAR(255) NULL,
  categoria_slug  VARCHAR(20)  NOT NULL,
  url             VARCHAR(500) NOT NULL,
  CONSTRAINT pk_servico_online PRIMARY KEY (id),
  CONSTRAINT fk_servico_online_categoria FOREIGN KEY (categoria_slug)
    REFERENCES categoria_servico_online (slug) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Grupos do checklist "Primeiros passos" (Saúde, Escola e creche, Casa, Documentos...)
CREATE TABLE checklist_grupo (
  id    VARCHAR(30) NOT NULL,
  nome  VARCHAR(60) NOT NULL,
  ordem TINYINT UNSIGNED NOT NULL,
  CONSTRAINT pk_checklist_grupo PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Itens do checklist da mudança
CREATE TABLE checklist_item (
  id          VARCHAR(60)  NOT NULL,
  grupo_id    VARCHAR(30)  NOT NULL,
  titulo      VARCHAR(150) NOT NULL,
  o_que_e     TEXT         NOT NULL,
  por_que     TEXT         NULL,
  como_fazer  TEXT         NULL,
  online      BOOLEAN      NOT NULL DEFAULT FALSE,
  documentos  TEXT         NULL COMMENT 'Lista separada por "; " (só quando a fonte informa)',
  prazo       VARCHAR(255) NULL,
  perfil      VARCHAR(20)  NULL COMMENT 'criancas, pet, carro — itens que só valem para alguns',
  pagina_rota VARCHAR(60)  NULL,
  ordem       TINYINT UNSIGNED NOT NULL,
  CONSTRAINT pk_checklist_item PRIMARY KEY (id),
  CONSTRAINT fk_checklist_item_grupo FOREIGN KEY (grupo_id)
    REFERENCES checklist_grupo (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Links oficiais de cada item do checklist
CREATE TABLE checklist_link (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id  VARCHAR(60)  NOT NULL,
  nome     VARCHAR(150) NOT NULL,
  url      VARCHAR(500) NOT NULL,
  CONSTRAINT pk_checklist_link PRIMARY KEY (id),
  CONSTRAINT fk_checklist_link_item FOREIGN KEY (item_id)
    REFERENCES checklist_item (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Feriados nacionais, municipais e pontos facultativos (usados no "Aberto agora")
CREATE TABLE feriado (
  data       DATE         NOT NULL,
  nome       VARCHAR(100) NOT NULL,
  tipo       ENUM('nacional','municipal','ponto facultativo') NOT NULL,
  fonte_url  VARCHAR(500) NOT NULL,
  CONSTRAINT pk_feriado PRIMARY KEY (data)
) ENGINE=InnoDB;

-- Grupos do "Dia a dia" (Mercados, Padarias, Farmácias...)
CREATE TABLE grupo_comercio (
  id    VARCHAR(20) NOT NULL,
  nome  VARCHAR(60) NOT NULL,
  CONSTRAINT pk_grupo_comercio PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Comércio do dia a dia (dados colaborativos do OpenStreetMap)
CREATE TABLE estabelecimento (
  id             VARCHAR(40)  NOT NULL COMMENT 'Ex.: osm-way-1218821584',
  nome           VARCHAR(150) NOT NULL,
  tipo           VARCHAR(60)  NOT NULL,
  grupo_id       VARCHAR(20)  NOT NULL,
  logradouro     VARCHAR(150) NULL,
  numero         VARCHAR(20)  NULL,
  bairro_nome    VARCHAR(100) NULL,
  latitude       DECIMAL(10,7) NULL,
  longitude      DECIMAL(10,7) NULL,
  telefone       VARCHAR(40)  NULL,
  horario_texto  VARCHAR(255) NULL,
  site           VARCHAR(255) NULL,
  observacao     VARCHAR(255) NULL,
  osm_ref        VARCHAR(40)  NULL COMMENT 'Nulo quando a fonte é a Prefeitura',
  atualizado_em  DATE         NOT NULL,
  CONSTRAINT pk_estabelecimento PRIMARY KEY (id),
  CONSTRAINT fk_estabelecimento_grupo FOREIGN KEY (grupo_id)
    REFERENCES grupo_comercio (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- C) USUÁRIOS E INTERAÇÃO
-- Hoje esses dados ficam no localStorage do navegador (chaves cc:*). Com o back-end
-- em Spring Boot, passam a ser gravados aqui, ligados à conta do usuário.
-- -----------------------------------------------------------------------------

CREATE TABLE usuario (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome         VARCHAR(120) NOT NULL,
  email        VARCHAR(160) NOT NULL,
  senha_hash   CHAR(60)     NOT NULL COMMENT 'Hash BCrypt; a senha nunca é gravada em texto',
  perfil       ENUM('CIDADAO','ADMIN') NOT NULL DEFAULT 'CIDADAO',
  bairro_id    INT UNSIGNED NULL COMMENT 'Meu bairro (antes: cc:meu-bairro)',
  tema         ENUM('auto','claro','escuro') NOT NULL DEFAULT 'auto',
  tamanho_fonte ENUM('normal','grande','maior') NOT NULL DEFAULT 'normal',
  libras       BOOLEAN      NOT NULL DEFAULT FALSE,
  ativo        BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuario PRIMARY KEY (id),
  CONSTRAINT uk_usuario_email UNIQUE (email),
  CONSTRAINT fk_usuario_bairro FOREIGN KEY (bairro_id)
    REFERENCES bairro (id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT ck_usuario_email CHECK (email LIKE '%_@_%._%')
) ENGINE=InnoDB;

-- Lembretes (página /lembretes; antes: cc:lembretes)
CREATE TABLE lembrete (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  BIGINT UNSIGNED NOT NULL,
  texto       VARCHAR(200) NOT NULL,
  data        DATE         NULL,
  hora        TIME         NULL,
  local_id    VARCHAR(80)  NULL,
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_lembrete PRIMARY KEY (id),
  CONSTRAINT fk_lembrete_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_lembrete_local FOREIGN KEY (local_id)
    REFERENCES local (id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT ck_lembrete_hora CHECK (hora IS NULL OR data IS NOT NULL)
) ENGINE=InnoDB;

-- Sugestões de locais enviadas pelos usuários (antes: cc:sugestoes:<categoria>)
CREATE TABLE sugestao_local (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id      BIGINT UNSIGNED NOT NULL,
  categoria_slug  VARCHAR(20)  NOT NULL,
  nome            VARCHAR(150) NOT NULL,
  status          ENUM('PENDENTE','APROVADA','RECUSADA') NOT NULL DEFAULT 'PENDENTE',
  criado_em       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_sugestao_local PRIMARY KEY (id),
  CONSTRAINT fk_sugestao_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sugestao_categoria FOREIGN KEY (categoria_slug)
    REFERENCES categoria (slug) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Itens do checklist marcados como feitos (antes: cc:checklist)
CREATE TABLE progresso_checklist (
  usuario_id  BIGINT UNSIGNED NOT NULL,
  item_id     VARCHAR(60)  NOT NULL,
  feito_em    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_progresso_checklist PRIMARY KEY (usuario_id, item_id),
  CONSTRAINT fk_progresso_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_progresso_item FOREIGN KEY (item_id)
    REFERENCES checklist_item (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- "Esta página foi útil?" — um voto por usuário e página (antes: cc:paginas-uteis)
CREATE TABLE avaliacao_pagina (
  usuario_id  BIGINT UNSIGNED NOT NULL,
  pagina      VARCHAR(120) NOT NULL COMMENT 'Rota avaliada, ex.: /saude/ubs-cecap',
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_avaliacao_pagina PRIMARY KEY (usuario_id, pagina),
  CONSTRAINT fk_avaliacao_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- VISÃO usada pelas páginas de categoria: local + tipo + categoria + 1º telefone
-- -----------------------------------------------------------------------------
CREATE VIEW vw_local_resumo AS
SELECT l.id,
       l.nome,
       c.slug  AS categoria,
       t.nome  AS tipo,
       l.endereco_completo,
       COALESCE(b.nome, l.bairro_nome) AS bairro,
       (SELECT tl.numero FROM telefone_local tl
         WHERE tl.local_id = l.id ORDER BY tl.ordem LIMIT 1) AS telefone,
       l.horario_texto,
       l.latitude,
       l.longitude
  FROM local l
  JOIN tipo_local t ON t.id = l.tipo_local_id
  JOIN categoria  c ON c.slug = t.categoria_slug
  LEFT JOIN bairro b ON b.id = l.bairro_id;
