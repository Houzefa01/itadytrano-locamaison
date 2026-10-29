# ItadyTrano (LocaMaison)

Application de location de logements pour les étudiants UNA.

> **Stack** : **Backend** Java 21 / Spring Boot • **Frontend** Angular 21 • **DB** PostgreSQL • Authentification **JWT**

## Table des matières
- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation & démarrage (développement)](#installation--démarrage-développement)
  - [Base de données (PostgreSQL)](#base-de-données-postgresql)
  - [Backend (Spring Boot)](#backend-spring-boot)
  - [Frontend (Angular)](#frontend-angular)
- [Configuration](#configuration)
  - [Variables / paramètres importants](#variables--paramètres-importants)
- [Scripts utiles](#scripts-utiles)
- [Bonnes pratiques](#bonnes-pratiques)
- [Licence](#licence)

## Aperçu
**LocaMaison** est une application web permettant de faciliter la **recherche** et la **location** de logements pour les étudiants de l’UNA.

## Fonctionnalités
- **Comptes et rôles** : étudiant, propriétaire, administrateur ; authentification Spring Security + JWT, vérification par SMS
- **Logements** : annonces (CRUD), photos et documents, carte interactive (Leaflet), recherche avec historique, favoris
- **Réservation et visites** : créneaux de visite, réservations, contrats de location et paiement des loyers (y compris par avance sur plusieurs mois)
- **Communication** : messagerie, notifications temps réel (WebSocket), avis et réactions
- **Modération** : signalements, espace d'administration, paramètres, CGU
- **Établissements** : rattachement des logements aux établissements universitaires
- Déploiement : Docker Compose, scripts Linux et Windows, guide Scaleway (`DEPLOIEMENT_SCALEWAY.md`)

## Architecture
Le dépôt est organisé en deux modules principaux :
- `backend/` : API Java (Spring Boot)
- `frontend/` : application Angular

## Prérequis
- **Java 21**
- **Node.js** (LTS recommandé) + **npm**
- **PostgreSQL**

## Installation & démarrage (développement)

### Base de données (PostgreSQL)
1. Créez une base : `locamaison`
2. Créez un utilisateur (exemple) : `locamaison`

Vous pouvez adapter ces paramètres dans la configuration du backend.

### Backend (Spring Boot)
Le backend est un projet **Gradle**.

```bash
cd backend/demo
./gradlew bootRun
```

Le backend démarre ensuite sur le port défini par Spring (par défaut **8080** si non modifié).

### Frontend (Angular)
```bash
cd frontend
npm install
npm start
# ou: ng serve
```

Par défaut, Angular sert l’application sur `http://localhost:4200/`.

## Configuration

### Variables / paramètres importants
Le backend contient une configuration de base dans :
- `backend/demo/src/main/resources/application.properties`

Paramètres typiques :
- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`
- `jwt.secret`
- `jwt.expiration`

> **Sécurité** : évitez de committer des secrets réels (JWT secret / mots de passe). Préférez des variables d’environnement ou un fichier `application-local.properties` non versionné.

## Scripts utiles
### Backend
```bash
cd backend/demo
./gradlew test
./gradlew build
```

### Frontend
```bash
cd frontend
npm test
npm run build
```

## Bonnes pratiques
- Créer un fichier `.env` / `application-local.properties` pour les paramètres sensibles
- Utiliser des migrations (Flyway/Liquibase) pour la DB (si vous souhaitez fiabiliser les déploiements)
- Ajouter une configuration CORS côté backend si le frontend consomme l’API sur un autre port

## Licence
Aucune licence n’est spécifiée pour le moment.

---

### Mainteneur
- **rakotna**
