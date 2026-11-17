# Atualizações para a documentação (PDF da oitava sprint)

Este arquivo reúne o que precisa ser corrigido no documento **"Documentação corretora oitava sprint – FINAL.pdf"** para que ele volte a refletir o sistema. Cada item indica a página/seção do PDF e traz o texto pronto para colar no Word.

As correções vêm de uma conferência completa entre o PDF e o código (requisitos, histórias de usuário, API, banco e código-fonte), seguida das correções feitas no sistema (etapas 0 a 4 do `docs/CHANGELOG_COMMITS.md`).

---

## Resumo do que mudar

| Página / seção do PDF | O que fazer |
|---|---|
| p. 31 – Funcionamento da API | Trocar "HTML, CSS e JavaScript" por React + Vite (texto abaixo) |
| p. 32 – Segurança / autorização | Substituir pelo texto de autenticação e **perfis** (agora implementados) |
| Seção 2 (nova subseção) | Incluir a **tabela de endpoints** com perfis e códigos HTTP |
| p. 34 – Modelo lógico | Atualizar tipos e nulidades conforme o modelo físico abaixo |
| p. 35 – Modelo físico | Trocar **"MySQL" por "PostgreSQL 16"** |
| p. 35–37 – Código SQL | Substituir pela DDL atual (`database/init/01-schema.sql`, reproduzida abaixo) |
| Requisitos (p. 7–15) | Opcional: incluir a **tabela de rastreabilidade** com o status de cada RF |
| p. 38–48 – Interface | Trocar os prints pelos de `docs/imagens/interface/` e ajustar as legendas |
| p. 49–199 – Código-fonte | Reimprimir os arquivos listados na seção 7 deste documento |

---

## 1. Funcionamento da API (p. 31) – parágrafo sobre o frontend

> O frontend da aplicação foi desenvolvido em **React 18** com **Vite**, utilizando **Tailwind CSS** para a estilização e a biblioteca de ícones **lucide-react**. Em produção, a interface é servida por um contêiner **Nginx**, que também atua como proxy reverso: as requisições feitas pela interface para o prefixo `/api` são encaminhadas ao backend Spring Boot. A comunicação entre frontend e backend utiliza requisições HTTP com corpo em JSON. Uma camada de mapeamento (`frontend/src/mappers.js`) converte os objetos retornados pela API para o formato utilizado pelas telas, concentrando em um único lugar a correspondência entre os campos.

---

## 2. Autenticação e autorização (p. 32) – texto substituto

> O acesso à API é protegido por **autenticação via token JWT** (assinado com HMAC-SHA256). A chave de assinatura não fica no código: ela é lida da variável de ambiente `JWT_SECRET` (arquivo `.env`, fora do controle de versão), e a aplicação se recusa a iniciar com uma chave de menos de 32 caracteres. O usuário informa e-mail e senha em `POST /auth/login`; as senhas são armazenadas com **BCrypt**. Em caso de sucesso, a API devolve um token que deve ser enviado nas demais requisições no cabeçalho `Authorization: Bearer <token>`.
>
> A cada requisição, o filtro de segurança valida o token e consulta o usuário no banco de dados: o **perfil de acesso** (ADMINISTRADOR, CORRETOR ou CLIENTE) e a **situação** (ativo/inativo) são lidos do cadastro atual, e não do token. Assim, um usuário desativado perde o acesso imediatamente e uma mudança de perfil passa a valer na hora.
>
> A **autorização** é feita em duas camadas:
> 1. **Por rota** (`SecurityConfig`): cada grupo de endpoints define quais perfis podem acessá-lo (tabela da seção 3).
> 2. **Por dado** (`UsuarioLogado`): um usuário com perfil CLIENTE só consegue consultar e operar sobre os próprios registros (apólices, cotações, propostas, histórico e dados cadastrais). A tentativa de acessar dados de outro cliente é recusada.
>
> No frontend, o menu e os botões de ação são exibidos de acordo com o perfil do usuário logado (`frontend/src/permissoes.js`). Essa adaptação da interface é apenas uma conveniência: quem garante o bloqueio é a API.
>
> Todas as operações que alteram dados (cadastros, alterações, exclusões, renovações, cancelamentos, aceites etc.) são registradas automaticamente na **trilha de auditoria** (`log_auditoria`), com o usuário, a data e hora, o IP de origem, a tabela afetada e a descrição da ação.

