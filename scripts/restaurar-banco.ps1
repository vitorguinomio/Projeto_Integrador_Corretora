# Restaura o banco da HCR Corretora a partir de um arquivo gerado por backup-banco.ps1.
# ATENÇÃO: substitui todos os dados atuais pelos do backup.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\restaurar-banco.ps1 backups\corretora_db_AAAA-MM-DD_HHMM.sql
param([Parameter(Mandatory = $true)][string]$Arquivo)
$ErrorActionPreference = 'Stop'
$container = 'corretora-postgres'
$banco = 'corretora_db'
$usuario = 'postgres'

if (-not (Test-Path $Arquivo)) { throw "Arquivo não encontrado: $Arquivo" }

$resposta = Read-Host "Isso vai SUBSTITUIR todos os dados do banco $banco pelos de $(Split-Path $Arquivo -Leaf). Continuar? (s/N)"
if ($resposta -notin @('s', 'S')) { Write-Host 'Restauração cancelada.'; exit 0 }

docker cp $Arquivo "${container}:/tmp/restaurar.sql"
docker exec $container psql -U $usuario -d $banco -v ON_ERROR_STOP=1 -q -f /tmp/restaurar.sql | Out-Null
docker exec $container rm -f /tmp/restaurar.sql
Write-Host "Banco restaurado a partir de $(Split-Path $Arquivo -Leaf). Reinicie a aplicação: docker compose restart app"
