"""
AI Gateway v3.1 (3 HF Keys + Voice) – البوابة الموحدة للذكاء الاصطناعي (المرجع الوحيد)
=============================================================
- تدمج provider_router بالكامل.
- تدير 13 مفتاح API عبر 5 مزودين مع Load Balancer ذكي.
- تدعم التوجيه المتخصص لكل مهمة (Coding، Emotional، Business...).
- تستخدم Smart Cache لتوفير 40-60% من استهلاك API.
- تدعم Circuit Breaker (فصل المزود المتعطل مؤقتاً).
- ✅ Cost Tracker مدمج – يسجل كل استدعاء API.
"""
import os, logging, asyncio, random, time, aiohttp
from typing import Tuple, Optional, List, Dict
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("ai_gateway")

# ============================================================
# إدارة مفاتيح API (مركزية)
# ============================================================
class APIKeyManager:
    def __init__(self):
        self._keys: Dict[str, List[Dict]] = {
            "gemini": [], "gemini_image": [], "groq": [], "openrouter": [], "huggingface": [],
        }
        self._daily_limits: Dict[str, int] = {
            "gemini": 1500, "gemini_image": 500, "groq": 1000, "openrouter": 200, "huggingface": 3000,
        }
        self._circuit_breaker: Dict[str, float] = {}
        self._usage_reset_time = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0) + timedelta(days=1)
        self._load_keys()

    def _load_keys(self):
        for var in ["GEMINI_API_KEY", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3"]:
            k = os.getenv(var, ""); 
            if k: self._keys["gemini"].append({"key": k, "usage": 0, "failures": 0})
        for var in ["GEMINI_IMAGE_API_KEY", "GEMINI_IMAGE_API_KEY_2"]:
            k = os.getenv(var, ""); 
            if k: self._keys["gemini_image"].append({"key": k, "usage": 0, "failures": 0})
        for var in ["GROQ_API_KEY", "GROQ_API_KEY_2", "GROQ_API_KEY_3"]:
            k = os.getenv(var, ""); 
            if k: self._keys["groq"].append({"key": k, "usage": 0, "failures": 0})
        for var in ["OPENROUTER_API_KEY", "OPENROUTER_API_KEY_2", "OPENROUTER_API_KEY_3"]:
            k = os.getenv(var, ""); 
            if k: self._keys["openrouter"].append({"key": k, "usage": 0, "failures": 0})
        for var in ["HUGGINGFACE_API_KEY", "HUGGINGFACE_API_KEY_2", "HUGGINGFACE_API_KEY_3"]:
            k = os.getenv(var, ""); 
            if k: self._keys["huggingface"].append({"key": k, "usage": 0, "failures": 0})
        logger.info(f"🔑 AI Gateway Keys: G={len(self._keys['gemini'])}, Gi={len(self._keys['gemini_image'])}, Gr={len(self._keys['groq'])}, O={len(self._keys['openrouter'])}, HF={len(self._keys['huggingface'])}")

    def _check_reset(self):
        if datetime.now(timezone.utc) >= self._usage_reset_time:
            for provider in self._keys:
                for k in self._keys[provider]: k["usage"] = 0
            self._usage_reset_time = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0) + timedelta(days=1)

    def _is_circuit_open(self, provider: str) -> bool:
        if provider in self._circuit_breaker:
            if time.time() < self._circuit_breaker[provider]:
                return True
            else:
                del self._circuit_breaker[provider]
        return False

    def _open_circuit(self, provider: str):
        self._circuit_breaker[provider] = time.time() + 300

    def get_key(self, provider: str) -> Optional[str]:
        self._check_reset()
        if self._is_circuit_open(provider):
            logger.warning(f"🔴 Circuit Breaker مفتوح لـ {provider} - تخطي")
            return None
        available = [k for k in self._keys.get(provider, []) if k["usage"] < self._daily_limits.get(provider, 100) and k["failures"] < 3]
        if available:
            chosen = random.choice(available)
            chosen["usage"] += 1
            return chosen["key"]
        if self._keys.get(provider):
            k = self._keys[provider][0]
            k["usage"] += 1
            return k["key"]
        return None

    def mark_failure(self, provider: str, key: str):
        failures = 0
        for k in self._keys.get(provider, []):
            if k["key"] == key: 
                k["failures"] += 1
                failures = k["failures"]
        if failures >= 3:
            self._open_circuit(provider)
            logger.error(f"🔴 Circuit Breaker مفعّل لـ {provider} (5 دقائق)")

