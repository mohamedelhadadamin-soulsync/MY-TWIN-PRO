import sys
sys.path.insert(0, '..')
from backend.memory_engine import classify, emb

def test_classify_pref():
    assert classify("أحب القهوة") == "pref"

def test_classify_dream():
    assert classify("حلمي أن أسافر") == "dream"

def test_emb_empty():
    result = emb("")
    assert len(result) == 768
    assert all(v == 0.0 for v in result)