### Matriz de permissões por perfil

| Área | Administrador | Corretor | Cliente |
|---|---|---|---|
| Painel | Indicadores gerais | Indicadores gerais | Apenas os próprios números |
| Clientes | Total | Total | Somente o próprio cadastro e histórico |
| Apólices e parcelas | Total | Total (emitir, renovar, cancelar, baixar parcela) | Consulta das próprias |
| Cotações | Total | Total | Solicitar e consultar as próprias |
| Propostas | Total | Elaborar | Aceitar ou recusar as próprias |
| Alertas | Todos | Os próprios | Os próprios |
| Seguros e coberturas | Cadastrar e alterar | Consulta | Consulta (catálogo) |
| Corretores | Total | Consulta | – |
| Usuários, relatórios e auditoria | Total | – | – |

---

## 3. Tabela de endpoints (nova subseção da seção 2)

Legenda de perfis: **A** = Administrador, **Co** = Corretor, **Cl** = Cliente, **Público** = não exige login. "Cl (próprios)" indica que o cliente só acessa os próprios registros.

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| POST | `/auth/login` | Autenticação (retorna o token JWT) | Público |
| POST | `/auth/register` | Autocadastro de cliente | Público |
| GET | `/auth/me` | Dados do usuário logado | A, Co, Cl |
| GET | `/dashboard`, `/dashboard/stats` | Indicadores gerais da corretora | A, Co |
| GET | `/clientes` (`?busca=`) | Lista e pesquisa de clientes | A, Co |
| GET | `/clientes/{id}` | Dados de um cliente | A, Co, Cl (próprios) |
| GET | `/clientes/{id}/historico` | Histórico de apólices e cotações | A, Co, Cl (próprios) |
| POST / PUT / DELETE | `/clientes`, `/clientes/{id}` | Cadastro, alteração e exclusão | A, Co |
| GET | `/corretores`, `/corretores/{id}` | Consulta de corretores | A, Co |
| POST / PUT / DELETE | `/corretores`, `/corretores/{id}` | Cadastro, alteração e exclusão | A |
| PATCH | `/corretores/{id}/status` | Ativar / desativar corretor | A |
| GET | `/seguros`, `/seguros/{id}` | Catálogo de seguros e coberturas | Público |
| POST / PUT | `/seguros`, `/seguros/{id}` | Cadastro e alteração de seguros | A |
| POST / PUT / DELETE | `/seguros/{id}/coberturas`, `/seguros/coberturas/{id}` | Inclusão, alteração e exclusão de coberturas | A |
| GET | `/apolices` (`?termo=&situacao=&clienteId=&corretorId=`) | Pesquisa de apólices | A, Co, Cl (próprias) |
| GET | `/apolices/{id}`, `/apolices/{id}/parcelas` | Apólice e suas parcelas | A, Co, Cl (próprias) |
| GET | `/apolices/alertas-vencimento` (`?dias=30`) | Apólices que vencem no período | A, Co |
| POST | `/apolices` | Registro de contratação (gera as parcelas) | A, Co |
| PUT | `/apolices/{id}` | Alteração de apólice ativa (corretor, vigência e prêmio; o saldo é redistribuído entre as parcelas pendentes) | A, Co |
| POST | `/apolices/{id}/renovar` | Renovação (nova apólice vinculada à anterior) | A, Co |
| POST | `/apolices/{id}/cancelar` | Cancelamento (com motivo opcional) | A, Co |
| PATCH | `/apolices/parcelas/{id}` | Baixa / alteração de status de parcela | A, Co |
| GET | `/cotacoes`, `/cotacoes/{id}` | Consulta de cotações | A, Co, Cl (próprias) |
| POST | `/cotacoes` | Solicitação de cotação | A, Co, Cl (para si) |
| PATCH | `/cotacoes/{id}/situacao` | Alteração de situação | A, Co |
| GET | `/propostas`, `/propostas/{id}`, `/propostas/cotacao/{id}` | Consulta de propostas | A, Co, Cl (próprias) |
| POST | `/propostas` | Elaboração de proposta | A, Co |
| POST | `/propostas/{id}/aceitar`, `/propostas/{id}/recusar` | Resposta do cliente | A, Cl (próprias) |
| GET | `/alertas` | Notificações do usuário logado | A, Co, Cl |
| POST | `/alertas` | Criação de notificação | A, Co |
| PATCH | `/alertas/{id}/ler` | Marcar notificação como lida | Dono da notificação ou A |
| GET / POST | `/usuarios` | Consulta e cadastro de usuários | A |
| PATCH | `/usuarios/{id}/status`, `/usuarios/{id}/perfil` | Situação e perfil de acesso (não é possível alterar a própria conta) | A |
| GET / POST / PUT | `/administradores` | Cadastro de administradores | A |
| GET | `/relatorios/apolices`, `/clientes`, `/corretores`, `/seguros` | Relatórios consolidados | A |
| GET | `/auditoria` | Trilha de auditoria | A |

