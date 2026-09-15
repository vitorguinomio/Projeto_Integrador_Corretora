Atue como um Engenheiro de Software Sênior e crie o scaffolding inicial deste projeto em Java 21 com Spring Boot 3 e PostgreSQL, seguindo rigorosamente a arquitetura Package by Feature descrita abaixo.

### 1. Estrutura de Diretórios Obrigatória
Crie a estrutura de diretórios e arquivos mínimos (esqueletos funcionais com stubs básicos) respeitando a divisão de trabalho da equipe:

meu-projeto/
├── .skills/                              <-- Habilidades e contextos para os Agentes de IA
│   ├── arch-rules.md                    <-- Regras arquiteturais e zonas read-only
│   ├── database-rules.md                <-- Regras de SQL, DDL e integridade
│   └── code-style.md                    <-- Padrões Java 21 records, DTOs e validação
├── database/
│   └── init/
│       └── 01-schema.sql                <-- DDL inicial com tabelas básicas (usuarios, clientes, seguros, apolices)
├── docker-compose.yml                   <-- Configuração básica (Postgres 16 Alpine + App)
├── pom.xml                              <-- Spring Boot 3.x, Spring Data JPA, Security, Postgres, Validation
└── src/
    └── main/
        ├── java/com/hcr/corretora/
        │   ├── Application.java         <-- Main class com @SpringBootApplication
        │   ├── core/                    <-- Core transversal
        │   │   ├── config/              <-- Ex: CorsConfig.java básico
        │   │   ├── exception/           <-- GlobalExceptionHandler.java (@RestControllerAdvice)
        │   │   └── security/            <-- SecurityConfig.java básico (rotas /auth/** liberadas)
        │   └── features/                <-- Features distribuídas
        │       ├── auth/                <-- Solo (Platform/Security)
        │       │   ├── AuthController.java
        │       │   ├── AuthService.java
        │       │   └── dto/LoginRequest.java (Java record)
        │       ├── clientes/            <-- Dupla 1
        │       │   ├── ClienteController.java
        │       │   ├── ClienteService.java
        │       │   ├── ClienteRepository.java
        │       │   ├── Cliente.java (@Entity simples)
        │       │   └── dto/ClienteRequest.java (Java record)
        │       ├── seguros/             <-- Dupla 1
        │       │   ├── SeguroController.java
        │       │   ├── SeguroService.java
        │       │   └── Seguro.java (@Entity simples)
        │       ├── corretores/          <-- Dupla 1
        │       │   ├── CorretorController.java
        │       │   └── CorretorService.java
        │       ├── apolices/            <-- Dupla 2
        │       │   ├── ApoliceController.java
        │       │   ├── ApoliceService.java
        │       │   ├── ApoliceRepository.java
        │       │   ├── Apolice.java (@Entity simples)
        │       │   └── dto/ApoliceRequest.java (Java record)
        │       └── dashboard/           <-- Dupla 2
        │           ├── DashboardController.java
        │           └── DashboardService.java
        └── resources/
            └── application.yml          <-- Configuração com variáveis de ambiente para o PostgreSQL

### 2. Regras de Implementação para o Scaffolding
- Código mínimo e limpo: Os Controllers precisam apenas de um endpoint simples anotado com `@GetMapping` ou `@PostMapping` retornando `ResponseEntity.ok()` com mensagens fictícias ou stubs, garantindo que o Spring Boot compile e execute sem falhas.
- DTOs devem utilizar estritamente Java `records`.
- As entidades JPA devem conter os campos essenciais com `@Id` e `@GeneratedValue(strategy = GenerationType.IDENTITY)`.
- A pasta `.skills/` deve conter instruções diretas para agentes de IA limitando-os a trabalhar apenas em suas respectivas pastas dentro de `features/`, proibindo edições em `core/`, no `pom.xml` ou nas tabelas da pasta `database/`.

Entregue os comandos de terminal/bash para gerar as pastas vazias de uma só vez e o código-fonte básico dos arquivos-chave.
