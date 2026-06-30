"""اختبارات الميزات – 4 ميزات رئيسية"""
import pytest, asyncio

@pytest.mark.asyncio
async def test_study_session():
    from app.features.study.athena_orchestrator import athena
    result = await athena.start_study_session("test_user", "الذكاء الاصطناعي", "teen", "ar")
    assert "explanation" in result

@pytest.mark.asyncio
async def test_dream_interpret():
    from app.features.dreams.dream_orchestrator import dream_orchestrator
    result = await dream_orchestrator.interpret("test_user", "حلمت أنني أطير", "ar")
    assert result is not None

@pytest.mark.asyncio
async def test_life_coach_session():
    from app.features.life_coach.life_coach_orchestrator import life_coach
    result = await life_coach.start_session("test_user", "أشعر بالقلق", "ar")
    assert result is not None

@pytest.mark.asyncio
async def test_smart_home_command():
    from app.features.smart_home.smart_home_orchestrator import smart_home
    result = await smart_home.process_command("test_user", "شغل النور", "ar")
    assert "response" in result
