# Regras Arquiteturais e Zonas Read-Only

## 1. Arquitetura do Projeto
Este projeto segue rigorosamente o padrão **Package by Feature** em conjunto com um módulo transversal central (**Core**).

A estrutura de pacotes é organizada por domínios de negócio:
- `com.hcr.corretora.core`: Componentes transversais compartilhados (segurança, tratamento global de exceções, configurações de rede/CORS).
- `com.hcr.corretora.features`: Módulos de negócio independentes e autônomos.

---

## 2. Divisão de Trabalho das Equipes e Agentes de IA

Cada Agente de IA ou desenvolvedor deve operar **estritamente** dentro do escopo de sua respectiva feature:

| Papel / Equipe | Escopo Autorizado |
|---|---|
| **Platform / Security** | `com.hcr.corretora.features.auth` |
| **Dupla 1** | `com.hcr.corretora.features.clientes`<br>`com.hcr.corretora.features.seguros`<br>`com.hcr.corretora.features.corretores` |
| **Dupla 2** | `com.hcr.corretora.features.apolices`<br>`com.hcr.corretora.features.dashboard` |

---

## 3. Zonas Estritamente READ-ONLY para Agentes de IA

Os seguintes arquivos e diretórios são considerados de infraestrutura crítica compartilhada e **NÃO DEVEM** ser alterados por agentes de IA trabalhando em features:

1. `src/main/java/com/hcr/corretora/core/**` (Configurações, Security, Exceptions globais)
2. `pom.xml` (Dependências e plugins Maven do projeto)
3. `database/**` (Scripts DDL e migrações de banco de dados)
4. `docker-compose.yml` (Infraestrutura de containers)
5. `src/main/resources/application.yml` (Configurações centrais da aplicação)

> [!WARNING]
> Se uma feature necessitar de uma nova dependência no Maven ou alteração em tabela de banco de dados, solicite ao Tech Lead / Engenheiro de Plataforma. Não edite os arquivos das zonas Read-Only diretamente.

---

## 4. Regras de Comunicação entre Features
- Features não devem acessar repositórios diretamente de outras features.
- A comunicação entre features deve ocorrer via DTOs e chamadas de serviços públicos bem definidos.
- Mantenha baixo acoplamento e alta coesão em cada pacote.

## 5. Forma de ser comunicar
- Sempre fazer os texto em pt-br
- Quando tiver questões problematicas trazer o detalhes central do problema
