"""Unit Tests for Emotion Bus v2.0"""
import pytest
from app.twin_state.emotion_bus import EmotionBus

@pytest.mark.asyncio
async def test_broadcast_stores_emotion():
    bus = EmotionBus()
    await bus.broadcast("user1", "joy", {"depth": 0.8})
    assert await bus.get_current_emotion("user1") == "joy"

@pytest.mark.asyncio
async def test_emotion_trend():
    bus = EmotionBus()
    await bus.broadcast("user1", "sadness", {})
    await bus.broadcast("user1", "sadness", {})
    await bus.broadcast("user1", "joy", {})
    trend = await bus.get_emotion_trend("user1", minutes=60)
    assert trend["current"] == "joy"

@pytest.mark.asyncio
async def test_subscriber_called():
    bus = EmotionBus()
    calls = []
    async def handler(uid, emotion, ctx):
        calls.append((uid, emotion))
    bus.subscribe(handler)
    await bus.broadcast("user1", "love", {})
    assert len(calls) == 1
    assert calls[0] == ("user1", "love")
