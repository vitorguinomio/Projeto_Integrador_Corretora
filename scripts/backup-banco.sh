#!/usr/bin/env bash
# Backup do banco da HCR Corretora (RNF21).
# Gera backups/corretora_db_AAAA-MM-DD_HHMM.sql a partir do contêiner do PostgreSQL
# e mantém apenas os 14 backups mais recentes.
# Uso: ./scripts/backup-banco.sh
set -euo pipefail

CONTAINER="${CONTAINER:-corretora-postgres}"
BANCO="${POSTGRES_DB:-corretora_db}"
USUARIO="${POSTGRES_USER:-postgres}"
MANTER="${MANTER:-14}"
PASTA="$(cd "$(dirname "$0")/.." && pwd)/backups"

mkdir -p "$PASTA"
ARQUIVO="$PASTA/${BANCO}_$(date +%Y-%m-%d_%H%M).sql"

# --clean --if-exists: o arquivo já apaga e recria as tabelas ao ser restaurado
docker exec "$CONTAINER" pg_dump -U "$USUARIO" -d "$BANCO" --clean --if-exists --no-owner > "$ARQUIVO"

if [ ! -s "$ARQUIVO" ]; then
  echo "Erro: o backup ficou vazio. Verifique se o contêiner $CONTAINER está rodando." >&2
  rm -f "$ARQUIVO"
  exit 1
fi
echo "Backup criado: $ARQUIVO ($(du -h "$ARQUIVO" | cut -f1))"

# Rotação: apaga os backups mais antigos além dos $MANTER mais recentes
ls -1t "$PASTA"/"${BANCO}"_*.sql 2>/dev/null | tail -n +"$((MANTER + 1))" | while read -r antigo; do
  rm -f -- "$antigo"
  echo "Backup antigo removido: $(basename "$antigo")"
done
