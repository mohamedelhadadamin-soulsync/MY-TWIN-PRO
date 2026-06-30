"""
AI Infrastructure Package
==========================
بوابة الذكاء الاصطناعي الموحدة (AIGateway) هي نقطة الدخول الوحيدة.
كل الميزات تستخدمها عبر BasePlugin.ai.
"""
from .ai_gateway import ai_gateway, AIGateway

__all__ = ["ai_gateway", "AIGateway"]
