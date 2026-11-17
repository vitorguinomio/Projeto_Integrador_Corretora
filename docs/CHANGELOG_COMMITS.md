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


---

> **Nota:** as entradas 9 a 20 descrevem as etapas de trabalho realizadas após a conferência entre o código e a documentação da oitava sprint. Como vários arquivos foram alterados em mais de uma etapa, elas foram enviadas ao Git **em um único commit**, na branch `melhorias-pos-sprint-8`.

## [Commit 9] - Correções no Cadastro de Corretores
- **Data/Hora:** 2026-11-16
- **Mensagem:** `fix: cadastro de corretor com dadosProfissionais, especialidade, telefone e exclusao`
- **O que foi enviado para o Git:**
  1. `frontend/src/components/CorretoresTab.jsx`: Envio do registro SUSEP no campo `dadosProfissionais` (antes ia como `registroSusep` e a API recusava), máscara `(xx) xxxxx-xxxx` no telefone e botão de exclusão com confirmação.
  2. `features/corretores` (`Corretor`, `CorretorRequest`, `CorretorResponse`, `CorretorService`, `CorretorController`): Novos campos `especialidade` e `telefone` (com validação de formato) e rota `DELETE /corretores/{id}`, bloqueada quando o corretor possui apólices.
  3. `database/init/01-schema.sql`: Colunas `especialidade` e `telefone` na tabela `corretor`.

---

## [Commit 10] - Build do Tailwind, Novo Visual e Pop-ups da Interface
- **Data/Hora:** 2026-11-16
- **Mensagem:** `feat: tailwind no build, novo visual da interface e pop-ups no lugar de alert/confirm`
- **O que foi enviado para o Git:**
  1. `frontend/package.json`, `vite.config.js` e `src/tailwind.css`: Tailwind CSS 4 compilado no build. O CSS exportado do protótipo só continha as classes usadas na exportação, e cerca de 60 classes do código não existiam (fundo do cabeçalho fixo, cor dos botões principais, grids responsivos, rolagem das tabelas).
  2. `src/tailwind.css`, `index.html`, `components/AppShell.jsx` e `components/ui/UiBits.jsx`: Nova identidade visual (fonte Geist, paleta neutra com azul, menu lateral claro, cabeçalho com a localização atual, componentes padronizados).
  3. `components/ui/UiBits.jsx`: `FeedbackProvider`/`useFeedback` com pop-ups de sucesso, erro, aviso, informação e confirmação, e `Modal` renderizado em portal. Todos os `alert()` e `confirm()` do navegador foram substituídos.

---

## [Commit 11] - Camada de Mapeamento entre a API e as Telas
- **Data/Hora:** 2026-11-16
- **Mensagem:** `fix: mapeamento dos DTOs da API para as telas (premios, coberturas, alertas, propostas e usuarios)`
- **O que foi enviado para o Git:**
  1. `frontend/src/mappers.js`: Conversão dos DTOs do backend para o modelo das telas (versão documentada no PDF da oitava sprint, que não havia sido enviada ao repositório), com rótulos de situação e formatação de datas no fuso local.
  2. Telas (`App`, `LoginView`, `DashboardTab`, `ClientesTab`, `ApolicesTab`, `CotacoesTab`, `AlertasTab`, `SegurosTab`, `CorretoresTab`, `UsuariosTab`, `RelatoriosTab`): Uso dos campos corretos (`valorPremio`, `valorBase`, `descricao`, `assunto`, `dataSolicitacao`, `loginEmail`/`perfilAcesso`) e das rotas corretas (`PATCH /alertas/{id}/ler`, `PATCH /apolices/parcelas/{id}`, `PATCH /usuarios/{id}/status`). Prêmios, coberturas, alertas, propostas, usuários, contadores dos corretores e relatórios passaram a exibir os dados reais; renovar, cancelar e pagar parcela voltaram a funcionar.
  3. `ClientesTab.jsx`: Campo de data de nascimento/fundação (antes era enviado fixo como 1990-01-01).

