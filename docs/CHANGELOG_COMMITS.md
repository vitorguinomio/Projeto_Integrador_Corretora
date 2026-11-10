# Registro de Commits por Etapas - Projeto Integrador Corretora

Este documento registra detalhadamente as entregas efetuadas no repositório Git em cada etapa do desenvolvimento do sistema HCR Corretora de Seguros.

---

## [Commit 1] - Modelagem de Banco de Dados, Segurança e Módulo de Usuários, Administradores e Clientes
- **Data/Hora:** 2026-11-09 21:20
- **Mensagem:** `feat: modelagem DDL 14 tabelas, autenticacao JWT e gestao completa de clientes`
- **O que foi enviado para o Git:**
  1. `database/init/01-schema.sql`: Implementação do DDL completo oficial contendo todas as 14 tabelas do modelo físico (`usuario`, `seguro`, `administrador`, `cliente`, `corretor`, `endereco`, `telefone`, `cobertura`, `cotacao`, `proposta`, `apolice`, `parcela_pagamentos`, `notificacao_alerta`, `log_auditoria`) com chaves estrangeiras e índices.
  2. `docker-compose.yml` e `src/main/resources/application.yml`: Configuração do Hibernate `ddl-auto: update`.
  3. `core/security`:
     - `JwtTokenService.java`: Gerador e validador de tokens HMAC-SHA256 (JWT) sem dependências externas adicionais.
     - `JwtAuthenticationFilter.java`: Filtro para interceptação de requisições com header `Authorization: Bearer <token>`.
     - `SecurityConfig.java`: Configuração de segurança com BCrypt, sessões stateless, liberação das rotas `/auth/**` e regras de autorização.
  4. `core/exception/GlobalExceptionHandler.java`: Tratamento global de integridade de dados (unicidade e chaves estrangeiras RF04/RF31/RF34), validação e acesso negado.
  5. `features/usuarios`: Entidade `Usuario`, `UsuarioRepository`, DTOs de criação/resposta, `UsuarioService` com hash BCrypt e `UsuarioController`.
  6. `features/administradores`: Entidade `Administrador`, `AdministradorRepository`, DTOs, `AdministradorService` e `AdministradorController`.
  7. `features/clientes`: Entidades `Cliente`, `Endereco`, `Telefone`, repositórios `ClienteRepository`, `EnderecoRepository`, `TelefoneRepository`, DTOs e `ClienteService` com CRUD completo, busca por termo, validação e `ClienteController`.
  8. `.agents/skills/commit-por-etapas/SKILL.md` e `.skills/commit-por-etapas/SKILL.md`: Registro da skill solicitada pelo usuário para versionamento incremental documentado.

---

## [Commit 2] - Módulos de Corretores, Seguros com Coberturas e Autenticação Completa
- **Data/Hora:** 2026-11-09 21:40
- **Mensagem:** `feat: modulo de corretores, catalogo de seguros com coberturas e servico de autenticacao/registro`
- **O que foi enviado para o Git:**
  1. `features/corretores`:
     - Entidade `Corretor` com chave estrangeira para `usuario` e registro profissional SUSEP.
     - `CorretorRepository`: busca por status, registro profissional e vínculo com usuário.
     - DTOs `CorretorRequest` e `CorretorResponse`.
     - `CorretorService` e `CorretorController`: cadastro, atualização, listagem e alternância de status ativo/inativo.
  2. `features/seguros`:
     - Entidades `Seguro` e `Cobertura` com relacionamento 1:N.
     - Repositórios `SeguroRepository` e `CoberturaRepository`.
     - DTOs `SeguroRequest`, `SeguroResponse` e `CoberturaDto`.
     - `SeguroService` e `SeguroController`: gestão de tipos de seguros, valor base, adição e remoção dinâmica de coberturas.
  3. `features/auth`:
     - `AuthService` e `AuthController`: endpoint `/auth/login` validando senha com BCrypt e emitindo token JWT, endpoint `/auth/register` para auto-cadastro do cliente e endpoint `/auth/me` para consulta do perfil conectado.
     - DTOs `LoginResponse` e `RegisterRequest`.

---

## [Commit 3] - Processo Comercial: Solicitação de Cotações e Elaboração de Propostas
- **Data/Hora:** 2026-11-09 21:45
- **Mensagem:** `feat: fluxo completo de cotacoes e propostas com vinculos de cliente, corretor e seguro`
- **O que foi enviado para o Git:**
  1. `features/cotacoes`:
     - Entidade `Cotacao` vinculando cliente, corretor (opcional na solicitação) e tipo de seguro.
     - `CotacaoRepository`: filtros por cliente, corretor e situação.
     - DTOs `CotacaoRequest` e `CotacaoResponse`.
     - `CotacaoService` e `CotacaoController`: solicitação (EU05, EU11), alteração de situação e atribuição de corretor responsável.
  2. `features/propostas`:
     - Entidade `Proposta` com relação 1:1 obrigatória para a cotação.
     - `PropostaRepository`: busca por cotação vinculada.
     - DTOs `PropostaRequest` e `PropostaResponse`.
     - `PropostaService` e `PropostaController`: elaboração de condições (EU12), aceite de proposta (EU08) e recusa.

---

## [Commit 4] - Gestão de Apólices, Renovação, Cancelamento, Parcelas e Histórico
- **Data/Hora:** 2026-11-09 22:00
- **Mensagem:** `feat: gestao de apolices, controle de vigencia, renovacao, parcelamento e historico do cliente`
- **O que foi enviado para o Git:**
  1. `features/apolices`:
     - Entidade `Apolice` com número de apólice único, vigência (data_inicio, data_termino), valor do prêmio, chave recursiva para renovação (`id_apolice_anterior`) e vínculo 1:N com parcelas.
     - Entidade `ParcelaPagamento` com valor, vencimento e status (`PENDENTE`, `PAGO`, `ATRASADO`).
     - Repositórios `ApoliceRepository` e `ParcelaPagamentoRepository` com consultas avançadas de pesquisa e identificação de vencimento em 30 dias.
     - DTOs `ApoliceRequest`, `ApoliceResponse`, `RenovacaoRequest`, `ParcelaResponse` e `AtualizarParcelaRequest`.
     - `ApoliceService` e `ApoliceController`: emissão de apólice com geração automática de parcelas, renovação mantendo histórico anterior (RF22, EU16), cancelamento seguro sem deleção física (RF23, EU17), consulta de alertas de vencimento (RF27) e liquidação de parcelas (EU28).
  2. `features/clientes`:
     - Adição do endpoint `GET /clientes/{id}/historico` retornando histórico cronológico consolidado de seguros, cotações e apólices (RF24, EU18).
