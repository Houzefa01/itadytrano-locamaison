# Déploiement de LocaMaison sur Windows

Ce document liste **tous les logiciels nécessaires** et explique, étape par étape, comment installer et lancer le projet **LocaMaison** sur un poste Windows 10 ou 11.

---

## 1. Logiciels requis

| Logiciel | Version | Rôle | Lien de téléchargement |
|----------|---------|------|------------------------|
| **Java JDK** | 17 | Exécuter le serveur (Spring Boot) | https://adoptium.net/temurin/releases/?version=17 |
| **Node.js** | 20 LTS ou plus | Construire et servir l'interface (Angular) | https://nodejs.org/fr/download |
| **PostgreSQL** | 16 ou 17 | Base de données | https://www.postgresql.org/download/windows/ |
| **Git** | récente | Récupérer et gérer le code | https://git-scm.com/download/win |
| **Angular CLI** | 21 | Outils de l'interface (`ng`) | via npm : `npm install -g @angular/cli` |
| **Gradle** | *(optionnel)* | Le projet inclut `gradlew.bat` qui le télécharge seul | https://gradle.org/install |
| **VS Code** | *(optionnel)* | Éditeur de code | https://code.visualstudio.com |

> Le serveur utilise aussi **Flyway**, **iText (PDF)** et **WebSocket** : ceux-ci sont des bibliothèques Java récupérées automatiquement par Gradle, **rien à installer à part le JDK**.

---

## 2. Installation des logiciels

### Option A — Installateurs déjà téléchargés (hors connexion)

Le dossier **`windows-installers/`** contient déjà tous les programmes (JDK 17, Node.js, PostgreSQL, Git). Double-cliquez-les dans l'ordre indiqué dans `windows-installers/README.md`, puis lancez :

```powershell
npm install -g @angular/cli
```

### Option B — Installation automatique en ligne (winget)

Un script PowerShell installe tout d'un coup grâce à **winget** (fourni avec Windows 10/11).

1. Ouvrir **PowerShell en tant qu'administrateur**.
2. Autoriser l'exécution du script pour cette session :
   ```powershell
   Set-ExecutionPolicy -Scope Process Bypass
   ```
3. Lancer le script (depuis le dossier du projet) :
   ```powershell
   .\install-windows.ps1
   ```
4. Fermer puis rouvrir le terminal, et vérifier :
   ```powershell
   java -version   # 17
   node -v         # 20+
   psql --version
   git --version
   ng version
   ```

*(Installation manuelle : télécharger chaque logiciel via les liens du tableau ci-dessus, puis `npm install -g @angular/cli`.)*

---

## 3. Récupérer le projet

```powershell
git clone <adresse-du-depot> LocaMaison
cd LocaMaison
```

---

## 4. Préparer la base de données

Pendant l'installation de PostgreSQL, notez le mot de passe du super-utilisateur `postgres`.

**Méthode simple (recommandée)** : double-cliquez sur **`recreer-base.bat`**. Le script
supprime la base existante (si présente) et la recrée vide ; au lancement, Flyway
reconstruit automatiquement tout le schéma. Idéal pour repartir d'une base propre
sur un nouveau PC Windows.

**Méthode manuelle** : ouvrez **SQL Shell (psql)** et créez la base et le compte :

```sql
CREATE USER itadyuser WITH PASSWORD 'password123';
CREATE DATABASE itadytrano OWNER itadyuser;
GRANT ALL PRIVILEGES ON DATABASE itadytrano TO itadyuser;
```

> Au premier démarrage du serveur, **Flyway** crée automatiquement toutes les tables.

---

## 5. Configurer le serveur (`backend/demo/.env`)

Créez (ou complétez) le fichier `backend\demo\.env` :

```dotenv
DB_URL=jdbc:postgresql://localhost:5432/itadytrano
DB_USERNAME=itadyuser
DB_PASSWORD=password123

# Secret JWT : >= 32 caractères, À CHANGER en production
JWT_SECRET=dev-itadytrano-9f3c1a7b5e2d4860a1c8f6b3e0d2a4c6b8e1f3a5
JWT_EXPIRATION=86400000

# E-mail (facultatif — pour les notifications) : mot de passe d'application Gmail
MAIL_USERNAME=votre.adresse@gmail.com
MAIL_PASSWORD=

# SMS Orange (facultatif)
ORANGE_CLIENT_ID=
ORANGE_CLIENT_SECRET=
ORANGE_SENDER_NUMBER=
```

> L'e-mail et le SMS sont **facultatifs** : sans eux, l'application fonctionne, seules les notifications par e-mail/SMS sont désactivées.

---

## 6. Lancer le serveur (backend)

```powershell
cd backend\demo
.\gradlew.bat bootRun
```

Le serveur démarre sur **http://localhost:8080**. Laissez cette fenêtre ouverte.

*Pour produire un fichier exécutable unique :*
```powershell
.\gradlew.bat bootJar
java -jar build\libs\demo-0.0.1-SNAPSHOT.jar
```

---

## 7. Lancer l'interface (frontend)

Dans un **second terminal** :

```powershell
cd frontend
npm install
ng serve
```

L'application s'ouvre sur **http://localhost:4200**.

*Pour une mise en production (pages statiques) :*
```powershell
ng build
# le résultat est dans frontend\dist\
```

---

## 8. Comptes de démonstration

La connexion au site se fait par **numéro de téléphone** + mot de passe.

Pour créer (ou réinitialiser) les 3 comptes de démonstration directement dans la
base, exécutez, une fois l'application lancée au moins une fois (Flyway a construit
le schéma) :

```powershell
.\creer-utilisateurs-windows.ps1
```

Le script est idempotent (relançable sans risque). Il crée les comptes déjà
**actifs et vérifiés** (connexion immédiate, sans code de vérification) :

| Profil | Téléphone (identifiant) | Mot de passe |
|--------|-------------------------|--------------|
| Étudiant | `0341234567` | `Etudiant2026` |
| Propriétaire | `0347654321` | `Proprio2026` |
| Administrateur | `0340000000` | `Admin2026` |

---

## 9. Récapitulatif des ports

| Service | Port |
|---------|------|
| Interface Angular | 4200 |
| Serveur Spring Boot | 8080 |
| PostgreSQL | 5432 |
