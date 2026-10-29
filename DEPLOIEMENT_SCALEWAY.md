# Déploiement ItadyTrano sur Scaleway VPS

> **Stack** : Docker Compose (PostgreSQL 18 + Spring Boot 4.0 + Nginx/Angular 19)  
> **Offre** : PLAY2-NANO — 2 vCPUs, 4 Go RAM, 200 Mbps, PAR 1  
> **OS** : Ubuntu 26.04 Resolute Raccoon  
> **Domaine** : à configurer (ex: `itadytrano.mg`)

---

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Création du VPS Scaleway](#2-création-du-vps-scaleway)
3. [Configuration initiale du serveur](#3-configuration-initiale-du-serveur)
4. [Installation de Docker](#4-installation-de-docker)
5. [Déploiement de l'application](#5-déploiement-de-lapplication)
6. [SSL avec Let's Encrypt](#6-ssl-avec-lets-encrypt)
7. [Domaine et DNS](#7-domaine-et-dns)
8. [Maintenance](#8-maintenance)
9. [Sauvegarde et restauration](#9-sauvegarde-et-restauration)
10. [Dépannage](#10-dépannage)

---

## 1. Prérequis

- Un compte [Scaleway](https://www.scaleway.com)
- Un nom de domaine (optionnel mais recommandé)
- Une clé SSH (pour sécuriser l'accès au serveur)
- Les sources du projet ItadyTrano

---

## 2. Création du VPS Scaleway

### 2.1 Depuis la console Scaleway

1. Connectez-vous sur [console.scaleway.com](https://console.scaleway.com)
2. Allez dans **Instances** → **Créer une instance**
3. Configurez :
   - **Région** : PAR 1 (Paris)
   - **Type** : PLAY2-NANO (2 vCPUs, 4 Go RAM)
   - **OS** : Ubuntu 26.04 Resolute Raccoon
   - **Stockage** : 10 Go minimum (30 Go recommandé pour les photos)
   - **Clé SSH** : ajoutez votre clé publique
4. Lancez l'instance

### 2.2 Récupération de l'IP

```bash
# Depuis votre machine locale
ping <IP_DU_VPS>
ssh root@<IP_DU_VPS>
```

---

## 3. Configuration initiale du serveur

### 3.1 Script automatisé

Le script `scripts/deploy-scaleway.sh` exécute toutes les étapes suivantes automatiquement :

```bash
# Depuis votre machine locale (ou directement sur le VPS après clone)
scp scripts/deploy-scaleway.sh root@<IP>:/root/
ssh root@<IP>
chmod +x deploy-scaleway.sh
./deploy-scaleway.sh
```

### 3.2 Mise à jour du système

```bash
apt update && apt upgrade -y
apt install -y ufw fail2ban htop curl wget git unattended-upgrades
```

### 3.3 Pare-feu (UFW)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### 3.4 Fail2ban

```bash
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
systemctl enable fail2ban
systemctl start fail2ban
```

### 3.5 Swap (recommandé pour PLAY2-NANO)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 4. Installation de Docker

### 4.1 Installation

```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose plugin
apt install -y docker-compose-plugin

# Vérification
docker --version
docker compose version
```

### 4.2 Optimisations pour PLAY2-NANO

```bash
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "experimental": true,
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 3
}
EOF
systemctl restart docker
```

---

## 5. Déploiement de l'application

### 5.1 Structure des fichiers sur le VPS

```
/opt/itadytrano/
├── docker-compose.yml
├── .env                    # Variables sensibles (non versionné)
├── backend/
│   └── demo/
│       ├── Dockerfile
│       ├── build.gradle
│       └── src/
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
├── data/
│   ├── db/                 # Volume PostgreSQL
│   └── uploads/            # Volume photos
└── scripts/
    └── backup.sh
```

### 5.2 Cloner et configurer

```bash
mkdir -p /opt/itadytrano
cd /opt/itadytrano

# Transférer les sources (depuis votre machine)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'build' \
  --exclude '.gradle' --exclude 'dist' \
  ./ root@<IP>:/opt/itadytrano/
```

### 5.3 Fichier d'environnement

Créez `/opt/itadytrano/.env` :

```bash
# Générer un secret JWT robuste
JWT_SECRET=$(openssl rand -hex 64)

cat > /opt/itadytrano/.env << EOF
# ── Base de données ──────────────────────────────────────
DB_NAME=itadytrano
DB_USER=itadyuser
DB_PASSWORD=$(openssl rand -base64 24)

# ── JWT ──────────────────────────────────────────────────
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRATION=86400000

# ── Web ──────────────────────────────────────────────────
ALLOWED_ORIGINS=https://votre-domaine.mg
WEB_PORT=8088

# ── SMTP (Gmail) ─────────────────────────────────────────
MAIL_USERNAME=votre.email@gmail.com
MAIL_PASSWORD=votre-mot-de-passe-app

# ── Orange SMS (optionnel) ───────────────────────────────
ORANGE_CLIENT_ID=
ORANGE_CLIENT_SECRET=
ORANGE_SENDER_NUMBER=

# ── Paiement ─────────────────────────────────────────────
PAYMENT_WEBHOOK_SECRET=$(openssl rand -hex 32)

# ── Uploads ──────────────────────────────────────────────
UPLOAD_DIR=/data/uploads

# ── Email (désactivé par défaut) ─────────────────────────
EMAIL_ENABLED=false
EOF
```

### 5.4 Configurer le domaine dans le frontend

Modifiez `frontend/src/environments/environment.prod.ts` :

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://votre-domaine.mg/api/v1',
};
```

### 5.5 Lancer l'application

```bash
cd /opt/itadytrano
docker compose up -d --build
```

### 5.6 Vérification

```bash
# État des services
docker compose ps

# Logs
docker compose logs -f

# Healthcheck
curl http://localhost:8080/actuator/health

# Test API
curl http://localhost:8080/api/v1/logements
```

### 5.7 Configuration du redémarrage automatique

Le `docker-compose.yml` inclut déjà `restart: unless-stopped`.  
Pour plus de sécurité, créez un service systemd :

```bash
cat > /etc/systemd/system/itadytrano.service << 'SYSTEMD'
[Unit]
Description=ItadyTrano - Application de location
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/itadytrano
ExecStart=/usr/bin/docker compose up -d --remove-orphans
ExecStop=/usr/bin/docker compose down
StandardOutput=journal

[Install]
WantedBy=multi-user.target
SYSTEMD

systemctl daemon-reload
systemctl enable itadytrano
systemctl start itadytrano
```

---

## 6. SSL avec Let's Encrypt

### 6.1 Installation de Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 6.2 Configuration Nginx pour le SSL

Sur la machine hôte (pas dans le conteneur), installez Nginx comme reverse proxy SSL :

```bash
apt install -y nginx
```

Créez `/etc/nginx/sites-available/itadytrano` :

```nginx
server {
    listen 80;
    server_name votre-domaine.mg;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.mg;

    ssl_certificate /etc/letsencrypt/live/votre-domaine.mg/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.mg/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;

    # Sécurité
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Proxy vers le conteneur web (port 8088)
    location / {
        proxy_pass http://127.0.0.1:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:8088;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Taille max upload (photos)
    client_max_body_size 50M;
}
```

Activez le site :

```bash
ln -s /etc/nginx/sites-available/itadytrano /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### 6.3 Obtention du certificat

```bash
certbot --nginx -d votre-domaine.mg --non-interactive --agree-tos -m votre@email.com
```

### 6.4 Renouvellement automatique

```bash
# Vérifier le renouvellement
certbot renew --dry-run

# cron est automatiquement ajouté par certbot
systemctl list-timers | grep certbot
```

---

## 7. Domaine et DNS

### 7.1 Configuration DNS

Chez votre registrar, créez ces enregistrements pointant vers l'IP de votre VPS Scaleway :

| Type | Nom | Valeur |
|------|-----|--------|
| A | `@` | `<IP_DU_VPS>` |
| A | `www` | `<IP_DU_VPS>` |

### 7.2 Vérification

```bash
dig +short votre-domaine.mg
dig +short www.votre-domaine.mg
```

---

## 8. Maintenance

### 8.1 Mise à jour de l'application

```bash
cd /opt/itadytrano
git pull
docker compose up -d --build
```

### 8.2 Logs

```bash
# Tous les services
docker compose logs -f --tail=100

# Service spécifique
docker compose logs -f api
docker compose logs -f web
docker compose logs -f db
```

### 8.3 Surveillance

```bash
# Ressources
htop
docker stats

# Espace disque
df -h /opt/itadytrano/data

# Taille des logs Docker
du -sh /var/lib/docker/containers
```

### 8.4 Nettoyage périodique

```bash
# Images non utilisées
docker image prune -f

# Conteneurs arrêtés
docker container prune -f

# Volumes orphelins
docker volume prune -f

# Logs système
journalctl --vacuum-size=200M
```

---

## 9. Sauvegarde et restauration

### 9.1 Script de backup automatique

Le script `scripts/backup.sh` (créé automatiquement par `deploy-scaleway.sh`) :

```bash
#!/usr/bin/env bash
# Sauvegarde : base de données + photos + .env
BACKUP_DIR="/opt/itadytrano/backups"
DATE=$(date +%Y-%m-%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# DB
docker compose exec -T db pg_dump -U itadyuser itadytrano \
  | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Photos
tar czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C /opt/itadytrano/data uploads

# .env
cp /opt/itadytrano/.env "$BACKUP_DIR/env_$DATE.txt"

# Rotation : garder 7 jours
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "env_*.txt" -mtime +7 -delete

echo "Backup terminé : $DATE"
```

### 9.2 Planification (cron)

```bash
echo "0 3 * * * root /opt/itadytrano/scripts/backup.sh" > /etc/cron.d/itadytrano-backup
```

### 9.3 Restauration

```bash
# Restaurer la base
gunzip < backups/db_2026-07-10_030000.sql.gz | docker compose exec -T db psql -U itadyuser itadytrano

# Restaurer les photos
tar xzf backups/uploads_2026-07-10_030000.tar.gz -C /
```

---

## 10. Dépannage

### 10.1 Ports

| Service | Conteneur | Hôte |
|---------|-----------|------|
| Application web | 80 | 8088 |
| API | 8080 | — (interne) |
| PostgreSQL | 5432 | — (interne) |
| SSH | — | 22 |
| HTTPS (Nginx host) | — | 443 |

### 10.2 Commandes utiles

```bash
# Redémarrer un service
docker compose restart api

# Reconstruire un service
docker compose up -d --build api

# Shell dans un conteneur
docker compose exec api bash
docker compose exec db psql -U itadyuser itadytrano

# Voir les variables d'env d'un conteneur
docker compose exec api env | grep -E 'DB_|JWT_'

# Vider les logs
docker compose logs --tail=0
```

### 10.3 Problèmes courants

**L'API ne démarre pas** → Vérifiez les logs : `docker compose logs api`  
**Erreur PostgreSQL** → Vérifiez que le volume db-data est sain : `docker compose logs db`  
**Les photos ne s'affichent pas** → Vérifiez le volume uploads-data et les permissions  
**Erreur 413 (entity too large)** → Vérifiez `client_max_body_size` dans la config Nginx  
**Connexion refusée** → Vérifiez UFW : `ufw status` et `docker compose ps`

---

## Ressources

- [Scaleway Instances](https://www.scaleway.com/en/virtual-instances/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Certbot](https://certbot.eff.org/)
- [Ubuntu 26.04](https://releases.ubuntu.com/)

---

> **Mainteneur** : rakotna  
> **Projet** : ItadyTrano / LocaMaison — Location de logements pour étudiants UNA