---

## [Commit 12] - Correção dos Erros 500 e das Mensagens de Erro
- **Data/Hora:** 2026-11-16
- **Mensagem:** `fix: transacoes readonly na busca e historico de clientes, alertas de vencimento e consulta de seguro`
- **O que foi enviado para o Git:**
  1. `ClienteService.java`, `ApoliceService.java`, `SeguroService.java`: `@Transactional(readOnly = true)` em `buscar`, `buscarHistorico`, `listarAlertasVencimento`, `listarParcelasPorApolice` e `buscarPorId` (`LazyInitializationException` gerava HTTP 500).
  2. `core/exception/GlobalExceptionHandler.java`: Erros inesperados registrados no log do servidor, com mensagem genérica ao usuário; JSON malformado passa a responder 400.

---

## [Commit 13] - Controle de Acesso por Perfil
- **Data/Hora:** 2026-11-16
- **Mensagem:** `feat: autorizacao por perfil na API, dados proprios do cliente e menu por perfil`
- **O que foi enviado para o Git:**
  1. `core/security/SecurityConfig.java`: Regras de acesso por rota para ADMINISTRADOR, CORRETOR e CLIENTE; respostas 401 (sem login) e 403 (sem permissão) em JSON.
  2. `core/security/UsuarioLogado.java` e controllers de clientes, apólices, cotações, propostas e alertas: Cliente acessa apenas os próprios registros e só solicita cotação para si.
  3. `core/security/JwtAuthenticationFilter.java`: Perfil e situação lidos do banco a cada requisição (usuário desativado perde o acesso na hora).
  4. Frontend (`App.jsx`, `api.js`, `permissoes.js`, `AppShell.jsx`, `LoginView.jsx` e telas): Removidos o login automático como administrador, o "fallback" que entrava como admin com senha errada e o seletor de perfil; menu e botões conforme o perfil; painel próprio do cliente ("Minha área"); sessão expirada volta ao login.

---

## [Commit 14] - Validações, Vencimento Automático, Auditoria e Telas de Edição
- **Data/Hora:** 2026-11-16
- **Mensagem:** `feat: cpf/cnpj, vencimento automatico, motivo de cancelamento, auditoria, corretor do cliente e edicao`
- **O que foi enviado para o Git:**
  1. `core/validation/CpfCnpj.java`, `ClienteService.java`, `AuthService.java`: Validação dos dígitos verificadores e gravação padronizada com máscara (duplicidade detectada com ou sem pontuação).
  2. `ApoliceService.java`, `Apolice.java`, `dto/CancelamentoRequest.java`, `dto/ApoliceResponse.java`: Vigência com término posterior ao início, renovação apenas de apólice ativa, cancelamento com motivo e data.
  3. `VencimentoApolicesJob.java` e `core/config/SchedulingConfig.java`: Apólices com vigência encerrada passam a VENCIDA (ao iniciar e diariamente às 00:05).
  4. `core/audit/AuditoriaInterceptor.java` e `core/config/WebConfig.java`: Toda operação de escrita registrada em `log_auditoria` (usuário, data/hora, IP, tabela e ação).
  5. `Cliente.java`, `ClienteRequest/Response`, `ClienteController.java`, `ClienteService.java`: Corretor responsável pelo cliente (`fk_corretor_id`); o corretor que cadastra fica como responsável por padrão.
  6. `ClienteService.java` e `SeguroService.java`: A edição só substitui endereços, telefones e coberturas quando a lista é enviada (antes apagava os existentes).
  7. `CorretorService.java`: Status do corretor sincronizado com o login do usuário.
  8. `Application.java`: Fuso horário de Brasília para as datas do sistema.
  9. Frontend: Edição de clientes, corretores (com ativar/desativar) e seguros; corretor responsável no cadastro de clientes; motivo e data do cancelamento na lista de apólices.
  10. `database/init/01-schema.sql` e `core/init/DataInitializer.java`: Colunas `apolice.motivo_cancelamento`, `apolice.data_cancelamento` e `cliente.fk_corretor_id`; CPFs válidos e corretor responsável nos dados de demonstração.

