---
name: commit-por-etapas
description: >-
  Executa commits incrementais a cada etapa do desenvolvimento do sistema,
  atualizando o documento docs/CHANGELOG_COMMITS.md com a descrição detalhada
  do que cada commit enviou para o repositório git.
---

# Skill: Commit por Etapas e Registro de Changelog

Esta skill define o fluxo de versionamento contínuo durante o desenvolvimento do Projeto Integrador HCR Corretora.

## Procedimento a cada etapa:
1. Concluir a implementação da funcionalidade/módulo específico (código, DTOs, testes ou telas).
2. Atualizar o arquivo `docs/CHANGELOG_COMMITS.md` adicionando uma nova entrada com:
   - Identificador da Etapa
   - Data e Hora
   - Título e Tipo do Commit (ex: `feat`, `fix`, `docs`, `refactor`)
   - Descrição detalhada dos arquivos e funcionalidades incluídas
3. Executar o commit no Git com mensagem semântica em português:
   `git add . && git commit -m "feat/fix: descrição clara"`
