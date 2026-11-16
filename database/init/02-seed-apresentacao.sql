-- ==============================================================================
-- Carga de Dados para Apresentação - HCR Corretora de Seguros (PostgreSQL 16)
-- Contém usuários (corporativos, Gmail, Hotmail), corretores, clientes PF e PJ,
-- produtos de seguro, coberturas, cotações, propostas, apólices e parcelas.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Limpeza segura caso executado manualmente sobre base existente
TRUNCATE TABLE
    log_auditoria,
    notificacao_alerta,
    parcela_pagamentos,
    apolice,
    proposta,
    cotacao,
    cobertura,
    telefone,
    endereco,
    corretor,
    cliente,
    administrador,
    seguro,
    usuario
RESTART IDENTITY CASCADE;

-- ==============================================================================
-- 1. USUÁRIOS (Senhas com hash BCrypt real via pgcrypto)
--    admin@hcr.com.br / admin@hcr.com -> senha: admin123
--    corretores                       -> senha: corretor123
--    clientes                         -> senha: cliente123
-- ==============================================================================
INSERT INTO usuario (id, nome, login_email, senha, perfil_acesso, status) VALUES
    (1, 'Dalton Rezende', 'admin@hcr.com.br', crypt('admin123', gen_salt('bf', 10)), 'ADMINISTRADOR', 'ATIVO'),
    (2, 'Helena Castro Rocha', 'admin@hcr.com', crypt('admin123', gen_salt('bf', 10)), 'ADMINISTRADOR', 'ATIVO'),
    (3, 'Carlos Eduardo Silva', 'carlos.silva@corretora.com.br', crypt('corretor123', gen_salt('bf', 10)), 'CORRETOR', 'ATIVO'),
    (4, 'Ana Paula Santos', 'ana.santos@gmail.com', crypt('corretor123', gen_salt('bf', 10)), 'CORRETOR', 'ATIVO'),
    (5, 'Rafael Guimarães', 'rafael.guimaraes@hotmail.com', crypt('corretor123', gen_salt('bf', 10)), 'CORRETOR', 'ATIVO'),
    (6, 'Fernanda Lima', 'fernanda.lima@hcrseguros.com.br', crypt('corretor123', gen_salt('bf', 10)), 'CORRETOR', 'INATIVO'),
    (7, 'João Pereira da Silva', 'joao.silva@gmail.com', crypt('cliente123', gen_salt('bf', 10)), 'CLIENTE', 'ATIVO'),
    (8, 'Mariana de Souza Oliveira', 'mariana.souza@hotmail.com.br', crypt('cliente123', gen_salt('bf', 10)), 'CLIENTE', 'ATIVO'),
    (9, 'Construtora Planalto Ltda', 'contato@construtoraplanalto.com.br', crypt('cliente123', gen_salt('bf', 10)), 'CLIENTE', 'ATIVO'),
    (10, 'TransLogística Centro-Oeste S/A', 'financeiro@translogistica.com.br', crypt('cliente123', gen_salt('bf', 10)), 'CLIENTE', 'ATIVO'),
    (11, 'Roberto Mendes Alves', 'roberto.mendes@gmail.com', crypt('cliente123', gen_salt('bf', 10)), 'CLIENTE', 'INATIVO'),
    (12, 'Camila Ribeiro Costa', 'camila.costa@outlook.com', crypt('cliente123', gen_salt('bf', 10)), 'CLIENTE', 'ATIVO');

SELECT setval('usuario_id_seq', (SELECT MAX(id) FROM usuario));

-- ==============================================================================
-- 2. ADMINISTRADORES
-- ==============================================================================
INSERT INTO administrador (id, nome, cargo, fk_usuario_id) VALUES
    (1, 'Dalton Rezende', 'Gerente Geral de Operações', 1),
    (2, 'Helena Castro Rocha', 'Diretora Executiva HCR', 2);