---

## [Commit 15] - Atualização da Documentação
- **Data/Hora:** 2026-11-16
- **Mensagem:** `docs: endpoints e perfis, modelo fisico atualizado, rastreabilidade dos requisitos e novos prints`
- **O que foi enviado para o Git:**
  1. `docs/atualizacoes-documentacao-pdf.md`: Seções corrigidas para o PDF (frontend, autenticação e perfis, tabela de endpoints, códigos HTTP, DDL PostgreSQL, rastreabilidade RF01–RF35, legendas da interface e lista de arquivos para a seção de código-fonte).
  2. `docs/imagens/interface/`: Prints atualizados de todas as telas.
  3. `docs/instalacao-e-execucao.md` e `README.md`: Contas de demonstração, exemplos reais de login/token/erros e solução de conflito de porta sem alterar o `docker-compose.yml`.
  4. `.gitignore`: Ignora o `docker-compose.override.yml` local.

---

## [Commit 16] - Estilo Próprio e Remoção do Protótipo Lovable
- **Data/Hora:** 2026-11-16
- **Mensagem:** `refactor: estilo proprio com tailwind e remocao dos arquivos do prototipo lovable`
- **O que foi enviado para o Git:**
  1. `frontend/src/tailwind.css`: Passa a ser o único arquivo de estilo. Define os tokens da HCR (cores, fontes Geist, animação de entrada) e os estilos de base (cor padrão das bordas, foco dos campos, cursor dos botões).
  2. Removidos `frontend/src/lovable-theme.css` (CSS de 89 KB pré-compilado na exportação do protótipo), `frontend/public/login-brasilia.jpg` (imagem do protótipo) e `frontend/src/styles.js` (estilos inline das telas de teste antigas, sem uso). O CSS final caiu de 122 KB para 31 KB.
  3. Telas e `components/ui/UiBits.jsx`: Tokens do protótipo substituídos pelos da HCR (`signal` → `warning`, `sidebar-*` → cores padrão, `shadow-card`/`shadow-lift` → sombras nativas do Tailwind, `tabular` → `tabular-nums`, `animate-rise` → `animate-fade-in`, `font-display` removido); tom `signal` do `StatCard` renomeado para `destaque`.
  4. `components/LoginView.jsx`: Novo painel da marca (cor primária, destaques do sistema) no lugar da foto, e contas de demonstração organizadas em uma constante.
  5. `docs/imagens/interface/`: Prints atualizados.

---

## [Commit 17] - Tela de Prêmios sob Gestão, Comissão e Cobrança
- **Data/Hora:** 2026-11-16
- **Mensagem:** `feat: tela de premios com comissao, recebimentos por mes e cobranca de parcelas`
- **O que foi enviado para o Git:**
  1. `features/seguros` (`Seguro`, `SeguroRequest`, `SeguroResponse`, `SeguroService`) e `database/init/01-schema.sql`: Coluna `percentual_comissao` no seguro (0 a 100%), no cadastro, na edição e na resposta da API; percentuais nos dados de demonstração (Automóvel 15%, Residencial 20%, Vida 25%).
  2. `frontend/src/components/PremiosTab.jsx`: Nova tela "Prêmios sob gestão" (menu Operação → Prêmios e card do Painel), para administrador e corretor: prêmios anuais, comissão estimada, recebido, a receber e em atraso; composição por seguro e por corretor; tabela das apólices ativas com comissão e andamento do recebimento.
  3. `frontend/src/components/GraficoRecebimentos.jsx`: Gráfico de barras empilhadas com os recebimentos dos 12 meses (recebido, em atraso com hachura e a receber), legenda, tooltip por mês e visualização em tabela.
  4. Cobrança na lista de recebimentos pendentes: parcelas vencidas primeiro, com "Notificar cliente" (cria um alerta para o cliente) e "Registrar pagamento".
  5. `components/SegurosTab.jsx`: Campo "Comissão da corretora (%)" no cadastro e na edição; percentual exibido no card do seguro.
  6. `components/ui/UiBits.jsx`: `StatCard` clicável quando recebe `onClick`.