# ============================================================
# توجيه المهام (Task Routing)
# ============================================================
TASK_ROUTING = {
    "coding": [
        {"provider": "huggingface", "model": "deepseek-ai/deepseek-coder-33b-instruct"},
        {"provider": "openrouter", "model": "qwen/qwen-2.5-coder-32b-instruct"},
        {"provider": "openrouter", "model": "deepseek/deepseek-coder"},
    ],
    "emotional": [
        {"provider": "huggingface", "model": "google/gemma-2-9b-it"},
        {"provider": "gemini", "model": "gemini-2.5-flash"},
        {"provider": "huggingface", "model": "meta-llama/Meta-Llama-3-8B-Instruct"},
    ],
    "business": [
        {"provider": "huggingface", "model": "mistralai/Mistral-7B-Instruct-v0.3"},
        {"provider": "openrouter", "model": "qwen/qwen-2.5-32b-instruct"},
        {"provider": "openrouter", "model": "deepseek/deepseek-chat"},
    ],
    "study": [
        {"provider": "huggingface", "model": "mistralai/Mistral-7B-Instruct-v0.3"},
        {"provider": "gemini", "model": "gemini-2.5-flash"},
        {"provider": "openrouter", "model": "meta-llama/llama-4-maverick"},
    ],
    "coaching": [
        {"provider": "huggingface", "model": "google/gemma-2-9b-it"},
        {"provider": "gemini", "model": "gemini-2.5-flash"},
        {"provider": "groq", "model": "llama-3.3-70b-versatile"},
    ],
    "general": [
        {"provider": "groq", "model": "llama-3.3-70b-versatile"},
        {"provider": "gemini", "model": "gemini-2.5-flash"},
        {"provider": "openrouter", "model": "meta-llama/llama-4-maverick"},
    ],
    "image": [
        {"provider": "gemini_image", "model": "gemini-2.5-flash-exp-image-generation"},
    ],
    "voice": [
        {"provider": "huggingface", "model": "openai/whisper-small"},
        {"provider": "huggingface", "model": "jonatasgrosman/wav2vec2-large-xlsr-53-arabic"},
    ],
}

class AIGateway:
    def __init__(self):
        self.key_manager = APIKeyManager()
        self._hf_session = None

    async def route(
        self, prompt: str, task: str = "general", user_id: Optional[str] = None
    ) -> Tuple[str, str]:
        """التوجيه الذكي حسب المهمة مع احتياطيات محددة و Smart Cache"""
        # 1. Smart Cache - فحص أولي
        try:
            from app.infrastructure.cache.cache_service import get_ai_response
            cached = get_ai_response(prompt[:200])
            if cached:
                logger.info("⚡ AI Gateway: استُخدم الكاش")
                return cached, "cache"
        except Exception:
            pass

        # 2. توجيه متخصص
        routing = TASK_ROUTING.get(task, TASK_ROUTING["general"])
        for entry in routing:
            provider = entry["provider"]
            model = entry["model"]
            key = self.key_manager.get_key(provider)
            if not key: continue
            try:
                text = None
                if provider == "huggingface":
                    text = await self._call_huggingface(model, prompt, key)
                elif provider in ["groq", "openrouter"]:
                    text = await self._call_openai_compatible(provider, model, prompt, key)
                elif provider in ["gemini", "gemini_image"]:
                    text = await self._call_gemini(model, prompt, key)
                if text and len(text.strip()) > 5:
                    logger.info(f"✅ {provider}/{model} ({task})")
                    # ✅ تسجيل في Cost Tracker
                    try:
                        from app.infrastructure.ai.cost_tracker import cost_tracker
                        cost_tracker.record_api_call(provider, model, key if key else "")
                    except Exception:
                        pass
                    # تخزين في الكاش
                    self._cache_response(prompt, text)
                    return text, provider
                self.key_manager.mark_failure(provider, key)
            except Exception as e:
                logger.warning(f"⚠️ {provider}/{model} failed: {e}")
                self.key_manager.mark_failure(provider, key)
        raise Exception("All AI providers exhausted")

    async def generate(self, prompt: str, language: str = "ar", task: str = "general", user_id: Optional[str] = None) -> Optional[str]:
        try:
            text, _ = await self.route(prompt, task, user_id)
            return text
        except Exception:
            return None

    async def _call_huggingface(self, model: str, prompt: str, key: str) -> Optional[str]:
        if not self._hf_session: self._hf_session = aiohttp.ClientSession()
        url = f"https://api-inference.huggingface.co/models/{model}"
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        payload = {"inputs": prompt, "parameters": {"max_new_tokens": 600, "temperature": 0.7}}
        try:
            async with self._hf_session.post(url, headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=25)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if isinstance(data, list) and len(data) > 0: return data[0].get("generated_text", "")
                    return data.get("generated_text", "")
        except Exception as e: logger.warning(f"HF failed: {e}")
        return None

    async def _call_openai_compatible(self, provider: str, model: str, prompt: str, key: str) -> Optional[str]:
        try:
            from openai import OpenAI
            base = "https://api.groq.com/openai/v1" if provider == "groq" else "https://openrouter.ai/api/v1"
            client = OpenAI(base_url=base, api_key=key)
            resp = await asyncio.wait_for(
                client.chat.completions.create(
                    model=model, messages=[{"role": "user", "content": prompt}],
                    max_tokens=600, temperature=0.7, timeout=10,
                ), timeout=12.0
            )
            return resp.choices[0].message.content
        except Exception as e: logger.warning(f"{provider} failed: {e}")
        return None

    async def _call_gemini(self, model: str, prompt: str, key: str) -> Optional[str]:
        try:
            from google import genai
            client = genai.Client(api_key=key)
            loop = asyncio.get_running_loop()
            response = await asyncio.wait_for(
                loop.run_in_executor(None, lambda: client.models.generate_content(model=model, contents=prompt)),
                timeout=12.0
            )
            return response.text if response else None
        except Exception as e: logger.warning(f"Gemini failed: {e}")
        return None

    def _cache_response(self, prompt: str, text: str) -> None:
        try:
            from app.infrastructure.cache.cache_service import cache_ai_response
            cache_ai_response(prompt[:200], text[:500], ttl=3600)
        except Exception: pass

# نسخة عالمية واحدة (المرجع الوحيد)
ai_gateway = AIGateway()
logger.info("✅ AI Gateway v3.1 (3 HF Keys + Voice) initialized (Circuit Breaker + Smart Cache + Cost Tracker)")