SELECT setval('administrador_id_seq', (SELECT MAX(id) FROM administrador));

-- ==============================================================================
-- 3. CORRETORES
-- ==============================================================================
INSERT INTO corretor (id, nome, dados_profissionais, especialidade, telefone, status, fk_usuario_id) VALUES
    (1, 'Carlos Eduardo Silva', 'SUSEP-102938-DF', 'Automóvel e Frotas', '(61) 99812-3400', 'ATIVO', 3),
    (2, 'Ana Paula Santos', 'SUSEP-204859-DF', 'Residencial e Patrimonial', '(61) 99123-4567', 'ATIVO', 4),
    (3, 'Rafael Guimarães', 'SUSEP-309412-SP', 'Vida e Empresarial', '(11) 98765-1122', 'ATIVO', 5),
    (4, 'Fernanda Lima', 'SUSEP-405199-GO', 'Saúde e Benefícios', '(62) 98444-5566', 'INATIVO', 6);

SELECT setval('corretor_id_seq', (SELECT MAX(id) FROM corretor));

-- ==============================================================================
-- 4. CLIENTES (PF e PJ), ENDEREÇOS E TELEFONES
-- ==============================================================================
INSERT INTO cliente (id, nome, cpf_cnpj, data_nasc, email, fk_usuario_id) VALUES
    (1, 'João Pereira da Silva', '123.456.789-00', '1988-04-12', 'joao.silva@gmail.com', 7),
    (2, 'Mariana de Souza Oliveira', '987.654.321-99', '1993-08-20', 'mariana.souza@hotmail.com.br', 8),
    (3, 'Construtora Planalto Ltda', '12.345.678/0001-90', '2012-03-15', 'contato@construtoraplanalto.com.br', 9),
    (4, 'TransLogística Centro-Oeste S/A', '45.678.901/0001-23', '2016-10-05', 'financeiro@translogistica.com.br', 10),
    (5, 'Roberto Mendes Alves', '456.789.123-44', '1979-11-28', 'roberto.mendes@gmail.com', 11),
    (6, 'Camila Ribeiro Costa', '321.654.987-11', '1995-02-14', 'camila.costa@outlook.com', 12);

SELECT setval('cliente_id_seq', (SELECT MAX(id) FROM cliente));

INSERT INTO endereco (cep, logradouro, numero, complemento, bairro, cidade, estado, fk_cliente_id) VALUES
    ('70390-020', 'SQS 204 Bloco B', '204', 'Apto 301', 'Asa Sul', 'Brasília', 'DF', 1),
    ('71909-540', 'Rua 12 Norte', '150', 'Residencial Solar', 'Águas Claras', 'Brasília', 'DF', 2),
    ('70306-000', 'SCS Quadra 06 Bloco A', '110', 'Salas 401 a 405', 'Asa Sul', 'Brasília', 'DF', 3),
    ('71200-030', 'SIA Trecho 3 Lote 625', '625', 'Galpão Logístico 2', 'SIA', 'Brasília', 'DF', 4),
    ('71635-200', 'SHIS QI 15 Conjunto 4', '18', 'Casa', 'Lago Sul', 'Brasília', 'DF', 5),
    ('70673-410', 'SQSW 304 Bloco D', '304', 'Apto 502', 'Sudoeste', 'Brasília', 'DF', 6);

INSERT INTO telefone (ddd, numero, tipo, fk_cliente_id) VALUES
    ('61', '98765-4321', 'CELULAR', 1),
    ('61', '99123-4567', 'CELULAR', 2),
    ('61', '3321-8899', 'COMERCIAL', 3),
    ('61', '3361-4400', 'COMERCIAL', 4),
    ('61', '98111-2233', 'CELULAR', 5),
    ('61', '99456-7890', 'CELULAR', 6);

