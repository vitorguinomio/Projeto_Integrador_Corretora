-- ==============================================================================
-- Carga Completa em TODAS AS 14 TABELAS - HCR Corretora de Seguros (PostgreSQL 16)
-- Popula: usuario, administrador, corretor, cliente, endereco, telefone,
--         seguro, cobertura, cotacao, proposta, apolice, parcela_pagamentos,
--         notificacao_alerta, log_auditoria.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
-- TABELA 1: usuario (17 registros: Administradores, Corretores e Clientes)
-- ==============================================================================
INSERT INTO usuario (id, nome, login_email, senha, perfil_acesso, status) VALUES
    (1, 'Dalton Rezende', 'admin@hcr.com.br', crypt('admin123', gen_salt('bf', 10)), 'ADMINISTRADOR', 'ATIVO'),
    (2, 'Helena Castro Rocha', 'admin@hcr.com', crypt('admin123', gen_salt('bf', 10)), 'ADMINISTRADOR', 'ATIVO'),
    (3, 'Marcos Vinícius Andrade', 'marcos.andrade@hcrseguros.com.br', crypt('admin123', gen_salt('bf', 10)), 'ADMINISTRADOR', 'ATIVO'),
    (4, 'Carlos Eduardo Silva', 'carlos.silva@corretora.com.br', crypt('corretor123', gen_salt('bf', 10)), 'CORRETOR', 'ATIVO'),
    (5, 'Ana Paula Santos', 'ana.santos@gmail.com', crypt('corretor123', gen_salt('bf', 10)), 'CORRETOR', 'ATIVO'),
    (6, 'Rafael Guimarães', 'rafael.guimaraes@hotmail.com', crypt('corretor123', gen_salt('bf', 10)), 'CORRETOR', 'ATIVO'),
    (7, 'Fernanda Lima', 'fernanda.lima@hcrseguros.com.br', crypt('corretor123', gen_salt('bf', 10)), 'CORRETOR', 'INATIVO'),
    (8, 'Lucas Nogueira Martins', 'lucas.martins@outlook.com', crypt('corretor123', gen_salt('bf', 10)), 'CORRETOR', 'ATIVO'),
    (9, 'João Pereira da Silva', 'joao.silva@gmail.com', crypt('cliente123', gen_salt('bf', 10)), 'CLIENTE', 'ATIVO'),
    (10, 'Mariana de Souza Oliveira', 'mariana.souza@hotmail.com.br', crypt('cliente123', gen_salt('bf', 10)), 'CLIENTE', 'ATIVO'),
    (11, 'Construtora Planalto Ltda', 'contato@construtoraplanalto.com.br', crypt('cliente123', gen_salt('bf', 10)), 'CLIENTE', 'ATIVO'),
    (12, 'TransLogística Centro-Oeste S/A', 'financeiro@translogistica.com.br', crypt('cliente123', gen_salt('bf', 10)), 'CLIENTE', 'ATIVO'),
    (13, 'Roberto Mendes Alves', 'roberto.mendes@gmail.com', crypt('cliente123', gen_salt('bf', 10)), 'CLIENTE', 'INATIVO'),
    (14, 'Camila Ribeiro Costa', 'camila.costa@outlook.com', crypt('cliente123', gen_salt('bf', 10)), 'CLIENTE', 'ATIVO'),
    (15, 'Hospital Santa Helena Brasília S/A', 'diretoria@hospitalsantahelena.com.br', crypt('cliente123', gen_salt('bf', 10)), 'CLIENTE', 'ATIVO'),
    (16, 'Pedro Henrique Cavalcanti', 'pedro.cavalcanti@hotmail.com', crypt('cliente123', gen_salt('bf', 10)), 'CLIENTE', 'ATIVO'),
    (17, 'Agropecuária Cerrado Forte Ltda', 'gestao@cerradoforte.com.br', crypt('cliente123', gen_salt('bf', 10)), 'CLIENTE', 'ATIVO');

SELECT setval('usuario_id_seq', (SELECT MAX(id) FROM usuario));

