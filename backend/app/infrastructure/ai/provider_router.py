"""
Provider Router – مؤشر إلى AI Gateway (للتوافق مع الكود القديم)
=============================================================
تم دمج هذا الملف بالكامل في ai_gateway.py v3.0.
هذا الملف موجود فقط للتوافق مع أي استدعاءات قديمة متبقية.
"""
import logging
from app.infrastructure.ai.ai_gateway import ai_gateway, APIKeyManager, TASK_ROUTING, AIGateway

logger = logging.getLogger("provider_router")

# إعادة تصدير كل شيء من ai_gateway
provider_router = ai_gateway
MultiAIClient = type('MultiAIClient', (), {
    'get_best_reply': lambda self, prompt, task="general": ai_gateway.generate(prompt, task=task)
})()

logger.info("✅ provider_router → ai_gateway (مؤشر توافق)")
