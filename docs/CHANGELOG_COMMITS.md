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

---

## [Commit 5] - Alertas, Auditoria, Dashboard, Relatórios Consolidados e Carga Inicial
- **Data/Hora:** 2026-11-09 22:18
- **Mensagem:** `feat: notificacoes, logs de auditoria, metricas dashboard, relatorios e carga inicial de dados`
- **O que foi enviado para o Git:**
  1. `features/alertas`:
     - Entidade `NotificacaoAlerta` mapeando a tabela oficial `notificacao_alerta`.
     - `NotificacaoAlertaRepository`, DTOs `NotificacaoResponse` e `CriarNotificacaoRequest`.
     - `AlertaService` e `AlertaController`: consulta por usuário e marcação de status como lida (EU27).
  2. `features/auditoria`:
     - Entidade `LogAuditoria` mapeando a tabela oficial `log_auditoria` (RNF22).
     - `LogAuditoriaRepository`, DTO `LogAuditoriaResponse`.
     - `AuditoriaService` e `AuditoriaController`: registro automático e consulta de auditoria do sistema.
  3. `features/dashboard`:
     - `DashboardService` e `DashboardController`: cálculo em tempo real de KPIs (total de clientes, apólices ativas, vencidas, próximas do vencimento, cotações pendentes e faturamento).
     - DTO `DashboardResponse`.
  4. `features/relatorios`:
     - `RelatorioService` e `RelatorioController`: consolidação analítica de clientes, corretores, seguros e apólices (RF35).
     - DTOs `RelatorioClienteItem`, `RelatorioCorretorItem`, `RelatorioSeguroItem` e `RelatorioApoliceItem`.
  5. `core/init/DataInitializer.java`:
     - Inicializador de dados de demonstração com Administrador, Corretores, Clientes, Seguros, Coberturas, Cotações, Propostas, Apólices, Parcelas e Notificações pré-configurados.

---

## [Commit 6] - Interface de Teste e Homologação de Dados (React Frontend)
- **Data/Hora:** 2026-11-09 23:15
- **Mensagem:** `feat: telas de teste frontend para homologacao de dados de todas as funcionalidades`
- **O que foi enviado para o Git:**
  1. `frontend/src/api.js`: Utilitário de chamadas REST autenticadas com injeção automática de Bearer Token e parsing unificado de mensagens de erro.
  2. `frontend/src/styles.js`: Sistema de design enxuto e responsivo com badges de status, botões semânticos e modais.
  3. `frontend/src/components/DashboardTab.jsx`: Tela de métricas gerais e cards de KPI operacionais/financeiros (RF26).
  4. `frontend/src/components/ClientesTab.jsx`: Tela de gestão de clientes com busca textual, cadastro modal com endereços e telefones, histórico completo e exclusão controlada (RF01 - RF04, RF24).
  5. `frontend/src/components/CorretoresTab.jsx`: Tela de gestão de corretores com registro SUSEP, edição e alternância de status ativo/inativo (RF05 - RF07).
  6. `frontend/src/components/SegurosTab.jsx`: Tela de catálogo de tipos de seguros e gestão dinâmica de coberturas (RF09 - RF11, RF17).
  7. `frontend/src/components/CotacoesTab.jsx`: Tela de solicitação de cotações, elaboração de propostas e avaliação/aceite comercial (EU05 - EU12).
  8. `frontend/src/components/ApolicesTab.jsx`: Tela de contratos de apólices com filtro por situação, emissão com parcelas automáticas, renovação preservando histórico e cancelamento (RF12 - RF16, RF21 - RF23, EU28).
  9. `frontend/src/components/AlertasTab.jsx`: Tela de identificação de apólices vencendo em 30 dias e leitura de notificações do usuário (RF27, EU27).
  10. `frontend/src/components/RelatoriosTab.jsx`: Tela de relatórios consolidados em 4 visões analíticas com opção de impressão/PDF (RF35).
  11. `frontend/src/components/AuditoriaTab.jsx`: Tela de controle de contas de usuários e visualização da trilha de auditoria (RF28, RF29, RNF22).
  12. `frontend/src/App.jsx`: Estrutura principal com seletor de perfis de teste rápido (Admin, Corretor, Cliente), modal de login manual e navegação entre abas.

---