-- ==============================================================================
-- TABELA 2: administrador (3 registros)
-- ==============================================================================
INSERT INTO administrador (id, nome, cargo, fk_usuario_id) VALUES
    (1, 'Dalton Rezende', 'Gerente Geral de Operações', 1),
    (2, 'Helena Castro Rocha', 'Diretora Executiva HCR', 2),
    (3, 'Marcos Vinícius Andrade', 'Superintendente Técnico e Compliance', 3);

SELECT setval('administrador_id_seq', (SELECT MAX(id) FROM administrador));

-- ==============================================================================
-- TABELA 3: corretor (5 registros)
-- ==============================================================================
INSERT INTO corretor (id, nome, dados_profissionais, especialidade, telefone, status, fk_usuario_id) VALUES
    (1, 'Carlos Eduardo Silva', 'SUSEP-102938-DF', 'Automóvel e Frotas', '(61) 99812-3400', 'ATIVO', 4),
    (2, 'Ana Paula Santos', 'SUSEP-204859-DF', 'Residencial e Patrimonial', '(61) 99123-4567', 'ATIVO', 5),
    (3, 'Rafael Guimarães', 'SUSEP-309412-SP', 'Vida e Empresarial', '(11) 98765-1122', 'ATIVO', 6),
    (4, 'Fernanda Lima', 'SUSEP-405199-GO', 'Saúde e Benefícios', '(62) 98444-5566', 'INATIVO', 7),
    (5, 'Lucas Nogueira Martins', 'SUSEP-508721-DF', 'Riscos Corporativos e Agro', '(61) 99654-8899', 'ATIVO', 8);

SELECT setval('corretor_id_seq', (SELECT MAX(id) FROM corretor));

-- ==============================================================================
-- TABELA 4: cliente (9 registros - Pessoas Físicas e Pessoas Jurídicas)
-- ==============================================================================
INSERT INTO cliente (id, nome, cpf_cnpj, data_nasc, email, fk_usuario_id) VALUES
    (1, 'João Pereira da Silva', '123.456.789-00', '1988-04-12', 'joao.silva@gmail.com', 9),
    (2, 'Mariana de Souza Oliveira', '987.654.321-99', '1993-08-20', 'mariana.souza@hotmail.com.br', 10),
    (3, 'Construtora Planalto Ltda', '12.345.678/0001-90', '2012-03-15', 'contato@construtoraplanalto.com.br', 11),
    (4, 'TransLogística Centro-Oeste S/A', '45.678.901/0001-23', '2016-10-05', 'financeiro@translogistica.com.br', 12),
    (5, 'Roberto Mendes Alves', '456.789.123-44', '1979-11-28', 'roberto.mendes@gmail.com', 13),
    (6, 'Camila Ribeiro Costa', '321.654.987-11', '1995-02-14', 'camila.costa@outlook.com', 14),
    (7, 'Hospital Santa Helena Brasília S/A', '67.890.123/0001-55', '2008-06-22', 'diretoria@hospitalsantahelena.com.br', 15),
    (8, 'Pedro Henrique Cavalcanti', '741.852.963-08', '1991-09-03', 'pedro.cavalcanti@hotmail.com', 16),
    (9, 'Agropecuária Cerrado Forte Ltda', '89.012.345/0001-77', '2014-01-19', 'gestao@cerradoforte.com.br', 17);

SELECT setval('cliente_id_seq', (SELECT MAX(id) FROM cliente));

