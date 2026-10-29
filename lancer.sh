#!/usr/bin/env bash
# ============================================================================
#  LocaMaison — script de lancement (Linux / cette machine)
#  Démarre la base, le serveur (Spring Boot) et l'interface (Angular).
#  Utilisation :  ./lancer.sh        (puis ./arreter.sh pour tout arrêter)
# ============================================================================
set -u
ROOT="$(cd "$(dirname "$0")" && pwd)"

# --- Configuration de la base de données (modifier si besoin) ---------------
export DB_URL="${DB_URL:-jdbc:postgresql://localhost:5432/itadytrano}"
export DB_USERNAME="${DB_USERNAME:-itadyuser}"
export DB_PASSWORD="${DB_PASSWORD:-password123}"

GRADLE_CMD="$(command -v gradle || echo "$ROOT/backend/demo/gradlew")"

echo "==== LocaMaison : démarrage ===="

# 1) PostgreSQL doit tourner
if ! pg_isready -q 2>/dev/null; then
  echo "  PostgreSQL ne répond pas (port 5432). Démarrez-le puis relancez." >&2
  exit 1
fi
echo "  PostgreSQL : OK"

# 2) Serveur Spring Boot (port 8080)
echo "  Démarrage du serveur (Spring Boot)..."
nohup bash -c "cd '$ROOT/backend/demo' && '$GRADLE_CMD' bootRun --console=plain" \
    > /tmp/locamaison-backend.log 2>&1 &
echo $! > /tmp/locamaison-backend.pid
disown 2>/dev/null || true

# 3) Interface Angular (port 4200)
echo "  Démarrage de l'interface (Angular)..."
nohup bash -c "cd '$ROOT/frontend' && npm start" > /tmp/locamaison-frontend.log 2>&1 &
echo $! > /tmp/locamaison-frontend.pid
disown 2>/dev/null || true

# 4) Attente que les deux ports répondent
printf "  Patientez "
for i in $(seq 1 120); do
  back=$(ss -tln 2>/dev/null | grep -c ':8080')
  front=$(ss -tln 2>/dev/null | grep -c ':4200')
  if [ "$back" -ge 1 ] && [ "$front" -ge 1 ]; then echo " prêt !"; break; fi
  printf "."; sleep 3
done

echo ""
LAN_IP="$(ip -4 addr show 2>/dev/null | grep -oP 'inet \K(192\.168|10|172\.(1[6-9]|2[0-9]|3[01]))\.[0-9.]+' | head -1)"
echo "==== ItadyTrano est lancé ===="
echo "  Interface (local)  : http://localhost:4200"
if [ -n "$LAN_IP" ]; then
  echo "  Interface (réseau) : http://$LAN_IP:4200   (depuis un téléphone/PC du même réseau)"
fi
echo "  API                : http://localhost:8080"
echo "  Journaux  : /tmp/locamaison-backend.log  /tmp/locamaison-frontend.log"
echo "  Pour arrêter : ./arreter.sh"
command -v xdg-open >/dev/null 2>&1 && xdg-open "http://localhost:4200" >/dev/null 2>&1 &
