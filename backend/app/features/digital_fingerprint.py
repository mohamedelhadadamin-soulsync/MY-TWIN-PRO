"""
Digital Fingerprint Engine v1.0 – البصمة الرقمية
=====================================================
بصمة فريدة لكل مستخدم تعكس:
- سمات الشخصية (Identity)
- النمط العاطفي المسيطر (Emotional)
- القيم والمخاوف والطموحات (Reflection)
- نمط التعلق (Attachment)
- مرحلة الرحلة (Journey Phase)
تتكامل مع كل طبقات TCMA وتُخزن في Supabase.
"""
import logging, hashlib, json
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

logger = logging.getLogger("digital_fingerprint")

class DigitalFingerprintEngine:
    """محرك البصمة الرقمية – يولد بصمة فريدة من TCMA"""
    
    def __init__(self):
        self._ai_gateway = None
        self._memory_client = None
    
    async def initialize(self, ai_gateway: Any, memory_client: Any):
        self._ai_gateway = ai_gateway
        self._memory_client = memory_client
        logger.info("🆔 Digital Fingerprint Engine initialized")
    
    async def generate_fingerprint(self, user_id: str, language: str = "ar") -> Dict[str, Any]:
        """توليد بصمة رقمية كاملة من كل طبقات TCMA"""
        
        fingerprint_data = {
            "user_id": user_id,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "identity": {},
            "emotional": {},
            "reflections": {},
            "attachment": {},
            "journey": {},
            "summary": {},
            "fingerprint_hash": "",
        }
        
        # 1. استخراج الهوية
        try:
            from app.memory.identity.identity_model import get_identity
            identity = await get_identity(user_id)
            fingerprint_data["identity"] = {
                "self_view": identity.get("self_view", "غير معروف"),
                "traits": identity.get("traits", []),
                "family_role": identity.get("family_role", "غير معروف"),
                "core_values": identity.get("core_values", []),
                "aspirations": identity.get("aspirations", []),
                "fears": identity.get("fears", []),
            }
        except Exception as e:
            logger.warning(f"Identity extraction failed: {e}")
        
        # 2. استخراج الأنماط العاطفية
        try:
            from app.memory.emotional.emotional_memory import get_emotional_patterns
            patterns = await get_emotional_patterns(user_id, days=30)
            fingerprint_data["emotional"] = {
                "dominant_emotion": patterns.get("dominant_emotion", "neutral"),
                "distribution": patterns.get("emotion_distribution", {}),
                "patterns": patterns.get("patterns", []),
                "recommendation": patterns.get("recommendation", ""),
            }
        except Exception as e:
            logger.warning(f"Emotional extraction failed: {e}")
        
        # 3. استخراج الاستنتاجات العميقة
        try:
            from app.memory.reflection.reflection_engine import get_user_insights
            insights = await get_user_insights(user_id, min_confidence=0.5)
            by_type = {}
            for ins in insights.get("insights", []):
                t = ins.get("type", "other")
                if t not in by_type:
                    by_type[t] = []
                by_type[t].append(ins["text"])
            
            fingerprint_data["reflections"] = {
                "total_insights": insights.get("total_insights", 0),
                "summary": insights.get("summary", ""),
                "by_type": by_type,
            }
        except Exception as e:
            logger.warning(f"Reflection extraction failed: {e}")
        
        # 4. استخراج نمط التعلق ومرحلة الرحلة (من الـ Store عبر Supabase)
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            profile = db.table("profiles").select("attachment_style,journey_phase").eq("user_id", user_id).single().execute()
            if profile.data:
                fingerprint_data["attachment"] = {
                    "style": profile.data.get("attachment_style", "unknown"),
                }
                fingerprint_data["journey"] = {
                    "phase": profile.data.get("journey_phase", "introduction"),
                }
        except:
            fingerprint_data["attachment"] = {"style": "unknown"}
            fingerprint_data["journey"] = {"phase": "introduction"}
        
        # 5. بناء ملخص إنساني للبصمة
        fingerprint_data["summary"] = self._build_human_summary(fingerprint_data, language)
        
        # 6. توليد Hash فريد للبصمة
        fingerprint_string = json.dumps(fingerprint_data["identity"]) + json.dumps(fingerprint_data["emotional"])
        fingerprint_data["fingerprint_hash"] = hashlib.sha256(fingerprint_string.encode()).hexdigest()[:16]
        
        # 7. تخزين البصمة في Supabase
        await self._store_fingerprint(fingerprint_data)
        
        logger.info(f"🆔 Fingerprint generated: {fingerprint_data['fingerprint_hash']}")
        return fingerprint_data
    
    def _build_human_summary(self, data: Dict[str, Any], language: str = "ar") -> Dict[str, str]:
        """بناء ملخص إنساني مقروء للبصمة"""
        identity = data.get("identity", {})
        emotional = data.get("emotional", {})
        reflections = data.get("reflections", {})
        
        traits = identity.get("traits", [])
        dominant = emotional.get("dominant_emotion", "neutral")
        patterns = emotional.get("patterns", [])
        total_insights = reflections.get("total_insights", 0)
        
        # ترجمة المشاعر للعربية
        emotion_ar = {
            "joy": "السعادة", "sadness": "الحزن", "fear": "القلق",
            "anger": "الغضب", "love": "الحب", "neutral": "الحياد",
            "shame": "الخجل", "surprise": "الدهشة"
        }
        dominant_ar = emotion_ar.get(dominant, dominant)
        
        # بناء الشخصية
        if language == "ar":
            personality = "شخصية " + (" و".join(traits[:3])) if traits else "شخصية متوازنة"
            emotion_summary = f"يميل عاطفياً إلى {dominant_ar}"
            insight_summary = f"لديه {total_insights} استنتاج عميق من محادثاته"
            
            if patterns:
                pattern_text = patterns[0] if patterns else ""
                emotion_summary += f" ({pattern_text})"
            
            return {
                "personality": personality,
                "emotional_state": emotion_summary,
                "insights": insight_summary,
                "one_liner": f"{personality}، {emotion_summary}. {insight_summary}."
            }
        else:
            personality = "A " + (" and ".join(traits[:3])) + " personality" if traits else "A balanced personality"
            emotion_summary = f"Emotionally tends toward {dominant}"
            insight_summary = f"Has {total_insights} deep insights from conversations"
            
            return {
                "personality": personality,
                "emotional_state": emotion_summary,
                "insights": insight_summary,
                "one_liner": f"{personality}. {emotion_summary}. {insight_summary}."
            }
    
    async def _store_fingerprint(self, data: Dict[str, Any]):
        """تخزين البصمة في Supabase"""
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            
            db.table("user_fingerprints").upsert({
                "user_id": data["user_id"],
                "fingerprint_hash": data["fingerprint_hash"],
                "traits": data["identity"].get("traits", []),
                "dominant_emotion": data["emotional"].get("dominant_emotion", "neutral"),
                "learning_style": "visual",
                "attachment_style": data["attachment"].get("style", "unknown"),
                "updated_at": data["generated_at"],
            }).execute()
        except Exception as e:
            logger.warning(f"Fingerprint storage failed: {e}")
    
    async def get_fingerprint(self, user_id: str) -> Optional[Dict[str, Any]]:
        """استرجاع البصمة المخزنة"""
        try:
            from app.infrastructure.database.supabase_client import get_db
            db = get_db()
            result = db.table("user_fingerprints").select("*").eq("user_id", user_id).single().execute()
            if result.data:
                return result.data
        except:
            pass
        return None


# نسخة عالمية
fingerprint_engine = DigitalFingerprintEngine()
logger.info("✅ Digital Fingerprint Engine ready")
