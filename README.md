# Projeto Integrador - Sistema de Corretora de Seguros

Sistema de gerenciamento para corretora de seguros desenvolvido em **Java 21**, **Spring Boot 3** e **PostgreSQL 16**, estruturado sob a arquitetura **Package by Feature**.

---

## 🚀 Guia Rápido de Inicialização

### Pré-requisitos
- Git
- Docker e Docker Compose

> [!TIP]
> Caso ainda não tenha o ambiente configurado, consulte o nosso **[Guia Completo de Instalação e Execução (Windows 11 e Linux)](docs/instalacao-e-execucao.md)**.

### Clonar e Iniciar

```bash
# 1. Clonar o repositório
git clone https://github.com/vitorguinomio/Projeto_Integrador_Corretora.git
cd Projeto_Integrador_Corretora

# 2. Criar o arquivo de configuração local e definir a chave dos logins (JWT_SECRET)
cp .env.example .env            # no Windows: copy .env.example .env
#    edite o .env e preencha JWT_SECRET (ex.: saída de "openssl rand -base64 48")

# 3. Subir o banco de dados e a aplicação via Docker Compose
docker compose up -d --build
```

O Frontend estará disponível em: `http://localhost:3000`  
A API estará disponível em: `http://localhost:8080`  
O banco PostgreSQL estará na porta: `localhost:5432`

### Contas de demonstração

O sistema abre na tela de login. Na primeira inicialização são criadas estas contas:

| Perfil | E-mail | Senha | O que vê |
|---|---|---|---|
| Administrador | `admin@hcr.com` | `admin123` | Todas as telas |
| Corretor | `carlos.silva@corretora.com` | `corretor123` | Painel, Clientes, Apólices, Cotações, Alertas e Seguros |
| Cliente | `joao.silva@email.com` | `cliente123` | Apenas os próprios dados (apólices, cotações e propostas) |

As permissões valem na API (`core/security/SecurityConfig.java`): o frontend apenas esconde o que o perfil não pode usar.

---

## 📚 Documentação do Projeto

- 📖 **[Guia de Instalação, Clonagem e Docker](docs/instalacao-e-execucao.md)**: Passo a passo detalhado para Windows 11 e Linux, comandos de gerenciamento de containers e troubleshooting.
- 📐 **[Regras Arquiteturais (.skills/arch-rules.md)](.skills/arch-rules.md)**: Organização Package by Feature, divisão de trabalho das duplas e regras de escopo.
- 🗄️ **[Regras de Banco de Dados (.skills/database-rules.md)](.skills/database-rules.md)**: Padrões de SQL, DDL, integridade referencial e auditoria.
- 💻 **[Padrões de Código (.skills/code-style.md)](.skills/code-style.md)**: Padrões Java 21, Records, Bean Validation e entidades JPA.
- 📝 **[Registro de Commits por Etapas](docs/CHANGELOG_COMMITS.md)**: O que cada etapa do desenvolvimento entregou.
- 📄 **[Atualizações para a documentação em PDF](docs/atualizacoes-documentacao-pdf.md)**: Endpoints e perfis, modelo físico atualizado, rastreabilidade dos requisitos e prints novos da interface (`docs/imagens/interface/`).

---

## 🛠️ Estrutura do Projeto

- `frontend/`: Interface Web em **React + Vite + Tailwind CSS** servida por **Nginx** (porta 3000).
- `core/`: Componentes transversais compartilhados (segurança e permissões por perfil, auditoria, validação de CPF/CNPJ, CORS, tratamento global de erros).
- `features/auth/`: Módulo de autenticação e controle de acesso.
- `features/clientes/`: Gestão e cadastro de clientes.
- `features/seguros/`: Catálogo e tipos de seguros.
- `features/corretores/`: Gestão de corretores.
- `features/apolices/`: Emissão e acompanhamento de apólices.
- `features/dashboard/`: Métricas e indicadores consolidados.