---

## [Commit 18] - Logo da HCR na Interface
- **Data/Hora:** 2026-11-16
- **Mensagem:** `feat: logo da hcr no menu, na tela de login e como favicon`
- **O que foi enviado para o Git:**
  1. `frontend/public/logo-hcr.png`, `logo-hcr-monograma.png` e `favicon.png`: Logo oficial com fundo transparente (a imagem original tinha o fundo xadrez desenhado nos pixels), recortado em versão completa, monograma e ícone.
  2. `components/AppShell.jsx`: Monograma no topo do menu lateral, com "HCR · Corretora de Seguros".
  3. `components/LoginView.jsx`: Logo completo acima do formulário e monograma em branco no painel azul.
  4. `index.html`: Favicon e título da aba "HCR Corretora de Seguros".

---

## [Commit 19] - Edição de Apólice e Cobertura, Buscas, Perfil de Usuário e Backup
- **Data/Hora:** 2026-11-16
- **Mensagem:** `feat: edicao de apolice e cobertura, busca de corretores e seguros, perfil de usuario e backup do banco`
- **O que foi enviado para o Git:**
  1. `features/apolices` (`dto/AtualizacaoApoliceRequest.java`, `ApoliceService`, `ApoliceController`): `PUT /apolices/{id}` altera corretor, vigência e prêmio de apólice ativa; as parcelas pagas são mantidas e o saldo é redistribuído entre as pendentes (RF13).
  2. `features/seguros` (`SeguroService`, `SeguroController`): `PUT /seguros/coberturas/{id}` para alterar descrição e valor de cobertura.
  3. `features/usuarios` (`UsuarioService`, `UsuarioController`): Perfil validado (ADMINISTRADOR, CORRETOR ou CLIENTE) e bloqueio de alteração de perfil/status da própria conta (RF28).
  4. Frontend: botão "Editar apólice"; editar e excluir cobertura no card do seguro; busca em Corretores e Seguros (RF25); seletor de perfil na tela de Usuários e remoção da coluna "Data de criação", que não existe no backend.
  5. `scripts/backup-banco.sh|.ps1` e `scripts/restaurar-banco.sh|.ps1`: Backup e restauração do PostgreSQL com retenção dos 14 mais recentes; seção 6 do guia de instalação; `backups/` no `.gitignore` (RNF21).

---

## [Commit 20] - Chave do JWT por Variável de Ambiente
- **Data/Hora:** 2026-11-16
- **Mensagem:** `fix: chave do jwt lida da variavel de ambiente JWT_SECRET`
- **O que foi enviado para o Git:**
  1. `core/security/JwtTokenService.java`: Removida a chave fixa do código. A chave vem de `JWT_SECRET`; sem ela, é gerada uma chave temporária a cada inicialização (com aviso no log); com menos de 32 caracteres, a aplicação não inicia.
  2. `src/main/resources/application.yml` e `docker-compose.yml`: Propriedades `app.jwt.secret` e `app.jwt.expiration-seconds` ligadas às variáveis `JWT_SECRET` e `JWT_EXPIRATION_SECONDS`.
  3. `.env.example` (modelo versionado) e `.gitignore` (ignora o `.env` local com os segredos).
  4. `README.md` e `docs/instalacao-e-execucao.md`: Passo de criação do `.env` e tabela de variáveis de ambiente.