-- ==============================================================================
-- 5. SEGUROS E COBERTURAS
-- ==============================================================================
INSERT INTO seguro (id, nome, descricao, caracteristicas, valor_base) VALUES
    (1, 'Seguro Automóvel Completo', 'Proteção compreensiva 100% FIPE para veículos de passeio com assistência 24h nacional.', 'Auto', 2400.00),
    (2, 'Seguro Residencial Premium', 'Proteção completa para casas e apartamentos com serviços emergenciais 24h inclusos.', 'Residencial', 960.00),
    (3, 'Seguro de Vida e Acidentes Pessoais', 'Estabilidade financeira e amparo imediato para o segurado e seus beneficiários.', 'Vida', 720.00),
    (4, 'Seguro Empresarial Patrimonial', 'Cobertura multirrisco para escritórios, comércios, galpões e equipamentos.', 'Empresarial', 4800.00),
    (5, 'Seguro Frota Corporativa', 'Gestão e proteção integrada para frotas comerciais, caminhões e utilitários.', 'Auto', 9600.00);

SELECT setval('seguro_id_seq', (SELECT MAX(id) FROM seguro));

INSERT INTO cobertura (descricao, valor, fk_seguro_id) VALUES
    ('Colisão, Incêndio, Roubo e Furto (100% FIPE)', 120000.00, 1),
    ('Danos Materiais e Corporais a Terceiros (RCF-V)', 150000.00, 1),
    ('Assistência 24h Guincho Ilimitado e Carro Reserva 15 dias', 25000.00, 1),
    ('Incêndio, Queda de Raio e Explosão', 450000.00, 2),
    ('Danos Elétricos e Quebra de Vidros', 35000.00, 2),
    ('Vendaval, Destelhamento e Assistência 24h', 40000.00, 2),
    ('Morte Qualquer Causa (Natural ou Acidental)', 300000.00, 3),
    ('Invalidez Permanente Total ou Parcial por Acidente', 300000.00, 3),
    ('Auxílio Funeral Familiar e Doenças Graves', 50000.00, 3),
    ('Incêndio, Explosão e Fumaça em Planta Comercial', 1200000.00, 4),
    ('Lucros Cessantes e Responsabilidade Civil Operações', 350000.00, 4),
    ('Cobertura Casco e RCF para Frota Pesada', 800000.00, 5),
    ('Socorro Mecânico Pesado e Remoção Nacional', 100000.00, 5);

-- ==============================================================================
-- 6. COTAÇÕES E PROPOSTAS
-- ==============================================================================
INSERT INTO cotacao (id, data_solicitacao, valor, situacao, fk_cliente_id, fk_corretor_id, fk_seguro_id) VALUES
    (1, CURRENT_TIMESTAMP - INTERVAL '18 days', 2400.00, 'APROVADA', 1, 1, 1),
    (2, CURRENT_TIMESTAMP - INTERVAL '12 days', 4800.00, 'APROVADA', 3, 3, 4),
    (3, CURRENT_TIMESTAMP - INTERVAL '4 days', 9600.00, 'PROPOSTA_GERADA', 4, 1, 5),
    (4, CURRENT_TIMESTAMP - INTERVAL '2 days', 960.00, 'SOLICITADA', 6, 2, 2),
    (5, CURRENT_TIMESTAMP - INTERVAL '25 days', 720.00, 'RECUSADA', 5, 3, 3);

SELECT setval('cotacao_id_seq', (SELECT MAX(id) FROM cotacao));

INSERT INTO proposta (id, condicoes, situacao, fk_cotacao_id) VALUES
    (1, 'Cobertura compreensiva 100% FIPE, franquia reduzida de R$ 1.450,00, carro reserva 15 dias e parcelamento em 12x.', 'ACEITA', 1),
    (2, 'Apólice multirrisco empresarial com cobertura de equipamentos, RC operações e pagamento em 6x sem juros.', 'ACEITA', 2),
    (3, 'Proteção para 6 veículos utilitários da frota com RCF de R$ 300 mil por veículo e assistência pesada 24h.', 'PENDENTE', 3),
    (4, 'Plano de Vida Individual com capital segurado de R$ 300 mil e sorteios mensais.', 'RECUSADA', 5);

