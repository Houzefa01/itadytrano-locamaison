# ============================================================================
#  LocaMaison — Creation des 3 comptes de demonstration (Windows / PowerShell)
#
#  Cree (ou met a jour) 3 utilisateurs directement dans la base :
#     - un ETUDIANT      : tel 0341234567 / mot de passe Etudiant2026
#     - un PROPRIETAIRE  : tel 0347654321 / mot de passe Proprio2026
#     - un ADMIN         : tel 0340000000 / mot de passe Admin2026
#
#  La connexion au site se fait par NUMERO DE TELEPHONE + mot de passe.
#  Les comptes sont crees ACTIFS et VERIFIES (connexion immediate, sans code).
#  Les mots de passe sont stockes hashes en BCrypt (compatibles Spring Security).
#
#  Prerequis :
#     - PostgreSQL installe, "psql" accessible (voir DEPLOIEMENT_WINDOWS.md).
#     - La base "itadytrano" doit deja exister avec son schema : lancez d'abord
#       l'application une fois (Flyway construit les tables) ou executez
#       .\recreer-base-windows.ps1 puis demarrez l'application.
#
#  Utilisation (PowerShell, dans le dossier du projet) :
#       .\creer-utilisateurs-windows.ps1
#
#  Le script est IDEMPOTENT : on peut le relancer sans risque (les comptes
#  existants sont simplement remis a jour).
# ============================================================================

$ErrorActionPreference = "Stop"

$DB_NAME = "itadytrano"
$DB_USER = "itadyuser"
$DB_PASS = "password123"   # mot de passe applicatif (cf. backend\demo\.env)

Write-Host "==== LocaMaison : creation des 3 comptes de demonstration ====" -ForegroundColor Cyan

# --- Localiser psql (PATH, sinon dossier d'installation standard) -----------
$psql = "psql"
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    $cand = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue |
            Select-Object -First 1
    if ($cand) { $psql = $cand.FullName } else { throw "psql introuvable. Ajoutez PostgreSQL\bin au PATH." }
}

$env:PGPASSWORD = $DB_PASS

# --- Verifier que la base et le schema existent -----------------------------
$check = & $psql -U $DB_USER -h localhost -d $DB_NAME -tAc "SELECT to_regclass('public.utilisateurs');" 2>$null
if ($LASTEXITCODE -ne 0) {
    $env:PGPASSWORD = ""
    throw "Connexion a la base '$DB_NAME' impossible (user '$DB_USER'). Verifiez que PostgreSQL est demarre et que la base existe (.\recreer-base-windows.ps1)."
}
if ("$check".Trim() -ne "utilisateurs") {
    $env:PGPASSWORD = ""
    throw "La table 'utilisateurs' est absente : lancez d'abord l'application une fois (Flyway construit le schema), puis relancez ce script."
}

# --- SQL : upsert des 3 comptes (single-quote => pas d'interpolation $) ------
# Les hashes BCrypt ($2a$10$...) correspondent aux mots de passe en clair.
$sql = @'
-- Etudiant --------------------------------------------------------------------
INSERT INTO utilisateurs
    (nom, prenom, email, telephone, password, user_role, status,
     is_active, is_verified, bailleur_verifie, created_at, updated_at)
VALUES
    ('Rakoto', 'Etudiant', 'etudiant@locamaison.mg', '0341234567',
     '$2a$10$uWl4VJy07AOnSCVaYSO7deMXNZytoJwXpta7JPx4oTG1KGFZd.Wyq',
     'ETUDIANT', 'ACTIVE', true, true, false, now(), now())
ON CONFLICT (telephone) DO UPDATE SET
    nom = EXCLUDED.nom, prenom = EXCLUDED.prenom, email = EXCLUDED.email,
    password = EXCLUDED.password, user_role = EXCLUDED.user_role,
    status = 'ACTIVE', is_active = true, is_verified = true,
    bailleur_verifie = EXCLUDED.bailleur_verifie, updated_at = now();

-- Proprietaire ----------------------------------------------------------------
INSERT INTO utilisateurs
    (nom, prenom, email, telephone, password, user_role, status,
     is_active, is_verified, bailleur_verifie, created_at, updated_at)
VALUES
    ('Rabe', 'Proprietaire', 'proprietaire@locamaison.mg', '0347654321',
     '$2a$10$CdfEYJO.E2rSu8Q0nXtcHeN.GV5i.eRF4U6P6faolUHhupOkgC4zu',
     'PROPRIETAIRE', 'ACTIVE', true, true, true, now(), now())
ON CONFLICT (telephone) DO UPDATE SET
    nom = EXCLUDED.nom, prenom = EXCLUDED.prenom, email = EXCLUDED.email,
    password = EXCLUDED.password, user_role = EXCLUDED.user_role,
    status = 'ACTIVE', is_active = true, is_verified = true,
    bailleur_verifie = true, updated_at = now();

-- Administrateur --------------------------------------------------------------
INSERT INTO utilisateurs
    (nom, prenom, email, telephone, password, user_role, status,
     is_active, is_verified, bailleur_verifie, created_at, updated_at)
VALUES
    ('Admin', 'LocaMaison', 'admin@locamaison.mg', '0340000000',
     '$2a$10$GWBNyNX9DauYyjQyLajSPOoR.WcKfcWJg9yPOIr744dY3voeJXrn.',
     'ADMIN', 'ACTIVE', true, true, false, now(), now())
ON CONFLICT (telephone) DO UPDATE SET
    nom = EXCLUDED.nom, prenom = EXCLUDED.prenom, email = EXCLUDED.email,
    password = EXCLUDED.password, user_role = EXCLUDED.user_role,
    status = 'ACTIVE', is_active = true, is_verified = true,
    bailleur_verifie = EXCLUDED.bailleur_verifie, updated_at = now();

-- Recapitulatif ---------------------------------------------------------------
SELECT telephone AS "Telephone", user_role AS "Role", status AS "Statut",
       nom || ' ' || prenom AS "Nom"
FROM utilisateurs
WHERE telephone IN ('0341234567', '0347654321', '0340000000')
ORDER BY user_role;
'@

$tmp = New-TemporaryFile
# UTF-8 sans BOM (obligatoire pour PostgreSQL)
[System.IO.File]::WriteAllText($tmp, $sql, [System.Text.UTF8Encoding]::new($false))
& $psql -U $DB_USER -h localhost -d $DB_NAME -v ON_ERROR_STOP=1 -f $tmp
$code = $LASTEXITCODE
Remove-Item $tmp -Force
$env:PGPASSWORD = ""

if ($code -ne 0) { throw "Echec de la creation des comptes (psql code $code)." }

Write-Host ""
Write-Host "  Les 3 comptes de demonstration sont prets." -ForegroundColor Green
Write-Host "  Connexion sur le site par NUMERO DE TELEPHONE :" -ForegroundColor Green
Write-Host "     Etudiant       tel 0341234567   mot de passe Etudiant2026"
Write-Host "     Proprietaire   tel 0347654321   mot de passe Proprio2026"
Write-Host "     Administrateur tel 0340000000   mot de passe Admin2026"
