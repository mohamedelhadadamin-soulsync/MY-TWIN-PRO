"""
Cost Tracker v1.0 – تتبع استهلاك API والتوفير اليومي
=============================================================
- يتتبع استهلاك كل مزود وكل مفتاح على حدة
- يحسب التوفير من Smart Cache
- يوفر تقارير يومية وأسبوعية
- يساعد في تحسين Load Balancer
"""
import time, logging
from typing import Dict, Any, List
from datetime import datetime, timezone, timedelta
from collections import defaultdict

logger = logging.getLogger("cost_tracker")

class CostTracker:
    def __init__(self):
        # استهلاك يومي لكل مزود
        self.daily_usage: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        # استهلاك يومي لكل مفتاح
        self.key_usage: Dict[str, int] = defaultdict(int)
        # إحصائيات الكاش
        self.cache_hits: int = 0
        self.cache_misses: int = 0
        # توقيت آخر إعادة تعيين
        self._last_reset = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def _reset_daily(self):
        """إعادة تعيين العدادات يومياً"""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if today != self._last_reset:
            self.daily_usage.clear()
            self.key_usage.clear()
            self.cache_hits = 0
            self.cache_misses = 0
            self._last_reset = today
            logger.info("🔄 Cost Tracker: إعادة تعيين يومية")

    def record_api_call(self, provider: str, model: str, key: str = "", tokens: int = 0) -> None:
        """تسجيل استدعاء API"""
        self._reset_daily()
        self.daily_usage[provider][model] += 1
        if key:
            self.key_usage[key[:20] + "..."] += 1

    def record_cache_hit(self) -> None:
        """تسجيل نجاح الكاش"""
        self._reset_daily()
        self.cache_hits += 1

    def record_cache_miss(self) -> None:
        """تسجيل فشل الكاش"""
        self._reset_daily()
        self.cache_misses += 1

    def get_daily_report(self) -> Dict[str, Any]:
        """تقرير الاستهلاك اليومي"""
        self._reset_daily()
        total_calls = sum(sum(models.values()) for models in self.daily_usage.values())
        total_cache = self.cache_hits + self.cache_misses
        cache_rate = (self.cache_hits / total_cache * 100) if total_cache > 0 else 0
        api_saved = self.cache_hits  # كل كاش نجاح = استدعاء API تم توفيره
        
        return {
            "date": self._last_reset,
            "total_api_calls": total_calls,
            "api_calls_saved": api_saved,
            "cache_hit_rate": round(cache_rate, 1),
            "by_provider": {
                provider: {
                    "total": sum(models.values()),
                    "models": dict(models)
                }
                for provider, models in self.daily_usage.items()
            },
            "estimated_cost_saved": f"${api_saved * 0.001:.4f}",  # تقديري
        }

    def get_provider_load(self) -> Dict[str, float]:
        """نسبة تحميل كل مزود (لتحسين Load Balancer)"""
        self._reset_daily()
        total = sum(sum(models.values()) for models in self.daily_usage.values())
        if total == 0:
            return {}
        return {
            provider: round(sum(models.values()) / total * 100, 1)
            for provider, models in self.daily_usage.items()
        }

# نسخة عالمية
cost_tracker = CostTracker()
logger.info("✅ Cost Tracker v1.0 initialized")
