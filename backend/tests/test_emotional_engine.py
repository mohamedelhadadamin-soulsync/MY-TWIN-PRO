import sys
sys.path.insert(0, '..')
from backend.emotional_engine import EmotionalStateTracker

def test_analyze_joy():
    tracker = EmotionalStateTracker()
    result = tracker.analyze("أنا سعيد جداً اليوم")
    assert result["primary"] == "joy"
    assert result["intensity"] > 0

def test_analyze_sadness():
    tracker = EmotionalStateTracker()
    result = tracker.analyze("أنا حزين جداً")
    assert result["primary"] == "sadness"

def test_analyze_neutral():
    tracker = EmotionalStateTracker()
    result = tracker.analyze("اليوم عادي")
    assert result["primary"] == "neutral"
