import sys; sys.path.insert(0, '..')

def test_imports():
    try:
        from twin_brain import TwinBrain
        from token_limits import check_tok, BASE_TOK
        from emotional_engine import EmotionalStateTracker
        from cache import get, set
        assert True
    except ImportError as e:
        assert False, f"فشل الاستيراد: {e}"

def test_token_limits():
    from token_limits import BASE_TOK
    assert BASE_TOK.get("free") == 500
    assert BASE_TOK.get("premium") == 4000
    assert BASE_TOK.get("yearly") == 15000

def test_emotional_engine():
    from emotional_engine import EmotionalStateTracker
    tracker = EmotionalStateTracker()
    result = tracker.analyze("أنا سعيد جداً اليوم")
    assert result["primary"] == "joy"
    assert result["intensity"] > 0
