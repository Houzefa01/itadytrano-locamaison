# ============================================================================
#  ItadyTrano — script de lancement (Windows 10/11)
#  Ouvre deux fenetres : le serveur (Spring Boot) et l'interface (Angular),
#  puis ouvre le navigateur. (Voir DEPLOIEMENT_WINDOWS.md pour l'installation.)
#
#  Utilisation :
#    - Double-cliquer sur  lancer.bat
#    - ou, dans PowerShell :  .\lancer-windows.ps1
# ============================================================================

$root = $PSScriptRoot

# --- Configuration de la base de donnees (modifier si besoin) ---------------
$env:DB_URL      = "jdbc:postgresql://localhost:5432/itadytrano"
$env:DB_USERNAME = "itadyuser"
$env:DB_PASSWORD = "password123"
# Secret JWT (>= 32 caracteres). A CHANGER en production.
$env:JWT_SECRET  = "dev-itadytrano-9f3c1a7b5e2d4860a1c8f6b3e0d2a4c6b8e1f3a5"

Write-Host "==== ItadyTrano : demarrage ====" -ForegroundColor Cyan
Write-Host "  Base de donnees : $($env:DB_URL)"

# 1) Serveur Spring Boot (nouvelle fenetre, port 8080 - ecoute sur tout le reseau)
Write-Host "  Ouverture du serveur (Spring Boot)..." -ForegroundColor Yellow
$cmdBack = "`$env:DB_URL='$($env:DB_URL)'; `$env:DB_USERNAME='$($env:DB_USERNAME)'; " +
           "`$env:DB_PASSWORD='$($env:DB_PASSWORD)'; `$env:JWT_SECRET='$($env:JWT_SECRET)'; " +
           "Set-Location '$root\backend\demo'; .\gradlew.bat bootRun"
Start-Process powershell -ArgumentList "-NoExit","-Command",$cmdBack

# 2) Interface Angular (nouvelle fenetre, port 4200 - `npm start` ecoute sur 0.0.0.0)
Write-Host "  Ouverture de l'interface (Angular)..." -ForegroundColor Yellow
$cmdFront = "Set-Location '$root\frontend'; " +
            "if (-not (Test-Path node_modules)) { npm install }; npm start"
Start-Process powershell -ArgumentList "-NoExit","-Command",$cmdFront

# Adresse IP locale (pour acces depuis un autre appareil du meme reseau)
$lan = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -match '^(192\.168|10|172\.(1[6-9]|2[0-9]|3[01]))\.' } |
        Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "==== ItadyTrano demarre ====" -ForegroundColor Green
Write-Host "  Interface (local)  : http://localhost:4200"
if ($lan) { Write-Host "  Interface (reseau) : http://$lan:4200   (depuis un telephone/PC du meme reseau)" }
Write-Host "  Serveur            : http://localhost:8080"
Write-Host "  Le premier demarrage peut prendre 1 a 2 minutes."
Write-Host "  Pour arreter : fermez les deux fenetres ouvertes."

Write-Host "  Ouverture du navigateur dans 30 secondes..."
Start-Sleep -Seconds 30
Start-Process "http://localhost:4200"
