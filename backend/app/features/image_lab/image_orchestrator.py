"""
Image Lab Orchestrator v5.0 – توليد الصور (Plugin)
=============================================================
- يرث من BasePlugin – يسجل نفسه تلقائياً في FeatureRegistry.
- Pollinations.ai أساسي، Gemini Image احتياطي.
- يستخدم AIGateway عبر self.ai.route() للمهام النصية.
"""
import logging, os, base64, aiohttp
from typing import Dict, Any, Optional

from app.features.base_plugin import BasePlugin

logger = logging.getLogger(__name__)

POLLINATIONS_URL = "https://image.pollinations.ai/prompt"

class ImageOrchestrator(BasePlugin):
    """مولد الصور المتكامل – مسجل كـ Plugin"""
    
    def __init__(self):
        super().__init__(name="ImageLab", version="5.0.0")
    
    @property
    def plugin_id(self) -> str:
        return "image_lab"
    
    @property
    def plugin_name_ar(self) -> str:
        return "توليد الصور"
    
    @property
    def plugin_name_en(self) -> str:
        return "Image Creator"
    
    @property
    def description(self) -> str:
        return "توليد صور بالذكاء الاصطناعي – Pollinations.ai أساسي، Gemini احتياطي"
    
    async def generate(self, user_id: str, prompt: str, style: str = "realistic", size: str = "1024x1024", provider: str = "pollinations") -> Dict[str, Any]:
        """توليد صورة مع نظام احتياطي متعدد الطبقات"""
        
        # الطبقة 1: Pollinations.ai
        try:
            logger.info(f"🎨 Trying Pollinations.ai for: {prompt[:50]}")
            encoded_prompt = prompt.replace(" ", "%20")
            url = f"{POLLINATIONS_URL}/{encoded_prompt}?width=1024&height=1024&nologo=true"
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                    if resp.status == 200:
                        image_bytes = await resp.read()
                        image_base64 = base64.b64encode(image_bytes).decode("utf-8")
                        return {"status": "success", "image_url": f"data:image/png;base64,{image_base64}", "provider": "pollinations.ai"}
        except Exception as e:
            logger.warning(f"Pollinations.ai failed: {e}")
        
        # الطبقة 2: Gemini Image
        try:
            logger.info(f"🤖 Trying Gemini Image for: {prompt[:50]}")
            from app.infrastructure.ai.ai_gateway import ai_gateway
            key = ai_gateway.key_manager.get_key("gemini_image")
            if key:
                from google import genai
                client = genai.Client(api_key=key)
                import asyncio
                loop = asyncio.get_running_loop()
                response = await asyncio.wait_for(
                    loop.run_in_executor(None, lambda: client.models.generate_content(
                        model="gemini-2.5-flash-exp-image-generation",
                        contents=f"Generate an image: {prompt}. Style: {style}"
                    )),
                    timeout=30.0
                )
                if response and response.text:
                    return {"status": "success", "image_url": response.text, "provider": "gemini"}
        except Exception as e:
            logger.warning(f"Gemini Image failed: {e}")
        
        return {"status": "fallback", "message": "عذراً، فشل توليد الصورة. حاول مرة أخرى.", "provider": "none"}
    
    async def enhance_prompt(self, user_id: str, prompt: str) -> str:
        enhanced = prompt.strip()
        if len(enhanced) < 10:
            enhanced += "، تفاصيل عالية، إضاءة جميلة"
        return enhanced
    
    def register_routes(self, app: Any) -> bool:
        try:
            from app.api.routes.image_routes import router
            app.include_router(router)
            logger.info("   ✅ Image Lab routes registered")
            return True
        except Exception as e:
            logger.warning(f"   ⚠️ Image Lab routes not registered: {e}")
            return False

image_lab = ImageOrchestrator()