-- ==============================================================================
-- TABELA 5: endereco (10 registros vinculados aos clientes)
-- ==============================================================================
INSERT INTO endereco (id, cep, logradouro, numero, complemento, bairro, cidade, estado, fk_cliente_id) VALUES
    (1, '70390-020', 'SQS 204 Bloco B', '204', 'Apto 301', 'Asa Sul', 'Brasília', 'DF', 1),
    (2, '71909-540', 'Rua 12 Norte', '150', 'Residencial Solar Apto 802', 'Águas Claras', 'Brasília', 'DF', 2),
    (3, '70306-000', 'SCS Quadra 06 Bloco A', '110', 'Ed. Sofia Salas 401 a 405', 'Asa Sul', 'Brasília', 'DF', 3),
    (4, '71200-030', 'SIA Trecho 3 Lote 625', '625', 'Galpão Logístico 2', 'SIA', 'Brasília', 'DF', 4),
    (5, '71635-200', 'SHIS QI 15 Conjunto 4', '18', 'Casa Terrea', 'Lago Sul', 'Brasília', 'DF', 5),
    (6, '70673-410', 'SQSW 304 Bloco D', '304', 'Apto 502', 'Sudoeste', 'Brasília', 'DF', 6),
    (7, '70710-904', 'SHLN Conjunto B Lote 5', '500', 'Torre Médica Principal', 'Asa Norte', 'Brasília', 'DF', 7),
    (8, '70830-010', 'SQN 302 Bloco C', '302', 'Apto 104', 'Asa Norte', 'Brasília', 'DF', 8),
    (9, '73801-010', 'Rodovia BR-020 Km 45', 'S/N', 'Sede Fazenda Cerrado', 'Zona Rural', 'Formosa', 'GO', 9),
    (10, '70070-120', 'SBS Quadra 2 Bloco E', '20', 'Filial Administrativa', 'Asa Sul', 'Brasília', 'DF', 3);

SELECT setval('endereco_id_seq', (SELECT MAX(id) FROM endereco));

-- ==============================================================================
-- TABELA 6: telefone (10 registros vinculados aos clientes)
-- ==============================================================================
INSERT INTO telefone (id, ddd, numero, tipo, fk_cliente_id) VALUES
    (1, '61', '98765-4321', 'CELULAR', 1),
    (2, '61', '99123-4567', 'CELULAR', 2),
    (3, '61', '3321-8899', 'COMERCIAL', 3),
    (4, '61', '3361-4400', 'COMERCIAL', 4),
    (5, '61', '98111-2233', 'CELULAR', 5),
    (6, '61', '99456-7890', 'CELULAR', 6),
    (7, '61', '3215-9000', 'COMERCIAL', 7),
    (8, '61', '98555-6789', 'CELULAR', 8),
    (9, '62', '3441-2200', 'COMERCIAL', 9),
    (10, '61', '99988-1122', 'CELULAR', 3);

SELECT setval('telefone_id_seq', (SELECT MAX(id) FROM telefone));

-- ==============================================================================
-- TABELA 7: seguro (6 produtos securitários completos)
-- ==============================================================================
INSERT INTO seguro (id, nome, descricao, caracteristicas, valor_base) VALUES
    (1, 'Seguro Automóvel Completo', 'Proteção compreensiva 100% FIPE para veículos de passeio com assistência 24h nacional.', 'Auto', 2400.00),
    (2, 'Seguro Residencial Premium', 'Proteção completa para casas e apartamentos com serviços emergenciais 24h inclusos.', 'Residencial', 960.00),
    (3, 'Seguro de Vida e Acidentes Pessoais', 'Estabilidade financeira e amparo imediato para o segurado e seus beneficiários.', 'Vida', 720.00),
    (4, 'Seguro Empresarial Patrimonial', 'Cobertura multirrisco para escritórios, comércios, clínicas, galpões e equipamentos.', 'Empresarial', 4800.00),
    (5, 'Seguro Frota Corporativa', 'Gestão e proteção integrada para frotas comerciais, caminhões e utilitários.', 'Auto', 9600.00),
    (6, 'Seguro Saúde e Odonto Corporativo', 'Cobertura hospitalar, ambulatorial e odontológica nacional para empresas.', 'Saúde', 6400.00);

SELECT setval('seguro_id_seq', (SELECT MAX(id) FROM seguro));

