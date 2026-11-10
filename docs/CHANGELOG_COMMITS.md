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