SELECT setval('proposta_id_seq', (SELECT MAX(id) FROM proposta));

-- ==============================================================================
-- 7. APÓLICES E PARCELAS DE PAGAMENTO
-- ==============================================================================
INSERT INTO apolice (id, numero_apolice, data_inicio, data_termino, situacao, valor_premio, fk_cliente_id, fk_corretor_id, fk_seguro_id, id_apolice_anterior) VALUES
    -- Apólice 1: Ativa (João Pereira da Silva)
    (1, 'APO-2026-AUTO-001', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '275 days', 'ATIVA', 2400.00, 1, 1, 1, NULL),
    -- Apólice 2: Ativa e próxima do vencimento em 14 dias (Mariana de Souza Oliveira) -> dispara Alerta!
    (2, 'APO-2026-RES-002', CURRENT_DATE - INTERVAL '351 days', CURRENT_DATE + INTERVAL '14 days', 'ATIVA', 960.00, 2, 2, 2, NULL),
    -- Apólice 3: Ativa Empresarial (Construtora Planalto Ltda)
    (3, 'APO-2026-EMP-003', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '305 days', 'ATIVA', 4800.00, 3, 3, 4, NULL),
    -- Apólice 4: Ativa e próxima do vencimento em 22 dias (TransLogística Centro-Oeste S/A)
    (4, 'APO-2026-FROTA-004', CURRENT_DATE - INTERVAL '343 days', CURRENT_DATE + INTERVAL '22 days', 'ATIVA', 9600.00, 4, 1, 5, NULL),
    -- Apólice 5: Ativa Vida (Camila Ribeiro Costa)
    (5, 'APO-2026-VIDA-005', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '335 days', 'ATIVA', 720.00, 6, 3, 3, NULL),
    -- Apólice 6: Cancelada (Roberto Mendes Alves)
    (6, 'APO-2026-AUTO-006', CURRENT_DATE - INTERVAL '180 days', CURRENT_DATE + INTERVAL '185 days', 'CANCELADA', 2100.00, 5, 1, 1, NULL);

SELECT setval('apolice_id_seq', (SELECT MAX(id) FROM apolice));

-- Parcelas da Apólice 1 (12x de R$ 200,00 - 3 pagas e 9 pendentes para demonstração)
INSERT INTO parcela_pagamentos (numero_parcela, valor, data_vencimento, status, forma_pagamento, data_pagamento, fk_apolice_id) VALUES
    (1, 200.00, CURRENT_DATE - INTERVAL '90 days', 'PAGO', 'PIX', CURRENT_DATE - INTERVAL '90 days', 1),
    (2, 200.00, CURRENT_DATE - INTERVAL '60 days', 'PAGO', 'PIX', CURRENT_DATE - INTERVAL '60 days', 1),
    (3, 200.00, CURRENT_DATE - INTERVAL '30 days', 'PAGO', 'Cartão de Crédito', CURRENT_DATE - INTERVAL '30 days', 1),
    (4, 200.00, CURRENT_DATE, 'PENDENTE', NULL, NULL, 1),
    (5, 200.00, CURRENT_DATE + INTERVAL '30 days', 'PENDENTE', NULL, NULL, 1),
    (6, 200.00, CURRENT_DATE + INTERVAL '60 days', 'PENDENTE', NULL, NULL, 1),
    (7, 200.00, CURRENT_DATE + INTERVAL '90 days', 'PENDENTE', NULL, NULL, 1),
    (8, 200.00, CURRENT_DATE + INTERVAL '120 days', 'PENDENTE', NULL, NULL, 1),
    (9, 200.00, CURRENT_DATE + INTERVAL '150 days', 'PENDENTE', NULL, NULL, 1),
    (10, 200.00, CURRENT_DATE + INTERVAL '180 days', 'PENDENTE', NULL, NULL, 1),
    (11, 200.00, CURRENT_DATE + INTERVAL '210 days', 'PENDENTE', NULL, NULL, 1),
    (12, 200.00, CURRENT_DATE + INTERVAL '240 days', 'PENDENTE', NULL, NULL, 1);