### Códigos de resposta

| Código | Quando ocorre |
|---|---|
| 200 / 201 / 204 | Consulta, criação ou exclusão realizada com sucesso |
| 400 | Dados inválidos (validação de campos, CPF/CNPJ inválido, datas incoerentes, JSON malformado) ou regra de negócio violada (ex.: CPF já cadastrado, renovar apólice que não está ativa, registro não encontrado) |
| 401 | Requisição sem login ou com token inválido/expirado |
| 403 | O perfil do usuário não tem permissão para a operação, ou o cliente tentou acessar dados de outro cliente |
| 409 | Operação bloqueada pela integridade do banco (ex.: excluir cliente que possui apólices) |
| 500 | Erro inesperado: o detalhe técnico fica apenas no log do servidor e o usuário recebe uma mensagem genérica |

### Diagrama de sequência – cadastro de cliente (p. 30–31)

Atualizar os retornos de erro citados no diagrama:

| Situação | Retorno |
|---|---|
| Campos obrigatórios não preenchidos | 400 com a lista de campos inválidos |
| CPF/CNPJ inválido (dígitos verificadores) | 400 – "CPF inválido: confira os números digitados." |
| CPF/CNPJ já cadastrado (com ou sem máscara) | 400 – "Já existe um cliente cadastrado com o CPF/CNPJ: …" |
| Falha na operação do banco | 409 (integridade) ou 500 (mensagem genérica) |

---

## 4. Banco de dados (p. 33–37)

### Texto do modelo físico (p. 35)

> Essa é a etapa final de modelagem, em que o código é construído dentro de um SGBD. Foi utilizado o **PostgreSQL 16**. O script abaixo cria as 14 tabelas do sistema com chaves primárias auto-incrementais (`BIGSERIAL`), chaves estrangeiras com regras de exclusão (`ON DELETE CASCADE`, `SET NULL` ou `RESTRICT`, conforme a necessidade de integridade), valores padrão e índices de consulta. O script é executado automaticamente pelo contêiner do PostgreSQL na primeira inicialização (`database/init/01-schema.sql`).

### Principais diferenças em relação à DDL que está hoje nas p. 35–37

- Chaves primárias `BIGSERIAL` (auto-incremento) no lugar de `INT` sem geração automática; chaves estrangeiras `BIGINT`.
- Regras de exclusão definidas em todas as chaves estrangeiras (antes nenhuma tinha `ON DELETE`).
- Colunas usadas pelo sistema que não constavam na DDL: `seguro.valor_base`, `cobertura.valor`, `apolice.valor_premio`, `notificacao_alerta.data_criacao`.
- Colunas novas desta sprint: `seguro.percentual_comissao` (comissão da corretora), `corretor.especialidade`, `corretor.telefone`, `apolice.motivo_cancelamento`, `apolice.data_cancelamento` e `cliente.fk_corretor_id` (corretor responsável pelo cliente, RF19).
- Chaves estrangeiras opcionais onde o fluxo exige: cliente e corretor sem login (`fk_usuario_id` nulo), cotação ainda sem corretor, log de auditoria sem usuário (ex.: autocadastro).
- Valores padrão de situação/status (`'ATIVO'`, `'ATIVA'`, `'SOLICITADA'`, `'PENDENTE'`, `'CELULAR'`) e de datas (`CURRENT_TIMESTAMP`).
- Índices de consulta em CPF/CNPJ, número e término da apólice, e-mail de login e chaves de cliente.

