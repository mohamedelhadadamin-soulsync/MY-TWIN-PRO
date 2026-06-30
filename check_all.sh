#!/bin/bash
echo "🔍 بدء الفحص الشامل لمشروع MyTwin AI"
echo "========================================"

# 1. فحص ملفات الواجهة الخلفية الأساسية
echo ""
echo "📦 1. فحص صحة ملفات Python في backend/"
cd backend
for f in main.py run.py; do
    if [ -f "$f" ]; then
        python3 -m py_compile "$f" 2>/dev/null && echo "    ✅ $f" || echo "    ❌ $f"
    fi
done

# فحص مجلد app/
for f in app/main.py app/core/config.py app/core/security.py app/core/streaming.py app/core/feature_flags.py app/core/cross_feature_analyzer.py app/core/unified_recommendation_engine.py; do
    if [ -f "$f" ]; then
        python3 -m py_compile "$f" 2>/dev/null && echo "    ✅ $f" || echo "    ❌ $f"
    fi
done

# فحص مسارات API
for f in app/api/routes/chat.py app/api/routes/auth.py app/api/routes/profile.py app/api/routes/memories.py app/api/routes/goals.py app/api/routes/recommendations.py app/api/routes/relationship.py app/api/routes/dream_routes.py app/api/routes/study_routes.py app/api/routes/business_routes.py app/api/routes/code_lab_routes.py app/api/routes/life_coach_routes.py app/api/routes/smart_home_routes.py app/api/routes/task_manager_routes.py; do
    if [ -f "$f" ]; then
        python3 -m py_compile "$f" 2>/dev/null && echo "    ✅ $f" || echo "    ❌ $f"
    fi
done

# فحص محركات الذاكرة (TCMA)
for f in app/memory/emotional/emotional_memory.py app/memory/reflection/reflection_engine.py app/memory/relationship/person_node.py app/memory/relationship/relationship_memory.py app/memory/relationship/ner_engine.py app/memory/relationship/attachment_model.py app/memory/graph/memory_graph.py app/memory/graph/graph_pattern_miner.py app/memory/identity/identity_model.py app/memory/retrieval/memory_retriever.py; do
    if [ -f "$f" ]; then
        python3 -m py_compile "$f" 2>/dev/null && echo "    ✅ $f" || echo "    ❌ $f"
    fi
done

# فحص محركات الذكاء
for f in app/infrastructure/ai/provider_router.py app/infrastructure/ai/provider_router_internal.py app/infrastructure/ai/gemini_client.py app/infrastructure/ai/self_critic.py app/infrastructure/ai/council.py app/infrastructure/ai/embedding_client.py; do
    if [ -f "$f" ]; then
        python3 -m py_compile "$f" 2>/dev/null && echo "    ✅ $f" || echo "    ❌ $f"
    fi
done

# فحص الميزات
for f in app/features/study/athena_orchestrator.py app/features/business/growth_hive_orchestrator.py app/features/code_lab/sdlc_orchestrator.py app/features/life_coach/life_coach_orchestrator.py app/features/dreams/dream_orchestrator.py app/features/smart_home/smart_home_orchestrator.py app/features/task_manager/pass_orchestrator.py app/features/creator/creator_orchestrator.py; do
    if [ -f "$f" ]; then
        python3 -m py_compile "$f" 2>/dev/null && echo "    ✅ $f" || echo "    ❌ $f"
    fi
done
cd ..

# 2. فحص وجود ملفات الواجهة الأمامية
echo ""
echo "📱 2. فحص وجود ملفات الواجهة الأساسية"
for f in app/_layout.tsx app/chat/index.tsx app/chat/ChatBubbles.tsx app/chat/ChatInput.tsx app/chat/ChatComponents.tsx app/features/index.tsx app/features/business-analyzer.tsx app/features/code-lab.tsx app/features/content-creator.tsx app/features/dreams.tsx app/features/image-creator.tsx app/features/life-coach.tsx app/features/smart-home.tsx app/features/study-mode.tsx app/features/task-manager.tsx; do
    [ -f "$f" ] && echo "    ✅ $f" || echo "    ❌ $f مفقود"
done

for f in app/profile.tsx app/relationship.tsx app/memories.tsx app/settings.tsx app/subscription.tsx app/login.tsx app/onboarding.tsx app/customize.tsx app/referral.tsx app/history.tsx app/privacy.tsx app/terms.tsx app/feedback.tsx app/splash.tsx app/welcome.tsx; do
    [ -f "$f" ] && echo "    ✅ $f" || echo "    ❌ $f مفقود"
done

for f in store/useTwinStore.ts lib/httpClient.ts lib/iapService.ts lib/notifications.ts lib/analytics.ts lib/useStreamingChat.ts hooks/useTwinFull.ts; do
    [ -f "$f" ] && echo "    ✅ $f" || echo "    ⚠️ $f مفقود (قد لا يكون ضرورياً)"
done

for f in components/SideMenu.tsx components/ErrorBoundary.tsx components/ChatBubbles.tsx components/Header.tsx components/AdModal.tsx components/BondTimeline.tsx components/CircleProgress.tsx components/SkeletonLoader.tsx components/TypingIndicator.tsx utils/voice_engine.ts utils/voice_profiles.ts utils/theme.ts; do
    [ -f "$f" ] && echo "    ✅ $f" || echo "    ❌ $f مفقود"
done

# 3. اختبار استيراد المحركات الأساسية
echo ""
echo "🌐 3. اختبار استيراد المحركات الأساسية"
cd backend
python3 -c "
import sys
sys.path.insert(0, '.')
modules = [
    'app.core.config',
    'app.core.security',
    'app.infrastructure.cache.cache_service',
    'app.infrastructure.database.supabase_client',
    'app.infrastructure.ai.provider_router',
    'app.memory.emotional.emotional_memory',
    'app.memory.reflection.reflection_engine',
    'app.memory.relationship.person_node',
    'app.memory.graph.memory_graph',
]
ok = 0
for m in modules:
    try:
        __import__(m)
        ok += 1
    except Exception as e:
        print(f'    ❌ {m}: {e}')
print(f'    ✅ تم استيراد {ok}/{len(modules)} محرك بنجاح')
" 2>/dev/null
cd ..

# 4. اختبارات الوحدة
echo ""
echo "🧪 4. اختبارات الوحدة"
if [ -d backend/tests ]; then
    cd backend
    python3 -m pytest tests/ -v --timeout=30 2>&1 | tail -20
    cd ..
else
    echo "  ⚠️ مجلد الاختبارات غير موجود"
fi

# 5. فحص السيرفر الحي
echo ""
echo "🌍 5. فحص السيرفر الحي"
curl -s https://my-twin-pro-production-b744.up.railway.app/health 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "  ⚠️ تعذر الوصول للسيرفر"

echo ""
echo "✅ الفحص الشامل انتهى"
