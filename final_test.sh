#!/bin/bash
BASE="https://my-twin-pro-production-b744.up.railway.app"
echo "🧪 الاختبار النهائي لجميع ميزات MyTwin"
echo "=========================================="

# 1. الصحة العامة
echo "1. الصحة:" && curl -s "$BASE/health" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅' if d.get('api')=='healthy' else '❌')"

# 2. المحادثة
echo "2. المحادثة:" && curl -s -X POST "$BASE/api/chat" -H "Content-Type: application/json" -d '{"message":"مرحبا كيف حالك؟","lang":"ar"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅', d.get('reply','')[:80])"

# 3. الطقس
echo "3. الطقس:" && curl -s "$BASE/api/pass/weather?city=London&lang=ar" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅', d.get('temperature','❌'), '°C' if d.get('temperature') else '❌')"

# 4. يوتيوب
echo "4. يوتيوب:" && curl -s "$BASE/api/pass/youtube?query=python&lang=ar" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅ نتائج' if d.get('results') else '❌')"

# 5. الأخبار
echo "5. الأخبار:" && curl -s "$BASE/api/pass/news?country=us&lang=en" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅', len(d.get('articles',[])), 'خبر' if d.get('articles') else '❌')"

# 6. Proactive Awareness
echo "6. الوعي الاستباقي:" && curl -s "$BASE/api/awareness/status" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅ نشط' if d.get('active') else '❌')"

# 7. الإحالة (Referral)
echo "7. الإحالة:" && curl -s -X POST "$BASE/api/referral/generate" -H "Content-Type: application/json" -d '{"user_id":"test123"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅', d.get('code','❌')[:20])"

# 8. الدراسة
echo "8. الدراسة:" && curl -s -X POST "$BASE/api/study/start" -H "Content-Type: application/json" -d '{"user_id":"test","concept":"جاذبية","language":"ar"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅' if d.get('session_id') else '❌')"

# 9. الأحلام
echo "9. الأحلام:" && curl -s -X POST "$BASE/api/dreams/interpret" -H "Content-Type: application/json" -d '{"user_id":"test","dream_text":"طيران","lang":"ar","school":"all"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅' if d.get('status') else '❌')"

# 10. الأعمال
echo "10. الأعمال:" && curl -s -X POST "$BASE/api/business/generate-idea" -H "Content-Type: application/json" -d '{"user_id":"test","budget":5000,"interests":"تقنية","lang":"ar"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅' if d.get('ideas') else '❌')"

# 11. الصور
echo "11. الصور:" && curl -s -X POST "$BASE/api/image-lab/generate" -H "Content-Type: application/json" -d '{"user_id":"test","prompt":"نجوم","style":"realistic"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅', d.get('status','❌'))"

# 12. المهام
echo "12. المهام:" && curl -s -X POST "$BASE/api/tasks/create" -H "Content-Type: application/json" -d '{"user_id":"test","title":"اختبار"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅' if d.get('task') else '❌')"

# 13. الأفاتار
echo "13. الأفاتار:" && curl -s "$BASE/api/avatar/get?user_id=test" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅' if d.get('image_url') or d.get('emotion') else '❌')"

# 14. البصمة الرقمية
echo "14. البصمة:" && curl -s "$BASE/api/fingerprint/get?user_id=test" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅' if d.get('fingerprint_hash') else '❌')"

# 15. مركز الوعي
echo "15. مركز الوعي:" && curl -s "$BASE/" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅', d.get('plugins_loaded','❌'), 'Plugins')"

echo "=========================================="
echo "✅ اكتمل الاختبار النهائي"
