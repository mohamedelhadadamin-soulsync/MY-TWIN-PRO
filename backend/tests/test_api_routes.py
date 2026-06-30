"""اختبارات API الأساسية - محدثة لـ v18.0.0"""
import pytest
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"
    assert response.json()["twin_os_kernel"] == True

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["api"] == "healthy"

def test_chat_missing_fields():
    response = client.post("/api/chat", json={})
    assert response.status_code == 422

def test_chat_valid():
    response = client.post("/api/chat", json={
        "message": "مرحباً", "lang": "ar", "user_id": "test_user"
    })
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 0

def test_avatar_get():
    response = client.get("/api/avatar/get?user_id=test&gender=female")
    assert response.status_code == 200

def test_consciousness_status():
    response = client.get("/api/consciousness/status?user_id=test")
    assert response.status_code == 200
    assert "unified_feeling" in response.json()

def test_projects_list():
    response = client.get("/api/projects?user_id=test")
    assert response.status_code == 200
    assert "projects" in response.json()

def test_study_start():
    response = client.post("/api/study/start", json={
        "user_id": "test", "concept": "gravity", "language": "ar"
    })
    assert response.status_code == 200

def test_pass_dashboard():
    response = client.get("/api/pass/dashboard?user_id=test")
    assert response.status_code == 200

def test_smart_home_status():
    response = client.get("/api/smart-home/status?user_id=test")
    assert response.status_code == 200

def test_ads_status():
    response = client.get("/api/ads/status")
    assert response.status_code == 200
