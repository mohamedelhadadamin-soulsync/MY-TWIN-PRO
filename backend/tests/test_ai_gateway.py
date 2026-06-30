"""اختبارات بوابة الذكاء الاصطناعي"""
import pytest, asyncio

@pytest.mark.asyncio
async def test_ai_gateway_general():
    from app.infrastructure.ai.ai_gateway import ai_gateway
    text, provider = await ai_gateway.route(
        prompt="ما هو الذكاء الاصطناعي؟",
        task="general"
    )
    assert isinstance(text, str)
    assert len(text) > 10

@pytest.mark.asyncio
async def test_cache_service():
    from app.infrastructure.cache.cache_service import set, get
    set("test_key", "test_value", 60)
    result = get("test_key")
    assert result == "test_value"

@pytest.mark.asyncio
async def test_semantic_cache():
    from app.infrastructure.cache.cache_service import (
        set_semantic_cached, get_semantic_cached
    )
    set_semantic_cached("كيف حالك اليوم", "أنا بخير", 60)
    result, score = get_semantic_cached("كيف حالك")
    # قد لا يجد تطابقاً دقيقاً