-- ==============================================================================
-- TABELA 8: cobertura (18 coberturas detalhadas vinculadas aos seguros)
-- ==============================================================================
INSERT INTO cobertura (id, descricao, valor, fk_seguro_id) VALUES
    (1, 'Colisão, Incêndio, Roubo e Furto Qualificado (100% FIPE)', 120000.00, 1),
    (2, 'Danos Materiais e Corporais a Terceiros (RCF-V)', 150000.00, 1),
    (3, 'Assistência 24h Guincho Ilimitado e Carro Reserva 15 dias', 25000.00, 1),
    (4, 'Incêndio, Queda de Raio e Explosão Residencial', 450000.00, 2),
    (5, 'Danos Elétricos e Quebra de Vidros e Espelhos', 35000.00, 2),
    (6, 'Vendaval, Destelhamento e Assistência 24h (Chaveiro/Encanador)', 40000.00, 2),
    (7, 'Morte Qualquer Causa (Natural ou Acidental)', 300000.00, 3),
    (8, 'Invalidez Permanente Total ou Parcial por Acidente (IPA)', 300000.00, 3),
    (9, 'Auxílio Funeral Familiar e Diagnóstico de Doenças Graves', 50000.00, 3),
    (10, 'Incêndio, Explosão e Fumaça em Planta Comercial', 1200000.00, 4),
    (11, 'Lucros Cessantes e Despesas Fixas em Sinistro', 350000.00, 4),
    (12, 'Responsabilidade Civil Operações e Equipamentos Portáteis', 250000.00, 4),
    (13, 'Cobertura Casco e RCF para Frota de Caminhões e Utilitários', 800000.00, 5),
    (14, 'Socorro Mecânico Pesado e Remoção Nacional 24h', 100000.00, 5),
    (15, 'Acidentes Pessoais de Passageiros e Motoristas (APP Frota)', 150000.00, 5),
    (16, 'Internação Hospitalar, UTI e Cirurgias em Rede Credenciada', 500000.00, 6),
    (17, 'Consultas Médicas, Exames Laboratoriais e Diagnóstico por Imagem', 120000.00, 6),
    (18, 'Cobertura Odontológica Preventiva e Próteses', 45000.00, 6);

SELECT setval('cobertura_id_seq', (SELECT MAX(id) FROM cobertura));

-- ==============================================================================
-- TABELA 9: cotacao (8 cotações registradas)
-- ==============================================================================
INSERT INTO cotacao (id, data_solicitacao, valor, situacao, observacoes, fk_cliente_id, fk_corretor_id, fk_seguro_id) VALUES
    (1, CURRENT_TIMESTAMP - INTERVAL '25 days', 2400.00, 'APROVADA', 'Veículo Toyota Corolla XEi 2025, garagem coberta em casa e no trabalho, condutor principal 38 anos.', 1, 1, 1),
    (2, CURRENT_TIMESTAMP - INTERVAL '18 days', 4800.00, 'APROVADA', 'Sede administrativa da Construtora Planalto no SCS com 5 salas comerciais e equipamentos de engenharia.', 3, 3, 4),
    (3, CURRENT_TIMESTAMP - INTERVAL '5 days', 9600.00, 'PROPOSTA_GERADA', 'Renovação e ampliação de frota: 6 caminhões Volkswagen Delivery operando no Distrito Federal e Goiás.', 4, 1, 5),
    (4, CURRENT_TIMESTAMP - INTERVAL '3 days', 960.00, 'SOLICITADA', 'Apartamento de 3 quartos no Sudoeste (SQSW 304), cobertura contra danos elétricos e incêndio.', 6, 2, 2),
    (5, CURRENT_TIMESTAMP - INTERVAL '20 days', 720.00, 'RECUSADA', 'Cotação de seguro de vida individual solicitada para avaliação comparativa de prêmios.', 5, 3, 3),
    (6, CURRENT_TIMESTAMP - INTERVAL '14 days', 6400.00, 'APROVADA', 'Plano coletivo empresarial de saúde e odonto para equipe administrativa e corpo clínico.', 7, 5, 6),
    (7, CURRENT_TIMESTAMP - INTERVAL '2 days', 2550.00, 'PROPOSTA_GERADA', 'Jeep Compass Longitude 2024, pernoite em garagem fechada na Asa Norte.', 8, 1, 1),
    (8, CURRENT_TIMESTAMP - INTERVAL '1 day', 5200.00, 'SOLICITADA', 'Cobertura patrimonial para galpões de armazenamento de grãos e maquinário agrícola em Formosa/GO.', 9, 5, 4);

SELECT setval('cotacao_id_seq', (SELECT MAX(id) FROM cotacao));

