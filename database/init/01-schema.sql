-- ==============================================================================
-- DDL Oficial - HCR Corretora de Seguros (PostgreSQL 16)
-- Modelo Físico Completo conforme Documentação Oficial do Projeto Integrador
-- ==============================================================================

DROP TABLE IF EXISTS log_auditoria CASCADE;
DROP TABLE IF EXISTS notificacao_alerta CASCADE;
DROP TABLE IF EXISTS parcela_pagamentos CASCADE;
DROP TABLE IF EXISTS apolice CASCADE;
DROP TABLE IF EXISTS proposta CASCADE;
DROP TABLE IF EXISTS cotacao CASCADE;
DROP TABLE IF EXISTS cobertura CASCADE;
DROP TABLE IF EXISTS telefone CASCADE;
DROP TABLE IF EXISTS endereco CASCADE;
DROP TABLE IF EXISTS corretor CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;
DROP TABLE IF EXISTS administrador CASCADE;
DROP TABLE IF EXISTS seguro CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

-- Tabelas antigas do scaffolding se existirem
DROP TABLE IF EXISTS apolices CASCADE;
DROP TABLE IF EXISTS seguros CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- 1. Criação das Tabelas Fortes (Independentes)
CREATE TABLE usuario (
    id BIGSERIAL PRIMARY KEY,
    login_email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil_acesso VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO'
);

CREATE TABLE seguro (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    caracteristicas TEXT,
    valor_base NUMERIC(10,2) DEFAULT 0.00
);

