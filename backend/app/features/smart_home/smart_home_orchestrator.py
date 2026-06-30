"""
Smart Home Orchestrator v6.0 – المنزل الذكي المتكامل (Plugin)
=============================================================
- يرث من BasePlugin – يسجل نفسه تلقائياً في FeatureRegistry.
- ينفذ الأوامر فعلياً على الأجهزة عبر device_controllers.
- يدعم 6 روتينات ذكية مع routine_engine.
- يتكامل مع TCMA عبر smart_home_memory_bridge.
- يستخدم AIGateway كاحتياطي لتحليل الأوامر غير المعروفة.
"""
import logging, os
from typing import Dict, Any

from app.features.base_plugin import BasePlugin

logger = logging.getLogger(__name__)

# الأوامر المدعومة وأفعالها
ROUTINE_ACTIONS = {
    "morning": [
        ("light", "light_on"),
        ("climate", "ac_heat"),
        ("routine", "news"),
    ],
    "work": [
        ("light", "light_off"),
        ("climate", "ac_off"),
    ],
    "evening": [
        ("light", "light_dim"),
        ("routine", "music"),
    ],
    "night": [
        ("light", "light_off"),
        ("climate", "ac_off"),
        ("lock", "lock_doors"),
    ],
    "travel": [
        ("light", "all_off"),
        ("climate", "all_off"),
        ("camera", "cameras_on"),
        ("routine", "presence_simulation"),
    ],
    "guests": [
        ("light", "light_welcome"),
        ("routine", "music"),
        ("climate", "ac_heat"),
    ],
}