-- ==============================================================================
-- TABELA 10: proposta (6 propostas comerciais vinculadas às cotações)
-- ==============================================================================
INSERT INTO proposta (id, condicoes, situacao, fk_cotacao_id) VALUES
    (1, 'Cobertura compreensiva 100% FIPE, franquia reduzida de R$ 1.450,00, carro reserva 15 dias e parcelamento em 12x sem juros.', 'ACEITA', 1),
    (2, 'Apólice multirrisco empresarial com cobertura de equipamentos, RC operações e pagamento em 6x.', 'ACEITA', 2),
    (3, 'Proteção para 6 veículos da frota com RCF de R$ 300 mil por veículo, APP motoristas e assistência pesada 24h.', 'PENDENTE', 3),
    (4, 'Plano de Vida Individual com capital segurado de R$ 300 mil, invalidez por acidente e auxílio funeral.', 'RECUSADA', 5),
    (5, 'Apólice Saúde Corporativa sem carência para 25 vidas, acomodação em apartamento e reembolso nacional.', 'ACEITA', 6),
    (6, 'Seguro Auto Compreensivo com franquia reduzida de R$ 1.600,00, vidros completos e guincho ilimitado em 10x.', 'PENDENTE', 7);

SELECT setval('proposta_id_seq', (SELECT MAX(id) FROM proposta));

-- ==============================================================================
-- TABELA 11: apolice (8 apólices com diferentes vigências e histórico de renovação)
-- ==============================================================================
INSERT INTO apolice (id, numero_apolice, data_inicio, data_termino, situacao, valor_premio, fk_cliente_id, fk_corretor_id, fk_seguro_id, id_apolice_anterior) VALUES
    -- Apólice 1: Ativa (João Pereira da Silva)
    (1, 'APO-2026-AUTO-001', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '275 days', 'ATIVA', 2400.00, 1, 1, 1, NULL),
    -- Apólice 2: Ativa próxima do vencimento em 14 dias (Mariana de Souza Oliveira)
    (2, 'APO-2026-RES-002', CURRENT_DATE - INTERVAL '351 days', CURRENT_DATE + INTERVAL '14 days', 'ATIVA', 960.00, 2, 2, 2, NULL),
    -- Apólice 3: Ativa Empresarial (Construtora Planalto Ltda)
    (3, 'APO-2026-EMP-003', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '305 days', 'ATIVA', 4800.00, 3, 3, 4, NULL),
    -- Apólice 4: Ativa próxima do vencimento em 22 dias (TransLogística Centro-Oeste S/A)
    (4, 'APO-2026-FROTA-004', CURRENT_DATE - INTERVAL '343 days', CURRENT_DATE + INTERVAL '22 days', 'ATIVA', 9600.00, 4, 1, 5, NULL),
    -- Apólice 5: Ativa Vida (Camila Ribeiro Costa)
    (5, 'APO-2026-VIDA-005', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '335 days', 'ATIVA', 720.00, 6, 3, 3, NULL),
    -- Apólice 6: Cancelada (Roberto Mendes Alves)
    (6, 'APO-2026-AUTO-006', CURRENT_DATE - INTERVAL '180 days', CURRENT_DATE + INTERVAL '185 days', 'CANCELADA', 2100.00, 5, 1, 1, NULL),
    -- Apólice 7: 1º Contrato anterior que entrou em renovação (Hospital Santa Helena)
    (7, 'APO-2025-SAUDE-007', CURRENT_DATE - INTERVAL '395 days', CURRENT_DATE - INTERVAL '30 days', 'EM_RENOVACAO', 6000.00, 7, 5, 6, NULL),
    -- Apólice 8: Apólice Renovada a partir da Apólice 7 (mantendo a mesma data_inicio do 1º contrato!)
    (8, 'APO-2026-SAUDE-008', CURRENT_DATE - INTERVAL '395 days', CURRENT_DATE + INTERVAL '335 days', 'ATIVA', 6400.00, 7, 5, 6, 7);

SELECT setval('apolice_id_seq', (SELECT MAX(id) FROM apolice));

-- ==============================================================================
-- TABELA 12: parcela_pagamentos (46 parcelas registradas com formas de pagamento)
-- ==============================================================================
-- Apólice 1 (12x de R$ 200,00 - 3 pagas e 9 pendentes)
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

