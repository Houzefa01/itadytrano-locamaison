# ============================================================================
#  LocaMaison — Installation des logiciels nécessaires (Windows 10/11)
#  Ce script télécharge et installe automatiquement, via winget, tous les
#  programmes requis pour déployer le projet.
#
#  Utilisation :
#    1. Ouvrir PowerShell EN TANT QU'ADMINISTRATEUR
#    2. Autoriser l'exécution :  Set-ExecutionPolicy -Scope Process Bypass
#    3. Lancer :                 .\install-windows.ps1
# ============================================================================

Write-Host "==== LocaMaison : installation des logiciels (Windows) ====" -ForegroundColor Cyan

# --- Vérifier la présence de winget (fourni avec Windows 10/11 à jour) ---
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Host "winget est introuvable. Installez 'App Installer' depuis le Microsoft Store, puis relancez ce script." -ForegroundColor Red
    exit 1
}

# --- Liste des logiciels (id winget) ---
$paquets = @(
    @{ Nom = "Java JDK 17 (Temurin)";  Id = "EclipseAdoptium.Temurin.17.JDK" },
    @{ Nom = "Node.js LTS";            Id = "OpenJS.NodeJS.LTS" },
    @{ Nom = "PostgreSQL 17";          Id = "PostgreSQL.PostgreSQL.17" },
    @{ Nom = "Git";                    Id = "Git.Git" },
    @{ Nom = "Gradle (optionnel)";     Id = "Gradle.Gradle" },
    @{ Nom = "VS Code (optionnel)";    Id = "Microsoft.VisualStudioCode" }
)

foreach ($p in $paquets) {
    Write-Host ""
    Write-Host ">> Installation : $($p.Nom)" -ForegroundColor Yellow
    winget install --id $($p.Id) --exact --silent `
        --accept-package-agreements --accept-source-agreements
}

# --- Angular CLI (via npm, après l'installation de Node) ---
Write-Host ""
Write-Host ">> Installation : Angular CLI (npm global)" -ForegroundColor Yellow
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")
npm install -g @angular/cli

Write-Host ""
Write-Host "==== Installation terminée ====" -ForegroundColor Green
Write-Host "Fermez puis rouvrez le terminal pour rafraîchir les variables d'environnement."
Write-Host "Vérifiez ensuite les versions :"
Write-Host "   java -version    (doit afficher 17)"
Write-Host "   node -v          (doit afficher 20 ou plus)"
Write-Host "   psql --version"
Write-Host "   git --version"
Write-Host "   ng version"
Write-Host ""
Write-Host "Suite des etapes : voir DEPLOIEMENT_WINDOWS.md" -ForegroundColor Cyan
