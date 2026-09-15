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

# 2. Subir o banco de dados e a aplicação via Docker Compose
docker compose up -d --build
```

O Frontend estará disponível em: `http://localhost:3000`  
A API estará disponível em: `http://localhost:8080`  
O banco PostgreSQL estará na porta: `localhost:5432`

---

## 📚 Documentação do Projeto

- 📖 **[Guia de Instalação, Clonagem e Docker](docs/instalacao-e-execucao.md)**: Passo a passo detalhado para Windows 11 e Linux, comandos de gerenciamento de containers e troubleshooting.
- 📐 **[Regras Arquiteturais (.skills/arch-rules.md)](.skills/arch-rules.md)**: Organização Package by Feature, divisão de trabalho das duplas e regras de escopo.
- 🗄️ **[Regras de Banco de Dados (.skills/database-rules.md)](.skills/database-rules.md)**: Padrões de SQL, DDL, integridade referencial e auditoria.
- 💻 **[Padrões de Código (.skills/code-style.md)](.skills/code-style.md)**: Padrões Java 21, Records, Bean Validation e entidades JPA.

---

## 🛠️ Estrutura do Projeto

- `frontend/`: Interface Web de teste em **React + Vite** servida por **Nginx** (porta 3000).
- `core/`: Componentes transversais compartilhados (segurança, CORS, tratamento global de erros).
- `features/auth/`: Módulo de autenticação e controle de acesso.
- `features/clientes/`: Gestão e cadastro de clientes.
- `features/seguros/`: Catálogo e tipos de seguros.
- `features/corretores/`: Gestão de corretores.
- `features/apolices/`: Emissão e acompanhamento de apólices.
- `features/dashboard/`: Métricas e indicadores consolidados.