-- Apólice 2 (6x de R$ 160,00 - 5 pagas e 1 pendente)
INSERT INTO parcela_pagamentos (numero_parcela, valor, data_vencimento, status, forma_pagamento, data_pagamento, fk_apolice_id) VALUES
    (1, 160.00, CURRENT_DATE - INTERVAL '351 days', 'PAGO', 'Boleto Bancário', CURRENT_DATE - INTERVAL '351 days', 2),
    (2, 160.00, CURRENT_DATE - INTERVAL '291 days', 'PAGO', 'Boleto Bancário', CURRENT_DATE - INTERVAL '291 days', 2),
    (3, 160.00, CURRENT_DATE - INTERVAL '231 days', 'PAGO', 'PIX', CURRENT_DATE - INTERVAL '231 days', 2),
    (4, 160.00, CURRENT_DATE - INTERVAL '171 days', 'PAGO', 'PIX', CURRENT_DATE - INTERVAL '171 days', 2),
    (5, 160.00, CURRENT_DATE - INTERVAL '111 days', 'PAGO', 'PIX', CURRENT_DATE - INTERVAL '111 days', 2),
    (6, 160.00, CURRENT_DATE - INTERVAL '51 days', 'PENDENTE', NULL, NULL, 2);

-- Apólice 3 (6x de R$ 800,00 - 2 pagas e 4 pendentes)
INSERT INTO parcela_pagamentos (numero_parcela, valor, data_vencimento, status, forma_pagamento, data_pagamento, fk_apolice_id) VALUES
    (1, 800.00, CURRENT_DATE - INTERVAL '60 days', 'PAGO', 'Transferência / TED', CURRENT_DATE - INTERVAL '60 days', 3),
    (2, 800.00, CURRENT_DATE - INTERVAL '30 days', 'PAGO', 'Boleto Bancário', CURRENT_DATE - INTERVAL '30 days', 3),
    (3, 800.00, CURRENT_DATE, 'PENDENTE', NULL, NULL, 3),
    (4, 800.00, CURRENT_DATE + INTERVAL '30 days', 'PENDENTE', NULL, NULL, 3),
    (5, 800.00, CURRENT_DATE + INTERVAL '60 days', 'PENDENTE', NULL, NULL, 3),
    (6, 800.00, CURRENT_DATE + INTERVAL '90 days', 'PENDENTE', NULL, NULL, 3);

-- Apólice 4 (4x de R$ 2.400,00 - 3 pagas e 1 pendente)
INSERT INTO parcela_pagamentos (numero_parcela, valor, data_vencimento, status, forma_pagamento, data_pagamento, fk_apolice_id) VALUES
    (1, 2400.00, CURRENT_DATE - INTERVAL '343 days', 'PAGO', 'Transferência / TED', CURRENT_DATE - INTERVAL '343 days', 4),
    (2, 2400.00, CURRENT_DATE - INTERVAL '253 days', 'PAGO', 'Transferência / TED', CURRENT_DATE - INTERVAL '253 days', 4),
    (3, 2400.00, CURRENT_DATE - INTERVAL '163 days', 'PAGO', 'Boleto Bancário', CURRENT_DATE - INTERVAL '163 days', 4),
    (4, 2400.00, CURRENT_DATE - INTERVAL '73 days', 'PENDENTE', NULL, NULL, 4);

-- Apólice 5 (3x de R$ 240,00 - 1 paga e 2 pendentes)
INSERT INTO parcela_pagamentos (numero_parcela, valor, data_vencimento, status, forma_pagamento, data_pagamento, fk_apolice_id) VALUES
    (1, 240.00, CURRENT_DATE - INTERVAL '30 days', 'PAGO', 'Cartão de Débito', CURRENT_DATE - INTERVAL '30 days', 5),
    (2, 240.00, CURRENT_DATE, 'PENDENTE', NULL, NULL, 5),
    (3, 240.00, CURRENT_DATE + INTERVAL '30 days', 'PENDENTE', NULL, NULL, 5);