class SmartHomeOrchestrator(BasePlugin):
    """منسق المنزل الذكي – مسجل كـ Plugin"""

    def __init__(self):
        super().__init__(name="SmartHome", version="6.0.0")

    @property
    def plugin_id(self) -> str:
        return "smart_home"

    @property
    def plugin_name_ar(self) -> str:
        return "المنزل الذكي"

    @property
    def plugin_name_en(self) -> str:
        return "Smart Home"

    @property
    def description(self) -> str:
        return "تحكم بالإضاءة، روتين، توصيات ذكية"

    # ================================================================
    # معالجة الأوامر
    # ================================================================
    async def process_command(self, user_id: str, command: str, lang: str = "ar") -> Dict[str, Any]:
        """تنفيذ الأمر على الأجهزة الفعلية أو محاكاة"""
        from app.features.smart_home.device_controllers import (
            ha_call_service, wled_set_color, wled_turn_off, discover_devices,
        )
        from app.features.smart_home.routine_engine import routine_engine
        from app.features.smart_home.smart_home_memory_bridge import smart_home_bridge

        executed = False
        response = ""
        command_lower = command.strip().lower()

        # 1. الأوامر البسيطة (عربي / إنجليزي)
        if "شغل النور" in command_lower or "turn on light" in command_lower:
            executed = await ha_call_service("light.turn_on", "light.salon")
            # محاولة WLED إذا كان مخصصاً
            if not executed:
                try: await wled_set_color("أبيض", 255); executed = True
                except: pass
            response = "تم تشغيل الإضاءة" if executed else "تعذر تشغيل الإضاءة"

        elif "اطفئ النور" in command_lower or "turn off light" in command_lower:
            executed = await ha_call_service("light.turn_off", "light.salon")
            if not executed:
                try: await wled_turn_off(); executed = True
                except: pass
            response = "تم إطفاء الإضاءة" if executed else "تعذر إطفاء الإضاءة"

        elif "شغل المكيف" in command_lower or "turn on ac" in command_lower:
            executed = await ha_call_service("climate.turn_on", "climate.salon")
            response = "تم تشغيل المكيف" if executed else "تعذر تشغيل المكيف"

        elif "اطفئ المكيف" in command_lower or "turn off ac" in command_lower:
            executed = await ha_call_service("climate.turn_off", "climate.salon")
            response = "تم إطفاء المكيف" if executed else "تعذر إطفاء المكيف"

        # 2. أوامر الروتين (routine:morning)
        elif command_lower.startswith("routine:"):
            routine_id = command_lower.split(":")[1].strip()
            actions = ROUTINE_ACTIONS.get(routine_id, [])
            executed_count = 0
            for device_type, action in actions:
                try:
                    if device_type == "light":
                        if action == "light_on":
                            ok = await ha_call_service("light.turn_on", "light.salon")
                        elif action == "light_off":
                            ok = await ha_call_service("light.turn_off", "light.salon")
                        elif action == "light_dim":
                            ok = await wled_set_color("أبيض", 80)
                        elif action == "light_welcome":
                            ok = await wled_set_color("أصفر", 200)
                        elif action == "all_off":
                            ok = await ha_call_service("light.turn_off", "all")
                        else:
                            ok = False
                    elif device_type == "climate":
                        if action == "ac_heat":
                            ok = await ha_call_service("climate.set_temperature", "climate.salon", {"temperature": 24})
                        elif action == "ac_off":
                            ok = await ha_call_service("climate.turn_off", "climate.salon")
                        elif action == "all_off":
                            ok = await ha_call_service("climate.turn_off", "all")
                        else:
                            ok = False
                    elif device_type == "lock":
                        ok = await ha_call_service("lock.lock", "lock.main_door")
                    elif device_type == "camera":
                        ok = await ha_call_service("camera.enable_motion", "camera.front")
                    elif device_type == "routine":
                        ok = True  # تشغيل الموسيقى أو الأخبار عبر مساعد آخر
                    else:
                        ok = False

                    if ok: executed_count += 1
                except Exception as e:
                    logger.warning(f"Routine action {action} failed: {e}")

            executed = executed_count > 0
            routine_name = {
                "morning": "صباح الخير", "work": "وضع العمل", "evening": "مساء الخير",
                "night": "تصبح على خير", "travel": "وضع السفر", "guests": "وضع الاستقبال"
            }.get(routine_id, routine_id)
            response = f"تم تفعيل روتين '{routine_name}' ({executed_count}/{len(actions)} إجراءات)" if executed else f"تعذر تفعيل روتين '{routine_name}'"
            routine_engine.log_action(user_id, f"routine:{routine_id}", "routine")

        # 3. أمر غير معروف – استخدام AI Gateway للتحليل
        else:
            if self.ai:
                try:
                    prompt = f"المستخدم يريد تنفيذ أمر منزلي: '{command}'. اقترح رداً مناسباً باللغة {'العربية' if lang == 'ar' else 'English'}."
                    ai_response, _ = await self.ai.route(prompt, task="general", user_id=user_id)
                    response = ai_response or "لم يتم التعرف على الأمر"
                except:
                    response = f"الأمر '{command}' غير معروف حالياً"
            else:
                response = f"الأمر '{command}' غير معروف حالياً"

        # تسجيل في الذاكرة
        await smart_home_bridge.log_action(user_id, command, response)
        routine_engine.log_action(user_id, command, "device_control")

        return {
            "command": command,
            "response": response,
            "executed": executed,
        }

    # ================================================================
    # حالة المنزل
    # ================================================================
    async def get_status(self, user_id: str) -> Dict[str, Any]:
        """جلب حالة المنزل الكاملة مع الأجهزة والاقتراحات"""
        from app.features.smart_home.device_controllers import discover_devices
        from app.features.smart_home.routine_engine import routine_engine
        from app.features.smart_home.smart_home_memory_bridge import smart_home_bridge

        # الأجهزة
        devices = await discover_devices()

        # الاقتراحات الذكية
        patterns = routine_engine.detect_patterns(user_id)
        suggestion = patterns[0]["suggestion"] if patterns else None

        # الحالة العاطفية
        context = await smart_home_bridge.get_user_context(user_id)
        user_emotion = context.get("emotion", "neutral") if context else "neutral"

        return {
            "devices": devices,
            "user_emotion": user_emotion,
            "suggestion": suggestion or "المنزل جاهز لأوامرك.",
        }

    def register_routes(self, app: Any) -> bool:
        try:
            from app.api.routes.smart_home_routes import router
            app.include_router(router)
            logger.info("   ✅ Smart Home routes registered")
            return True
        except Exception as e:
            logger.warning(f"   ⚠️ Smart Home routes not registered: {e}")
            return False


smart_home = SmartHomeOrchestrator()
logger.info("✅ Smart Home Orchestrator v6.0 initialized")