-- Parcelas da Apólice 2 (6x de R$ 160,00 - 5 pagas e 1 pendente)
INSERT INTO parcela_pagamentos (numero_parcela, valor, data_vencimento, status, forma_pagamento, data_pagamento, fk_apolice_id) VALUES
    (1, 160.00, CURRENT_DATE - INTERVAL '351 days', 'PAGO', 'Boleto Bancário', CURRENT_DATE - INTERVAL '351 days', 2),
    (2, 160.00, CURRENT_DATE - INTERVAL '291 days', 'PAGO', 'Boleto Bancário', CURRENT_DATE - INTERVAL '291 days', 2),
    (3, 160.00, CURRENT_DATE - INTERVAL '231 days', 'PAGO', 'PIX', CURRENT_DATE - INTERVAL '231 days', 2),
    (4, 160.00, CURRENT_DATE - INTERVAL '171 days', 'PAGO', 'PIX', CURRENT_DATE - INTERVAL '171 days', 2),
    (5, 160.00, CURRENT_DATE - INTERVAL '111 days', 'PAGO', 'PIX', CURRENT_DATE - INTERVAL '111 days', 2),
    (6, 160.00, CURRENT_DATE - INTERVAL '51 days', 'PENDENTE', NULL, NULL, 2);

-- Parcelas da Apólice 3 (6x de R$ 800,00 - 2 pagas e 4 pendentes)
INSERT INTO parcela_pagamentos (numero_parcela, valor, data_vencimento, status, forma_pagamento, data_pagamento, fk_apolice_id) VALUES
    (1, 800.00, CURRENT_DATE - INTERVAL '60 days', 'PAGO', 'Transferência / TED', CURRENT_DATE - INTERVAL '60 days', 3),
    (2, 800.00, CURRENT_DATE - INTERVAL '30 days', 'PAGO', 'Boleto Bancário', CURRENT_DATE - INTERVAL '30 days', 3),
    (3, 800.00, CURRENT_DATE, 'PENDENTE', NULL, NULL, 3),
    (4, 800.00, CURRENT_DATE + INTERVAL '30 days', 'PENDENTE', NULL, NULL, 3),
    (5, 800.00, CURRENT_DATE + INTERVAL '60 days', 'PENDENTE', NULL, NULL, 3),
    (6, 800.00, CURRENT_DATE + INTERVAL '90 days', 'PENDENTE', NULL, NULL, 3);

-- Parcelas da Apólice 4 (4x de R$ 2.400,00 - 3 pagas e 1 pendente)
INSERT INTO parcela_pagamentos (numero_parcela, valor, data_vencimento, status, forma_pagamento, data_pagamento, fk_apolice_id) VALUES
    (1, 2400.00, CURRENT_DATE - INTERVAL '343 days', 'PAGO', 'Transferência / TED', CURRENT_DATE - INTERVAL '343 days', 4),
    (2, 2400.00, CURRENT_DATE - INTERVAL '253 days', 'PAGO', 'Transferência / TED', CURRENT_DATE - INTERVAL '253 days', 4),
    (3, 2400.00, CURRENT_DATE - INTERVAL '163 days', 'PAGO', 'Boleto Bancário', CURRENT_DATE - INTERVAL '163 days', 4),
    (4, 2400.00, CURRENT_DATE - INTERVAL '73 days', 'PENDENTE', NULL, NULL, 4);

