# Guia de Instalação, Clonagem e Execução com Docker

Este documento contém todas as instruções necessárias para preparar seu ambiente de desenvolvimento, clonar o repositório e executar a aplicação utilizando o **Docker Compose**. O guia abrange tanto **Windows 11** quanto distribuições **Linux**.

---

## Sumário
1. [Guia Rápido de Instalação dos Pré-requisitos](#1-guia-rápido-de-instalação-dos-pré-requisitos)
   - [Windows 11](#windows-11)
   - [Linux (Ubuntu / Debian / Fedora / Arch)](#linux-ubuntudebian--fedora--arch)
   - [Verificação das Instalações](#verificação-das-instalações)
2. [Como Clonar o Projeto](#2-como-clonar-o-projeto)
3. [Iniciando com Docker Compose](#3-iniciando-com-docker-compose)
   - [Cenário A: Subir Banco de Dados + Aplicação (Recomendado)](#cenário-a-subir-banco-de-dados--aplicação-completo)
   - [Cenário B: Subir apenas o PostgreSQL (Para desenvolvimento na IDE)](#cenário-b-subir-apenas-o-postgresql-modo-híbrido)
4. [Comandos Úteis de Gerenciamento do Docker](#4-comandos-úteis-de-gerenciamento-do-docker)
5. [Testando os Endpoints Iniciais](#5-testando-os-endpoints-iniciais)
6. [Resolução de Problemas Comuns](#6-resolução-de-problemas-comuns)

---

## 1. Guia Rápido de Instalação dos Pré-requisitos

Para executar este projeto, os dois únicos requisitos obrigatórios são **Git** e **Docker** (com Docker Compose).

---

### Windows 11

Recomenda-se utilizar o **PowerShell** ou o **Terminal do Windows** como Administrador ou o gerenciador de pacotes nativo `winget`.

#### Passo 1: Instalar o WSL2 (Requisito para o Docker Desktop)
Abra o PowerShell como Administrador e execute:
```powershell
wsl --install
```
> [!NOTE]
> Se o WSL2 já estiver instalado, certifique-se de que ele está atualizado executando `wsl --update`. Pode ser necessário reiniciar o computador.

#### Passo 2: Instalar o Git
Via terminal `winget`:
```powershell
winget install --id Git.Git -e --source winget
```
*Ou baixe o instalador oficial em: [git-scm.com/download/win](https://git-scm.com/download/win)*.

#### Passo 3: Instalar o Docker Desktop
Via terminal `winget`:
```powershell
winget install --id Docker.DockerDesktop -e --source winget
```
*Ou baixe o instalador oficial em: [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)*.

> [!IMPORTANT]
> Durante a instalação do Docker Desktop, garanta que a opção **"Use WSL 2 instead of Hyper-V"** esteja marcada. Após a conclusão, abra o Docker Desktop pelo menu Iniciar para inicializar a engine do Docker.

#### (Opcional) Java 21 e Maven para Desenvolvimento Local na IDE
Se desejar rodar a aplicação diretamente pela sua IDE (IntelliJ IDEA, VS Code, Eclipse):
```powershell
winget install --id EclipseAdoptium.Temurin.21.JDK -e --source winget
winget install --id Apache.Maven -e --source winget
```

---

### Linux (Ubuntu/Debian / Fedora / Arch)

#### Distribuições baseadas em Debian / Ubuntu

1. **Instalar Git**:
   ```bash
   sudo apt update
   sudo apt install -y git curl
   ```

2. **Instalar Docker Engine e Docker Compose Plugin**:
   ```bash
   # Remove pacotes conflitantes
   for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do sudo apt-get remove -y $pkg; done

   # Configura o repositório oficial do Docker
   sudo apt update
   sudo apt install -y ca-certificates curl gnupg
   sudo install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   sudo chmod a+r /etc/apt/keyrings/docker.gpg

   echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
     $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
     sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

   sudo apt update
   sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   ```

3. **Permitir executar Docker sem `sudo`**:
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

4. **(Opcional) Java 21 e Maven**:
   ```bash
   sudo apt install -y openjdk-21-jdk maven
   ```

#### Fedora
```bash
sudo dnf install -y git dnf-plugins-core
sudo dnf-3 config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
```

#### Arch Linux / Manjaro
```bash
sudo pacman -Syu --noconfirm git docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
```

---

### Verificação das Instalações

Abra um novo terminal (PowerShell no Windows ou Bash no Linux) e execute:

```bash
git --version
docker --version
docker compose version
```

Se todos retornarem suas respectivas versões, seu ambiente está pronto!

---

## 2. Como Clonar o Projeto

Escolha o método de sua preferência (HTTPS ou SSH) e execute no terminal:

### Opção 1: Via HTTPS (Mais simples, não exige chaves SSH)
```bash
git clone https://github.com/vitorguinomio/Projeto_Integrador_Corretora.git
```

### Opção 2: Via Chave SSH (Recomendado se já tiver chave configurada no GitHub)
```bash
git clone git@github.com:vitorguinomio/Projeto_Integrador_Corretora.git
```

### Acessar a pasta do projeto:
```bash
cd Projeto_Integrador_Corretora
```

---

## 3. Iniciando com Docker Compose

O arquivo `docker-compose.yml` está configurado para subir:
1. **`postgres`**: Banco de dados PostgreSQL 16 Alpine, com script de schema inicial (`01-schema.sql`) executado automaticamente na primeira inicialização.
2. **`app`**: A aplicação Spring Boot (Java 21) compilada e empacotada automaticamente via Dockerfile multi-stage.
3. **`frontend`**: Aplicação SPA React + Vite empacotada com servidor Nginx Alpine, servindo a interface web e provendo proxy reverso das rotas `/api/` para o Spring Boot.

---

### Cenário A: Subir Banco de Dados + Aplicação + Frontend (Completo)

Para compilar o código e subir todos os serviços de uma vez em segundo plano (modo detached):

```bash
docker compose up -d --build
```

- A primeira execução baixará as imagens e compilará o projeto.
- O PostgreSQL iniciará primeiro e, assim que estiver saudável (`healthy`), a aplicação Spring Boot subirá, seguida pelo contêiner do frontend.
- **Frontend (Web)**: Disponível no navegador em `http://localhost:3000`
- **Backend (API)**: Disponível em `http://localhost:8080`
- **PostgreSQL**: Disponível na porta `localhost:5432` (Usuário: `postgres`, Senha: `postgres`, Database: `corretora_db`)

---

### Cenário B: Subir apenas o PostgreSQL (Modo Híbrido)

Se você preferir executar o Spring Boot diretamente na sua IDE (ex: IntelliJ IDEA ou VS Code) para ter debug interativo e hot-reload, basta subir apenas o container do banco:

```bash
docker compose up -d postgres
```

Depois, execute a classe `com.hcr.corretora.Application` diretamente na sua IDE. Ela se conectará automaticamente ao PostgreSQL rodando no Docker em `localhost:5432`. Caso queira subir também o frontend em modo de desenvolvimento:
```bash
cd frontend
npm install
npm run dev
```
O Vite iniciará o frontend em `http://localhost:3000` com proxy reverso apontando para `http://localhost:8080`.

---

## 4. Comandos Úteis de Gerenciamento do Docker

Abaixo estão os comandos mais frequentes no dia a dia:

| Ação | Comando |
|---|---|
| **Ver status dos containers** | `docker compose ps` |
| **Acompanhar logs de todos os serviços** | `docker compose logs -f` |
| **Acompanhar logs apenas do frontend** | `docker compose logs -f frontend` |
| **Acompanhar logs apenas da aplicação** | `docker compose logs -f app` |
| **Acompanhar logs apenas do banco** | `docker compose logs -f postgres` |
| **Parar os containers mantendo os dados** | `docker compose down` |
| **Parar e remover volumes (Resetar o banco)** | `docker compose down -v` |
| **Reconstruir apenas o frontend** | `docker compose up -d --build frontend` |
| **Reconstruir a aplicação backend** | `docker compose up -d --build app` |

---

## 5. Testando os Endpoints Iniciais

Após subir a aplicação com `docker compose up -d --build`, você pode testar se a API está respondendo corretamente usando `curl` no terminal ou ferramentas como Postman/Insomnia:

### 1. Consultar Métricas do Dashboard
```bash
curl -X GET http://localhost:8080/dashboard
```
**Resposta esperada (HTTP 200)**:
```json
{
  "totalClientes": 142,
  "taxaConversao": "74.5%",
  "faturamentoMensal": 185400.00,
  "apolicesPendentes": 12,
  "apolicesAtivas": 98
}
```

### 2. Consultar Lista de Seguros
```bash
curl -X GET http://localhost:8080/seguros
```
**Resposta esperada (HTTP 200)**:
Lista com os tipos de seguros cadastrados.

### 3. Teste de Login (Autenticação)
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "corretor@empresa.com", "senha": "senhaSegura123"}'
```
**Resposta esperada (HTTP 200)**:
```json
{
  "status": "AUTENTICADO",
  "tipo": "Bearer",
  "token": "stub-jwt-token-placeholder",
  "usuario": "corretor@empresa.com"
}
```

---

## 6. Resolução de Problemas Comuns

### 1. Conflito de Porta (`Port 5432 is already in use` ou `Port 8080 is already in use`)
- **Causa**: Você já possui uma instância local do PostgreSQL ou Tomcat/outra aplicação rodando nessas portas.
- **Solução**:
  - Parar o serviço local do PostgreSQL:
    - No Windows: Abra o `services.msc`, localize o serviço do PostgreSQL e clique em "Parar".
    - No Linux: `sudo systemctl stop postgresql`.
  - Alternativamente, altere a porta externa mapeada no [docker-compose.yml](file:///home/sunshine/Projeto_Integrador_Corretora/docker-compose.yml) (ex: `"5433:5432"`).

### 2. Erro de permissão no Linux (`Got permission denied while trying to connect to the Docker daemon socket`)
- **Causa**: O usuário atual não tem permissão para acessar o socket do Docker.
- **Solução**:
  ```bash
  sudo usermod -aG docker $USER
  newgrp docker
  ```

### 3. Docker Desktop não inicializado no Windows
- **Causa**: O serviço em segundo plano do Docker Desktop não foi iniciado.
- **Solução**: Abra o aplicativo "Docker Desktop" pelo menu Iniciar e aguarde o ícone da baleia no canto inferior direito ficar com status "Engine running" (verde).
