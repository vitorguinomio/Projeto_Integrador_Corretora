# Regras de SQL, DDL e Integridade de Banco de Dados

## 1. Banco de Dados Oficial
- **Engine**: PostgreSQL 16 Alpine
- **Charset**: UTF-8
- **Timezone padrão**: UTC

---

## 2. Padrões de Nomenclatura
- **Tabelas**: Plural, minúsculas, separadas por underscore (`snake_case`). Exemplo: `usuarios`, `clientes`, `apolices`.
- **Colunas**: Minúsculas, em `snake_case`. Exemplo: `numero_apolice`, `data_nascimento`, `valor_premio`.
- **Chaves Primárias**: Coluna `id` do tipo `BIGSERIAL` ou `BIGINT GENERATED ALWAYS AS IDENTITY`.
- **Chaves Estrangeiras**: Nome da entidade no singular seguido de `_id`. Exemplo: `cliente_id`, `seguro_id`.
- **Restrições / Constraints**:
  - Primary Key: `pk_<tabela>`
  - Foreign Key: `fk_<tabela_origem>_<tabela_destino>`
  - Unique Key: `uk_<tabela>_<coluna>`
  - Index: `idx_<tabela>_<coluna>`

---

## 3. Integridade Referencial e Boas Práticas
- Toda Foreign Key deve ter cláusula explícita de integridade (ex: `ON DELETE RESTRICT` ou `ON DELETE CASCADE` com justificativa de domínio).
- Criação de índices explícitos em colunas de busca frequente (`cpf_cnpj`, `email`, `numero_apolice`) e em chaves estrangeiras.
- Rastreabilidade temporal obrigatória:
  - `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL`
  - `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL`

---

## 4. Governança e Migrações
- Arquivos de inicialização residem em `database/init/` ordenados numericamente (ex: `01-schema.sql`, `02-data.sql`).
- Operações destrutivas (`DROP TABLE`, `DROP COLUMN`) são proibidas em ambientes produtivos ou sem prévia validação do Tech Lead.
- Agentes de IA que atuam em features **NÃO** possuem permissão para modificar os arquivos DDL de `database/init/`.