-- Apólice 6 (Cancelada - 3 parcelas)
INSERT INTO parcela_pagamentos (numero_parcela, valor, data_vencimento, status, forma_pagamento, data_pagamento, fk_apolice_id) VALUES
    (1, 700.00, CURRENT_DATE - INTERVAL '180 days', 'PAGO', 'PIX', CURRENT_DATE - INTERVAL '180 days', 6),
    (2, 700.00, CURRENT_DATE - INTERVAL '150 days', 'PENDENTE', NULL, NULL, 6),
    (3, 700.00, CURRENT_DATE - INTERVAL '120 days', 'PENDENTE', NULL, NULL, 6);

-- Apólice 7 (1º Contrato anterior quitado - 6 parcelas pagas)
INSERT INTO parcela_pagamentos (numero_parcela, valor, data_vencimento, status, forma_pagamento, data_pagamento, fk_apolice_id) VALUES
    (1, 1000.00, CURRENT_DATE - INTERVAL '395 days', 'PAGO', 'Boleto Bancário', CURRENT_DATE - INTERVAL '395 days', 7),
    (2, 1000.00, CURRENT_DATE - INTERVAL '335 days', 'PAGO', 'Boleto Bancário', CURRENT_DATE - INTERVAL '335 days', 7),
    (3, 1000.00, CURRENT_DATE - INTERVAL '275 days', 'PAGO', 'Boleto Bancário', CURRENT_DATE - INTERVAL '275 days', 7),
    (4, 1000.00, CURRENT_DATE - INTERVAL '215 days', 'PAGO', 'Transferência / TED', CURRENT_DATE - INTERVAL '215 days', 7),
    (5, 1000.00, CURRENT_DATE - INTERVAL '155 days', 'PAGO', 'Transferência / TED', CURRENT_DATE - INTERVAL '155 days', 7),
    (6, 1000.00, CURRENT_DATE - INTERVAL '95 days', 'PAGO', 'Transferência / TED', CURRENT_DATE - INTERVAL '95 days', 7);

-- Apólice 8 (Renovação ativa - 8x de R$ 800,00 - 1 paga e 7 pendentes)
INSERT INTO parcela_pagamentos (numero_parcela, valor, data_vencimento, status, forma_pagamento, data_pagamento, fk_apolice_id) VALUES
    (1, 800.00, CURRENT_DATE - INTERVAL '30 days', 'PAGO', 'PIX', CURRENT_DATE - INTERVAL '30 days', 8),
    (2, 800.00, CURRENT_DATE, 'PENDENTE', NULL, NULL, 8),
    (3, 800.00, CURRENT_DATE + INTERVAL '30 days', 'PENDENTE', NULL, NULL, 8),
    (4, 800.00, CURRENT_DATE + INTERVAL '60 days', 'PENDENTE', NULL, NULL, 8),
    (5, 800.00, CURRENT_DATE + INTERVAL '90 days', 'PENDENTE', NULL, NULL, 8),
    (6, 800.00, CURRENT_DATE + INTERVAL '120 days', 'PENDENTE', NULL, NULL, 8),
    (7, 800.00, CURRENT_DATE + INTERVAL '150 days', 'PENDENTE', NULL, NULL, 8),
    (8, 800.00, CURRENT_DATE + INTERVAL '180 days', 'PENDENTE', NULL, NULL, 8);