### Código SQL (substitui as p. 35–37)

```sql
-- 1. Tabelas fortes (independentes)
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
    valor_base NUMERIC(10,2) DEFAULT 0.00,
    percentual_comissao NUMERIC(5,2) DEFAULT 0.00
);

-- 2. Tabelas de atores (dependentes de usuario)
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
    especialidade VARCHAR(100),
    telefone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    fk_usuario_id BIGINT UNIQUE,
    CONSTRAINT fk_corretor_usuario FOREIGN KEY (fk_usuario_id) REFERENCES usuario (id) ON DELETE SET NULL
);

-- Vínculo cliente -> corretor responsável (RF19)
ALTER TABLE cliente ADD COLUMN fk_corretor_id BIGINT;
ALTER TABLE cliente ADD CONSTRAINT fk_cliente_corretor FOREIGN KEY (fk_corretor_id) REFERENCES corretor (id) ON DELETE SET NULL;

-- 3. Tabelas satélites e de produtos
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

-- 4. Processo de venda
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

-- 5. Contratação e financeiro
CREATE TABLE apolice (
    id BIGSERIAL PRIMARY KEY,
    numero_apolice VARCHAR(50) NOT NULL UNIQUE,
    data_inicio DATE NOT NULL,
    data_termino DATE NOT NULL,
    situacao VARCHAR(50) NOT NULL DEFAULT 'ATIVA',
    valor_premio NUMERIC(10,2) DEFAULT 0.00,
    motivo_cancelamento VARCHAR(255),
    data_cancelamento DATE,
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

-- 6. Sistema e segurança
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
```

> Os modelos conceitual (p. 33) e lógico (p. 34) devem receber as mesmas mudanças: o relacionamento **Cliente N : 1 Corretor** (corretor responsável) e os novos atributos de Corretor e Apólice listados acima.

---

## 5. Rastreabilidade dos requisitos funcionais (opcional, após a p. 11)

Situação após as correções desta sprint: 35 de 35 requisitos funcionais atendidos.

