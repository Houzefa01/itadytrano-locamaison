#!/usr/bin/env bash
# ============================================================================
#  deploy-scaleway.sh — Déploiement automatisé d'ItadyTrano sur Scaleway VPS
#  Cible : Ubuntu 26.04 Resolute Raccoon, PLAY2-NANO (2 vCPUs, 4 Go RAM)
#  Usage : sudo bash deploy-scaleway.sh [--domain itadytrano.mg]
# ============================================================================
set -euo pipefail

# ── Couleurs ──────────────────────────────────────────────────────────────
RST='\033[0m'; RED='\033[0;31m'; GRN='\033[0;32m'; YLW='\033[0;33m'
BLU='\033[0;34m'; CYA='\033[0;36m'
info()  { echo -e "${CYA}[INFO]${RST}  $*"; }
ok()    { echo -e "${GRN}[OK]${RST}    $*"; }
warn()  { echo -e "${YLW}[WARN]${RST}  $*"; }
err()   { echo -e "${RED}[ERR]${RST}   $*" >&2; }
step()  { echo -e "\n${BLU}══════════════════════════════════════════════════${RST}"; echo -e "${BLU}  $*${RST}"; echo -e "${BLU}══════════════════════════════════════════════════${RST}"; }

# ── Variables ─────────────────────────────────────────────────────────────
DOMAIN="${1:-}"
PROJECT_DIR="/opt/itadytrano"
SCRIPTS_DIR="$PROJECT_DIR/scripts"
BACKUP_DIR="$PROJECT_DIR/backups"
TIME=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/tmp/itadytrano-deploy-$TIME.log"

# Rediriger stdout/stderr vers le log ET le terminal
exec > >(tee -a "$LOG_FILE") 2>&1

# ── Vérifications préalables ──────────────────────────────────────────────
check_prereqs() {
    step "1/8 — Vérifications préalables"

    if [[ $EUID -ne 0 ]]; then
        err "Ce script doit être exécuté en tant que root (sudo)."
        exit 1
    fi

    if ! ls "$PROJECT_DIR/docker-compose.yml" &>/dev/null \
        && ! ls "./docker-compose.yml" &>/dev/null; then
        warn "docker-compose.yml introuvable dans $PROJECT_DIR ni dans le répertoire courant."
        warn "Placez les sources dans $PROJECT_DIR avant de lancer ce script."
        echo ""
        read -rp "Voulez-vous créer $PROJECT_DIR et y cloner les sources ? (y/N) " yn
        if [[ "$yn" =~ ^[YyOo]$ ]]; then
            mkdir -p "$PROJECT_DIR"
            warn "Copiez les fichiers dans $PROJECT_DIR, puis relancez le script."
            exit 0
        fi
        exit 1
    fi

    # Déduire PROJECT_DIR
    if ls "./docker-compose.yml" &>/dev/null; then
        PROJECT_DIR=$(pwd)
    fi
    SCRIPTS_DIR="$PROJECT_DIR/scripts"
    BACKUP_DIR="$PROJECT_DIR/backups"

    ok "Répertoire projet : $PROJECT_DIR"
    ok "Log : $LOG_FILE"
}

