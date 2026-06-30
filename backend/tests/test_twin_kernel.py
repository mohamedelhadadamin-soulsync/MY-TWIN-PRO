"""Unit Tests for Twin OS Kernel v2.0"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.twin_state.twin_kernel import TwinKernel

@pytest.mark.asyncio
async def test_kernel_initialize():
    kernel = TwinKernel()
    await kernel.initialize()
    assert kernel._initialized == True

@pytest.mark.asyncio
async def test_process_interaction_returns_result():
    kernel = TwinKernel()
    await kernel.initialize()
    with patch('app.twin_state.internal_state.twin_internal_state.update_mood', new_callable=AsyncMock):
        with patch('app.twin_state.relationship_economy.relationship_economy.process_interaction', new_callable=AsyncMock):
            with patch('app.twin_state.dynamic_personality.dynamic_personality.evolve', new_callable=AsyncMock):
                with patch('app.twin_state.emotion_bus.emotion_bus.broadcast', new_callable=AsyncMock):
                    with patch('app.twin_state.working_memory.working_memory.add_interaction', new_callable=AsyncMock):
                        result = await kernel.process_interaction("test_user", "hello", "hi", "joy")
                        assert "kernel_version" in result
                        assert len(result["engines_triggered"]) >= 4

@pytest.mark.asyncio
async def test_kernel_counts_interactions():
    kernel = TwinKernel()
    await kernel.initialize()
    with patch('app.twin_state.internal_state.twin_internal_state.update_mood', new_callable=AsyncMock), \
         patch('app.twin_state.relationship_economy.relationship_economy.process_interaction', new_callable=AsyncMock), \
         patch('app.twin_state.dynamic_personality.dynamic_personality.evolve', new_callable=AsyncMock), \
         patch('app.twin_state.emotion_bus.emotion_bus.broadcast', new_callable=AsyncMock), \
         patch('app.twin_state.working_memory.working_memory.add_interaction', new_callable=AsyncMock):
        await kernel.process_interaction("u1", "msg", "reply", "neutral")
        await kernel.process_interaction("u1", "msg", "reply", "neutral")
        assert kernel._interaction_count == 2
