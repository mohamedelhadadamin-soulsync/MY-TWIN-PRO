#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
#  MyTwin – Start Expo (Tunnel > LAN)
#  يُشغّل Expo مع tunnel، وفي حال فشل ngrok يتراجع إلى LAN.
# ═══════════════════════════════════════════════════════════════

# دالة لفحص توفر منفذ
port_free() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -i ":$1" >/dev/null 2>&1 && return 1 || return 0
  fi
  return 0  # نفترض التوفر إذا لم نستطع الفحص
}

# اختيار أول منفذ متاح بين 8081 و 8083
PORT=8081
for p in 8081 8082 8083; do
  if port_free "$p"; then
    PORT="$p"
    break
  fi
done

echo "🚀 Trying to start Expo with tunnel (ngrok) on port $PORT..."
echo "   (If tunnel fails, will fall back to LAN automatically)"

# محاولة tunnel أولاً، مع fallback إلى LAN
if npx expo start --tunnel --clear --port "$PORT" 2>&1; then
  echo "✅ Expo started with tunnel on port $PORT."
else
  echo "⚠️  Tunnel failed or exited. Falling back to LAN on port $PORT..."
  npx expo start --lan --clear --port "$PORT"
fi
