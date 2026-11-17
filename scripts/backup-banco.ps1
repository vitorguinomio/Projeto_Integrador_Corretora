# Backup do banco da HCR Corretora (RNF21) - versão para Windows PowerShell.
# Gera backups\corretora_db_AAAA-MM-DD_HHMM.sql e mantém apenas os 14 mais recentes.
# Uso: powershell -ExecutionPolicy Bypass -File scripts\backup-banco.ps1
$ErrorActionPreference = 'Stop'
$container = 'corretora-postgres'
$banco = 'corretora_db'
$usuario = 'postgres'
$manter = 14
$pasta = Join-Path (Split-Path $PSScriptRoot -Parent) 'backups'

New-Item -ItemType Directory -Force -Path $pasta | Out-Null
$arquivo = Join-Path $pasta ("{0}_{1}.sql" -f $banco, (Get-Date -Format 'yyyy-MM-dd_HHmm'))

# O pg_dump grava dentro do contêiner e o arquivo é copiado para fora (evita problemas de codificação do PowerShell)
docker exec $container sh -c "pg_dump -U $usuario -d $banco --clean --if-exists --no-owner -f /tmp/backup.sql"
docker cp "${container}:/tmp/backup.sql" $arquivo
docker exec $container rm -f /tmp/backup.sql

if (-not (Test-Path $arquivo) -or (Get-Item $arquivo).Length -eq 0) {
    throw "O backup ficou vazio. Verifique se o contêiner $container está rodando."
}
Write-Host ("Backup criado: {0} ({1:N0} KB)" -f $arquivo, ((Get-Item $arquivo).Length / 1KB))

Get-ChildItem $pasta -Filter "${banco}_*.sql" | Sort-Object LastWriteTime -Descending |
    Select-Object -Skip $manter | ForEach-Object {
        Remove-Item $_.FullName
        Write-Host "Backup antigo removido: $($_.Name)"
    }