-- 2. Criação das Tabelas de Atores (Dependentes de Usuario)
CREATE TABLE administrador (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cargo VARCHAR(50) NOT NULL,
    fk_usuario_id BIGINT NOT NULL UNIQUE,
    CONSTRAINT fk_administrador_usuario FOREIGN KEY (fk_usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
);

CREATE TABLE cliente (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf_cnpj VARCHAR(18) NOT NULL UNIQUE,
    data_nasc DATE NOT NULL,
    email VARCHAR(100) NOT NULL,
    fk_usuario_id BIGINT UNIQUE,
    CONSTRAINT fk_cliente_usuario FOREIGN KEY (fk_usuario_id) REFERENCES usuario (id) ON DELETE SET NULL
);

CREATE TABLE corretor (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    dados_profissionais VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    fk_usuario_id BIGINT UNIQUE,
    CONSTRAINT fk_corretor_usuario FOREIGN KEY (fk_usuario_id) REFERENCES usuario (id) ON DELETE SET NULL
);

-- 3. Criação das Tabelas Satélites e de Produtos
CREATE TABLE endereco (
    id BIGSERIAL PRIMARY KEY,
    cep VARCHAR(10) NOT NULL,
    logradouro VARCHAR(150) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(100),
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    fk_cliente_id BIGINT NOT NULL,
    CONSTRAINT fk_endereco_cliente FOREIGN KEY (fk_cliente_id) REFERENCES cliente (id) ON DELETE CASCADE
);

CREATE TABLE telefone (
    id BIGSERIAL PRIMARY KEY,
    ddd CHAR(2) NOT NULL,
    numero VARCHAR(15) NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'CELULAR',
    fk_cliente_id BIGINT NOT NULL,
    CONSTRAINT fk_telefone_cliente FOREIGN KEY (fk_cliente_id) REFERENCES cliente (id) ON DELETE CASCADE
);

CREATE TABLE cobertura (
    id BIGSERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(10,2) DEFAULT 0.00,
    fk_seguro_id BIGINT NOT NULL,
    CONSTRAINT fk_cobertura_seguro FOREIGN KEY (fk_seguro_id) REFERENCES seguro (id) ON DELETE CASCADE
);

-- 4. Criação das Tabelas de Processo de Venda
CREATE TABLE cotacao (
    id BIGSERIAL PRIMARY KEY,
    data_solicitacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor NUMERIC(10,2),
    situacao VARCHAR(50) NOT NULL DEFAULT 'SOLICITADA',
    fk_cliente_id BIGINT NOT NULL,
    fk_corretor_id BIGINT,
    fk_seguro_id BIGINT NOT NULL,
    CONSTRAINT fk_cotacao_cliente FOREIGN KEY (fk_cliente_id) REFERENCES cliente (id) ON DELETE RESTRICT,
    CONSTRAINT fk_cotacao_corretor FOREIGN KEY (fk_corretor_id) REFERENCES corretor (id) ON DELETE SET NULL,
    CONSTRAINT fk_cotacao_seguro FOREIGN KEY (fk_seguro_id) REFERENCES seguro (id) ON DELETE RESTRICT
);

CREATE TABLE proposta (
    id BIGSERIAL PRIMARY KEY,
    condicoes TEXT NOT NULL,
    situacao VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
    fk_cotacao_id BIGINT NOT NULL UNIQUE,
    CONSTRAINT fk_proposta_cotacao FOREIGN KEY (fk_cotacao_id) REFERENCES cotacao (id) ON DELETE CASCADE
);

-- 5. Criação da Contratação e Financeiro
CREATE TABLE apolice (
    id BIGSERIAL PRIMARY KEY,
    numero_apolice VARCHAR(50) NOT NULL UNIQUE,
    data_inicio DATE NOT NULL,
    data_termino DATE NOT NULL,
    situacao VARCHAR(50) NOT NULL DEFAULT 'ATIVA',
    valor_premio NUMERIC(10,2) DEFAULT 0.00,
    fk_cliente_id BIGINT NOT NULL,
    fk_corretor_id BIGINT NOT NULL,
    fk_seguro_id BIGINT NOT NULL,
    id_apolice_anterior BIGINT,
    CONSTRAINT fk_apolice_cliente FOREIGN KEY (fk_cliente_id) REFERENCES cliente (id) ON DELETE RESTRICT,
    CONSTRAINT fk_apolice_corretor FOREIGN KEY (fk_corretor_id) REFERENCES corretor (id) ON DELETE RESTRICT,
    CONSTRAINT fk_apolice_seguro FOREIGN KEY (fk_seguro_id) REFERENCES seguro (id) ON DELETE RESTRICT,
    CONSTRAINT fk_apolice_renovacao FOREIGN KEY (id_apolice_anterior) REFERENCES apolice (id) ON DELETE SET NULL
);

CREATE TABLE parcela_pagamentos (
    id BIGSERIAL PRIMARY KEY,
    valor NUMERIC(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
    fk_apolice_id BIGINT NOT NULL,
    CONSTRAINT fk_parcela_apolice FOREIGN KEY (fk_apolice_id) REFERENCES apolice (id) ON DELETE CASCADE
);

-- 6. Criação das Tabelas de Sistema e Segurança
CREATE TABLE notificacao_alerta (
    id BIGSERIAL PRIMARY KEY,
    assunto VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fk_usuario_id BIGINT NOT NULL,
    CONSTRAINT fk_notificacao_usuario FOREIGN KEY (fk_usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
);

CREATE TABLE log_auditoria (
    id BIGSERIAL PRIMARY KEY,
    acao_realizada VARCHAR(255) NOT NULL,
    data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tabela_afetada VARCHAR(50) NOT NULL,
    ip_origem VARCHAR(45),
    fk_usuario_id BIGINT,
    CONSTRAINT fk_log_usuario FOREIGN KEY (fk_usuario_id) REFERENCES usuario (id) ON DELETE SET NULL
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_usuario_login ON usuario(login_email);
CREATE INDEX IF NOT EXISTS idx_cliente_cpf_cnpj ON cliente(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_apolice_numero ON apolice(numero_apolice);
CREATE INDEX IF NOT EXISTS idx_apolice_termino ON apolice(data_termino);
CREATE INDEX IF NOT EXISTS idx_apolice_cliente ON apolice(fk_cliente_id);
CREATE INDEX IF NOT EXISTS idx_cotacao_cliente ON cotacao(fk_cliente_id);
