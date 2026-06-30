"""اختبارات المحركات الأساسية – TCMA + الوعي"""
import pytest, asyncio

@pytest.mark.asyncio
async def test_mood_synthesizer():
    from app.twin_state.mood_synthesizer import mood_synthesizer
    result = await mood_synthesizer.synthesize("test_user", "ar")
    assert isinstance(result, str)
    assert len(result) > 10

@pytest.mark.asyncio
async def test_consciousness_engine():
    from app.twin_state.consciousness_engine import consciousness_engine
    thought = await consciousness_engine.current_thought("test_user")
    assert isinstance(thought, str)
    assert len(thought) > 5

@pytest.mark.asyncio
async def test_decision_engine():
    from app.twin_state.decision_engine import decision_engine
    result = await decision_engine.make_decision("test_user")
    assert "decision" in result
    assert "confidence" in result

@pytest.mark.asyncio
async def test_curiosity_engine():
    from app.twin_state.curiosity_engine import curiosity_engine
    q = await curiosity_engine.generate_question("test_user")
    # قد ترجع None إذا لم توجد بيانات كافية
    if q:
        assert isinstance(q, str)

@pytest.mark.asyncio
async def test_prediction_engine():
    from app.twin_state.prediction_engine import prediction_engine
    pred = await prediction_engine.predict_tomorrow("test_user")
    assert "predicted_mood" in pred
    assert "recommendation" in pred

@pytest.mark.asyncio
async def test_belief_system():
    from app.twin_state.belief_system import belief_system
    beliefs = await belief_system.get_beliefs("test_user")
    assert isinstance(beliefs, list)

@pytest.mark.asyncio
async def test_agentic_loop():
    from app.twin_state.agentic_loop import agentic_loop
    action = await agentic_loop.run("test_user")
    # قد ترجع None
    if action:
        assert "message" in action
