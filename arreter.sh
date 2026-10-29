#!/usr/bin/env bash
# ============================================================================
#  LocaMaison — arrête le serveur et l'interface lancés par ./lancer.sh
# ============================================================================
echo "==== LocaMaison : arrêt ===="

for svc in backend frontend; do
  pidfile="/tmp/locamaison-$svc.pid"
  if [ -f "$pidfile" ]; then
    kill "$(cat "$pidfile")" 2>/dev/null && echo "  $svc arrêté (pid $(cat "$pidfile"))"
    rm -f "$pidfile"
  fi
done

# Filets de sécurité (processus restants)
pkill -f 'ng serve'        2>/dev/null && echo "  ng serve arrêté"
pkill -f 'bootRun'         2>/dev/null && echo "  bootRun arrêté"
pkill -f 'DemoApplication' 2>/dev/null

echo "Terminé."
