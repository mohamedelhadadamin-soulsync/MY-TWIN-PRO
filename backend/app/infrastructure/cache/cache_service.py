"""
MyTwin – Smart Semantic Cache Service v6.0 (مع Cost Tracker)
================================================
- تخزين مؤقت محلي + Redis (اختياري)
- Semantic Similarity للتشابه المعنوي
- TTL متدرج: 1h / 24h / 7d
- Smart Eviction + Cost Tracking مدمج
- يسجل Hits/Misses في Cost Tracker لتحليل التوفير
"""
import hashlib, time, json, logging, re
from typing import Optional, Any, Dict, Tuple
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)

_cache: Dict[str, Dict[str, Any]] = {}
_cache_stats = {
    "hits": 0, "misses": 0, "sets": 0, "deletes": 0,
    "semantic_hits": 0, "api_calls_saved": 0,
    "last_cleanup": time.time(),
}

_redis_client = None
_redis_enabled = False

try:
    from app.core.config import config
    redis_url = getattr(config, 'REDIS_URL', None)
    if redis_url:
        import redis
        _redis_client = redis.Redis.from_url(
            redis_url, decode_responses=True,
            socket_connect_timeout=2, socket_timeout=2
        )
        _redis_client.ping()
        _redis_enabled = True
        logger.info("✅ Redis متصل")
except Exception as e:
    logger.info(f"ℹ️ Redis غير متصل، استخدام الذاكرة المحلية: {e}")

def _get_ttl(key: str, value: str = "") -> int:
    if "frequent" in key or "emotion" in key: return 3600
    if "context" in key or "personality" in key: return 86400
    if "static" in key: return 604800
    return 300

def _clean_text(text: str) -> str:
    text = re.sub(r'[^\w\s]', '', text.lower())
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def _semantic_hash(text: str) -> str:
    words = sorted(set(_clean_text(text).split()))
    return hashlib.md5(" ".join(words[:20]).encode()).hexdigest()

def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, _clean_text(a), _clean_text(b)).ratio()

def get(key: str) -> Optional[Any]:
    global _cache_stats
    if _redis_enabled and _redis_client:
        try:
            val = _redis_client.get(key)
            if val is not None:
                _cache_stats["hits"] += 1
                _record_hit()
                return json.loads(val)
        except Exception: pass

    entry = _cache.get(key)
    if entry and entry.get("expires", 0) > time.time():
        _cache_stats["hits"] += 1
        _record_hit()
        return entry["value"]
    elif entry:
        del _cache[key]
        _cache_stats["deletes"] += 1
    _cache_stats["misses"] += 1
    _record_miss()
    return None

def set(key: str, value: Any, ttl: int = 0) -> None:
    global _cache_stats
    if ttl == 0: ttl = _get_ttl(key, str(value)[:100])
    if _redis_enabled and _redis_client:
        try: _redis_client.setex(key, ttl, json.dumps(value, ensure_ascii=False))
        except Exception: pass
    _cache[key] = {"value": value, "expires": time.time() + ttl}
    _cache_stats["sets"] += 1
    if time.time() - _cache_stats["last_cleanup"] > 600:
        _cleanup_expired()

def delete(key: str) -> bool:
    global _cache_stats
    if _redis_enabled and _redis_client:
        try: _redis_client.delete(key)
        except Exception: pass
    if key in _cache:
        del _cache[key]
        _cache_stats["deletes"] += 1
        return True
    return False

def _cleanup_expired() -> int:
    global _cache_stats
    now = time.time()
    expired = [k for k, v in _cache.items() if v.get("expires", 0) <= now]
    for key in expired: del _cache[key]
    _cache_stats["last_cleanup"] = now
    if expired: logger.info(f"🧹 تنظيف {len(expired)} مفتاح منتهي")
    return len(expired)