## [Commit 7] - Integração do Protótipo Visual Lovable e Ajustes de Persistência Backend
- **Data/Hora:** 2026-11-10 06:20
- **Mensagem:** `feat: integracao completa do prototipo visual lovable ao frontend e ajustes de persistencia backend`
- **O que foi enviado para o Git:**
  1. `frontend/index.html`: Inclusão das tipografias oficiais do protótipo Lovable (`Fraunces`, `Manrope`, `JetBrains Mono`) e configuração de viewport responsivo.
  2. `frontend/src/lovable-theme.css`: Integração de variáveis de estilo OKLCH (`--paper`, `--ink`, `--primary`, `--signal`, etc.), utilitários de gradiente (`bg-gradient-signal`, `bg-gradient-ink`) e regras de layout do protótipo.
  3. `frontend/public/login-brasilia.jpg`: Imagem de capa em alta definição com arquitetura modernista de Brasília para a tela de autenticação split-screen.
  4. `frontend/package.json` & `frontend/package-lock.json`: Instalação e configuração da biblioteca de ícones `lucide-react`.
  5. `frontend/src/components/ui/UiBits.jsx`: Componentes atômicos com o design Lovable (`PageHeader`, `StatCard`, `StatusBadge`, `SectionCard`, `EmptyState`, `CodeText`, `Modal`).
  6. `frontend/src/components/AppShell.jsx`: Shell com barra lateral expansível, seções Operação e Gestão, contador de alertas, seletor de perfis e rodapé do usuário logado.
  7. `frontend/src/components/LoginView.jsx`: Tela de login split-screen com abas para perfis pré-configurados (Admin, Corretor, Cliente), alternância de senha e integração com a autenticação JWT do backend.
  8. `frontend/src/components/DashboardTab.jsx`: Painel analítico com KPIs, lista de apólices a vencer com badges de contagem regressiva, cotações recentes, distribuição percentual de tipos de seguros e alertas críticos.
  9. `frontend/src/components/ClientesTab.jsx`: Gestão completa de clientes com busca instantânea, filtros PF/PJ, cadastro com endereços e telefones múltiplos, e histórico completo de apólices e cotações.
  10. `frontend/src/components/ApolicesTab.jsx`: Gestão de apólices com status visual, detalhamento e quitação individual de parcelas de pagamento, renovação com histórico anterior e cancelamento seguro.
  11. `frontend/src/components/CotacoesTab.jsx`: Solicitação de cotações com cálculo do valor base, elaboração de propostas comerciais e fluxo de aceite e recusa com emissão associada.
  12. `frontend/src/components/AlertasTab.jsx`: Central de notificações e monitoramento de apólices com vencimento nos próximos 30 dias com marcação de leitura.
  13. `frontend/src/components/SegurosTab.jsx`: Catálogo em formato de grid de tipos de seguro com coberturas detalhadas, criação de novos seguros e inclusão de coberturas dinâmicas.
  14. `frontend/src/components/CorretoresTab.jsx`: Equipe de corretores com cadastro SUSEP, canais de contato, status ativo/inativo e cadastro de novos profissionais.
  15. `frontend/src/components/UsuariosTab.jsx`: Gestão de usuários do sistema, alternância de acesso ativo/inativo e matriz de permissões por perfil.
  16. `frontend/src/components/RelatoriosTab.jsx`: Visões analíticas da carteira por corretor, situação das apólices e exportação para formato CSV.
  17. `frontend/src/components/AuditoriaTab.jsx`: Trilha de auditoria com filtros por entidade e ação, identificação de operador, data/hora e IP.
  18. `frontend/src/App.jsx`: Roteamento e orquestração dos módulos, controle de sessão ativa e sincronização com o backend.
  19. Backend Spring Boot:
      - `SeguroRepository.java` e `SeguroService.java`: Consulta `findAllWithCoberturas()` com `LEFT JOIN FETCH` e transações `@Transactional(readOnly = true)` para prevenção de `LazyInitializationException`.
      - `DashboardController.java` e `DashboardService.java`: Alias `/stats` e transação somente-leitura.
      - `ClienteService.java`: Extração e fallback de DDD automático e estado padrão em endereços.
      - `ClienteRequest.java`: Flexibilização de `dataNasc` como campo opcional.
      - `ApoliceRepository.java` e `ApoliceService.java`: Compatibilização de tipos no JPQL PostgreSQL (`CAST(:termo AS string)`) e bypass de busca sem filtros.

---

## [Commit 8] - Otimizações Transacionais e Blindagem de Serviços Backend
- **Data/Hora:** 2026-11-10 06:25
- **Mensagem:** `fix: anotacoes transacionais readonly para relatorios, cotacoes, propostas, alertas e auditoria`
- **O que foi enviado para o Git:**
  1. `features/relatorios/RelatorioService.java`: Adição de anotação `@Transactional(readOnly = true)` no nível da classe para permitir o carregamento seguro de coleções Lazy associadas (como `apolice.getParcelas()`), garantindo 100% de sucesso nos relatórios agregados de apólices, clientes, corretores e seguros.
  2. `features/cotacoes/CotacaoService.java`: Anotação `@Transactional(readOnly = true)` para evitar fechamento prematuro de sessão ao navegar nas entidades relacionadas de cliente, corretor e seguro.
  3. `features/propostas/PropostaService.java`: Anotação `@Transactional(readOnly = true)` para integridade das consultas de propostas vinculadas a cotações.
  4. `features/alertas/AlertaService.java`: Anotação `@Transactional(readOnly = true)` para consulta consistente de notificações e vínculo com o usuário.
  5. `features/auditoria/AuditoriaService.java`: Anotação `@Transactional(readOnly = true)` para consulta e listagem ordenada de logs de auditoria do sistema.

