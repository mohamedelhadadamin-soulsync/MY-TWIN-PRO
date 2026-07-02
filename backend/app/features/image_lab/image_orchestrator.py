"""
Image Lab Orchestrator v6.0 – 3 طبقات للصور
=============================================
- طبقة 1: Gemini Image (أساسي - أفضل جودة)
- طبقة 2: HuggingFace Stable Diffusion (احتياطي - جودة عالية)
- طبقة 3: Pollinations.ai (احتياطي نهائي - مجاني غير محدود)
"""
import logging, os, base64, aiohttp, asyncio
from typing import Dict, Any

logger = logging.getLogger(__name__)

HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")
HF_SD_MODEL = "stabilityai/stable-diffusion-2-1"

class ImageOrchestrator:
    async def generate(self, user_id: str, prompt: str, style: str = "realistic", size: str = "1024x1024") -> Dict[str, Any]:
        
        # 1. Gemini Image (أساسي)
        try:
            logger.info(f"🎨 Trying Gemini Image for: {prompt[:50]}")
            from app.infrastructure.ai.ai_gateway import ai_gateway
            key = ai_gateway.key_manager.get_key("gemini_image")
            if key:
                from google import genai
                client = genai.Client(api_key=key)
                loop = asyncio.get_running_loop()
                response = await asyncio.wait_for(
                    loop.run_in_executor(None, lambda: client.models.generate_content(
                        model="gemini-2.5-flash-exp-image-generation",
                        contents=f"Generate a high-quality image: {prompt}. Style: {style}. Make it detailed and realistic."
                    )),
                    timeout=30.0
                )
                if response and response.text:
                    return {"status": "success", "image_url": response.text, "provider": "gemini"}
        except Exception as e:
            logger.warning(f"Gemini Image failed: {e}")

        # 2. HuggingFace Stable Diffusion
        if HF_API_KEY:
            try:
                logger.info(f"🎨 Trying Stable Diffusion for: {prompt[:50]}")
                headers = {"Authorization": f"Bearer {HF_API_KEY}"}
                payload = {"inputs": f"{prompt}, {style}, high quality, detailed"}
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"https://api-inference.huggingface.co/models/{HF_SD_MODEL}",
                        headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=30)
                    ) as resp:
                        if resp.status_code == 200:
                            image_bytes = await resp.read()
                            image_base64 = base64.b64encode(image_bytes).decode("utf-8")
                            return {"status": "success", "image_url": f"data:image/png;base64,{image_base64}", "provider": "huggingface_sd"}
            except Exception as e:
                logger.warning(f"Stable Diffusion failed: {e}")

        # 3. Pollinations.ai (احتياطي نهائي)
        try:
            logger.info(f"🎨 Trying Pollinations.ai for: {prompt[:50]}")
            encoded_prompt = prompt.replace(" ", "%20")
            url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&model=flux"
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                    if resp.status_code == 200:
                        image_bytes = await resp.read()
                        image_base64 = base64.b64encode(image_bytes).decode("utf-8")
                        return {"status": "success", "image_url": f"data:image/png;base64,{image_base64}", "provider": "pollinations"}
        except Exception as e:
            logger.warning(f"Pollinations failed: {e}")

        return {"status": "fallback", "message": "عذراً، فشل توليد الصورة.", "provider": "none"}

image_lab = ImageOrchestrator()
logger.info("✅ Image Lab v6.0 initialized (Gemini → SD → Pollinations)")