-- ==============================================================================
-- TABELA 13: notificacao_alerta (8 alertas operacionais e de vencimento)
-- ==============================================================================
INSERT INTO notificacao_alerta (id, assunto, status, data_criacao, fk_usuario_id) VALUES
    (1, 'Apólice APO-2026-RES-002 de Mariana de Souza Oliveira vence em 14 dias. Contate a cliente para renovação.', 'PENDENTE', CURRENT_TIMESTAMP - INTERVAL '2 hours', 5),
    (2, 'Apólice APO-2026-FROTA-004 de TransLogística Centro-Oeste S/A vence em 22 dias. Prepare proposta de renovação.', 'PENDENTE', CURRENT_TIMESTAMP - INTERVAL '5 hours', 4),
    (3, 'Proposta #3 (Seguro Frota Corporativa) aguarda aceite do cliente TransLogística Centro-Oeste S/A.', 'PENDENTE', CURRENT_TIMESTAMP - INTERVAL '1 day', 1),
    (4, 'Proposta #6 (Seguro Automóvel Completo) enviada para Pedro Henrique Cavalcanti.', 'PENDENTE', CURRENT_TIMESTAMP - INTERVAL '12 hours', 4),
    (5, 'Nova cotação #8 (Seguro Empresarial Patrimonial) solicitada por Agropecuária Cerrado Forte Ltda.', 'PENDENTE', CURRENT_TIMESTAMP - INTERVAL '6 hours', 8),
    (6, 'Parcela #4 da apólice APO-2026-AUTO-001 vence hoje. Lembrete enviado ao segurado João Pereira da Silva.', 'PENDENTE', CURRENT_TIMESTAMP - INTERVAL '3 hours', 4),
    (7, 'Renovação da apólice APO-2026-SAUDE-008 do Hospital Santa Helena concluída mantendo data inicial original.', 'LIDA', CURRENT_TIMESTAMP - INTERVAL '4 days', 8),
    (8, 'Carga de apresentação PostgreSQL carregada em todas as 14 tabelas do banco de dados.', 'LIDA', CURRENT_TIMESTAMP - INTERVAL '2 days', 1);

SELECT setval('notificacao_alerta_id_seq', (SELECT MAX(id) FROM notificacao_alerta));

-- ==============================================================================
-- TABELA 14: log_auditoria (10 registros cobrindo todas as entidades do sistema)
-- ==============================================================================
INSERT INTO log_auditoria (id, acao_realizada, data_hora, tabela_afetada, ip_origem, fk_usuario_id) VALUES
    (1, 'CRIACAO: Cadastro do cliente Construtora Planalto Ltda (CNPJ 12.345.678/0001-90) com 2 endereços e 2 telefones', CURRENT_TIMESTAMP - INTERVAL '20 days', 'cliente', '172.18.0.1', 1),
    (2, 'CRIACAO: Cadastro do corretor Lucas Nogueira Martins (SUSEP-508721-DF)', CURRENT_TIMESTAMP - INTERVAL '18 days', 'corretor', '172.18.0.1', 1),
    (3, 'CRIACAO: Cadastro do produto Seguro Saúde e Odonto Corporativo com 3 coberturas', CURRENT_TIMESTAMP - INTERVAL '16 days', 'seguro', '172.18.0.1', 2),
    (4, 'CRIACAO: Emissão da apólice APO-2026-AUTO-001 e geração de 12 parcelas para João Pereira da Silva', CURRENT_TIMESTAMP - INTERVAL '15 days', 'apolice', '172.18.0.1', 4),
    (5, 'CRIACAO: Solicitação de cotação #3 para TransLogística Centro-Oeste S/A (Seguro Frota Corporativa)', CURRENT_TIMESTAMP - INTERVAL '5 days', 'cotacao', '172.18.0.1', 4),
    (6, 'CRIACAO: Elaboração da proposta #3 vinculada à cotação #3 no valor de R$ 9.600,00', CURRENT_TIMESTAMP - INTERVAL '4 days', 'proposta', '172.18.0.1', 4),
    (7, 'RENOVAR: Renovação da apólice APO-2025-SAUDE-007 -> APO-2026-SAUDE-008 mantendo data inicial do 1º contrato', CURRENT_TIMESTAMP - INTERVAL '4 days', 'apolice', '172.18.0.1', 8),
    (8, 'PAGAMENTO: Quitação da parcela #3 da apólice APO-2026-AUTO-001 via Cartão de Crédito', CURRENT_TIMESTAMP - INTERVAL '3 days', 'parcela_pagamentos', '172.18.0.1', 4),
    (9, 'CANCELAR: Cancelamento da apólice APO-2026-AUTO-006 a pedido do segurado Roberto Mendes Alves', CURRENT_TIMESTAMP - INTERVAL '2 days', 'apolice', '172.18.0.1', 1),
    (10, 'ATUALIZAR: Desativação temporária do usuário fernanda.lima@hcrseguros.com.br', CURRENT_TIMESTAMP - INTERVAL '1 day', 'usuario', '172.18.0.1', 1);

SELECT setval('log_auditoria_id_seq', (SELECT MAX(id) FROM log_auditoria));