| Código | Requisito | Situação | Observação |
|---|---|---|---|
| RF01 | Cadastro de clientes | Atendido | Inclui data de nascimento/fundação, endereço, telefone e validação de CPF/CNPJ |
| RF02 | Alteração de clientes | Atendido | Botão "Editar" na tela de Clientes |
| RF03 | Consulta de clientes | Atendido | Por nome, CPF/CNPJ, e-mail ou código |
| RF04 | Exclusão de clientes | Atendido | Bloqueada quando há apólices ou cotações vinculadas |
| RF05 | Cadastro de corretores | Atendido | Registro SUSEP, especialidade e telefone |
| RF06 | Alteração de corretores | Atendido | Edição e ativação/desativação (desativar bloqueia o login) |
| RF07 | Consulta de corretores | Atendido | Com clientes atendidos e apólices ativas |
| RF08 | Controle de acesso | Atendido | JWT + autorização por perfil na API |
| RF09 | Cadastro de seguros | Atendido | Com prêmio base e coberturas iniciais |
| RF10 | Alteração de seguros | Atendido | Edição mantém as coberturas existentes |
| RF11 | Consulta de seguros | Atendido | Catálogo com coberturas e valores |
| RF12 | Cadastro de apólices | Atendido | Gera o cronograma de parcelas |
| RF13 | Alteração de apólices | Atendido | Edição de corretor, vigência e prêmio da apólice ativa, além de renovação, cancelamento e baixa de parcelas |
| RF14 | Consulta de apólices | Atendido | Por número, cliente, seguro e situação |
| RF15 | Controle da situação | Atendido | Ativa, em renovação, cancelada e vencida (automática ao fim da vigência) |
| RF16 | Controle de vigência | Atendido | Término obrigatoriamente posterior ao início |
| RF17 | Cadastro de coberturas | Atendido | Inclusão, alteração e exclusão por seguro |
| RF18 | Relacionamento cliente–seguro | Atendido | Histórico do cliente com apólices e cotações |
| RF19 | Relacionamento corretor–cliente | Atendido | Corretor responsável no cadastro do cliente |
| RF20 | Relacionamento corretor–apólice | Atendido | |
| RF21 | Registro de contratação | Atendido | O aceite da proposta aprova a cotação; a apólice é registrada na tela de Apólices |
| RF22 | Registro de renovação | Atendido | Nova apólice vinculada à anterior |
| RF23 | Registro de cancelamento | Atendido | Grava motivo e data |
| RF24 | Consulta de histórico | Atendido | |
| RF25 | Pesquisa e filtros | Atendido | Busca em clientes, apólices, corretores e seguros (inclusive pelo nome das coberturas) |
| RF26 | Dashboard | Atendido | Indicadores gerais (equipe) ou próprios (cliente) |
| RF27 | Alertas de vencimento | Atendido | Apólices que vencem em 30 dias, no painel e na tela de Alertas |
| RF28 | Gerenciamento de usuários | Atendido | Cadastro, consulta, ativação/desativação e alteração de perfil pela tela |
| RF29 | Controle de permissões | Atendido | Ver matriz de permissões |
| RF30 | Validação de dados | Atendido | Na interface e na API (CPF/CNPJ, datas, telefone, campos obrigatórios) |
| RF31 | Controle de duplicidade | Atendido | CPF/CNPJ (com ou sem máscara), número de apólice, SUSEP e e-mail |
| RF32 | Persistência dos dados | Atendido | PostgreSQL |
| RF33 | Atualização dos dados | Atendido | |
| RF34 | Exclusão controlada | Atendido | Regras `RESTRICT` nas chaves estrangeiras |
| RF35 | Relatórios | Atendido | Carteira por corretor, apólices por situação, prêmios por seguro e exportação CSV |

Requisitos não funcionais que mudaram de situação nesta sprint:

| Código | Situação | Observação |
|---|---|---|
| RNF05 – Controle de acesso | Atendido | Permissões aplicadas pela API |
| RNF06 – Proteção de dados | Atendido | Cliente só acessa os próprios dados |
| RNF20 – Tratamento de erros | Atendido | Mensagens claras; detalhes técnicos apenas no log do servidor |
| RNF22 – Auditoria | Atendido | Todas as operações de escrita são registradas |
| RNF21 – Backup | Atendido | Scripts de backup e restauração (`scripts/`), com retenção dos 14 mais recentes |

---

## 6. Interface (p. 38–48)

Os prints novos estão em `docs/imagens/interface/`, com o número da seção do PDF no nome do arquivo:

| Seção | Arquivo | Legenda sugerida |
|---|---|---|
| 10.1 Login | `10-1-login.png` | Tela de acesso: painel com a identidade da HCR e formulário de e-mail e senha; as abas preenchem as contas de demonstração de cada perfil. |
| 10.2 Painel | `10-2-painel.png` | Visão geral para a equipe: clientes, apólices ativas, prêmios sob gestão, cotações em aberto, vencimentos dos próximos 30 dias e cotações recentes. |
| 10.2 Painel (cliente) | `10-2b-painel-perfil-cliente.png` | "Minha área" do cliente: apenas as próprias apólices, prêmio anual, cotações e vencimentos. |
| 10.3 Clientes | `10-3-clientes.png` | Cadastro, consulta, alteração e exclusão de clientes PF e PJ, com corretor responsável. |
| 10.3 Histórico | `10-3b-historico-cliente.png` | Histórico do cliente: contato, endereço, apólices contratadas e cotações solicitadas. |
| 10.4 Apólices | `10-4-apolices.png` | Controle de vigência, situação, prêmio e parcelas; registro de contratação, renovação e cancelamento com motivo. |
| 10.4 Prêmios | `10-4b-premios.png` | Prêmios sob gestão: total da carteira ativa, comissão da corretora, valores recebidos, a receber e em atraso, recebimentos por mês, composição por seguro e por corretor e cobrança das parcelas pendentes (notificar o cliente e registrar o pagamento). |
| 10.5 Cotações e propostas | `10-5-cotacoes-propostas.png` | Fluxo comercial: solicitação, elaboração da proposta pela equipe e aceite ou recusa pelo cliente. |
| 10.6 Alertas | `10-6-alertas.png` | Apólices que vencem nos próximos 30 dias e notificações do usuário, com marcação de leitura. |
| 10.7 Seguros e coberturas | `10-7-seguros-coberturas.png` | Catálogo de seguros com prêmio base e coberturas; cadastro e edição pelo administrador. |
| 10.8 Corretores | `10-8-corretores.png` | Corretores com registro SUSEP, contato, clientes atendidos e apólices ativas; edição e ativação/desativação. |
| 10.9 Usuários e permissões | `10-9-usuarios-permissoes.png` | Usuários do sistema com perfil e situação, e matriz de permissões por perfil. |
| 10.10 Relatórios | `10-10-relatorios.png` | Carteira ativa, carteira por corretor, apólices por situação, prêmios por seguro e exportação CSV. |
| 10.11 Auditoria | `10-11-auditoria.png` | Trilha de auditoria: data e hora, ação, tabela, usuário e IP de cada operação. |

Texto de abertura sugerido para a seção 10:

> As telas abaixo foram capturadas do sistema em execução, com os dados de demonstração. O menu lateral e as ações disponíveis variam conforme o perfil do usuário (administrador, corretor ou cliente).

---

## 7. Código-fonte (p. 49–199)

O PDF imprime uma versão do frontend que nunca foi enviada ao repositório (com `mappers.js`). O código atual do repositório já incorpora essas correções e as desta sprint. Para a seção 11, reimprimir os arquivos abaixo.

**Novos**
- `src/main/java/com/hcr/corretora/core/security/UsuarioLogado.java`
- `src/main/java/com/hcr/corretora/core/audit/AuditoriaInterceptor.java`
- `src/main/java/com/hcr/corretora/core/config/WebConfig.java`
- `src/main/java/com/hcr/corretora/core/config/SchedulingConfig.java`
- `src/main/java/com/hcr/corretora/core/validation/CpfCnpj.java`
- `src/main/java/com/hcr/corretora/features/apolices/VencimentoApolicesJob.java`
- `src/main/java/com/hcr/corretora/features/apolices/dto/CancelamentoRequest.java`
- `frontend/src/mappers.js`, `frontend/src/permissoes.js`, `frontend/src/tailwind.css`

**Removidos** (não devem mais aparecer na seção 11)
- `frontend/src/lovable-theme.css`, `frontend/src/styles.js`, `frontend/public/login-brasilia.jpg`

**Alterados – backend**
- `Application.java` (fuso horário de Brasília)
- `core/security/SecurityConfig.java`, `core/security/JwtAuthenticationFilter.java`
- `core/exception/GlobalExceptionHandler.java`
- `core/init/DataInitializer.java`
- `features/clientes`: `Cliente.java`, `ClienteController.java`, `ClienteService.java`, `dto/ClienteRequest.java`, `dto/ClienteResponse.java`
- `features/corretores`: `Corretor.java`, `CorretorController.java`, `CorretorService.java`, `dto/CorretorRequest.java`, `dto/CorretorResponse.java`
- `features/apolices`: `Apolice.java`, `ApoliceController.java`, `ApoliceRepository.java`, `ApoliceService.java`, `dto/ApoliceResponse.java`
- `features/cotacoes/CotacaoController.java`, `features/propostas/PropostaController.java`
- `features/alertas/AlertaController.java`, `features/alertas/AlertaService.java`
- `features/seguros/SeguroService.java`, `features/auth/AuthService.java`
- `database/init/01-schema.sql`

**Alterados – frontend**
- `index.html`, `vite.config.js`, `package.json`, `src/main.jsx`, `src/App.jsx`, `src/api.js`
- Todos os arquivos de `src/components/` (telas e `ui/UiBits.jsx`)
