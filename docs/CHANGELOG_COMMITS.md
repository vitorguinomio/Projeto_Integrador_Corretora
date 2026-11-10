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