# ── Interface réseau ──────────────────────────────────────────────────────
detect_ip() {
    IP_PUBLIC=$(curl -s https://api.ipify.org 2>/dev/null || curl -s https://ifconfig.me 2>/dev/null || echo "INCONNUE")
    ok "IP publique détectée : $IP_PUBLIC"
}

# ── Étape 2 : Mise à jour système ────────────────────────────────────────
system_update() {
    step "2/8 — Mise à jour du système"

    export DEBIAN_FRONTEND=noninteractive
    apt update && apt upgrade -y
    apt install -y ufw fail2ban htop curl wget git unzip \
        unattended-upgrades apt-transport-https ca-certificates software-properties-common

    # Unattended upgrades — sécurité auto
    cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF
    systemctl restart unattended-upgrades 2>/dev/null || true
    ok "Système à jour et sécurisé"
}

# ── Étape 3 : Pare-feu ───────────────────────────────────────────────────
configure_firewall() {
    step "3/8 — Configuration du pare-feu (UFW)"

    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    ok "UFW actif : ports 22, 80, 443 ouverts"
}

# ── Étape 4 : Swap ────────────────────────────────────────────────────────
configure_swap() {
    step "4/8 — Configuration du swap (2 Go)"

    if swapon --show | grep -q /swapfile; then
        ok "Swap déjà actif"
        return
    fi
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ok "Swap 2 Go activé"
}

# ── Étape 5 : Docker ──────────────────────────────────────────────────────
install_docker() {
    step "5/8 — Installation de Docker"

    if command -v docker &>/dev/null; then
        ok "Docker déjà installé : $(docker --version)"
    else
        curl -fsSL https://get.docker.com | bash
        ok "Docker installé"
    fi

    if docker compose version &>/dev/null; then
        ok "Docker Compose déjà installé : $(docker compose version)"
    else
        apt install -y docker-compose-plugin
        ok "Docker Compose plugin installé"
    fi

    # Optimisations pour PLAY2-NANO
    cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" },
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 3
}
EOF
    systemctl restart docker
    ok "Docker configuré et optimisé"
}

# ── Étape 6 : Application ─────────────────────────────────────────────────
deploy_app() {
    step "6/8 — Déploiement de l'application"

    cd "$PROJECT_DIR"

    # Créer les dossiers
    mkdir -p "$SCRIPTS_DIR" "$BACKUP_DIR" data/uploads

    # Générer le .env de production
    if [[ -f .env ]]; then
        warn ".env existant — sauvegarde dans .env.backup.$TIME"
        cp .env ".env.backup.$TIME"
    fi

    DB_PASS_GEN=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    JWT_SECRET_GEN=$(openssl rand -hex 64)
    WEBHOOK_SECRET_GEN=$(openssl rand -hex 32)

    cat > .env << EOF
# ── ItadyTrano — Production ─────────────────────────────────
# Généré automatiquement le $(date '+%Y-%m-%d %H:%M:%S')
# ─────────────────────────────────────────────────────────────

# Base de données
DB_NAME=itadytrano
DB_USER=itadyuser
DB_PASSWORD=${DB_PASS_GEN}

# JWT
JWT_SECRET=${JWT_SECRET_GEN}
JWT_EXPIRATION=86400000

# Web
ALLOWED_ORIGINS=https://${DOMAIN:-localhost}
WEB_PORT=8088

# Email (SMTP Gmail — facultatif)
MAIL_USERNAME=
MAIL_PASSWORD=

# Orange SMS API (facultatif)
ORANGE_CLIENT_ID=
ORANGE_CLIENT_SECRET=
ORANGE_SENDER_NUMBER=

# Paiement
PAYMENT_WEBHOOK_SECRET=${WEBHOOK_SECRET_GEN}

# Uploads
UPLOAD_DIR=/data/uploads

# Email (désactivé par défaut)
EMAIL_ENABLED=false
EOF

    ok "Fichier .env généré"

    # Modifier l'API URL dans le frontend si un domaine est fourni
    if [[ -n "$DOMAIN" ]]; then
        local env_prod="$PROJECT_DIR/frontend/src/environments/environment.prod.ts"
        if [[ -f "$env_prod" ]]; then
            sed -i "s|apiUrl:.*|apiUrl: 'https://$DOMAIN/api/v1',|" "$env_prod"
            ok "URL API frontend configurée : https://$DOMAIN/api/v1"
        fi
    fi

    # Build et lancement
    info "Build et démarrage des conteneurs (cela peut prendre 5-10 min la première fois)..."
    docker compose up -d --build

    ok "Application déployée"
    info "Attente du healthcheck..."
    for i in $(seq 1 30); do
        if curl -sf http://localhost:8080/actuator/health 2>/dev/null | grep -q '"status":"UP"'; then
            ok "API opérationnelle (healthcheck OK)"
            break
        fi
        if [[ $i -eq 30 ]]; then
            warn "Healthcheck non validé après 30 tentatives — vérifiez les logs : docker compose logs api"
        fi
        sleep 3
    done
}

