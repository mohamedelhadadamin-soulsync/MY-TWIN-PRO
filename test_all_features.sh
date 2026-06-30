#!/bin/bash
echo "========================================="
echo "🧪 الاختبار الشامل لـ MyTwin AI v16.0.0"
echo "========================================="

BASE="https://my-twin-pro-production-b744.up.railway.app"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuZGJ6bHdpdHpoaWRhaHVvb2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYzNzc4MjQsImV4cCI6MjA0MTk1MzgyNH0.JeQZ6BVVJqP-ZNLQJTdYjQlZRgUPIAI9zBVlGnRnGUk"

# 1. الصحة العامة
echo "🌐 1. الصحة العامة"
curl -s "$BASE/health" | python3 -m json.tool
echo ""

# 2. المحادثة
echo "💬 2. المحادثة (AIGateway)"
curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"مرحبا، كيف حالك؟","lang":"ar"}' | python3 -c '
import sys,json; d=json.load(sys.stdin)
print("✅ الرد:", d.get("reply","")[:100])
print("🔌 المزود:", d.get("provider","unknown"))
'
echo ""

# 3. الدراسة
echo "📚 3. الدراسة (Athena Plugin)"
curl -s -X POST "$BASE/api/study/start" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test123","concept":"الجاذبية","language":"ar"}' | python3 -c '
import sys,json; d=json.load(sys.stdin)
print("✅ الجلسة:", d.get("session_id",""), "| الشرح:", str(d.get("explanation",{}).get("simplified",""))[:80])
'
echo ""

# 4. تفسير الأحلام
echo "🌙 4. تفسير الأحلام (Dreams Plugin)"
curl -s -X POST "$BASE/api/dreams/interpret" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test123","dream_text":"حلمت أنني أطير","lang":"ar","school":"all"}' | python3 -c '
import sys,json; d=json.load(sys.stdin)
print("✅ الحالة:", d.get("status","unknown"))
print("📝 التفسير:", str(d.get("data",{}).get("interpretation",""))[:80])
'
echo ""

# 5. الطقس
echo "🌤️ 5. الطقس"
curl -s "$BASE/api/pass/weather?city=London&lang=ar" | python3 -c '
import sys,json; d=json.load(sys.stdin)
print("✅ المدينة:", d.get("city",""), "| الحرارة:", d.get("temperature",""), "°C")
'
echo ""

# 6. الأخبار
echo "📰 6. الأخبار"
curl -s "$BASE/api/pass/news?lang=ar" | python3 -c '
import sys,json; d=json.load(sys.stdin)
print("✅ عدد الأخبار:", len(d.get("articles",[])))
'
echo ""

# 7. العملات
echo "💱 7. العملات"
curl -s "$BASE/api/pass/currency?base=USD&symbols=EGP,SAR" | python3 -c '
import sys,json; d=json.load(sys.stdin)
print("✅ الأسعار:", d.get("rates",{}))
'
echo ""

# 8. اليوتيوب
echo "🎬 8. اليوتيوب"
curl -s "$BASE/api/pass/youtube?query=python+tutorial&lang=ar" 2>/dev/null | python3 -c '
import sys,json
try:
    d=json.load(sys.stdin)
    print("✅ النتائج:", str(d)[:100])
except:
    print("⚠️ المسار غير موجود بعد (سيُضاف)")
'
echo ""

# 9. توليد الصور
echo "🖼️ 9. توليد الصور"
curl -s -X POST "$BASE/api/image-lab/generate?user_id=test123&prompt=قطة%20في%20الفضاء&style=realistic" | python3 -c '
import sys,json; d=json.load(sys.stdin)
print("✅ الحالة:", d.get("status","unknown"), "| المزود:", d.get("provider",""))
'
echo ""

# 10. الأعمال
echo "💼 10. الأعمال (Business Plugin)"
curl -s -X POST "$BASE/api/business/generate-idea" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test123","budget":5000,"interests":"تكنولوجيا","lang":"ar"}' | python3 -c '
import sys,json; d=json.load(sys.stdin)
print("✅ الفكرة:", str(d.get("ideas",""))[:80])
'
echo ""

echo "✅ تم الانتهاء من جميع الاختبارات"
