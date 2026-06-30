"""
Consciousness Bridge v1.0 – جسر الوعي بين الميزات
=====================================================
يربط كل Plugins النظام ببعضها:
- عندما يدرس المستخدم، يحلل Growth Hive السوق لموضوع دراسته.
- عندما يحلل حلماً، يقدم Life Coach توصية نفسية.
- النتائج تُخزّن في TCMA وتُعرض في Twin Mind Center.
"""
import logging, asyncio
from typing import Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger("consciousness_bridge")

class ConsciousnessBridge:
    """جسر الوعي – يربط الميزات ببعضها"""
    
    def __init__(self):
        self._ai_gateway = None
        self._memory_client = None
        self._cross_recommendations: Dict[str, list] = {}
    
    async def initialize(self, ai_gateway: Any, memory_client: Any):
        self._ai_gateway = ai_gateway
        self._memory_client = memory_client
        logger.info("🌉 Consciousness Bridge initialized")
    
    async def on_feature_used(self, user_id: str, feature: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """تُستدعى عند استخدام أي ميزة. تولد توصيات عبر الميزات."""
        recommendations = []
        
        if feature == "study" and data.get("concept"):
            # عندما يدرس المستخدم، اقترح تحليل أعمال لنفس الموضوع
            recommendations.append({
                "title": "هل فكرت في تحويل هذا لمشروع؟",
                "body": f"لاحظت أنك تدرس '{data['concept']}'. محلل الأعمال يمكنه مساعدتك في تحويله لمشروع.",
                "action": "business",
                "route": "/features/business-analyzer"
            })
        
        elif feature == "dreams" and data.get("emotions"):
            # عندما يحلل حلماً، قدم توصية من Life Coach
            emotions = data.get("emotions", [])
            if "قلق" in emotions or "fear" in emotions:
                recommendations.append({
                    "title": "حلمك يعكس بعض القلق",
                    "body": "مدرب الحياة يمكنه مساعدتك في التعامل مع هذا القلق.",
                    "action": "life_coach",
                    "route": "/features/life-coach"
                })
        
        elif feature == "code_lab" and data.get("language"):
            # عندما يبرمج، اقترح دراسة
            recommendations.append({
                "title": "تطوير مهاراتك البرمجية",
                "body": f"أثينا يمكنها مساعدتك في تعلم مفاهيم متقدمة في {data['language']}.",
                "action": "study",
                "route": "/features/study-mode"
            })
        
        elif feature == "business" and data.get("interests"):
            # عندما يحلل أعمال، اقترح كتابة محتوى
            recommendations.append({
                "title": "هل تريد نشر أفكارك؟",
                "body": "صانع المحتوى يمكنه مساعدتك في كتابة محتوى عن مشروعك.",
                "action": "creator",
                "route": "/features/content-creator"
            })
        
        if recommendations:
            self._cross_recommendations[user_id] = recommendations
            logger.info(f"🌉 Generated {len(recommendations)} cross-feature recommendations for {user_id}")
        
        return {"recommendations": recommendations} if recommendations else None
    
    async def get_recommendations(self, user_id: str) -> list:
        """استرجاع التوصيات عبر الميزات"""
        return self._cross_recommendations.get(user_id, [])

# نسخة عالمية
consciousness_bridge = ConsciousnessBridge()
logger.info("✅ Consciousness Bridge ready")
