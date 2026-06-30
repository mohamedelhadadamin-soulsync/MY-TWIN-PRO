"""
Awareness Score System v1.0 – العقل المدبر للوعي الاستباقي
=============================================================
يحسب درجة وعي لكل مستخدم (0-100) بناءً على:
- تكرار المحادثات (30%)
- التفاعل العاطفي (25%)
- مستوى الرابطة (25%)
- عمق الاستنتاجات (20%)

يُحدد تردد الإشعارات حسب الدرجة والباقة.
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from app.infrastructure.database.supabase_client import get_db

logger = logging.getLogger("awareness_score")

# خريطة الباقات إلى عدد الإشعارات اليومية
TIER_NOTIFICATION_LIMITS = {
    "free":     {"min": 1, "max": 2,   "label": "الباقة المجانية"},
    "plus":     {"min": 1, "max": 3,   "label": "Plus"},
    "premium":  {"min": 2, "max": 4,   "label": "Premium"},
    "pro":      {"min": 3, "max": 5,   "label": "Pro"},
    "yearly":   {"min": 5, "max": 5,   "label": "Yearly"},
}

# نطاقات الوعي وتأثيرها على عدد الإشعارات
AWARENESS_RANGES = [
    {"range": (0, 20),   "label": "خامل",     "frequency_multiplier": 0.5},
    {"range": (20, 50),  "label": "عادي",     "frequency_multiplier": 1.0},
    {"range": (50, 80),  "label": "متفاعل",   "frequency_multiplier": 1.5},
    {"range": (80, 100), "label": "مرتبط",    "frequency_multiplier": 2.0},
]


async def calculate_awareness_score(user_id: str) -> float:
    """
    حساب درجة الوعي لمستخدم معين.
    المعادلة: chat_frequency(30%) + emotional_engagement(25%) + bond_level(25%) + reflection_depth(20%)
    """
    db = get_db()
    now = datetime.now(timezone.utc)
    
    # 1. تكرار المحادثات – آخر 7 أيام (30 نقطة كحد أقصى)
    chat_score = 0.0
    try:
        week_ago = (now - timedelta(days=7)).isoformat()
        chat_res = db.table("emotional_memory") \
            .select("id", count="exact") \
            .eq("user_id", user_id) \
            .gte("created_at", week_ago) \
            .execute()
        chat_count = chat_res.count or 0
        # 50 رسالة في الأسبوع = الدرجة الكاملة 30
        chat_score = min(chat_count / 50 * 30, 30)
    except Exception as e:
        logger.warning(f"Chat frequency calculation failed: {e}")
    
    # 2. التفاعل العاطفي – تنوع المشاعر (25 نقطة كحد أقصى)
    emotional_score = 0.0
    try:
        emo_res = db.table("emotional_memory") \
            .select("detected_emotion") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(50) \
            .execute()
        if emo_res.data:
            emotions = set()
            for row in emo_res.data:
                emotion_data = row.get("detected_emotion", {})
                if isinstance(emotion_data, dict):
                    primary = emotion_data.get("primary", "neutral")
                else:
                    primary = str(emotion_data)
                emotions.add(primary)
            # 5 مشاعر مختلفة = الدرجة الكاملة 25
            emotional_score = min(len(emotions) / 5 * 25, 25)
    except Exception as e:
        logger.warning(f"Emotional engagement calculation failed: {e}")
    
    # 3. مستوى الرابطة – من profiles.bond_level (25 نقطة كحد أقصى)
    bond_score = 0.0
    try:
        profile_res = db.table("profiles") \
            .select("bond_level") \
            .eq("id", user_id) \
            .single() \
            .execute()
        if profile_res.data:
            bond = profile_res.data.get("bond_level", 0) or 0
            bond_score = bond * 0.25  # bond_level من 0-100، نحوله إلى 25
    except Exception as e:
        logger.warning(f"Bond level calculation failed: {e}")
    
    # 4. عمق الاستنتاجات – آخر 14 يوم (20 نقطة كحد أقصى)
    reflection_score = 0.0
    try:
        two_weeks_ago = (now - timedelta(days=14)).isoformat()
        ref_res = db.table("reflection_insights") \
            .select("id", count="exact") \
            .eq("user_id", user_id) \
            .gte("created_at", two_weeks_ago) \
            .execute()
        ref_count = ref_res.count or 0
        # 10 استنتاجات في أسبوعين = الدرجة الكاملة 20
        reflection_score = min(ref_count / 10 * 20, 20)
    except Exception as e:
        logger.warning(f"Reflection depth calculation failed: {e}")
    
    total = chat_score + emotional_score + bond_score + reflection_score
    return round(min(total, 100), 1)


async def get_awareness_level(user_id: str) -> Dict[str, Any]:
    """جلب درجة الوعي مع التصنيف"""
    score = await calculate_awareness_score(user_id)
    
    # تحديد التصنيف
    level_label = "خامل"
    for r in AWARENESS_RANGES:
        if r["range"][0] <= score < r["range"][1]:
            level_label = r["label"]
            break
    
    # حفظ الدرجة في الملف الشخصي
    try:
        db = get_db()
        db.table("profiles").update({
            "awareness_score": score,
            "awareness_score_updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", user_id).execute()
    except Exception as e:
        logger.warning(f"Failed to save awareness score: {e}")
    
    return {
        "user_id": user_id,
        "score": score,
        "level": level_label,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }


async def get_notification_frequency(user_id: str, tier: str) -> Dict[str, Any]:
    """
    حساب عدد الإشعارات المسموح بها يومياً لمستخدم معين.
    يأخذ في الاعتبار: درجة الوعي + الباقة.
    """
    awareness = await get_awareness_level(user_id)
    score = awareness["score"]
    
    # حدود الباقة
    tier_limits = TIER_NOTIFICATION_LIMITS.get(tier, TIER_NOTIFICATION_LIMITS["free"])
    tier_min, tier_max = tier_limits["min"], tier_limits["max"]
    
    # مضاعف التردد حسب نطاق الوعي
    multiplier = 1.0
    for r in AWARENESS_RANGES:
        if r["range"][0] <= score < r["range"][1]:
            multiplier = r["frequency_multiplier"]
            break
    
    # حساب العدد النهائي
    base_range = tier_max - tier_min
    adjusted = tier_min + (base_range * (score / 100)) * multiplier
    daily_count = round(min(max(adjusted, tier_min), tier_max))
    
    # عدد الإشعارات المرسلة اليوم
    try:
        db = get_db()
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        sent_res = db.table("proactive_notifications") \
            .select("id", count="exact") \
            .eq("user_id", user_id) \
            .gte("created_at", today_start) \
            .execute()
        sent_today = sent_res.count or 0
    except:
        sent_today = 0
    
    return {
        "user_id": user_id,
        "tier": tier,
        "tier_limits": {"min": tier_min, "max": tier_max},
        "awareness_score": score,
        "awareness_level": awareness["level"],
        "daily_limit": daily_count,
        "sent_today": sent_today,
        "can_send": sent_today < daily_count,
        "remaining": max(0, daily_count - sent_today),
    }


async def should_send_notification(user_id: str, tier: str = "free") -> bool:
    """فحص سريع: هل يُسمح بإرسال إشعار الآن؟"""
    freq = await get_notification_frequency(user_id, tier)
    return freq["can_send"]


logger.info("✅ Awareness Score System v1.0 initialized")
