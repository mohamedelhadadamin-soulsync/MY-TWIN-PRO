#!/usr/bin/env bash
set -e

# ═══════════════════════════════════════════════════════════════
#  MyTwin – Setup Environment Script
#  يكتشف IP الجهاز تلقائياً ويُشغّل Expo بالعنوان الصحيح.
#  يُستخدم فقط في التطوير المحلي (ليس في Codespaces أو الإنتاج).
# ═══════════════════════════════════════════════════════════════

echo "🔍 Detecting host IP for EXPO_PUBLIC_API_URL..."

HOST_IP=""

# إذا كنا في Codespaces، نعتمد على المتغير الموجود مسبقاً أو نطلب من المستخدم
if [ -n "$CODESPACES" ] || [ -n "$GITHUB_CODESPACE_TOKEN" ]; then
  echo "⚠️  Codespaces detected – skipping IP detection."
  echo "   Set EXPO_PUBLIC_API_URL manually or use port forwarding."
  exec npx expo start --tunnel --clear
fi

# محاولة الحصول على IP عبر ip route (Linux)
if command -v ip >/dev/null 2>&1; then
  HOST_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '/src/ {print $7; exit}')
fi

# fallback: hostname (Linux/Mac)
if [ -z "$HOST_IP" ] && command -v hostname >/dev/null 2>&1; then
  HOST_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi

# fallback: ifconfig (Mac قديم)
if [ -z "$HOST_IP" ] && command -v ifconfig >/dev/null 2>&1; then
  HOST_IP=$(ifconfig 2>/dev/null | awk '/inet / && !/127.0.0.1/ {print $2; exit}')
fi

# إذا فشل كل شيء، نُشغّل Expo مع تذكير للمطور
if [ -z "$HOST_IP" ]; then
  echo "❌ Could not detect host IP."
  echo "   Please set EXPO_PUBLIC_API_URL manually to http://<HOST_IP>:8000"
  echo "   Then run: npx expo start --lan --clear"
  exit 1
fi

# ✅ تم الاكتشاف – نصدر المتغير ونُشغّل Expo
export EXPO_PUBLIC_API_URL="http://$HOST_IP:8000"
echo "✅ EXPO_PUBLIC_API_URL = $EXPO_PUBLIC_API_URL"

# اختيار منفذ متاح (8081 هو الافتراضي)
PORT=8081
if command -v lsof >/dev/null 2>&1 && lsof -i ":$PORT" >/dev/null 2>&1; then
  PORT=8082
fi

echo "🚀 Starting Expo on port $PORT (LAN mode)..."
echo "   📱 Open Expo Go and scan the QR, or enter: exp://$HOST_IP:$PORT"

exec npx expo start --lan --clear --port "$PORT"