# ── Étape 7 : Service systemd ─────────────────────────────────────────────
install_systemd_service() {
    step "7/8 — Service systemd (redémarrage automatique)"

    cat > /etc/systemd/system/itadytrano.service << 'SYSTEMD'
[Unit]
Description=ItadyTrano - Application de location etudiants
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/itadytrano
ExecStart=/usr/bin/docker compose up -d --remove-orphans
ExecStop=/usr/bin/docker compose down
ExecReload=/usr/bin/docker compose up -d --build
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SYSTEMD

    systemctl daemon-reload
    systemctl enable itadytrano
    ok "Service systemd installé et activé"
}

# ── Étape 8 : Scripts de maintenance ──────────────────────────────────────
install_maintenance_scripts() {
    step "8/8 — Scripts de maintenance"

    # ── Backup ──────────────────────────────────────────────────────────────
    cat > "$SCRIPTS_DIR/backup.sh" << 'BACKUP'
#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="/opt/itadytrano"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y-%m-%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

echo "[$(date '+%H:%M:%S')] Sauvegarde ItadyTrano..."

# DB
cd "$PROJECT_DIR"
docker compose exec -T db pg_dump -U itadyuser itadytrano 2>/dev/null \
  | gzip > "$BACKUP_DIR/db_$DATE.sql.gz" \
  && echo "  ✓ Base de donnees : db_$DATE.sql.gz ($(du -h "$BACKUP_DIR/db_$DATE.sql.gz" | cut -f1))"

# Photos
tar czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$PROJECT_DIR/data" uploads 2>/dev/null \
  && echo "  ✓ Photos : uploads_$DATE.tar.gz"

# .env
cp "$PROJECT_DIR/.env" "$BACKUP_DIR/env_$DATE.txt" \
  && echo "  ✓ Configuration : env_$DATE.txt"

# Rotation (7 jours)
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "env_*.txt" -mtime +7 -delete

echo "Sauvegarde terminee : $DATE"
BACKUP

    chmod +x "$SCRIPTS_DIR/backup.sh"
    echo "0 3 * * * root $SCRIPTS_DIR/backup.sh" > /etc/cron.d/itadytrano-backup
    ok "Script de backup installé (cron quotidien à 3h00)"

    # ── Restore ─────────────────────────────────────────────────────────────
    cat > "$SCRIPTS_DIR/restore.sh" << 'RESTORE'
#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="/opt/itadytrano"
BACKUP_DIR="$PROJECT_DIR/backups"

usage() {
    echo "Usage: $0 <fichier_db.sql.gz> [fichier_uploads.tar.gz]"
    echo "Exemple: $0 backups/db_2026-07-10_030000.sql.gz"
    exit 1
}

[[ $# -lt 1 ]] && usage
DB_FILE="$1"
UPLOADS_FILE="${2:-}"

if [[ ! -f "$DB_FILE" ]]; then
    echo "Erreur : $DB_FILE introuvable"
    exit 1
fi

cd "$PROJECT_DIR"

echo "Restauration de la base..."
gunzip < "$DB_FILE" | docker compose exec -T db psql -U itadyuser itadytrano
echo "✓ Base restauree"

if [[ -n "$UPLOADS_FILE" && -f "$UPLOADS_FILE" ]]; then
    echo "Restauration des photos..."
    tar xzf "$UPLOADS_FILE" -C "$PROJECT_DIR/data"
    echo "✓ Photos restaurees"
fi

echo "Restauration terminee."
echo "Redemarrez l'application : docker compose restart api"
RESTORE

    chmod +x "$SCRIPTS_DIR/restore.sh"
    ok "Script de restauration : $SCRIPTS_DIR/restore.sh"

    # ── Status ──────────────────────────────────────────────────────────────
    cat > "$SCRIPTS_DIR/status.sh" << 'STATUS'
#!/usr/bin/env bash
echo "═══════════════════════════════════════════"
echo "  ItadyTrano — État des services"
echo "═══════════════════════════════════════════"
cd /opt/itadytrano
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Ressources :"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || true
echo ""
echo "Stockage :"
df -h /opt/itadytrano/data 2>/dev/null | tail -1
STATUS

    chmod +x "$SCRIPTS_DIR/status.sh"
    ok "Script d'état : $SCRIPTS_DIR/status.sh"

    # ── Logs ────────────────────────────────────────────────────────────────
    cat > "$SCRIPTS_DIR/logs.sh" << 'LOGS'
#!/usr/bin/env bash
SERVICE="${1:-}"
cd /opt/itadytrano
if [[ -n "$SERVICE" ]]; then
    docker compose logs -f --tail=100 "$SERVICE"
else
    docker compose logs -f --tail=100
fi
LOGS

    chmod +x "$SCRIPTS_DIR/logs.sh"
    ok "Script de logs : $SCRIPTS_DIR/logs.sh [api|web|db]"

    # ── Update ──────────────────────────────────────────────────────────────
    cat > "$SCRIPTS_DIR/update.sh" << 'UPDATE'
#!/usr/bin/env bash
set -euo pipefail
cd /opt/itadytrano
echo "Mise à jour d'ItadyTrano..."
git pull 2>/dev/null && echo "✓ Code mis à jour" || echo "⚠ Pas de git, mise à jour manuelle requise"
docker compose up -d --build
echo "✓ Application redéployée"
UPDATE

    chmod +x "$SCRIPTS_DIR/update.sh"
    ok "Script de mise à jour : $SCRIPTS_DIR/update.sh"
}

# ── Résumé ────────────────────────────────────────────────────────────────
print_summary() {
    step "Déploiement terminé !"

    local web_port
    web_port=$(grep -oP '(?<=WEB_PORT=).*' "$PROJECT_DIR/.env" 2>/dev/null || echo "8088")

    echo ""
    echo -e "${GRN}  ItadyTrano est déployé sur Scaleway VPS !${RST}"
    echo ""
    echo "  Adresse      : http://$IP_PUBLIC:$web_port"
    if [[ -n "$DOMAIN" ]]; then
        echo "  Domaine      : https://$DOMAIN"
    fi
    echo "  API          : http://$IP_PUBLIC:$web_port/api/v1"
    echo "  Healthcheck  : http://$IP_PUBLIC:$web_port/api (réponse attendue : 200)"
    echo ""
    echo "  Commandes utiles :"
    echo "    État      : $SCRIPTS_DIR/status.sh"
    echo "    Logs      : $SCRIPTS_DIR/logs.sh [api|web|db]"
    echo "    Backup    : $SCRIPTS_DIR/backup.sh"
    echo "    Restore   : $SCRIPTS_DIR/restore.sh"
    echo "    Update    : $SCRIPTS_DIR/update.sh"
    echo ""
    echo "  Fichiers importants :"
    echo "    .env      : $PROJECT_DIR/.env"
    echo "    Log déploiement : $LOG_FILE"
    echo ""

    if [[ -n "$DOMAIN" ]]; then
        echo -e "${YLW}  ⚠  Après configuration DNS, exécutez :${RST}"
        echo "    sudo certbot --nginx -d $DOMAIN"
    else
        echo -e "${YLW}  ⚠  Aucun domaine configuré.${RST}"
        echo "    Pour ajouter SSL, installez certbot et exécutez :"
        echo "    sudo certbot --nginx -d votre-domaine.mg"
    fi
    echo ""
}

# ── Exécution ─────────────────────────────────────────────────────────────
main() {
    echo ""
    echo -e "${BLU}╔══════════════════════════════════════════════════════════╗${RST}"
    echo -e "${BLU}║${RST}      ItadyTrano — Déploiement Scaleway VPS              ${BLU}║${RST}"
    echo -e "${BLU}║${RST}      $(date '+%Y-%m-%d %H:%M:%S')                                   ${BLU}║${RST}"
    echo -e "${BLU}╚══════════════════════════════════════════════════════════╝${RST}"
    echo ""

    check_prereqs
    detect_ip
    system_update
    configure_firewall
    configure_swap
    install_docker
    deploy_app
    install_systemd_service
    install_maintenance_scripts
    print_summary
}

main "$@"
