# ============================================================================
#  ItadyTrano — (RE)CREATION de la base de donnees sur Windows
#  Supprime la base existante puis la recree vide. Au prochain lancement,
#  Flyway reconstruit automatiquement TOUT le schema (migrations V1..V27).
#
#  Prerequis : PostgreSQL installe, "psql" accessible (voir DEPLOIEMENT_WINDOWS.md).
#  Utilisation (PowerShell, dans le dossier du projet) :
#      .\recreer-base-windows.ps1
#  ATTENTION : toutes les donnees existantes de la base seront PERDUES.
# ============================================================================

$ErrorActionPreference = "Stop"

$DB_NAME = "itadytrano"
$DB_USER = "itadyuser"
$DB_PASS = "password123"

Write-Host "==== ItadyTrano : (re)creation de la base '$DB_NAME' ====" -ForegroundColor Cyan
Write-Host "  ATTENTION : la base '$DB_NAME' va etre SUPPRIMEE puis recreee (donnees perdues)." -ForegroundColor Yellow
$ok = Read-Host "  Continuer ? (o/N)"
if ($ok -ne "o" -and $ok -ne "O") { Write-Host "  Annule."; exit 0 }

# Mot de passe du super-utilisateur 'postgres' (defini a l'installation de PostgreSQL)
$pgPass = Read-Host "  Mot de passe du compte PostgreSQL 'postgres'" -AsSecureString
$bstr   = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPass)
$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)

# Localiser psql (PATH, sinon dossier d'installation standard)
$psql = "psql"
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    $cand = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue |
            Select-Object -First 1
    if ($cand) { $psql = $cand.FullName } else { throw "psql introuvable. Ajoutez PostgreSQL\bin au PATH." }
}

$sql = @"
-- Fermer les connexions a la base puis la supprimer
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME';
DROP DATABASE IF EXISTS $DB_NAME;
-- (Re)creer le role applicatif
DO `$`$ BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS';
   ELSE
      ALTER ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS';
   END IF;
END `$`$;
-- Creer la base vide, appartenant au role applicatif
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
"@

$tmp = New-TemporaryFile
# UTF-8 sans BOM (obligatoire pour PostgreSQL)
[System.IO.File]::WriteAllText($tmp, $sql, [System.Text.UTF8Encoding]::new($false))
& $psql -U postgres -h localhost -d postgres -v ON_ERROR_STOP=1 -f $tmp
Remove-Item $tmp -Force
$env:PGPASSWORD = ""

Write-Host ""
Write-Host "  Base '$DB_NAME' recreee (vide)." -ForegroundColor Green
Write-Host "  Lancez maintenant l'application : Flyway construira tout le schema." -ForegroundColor Green
Write-Host "      .\lancer.bat   (ou .\lancer-windows.ps1)"