-- Parcelas da Apólice 5 (3x de R$ 240,00 - 1 paga e 2 pendentes)
INSERT INTO parcela_pagamentos (numero_parcela, valor, data_vencimento, status, forma_pagamento, data_pagamento, fk_apolice_id) VALUES
    (1, 240.00, CURRENT_DATE - INTERVAL '30 days', 'PAGO', 'Cartão de Débito', CURRENT_DATE - INTERVAL '30 days', 5),
    (2, 240.00, CURRENT_DATE, 'PENDENTE', NULL, NULL, 5),
    (3, 240.00, CURRENT_DATE + INTERVAL '30 days', 'PENDENTE', NULL, NULL, 5);

-- Parcelas da Apólice 6 (Cancelada)
INSERT INTO parcela_pagamentos (numero_parcela, valor, data_vencimento, status, forma_pagamento, data_pagamento, fk_apolice_id) VALUES
    (1, 700.00, CURRENT_DATE - INTERVAL '180 days', 'PAGO', 'PIX', CURRENT_DATE - INTERVAL '180 days', 6),
    (2, 700.00, CURRENT_DATE - INTERVAL '150 days', 'PENDENTE', NULL, NULL, 6),
    (3, 700.00, CURRENT_DATE - INTERVAL '120 days', 'PENDENTE', NULL, NULL, 6);

-- ==============================================================================
-- 8. NOTIFICAÇÕES DE ALERTA E LOGS DE AUDITORIA
-- ==============================================================================
INSERT INTO notificacao_alerta (assunto, status, data_criacao, fk_usuario_id) VALUES
    ('Apólice APO-2026-RES-002 de Mariana de Souza Oliveira vence em 14 dias. Contate a cliente para renovação.', 'PENDENTE', CURRENT_TIMESTAMP - INTERVAL '2 hours', 4),
    ('Apólice APO-2026-FROTA-004 de TransLogística Centro-Oeste S/A vence em 22 dias. Prepare proposta de renovação.', 'PENDENTE', CURRENT_TIMESTAMP - INTERVAL '5 hours', 3),
    ('Proposta #3 (Seguro Frota Corporativa) aguarda aceite do cliente TransLogística Centro-Oeste S/A.', 'PENDENTE', CURRENT_TIMESTAMP - INTERVAL '1 day', 1),
    ('Parcela #4 da apólice APO-2026-AUTO-001 vence hoje. Lembrete enviado ao segurado.', 'PENDENTE', CURRENT_TIMESTAMP - INTERVAL '3 hours', 3),
    ('Carga de apresentação PostgreSQL carregada com sucesso no ambiente Docker.', 'LIDA', CURRENT_TIMESTAMP - INTERVAL '2 days', 1);

INSERT INTO log_auditoria (acao_realizada, data_hora, tabela_afetada, ip_origem, fk_usuario_id) VALUES
    ('CRIACAO: Emissão da apólice APO-2026-AUTO-001 e geração de 12 parcelas', CURRENT_TIMESTAMP - INTERVAL '15 days', 'apolice', '172.18.0.1', 3),
    ('CRIACAO: Emissão da apólice APO-2026-EMP-003 para Construtora Planalto Ltda', CURRENT_TIMESTAMP - INTERVAL '10 days', 'apolice', '172.18.0.1', 5),
    ('PAGAMENTO: Quitação da parcela #3 da apólice APO-2026-AUTO-001 via Cartão de Crédito', CURRENT_TIMESTAMP - INTERVAL '5 days', 'parcela_pagamentos', '172.18.0.1', 3),
    ('CANCELAMENTO: Cancelamento da apólice APO-2026-AUTO-006 a pedido do segurado', CURRENT_TIMESTAMP - INTERVAL '3 days', 'apolice', '172.18.0.1', 1),
    ('SEGURANCA: Desativação temporária do usuário fernanda.lima@hcrseguros.com.br', CURRENT_TIMESTAMP - INTERVAL '1 day', 'usuario', '172.18.0.1', 1);
