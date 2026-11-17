#!/usr/bin/env bash
# Restaura o banco da HCR Corretora a partir de um arquivo gerado por backup-banco.sh.
# ATENÇÃO: substitui todos os dados atuais pelos do backup.
# Uso: ./scripts/restaurar-banco.sh backups/corretora_db_AAAA-MM-DD_HHMM.sql
set -euo pipefail

CONTAINER="${CONTAINER:-corretora-postgres}"
BANCO="${POSTGRES_DB:-corretora_db}"
USUARIO="${POSTGRES_USER:-postgres}"
ARQUIVO="${1:-}"

if [ -z "$ARQUIVO" ] || [ ! -f "$ARQUIVO" ]; then
  echo "Informe o arquivo de backup. Disponíveis:" >&2
  ls -1t "$(cd "$(dirname "$0")/.." && pwd)/backups"/*.sql 2>/dev/null >&2 || echo "  (nenhum backup encontrado)" >&2
  exit 1
fi

read -r -p "Isso vai SUBSTITUIR todos os dados do banco $BANCO pelos de $(basename "$ARQUIVO"). Continuar? (s/N) " resposta
if [ "$resposta" != "s" ] && [ "$resposta" != "S" ]; then
  echo "Restauração cancelada."
  exit 0
fi

docker exec -i "$CONTAINER" psql -U "$USUARIO" -d "$BANCO" -v ON_ERROR_STOP=1 -q < "$ARQUIVO" > /dev/null
echo "Banco restaurado a partir de $(basename "$ARQUIVO"). Reinicie a aplicação: docker compose restart app"