def get_semantic_cached(query: str, threshold: float = 0.85) -> Tuple[Optional[str], float]:
    global _cache_stats
    clean_q = _clean_text(query)
    semantic_key = f"semantic:{_semantic_hash(query)}"
    direct = get(semantic_key)
    if direct:
        _cache_stats["semantic_hits"] += 1
        return direct, 1.0

    best_match = None
    best_score = 0.0
    for k, v in list(_cache.items()):
        if not k.startswith("semantic:"): continue
        original_text = str(v.get("value", "")) if isinstance(v.get("value"), str) else ""
        if len(original_text) < 10: continue
        score = _similarity(query, original_text)
        if score > best_score and score >= threshold:
            best_score = score
            best_match = v.get("value")
    if best_match:
        _cache_stats["semantic_hits"] += 1
        return best_match, best_score
    return None, 0.0

def set_semantic_cached(query: str, response: str, ttl: int = 0) -> None:
    if ttl == 0: ttl = _get_ttl("frequent", response[:100])
    set(f"semantic:{_semantic_hash(query)}", response, ttl)
    logger.debug(f"💾 Semantic cache stored (TTL: {ttl}s)")

def _make_response_key(message: str, twin_name: str, lang: str) -> str:
    raw = f"{message.strip().lower()}|{twin_name}|{lang}"
    return f"resp:{hashlib.md5(raw.encode()).hexdigest()}"

def get_cached_response(message: str, twin_name: str, lang: str) -> Optional[str]:
    result, score = get_semantic_cached(message)
    if result and score >= 0.85:
        _cache_stats["api_calls_saved"] += 1
        return result
    return get(_make_response_key(message, twin_name, lang))

def set_cached_response(message: str, twin_name: str, lang: str, reply: str, ttl: int = 300) -> None:
    set(_make_response_key(message, twin_name, lang), reply, ttl)
    set_semantic_cached(message, reply, ttl)

def cache_user_context(user_id: str, context: dict, ttl: int = 600) -> None:
    set(f"context:{user_id}", context, ttl)

def get_user_context(user_id: str) -> Optional[dict]:
    return get(f"context:{user_id}")

def cache_emotional_state(user_id: str, emotional_state: dict) -> None:
    set(f"emotion:{user_id}", emotional_state, ttl=120)

def get_emotional_state(user_id: str) -> Optional[dict]:
    return get(f"emotion:{user_id}")

def cache_ai_response(query: str, response: str, ttl: int = 300) -> None:
    set(f"ai_response:{hashlib.md5(query.encode()).hexdigest()}", response, ttl)
    set_semantic_cached(query, response, ttl)

def get_ai_response(query: str) -> Optional[str]:
    result, score = get_semantic_cached(query)
    if result and score >= 0.85:
        _cache_stats["api_calls_saved"] += 1
        return result
    return get(f"ai_response:{hashlib.md5(query.encode()).hexdigest()}")

def get_stats() -> Dict:
    total = _cache_stats["hits"] + _cache_stats["misses"]
    hit_rate = (_cache_stats["hits"] / total * 100) if total > 0 else 0
    return {
        "total_entries": len(_cache),
        "hits": _cache_stats["hits"],
        "misses": _cache_stats["misses"],
        "hit_rate": round(hit_rate, 2),
        "semantic_hits": _cache_stats["semantic_hits"],
        "api_calls_saved": _cache_stats["api_calls_saved"],
        "redis_enabled": _redis_enabled,
    }

def _record_hit():
    try:
        from app.infrastructure.ai.cost_tracker import cost_tracker
        cost_tracker.record_cache_hit()
    except Exception: pass

def _record_miss():
    try:
        from app.infrastructure.ai.cost_tracker import cost_tracker
        cost_tracker.record_cache_miss()
    except Exception: pass

logger.info(f"✅ Smart Semantic Cache v6.0 | Redis: {'متصل' if _redis_enabled else 'محلي'} | TTL: متدرج | Cost Tracker: مدمج")
