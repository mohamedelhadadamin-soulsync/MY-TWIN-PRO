"""
MyTwin – External Services v9.0 (محسّن الأخبار والطقس واليوتيوب)
=============================================================
- طقس: Open-Meteo (أساسي مجاني) → OpenWeatherMap (احتياطي بمفتاحين) → AI Gateway (احتياطي نهائي)
- أخبار: Wikipedia (أساسي مجاني) → GNews API (احتياطي بمفتاحين) → AI Gateway (احتياطي نهائي)
- يوتيوب: Invidious (أساسي مجاني) → YouTube API (احتياطي بمفتاحين) → AI Gateway (احتياطي نهائي)
"""
import os, logging, base64, asyncio
from typing import Optional, Dict, Any, List
import httpx

logger = logging.getLogger(__name__)

YOUTUBE_API_KEYS = [k for k in [os.getenv("YOUTUBE_API_KEY", ""), os.getenv("YOUTUBE_API_KEY_2", "")] if k]
NEWS_API_KEYS = [k for k in [os.getenv("GNEWS_API_KEY", ""), os.getenv("GNEWS_API_KEY_2", ""), os.getenv("NEWS_API_KEY", ""), os.getenv("NEWS_API_KEY_2", "")] if k]
OPENWEATHER_API_KEYS = [k for k in [os.getenv("OPENWEATHER_API_KEY", ""), os.getenv("OPENWEATHER_API_KEY_2", "")] if k]

logger.info(f"🔑 Services: YT={len(YOUTUBE_API_KEYS)}, News={len(NEWS_API_KEYS)}, OWM={len(OPENWEATHER_API_KEYS)}")


# ================================================================
# الطقس (Open-Meteo أساسي → OpenWeatherMap احتياطي → AI Gateway)
# ================================================================
async def get_weather(city: str = "Cairo", lang: str = "ar") -> Dict[str, Any]:
    """يجلب الطقس لمدينة معينة. يدعم أسماء المدن العربية والإنجليزية."""

    # تحويل أسماء المدن العربية إلى equivalents إنجليزية
    city_map = {
        "القاهرة": "Cairo", "الإسكندرية": "Alexandria", "الجيزة": "Giza",
        "الرياض": "Riyadh", "جدة": "Jeddah", "دبي": "Dubai",
        "أبوظبي": "Abu Dhabi", "الدوحة": "Doha", "المنامة": "Manama",
        "مسقط": "Muscat", "عمان": "Amman", "بيروت": "Beirut",
        "بغداد": "Baghdad", "دمشق": "Damascus", "الخرطوم": "Khartoum",
        "طرابلس": "Tripoli", "تونس": "Tunis", "الجزائر": "Algiers",
        "الرباط": "Rabat", "الدار البيضاء": "Casablanca",
    }
    search_city = city_map.get(city, city)

    # تحديد الإحداثيات
    lat, lon = None, None
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            geo = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": search_city, "format": "json", "limit": 1},
                headers={"User-Agent": "MyTwin-AI/1.0"}
            )
            if geo.status_code == 200 and geo.json():
                location = geo.json()[0]
                lat, lon = float(location["lat"]), float(location["lon"])
    except Exception:
        pass

    if lat is None or lon is None:
        lat, lon = 30.0444, 31.2357  # القاهرة

    # الطبقة 1: Open-Meteo (مجاني)
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={"latitude": lat, "longitude": lon, "current_weather": True}
            )
            if resp.status_code == 200:
                c = resp.json()["current_weather"]
                return {
                    "city": city, "temperature": c["temperature"],
                    "windspeed": c["windspeed"],
                    "description": _weather_desc(c.get("weathercode", 0), lang),
                    "source": "open-meteo",
                }
    except Exception as e:
        logger.warning(f"Open-Meteo failed: {e}")

    # الطبقة 2: OpenWeatherMap
    for key in OPENWEATHER_API_KEYS:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    params={"q": search_city, "appid": key, "units": "metric", "lang": "ar" if lang == "ar" else "en"}
                )
                if resp.status_code == 200:
                    d = resp.json()
                    return {
                        "city": city, "temperature": d["main"]["temp"],
                        "windspeed": d.get("wind", {}).get("speed", 0),
                        "humidity": d["main"].get("humidity", 0),
                        "description": d["weather"][0]["description"] if d.get("weather") else "",
                        "source": "openweathermap",
                    }
        except Exception:
            continue

    # الطبقة 3: AI Gateway
    try:
        from app.infrastructure.ai.ai_gateway import ai_gateway
        prompt = f"ما هو الطقس الحالي في مدينة {city}؟ أجب بدرجة الحرارة ووصف الحالة فقط."
        text, _ = await ai_gateway.route(prompt, task="general")
        if text:
            return {"city": city, "temperature": "N/A", "description": text.strip(), "source": "ai_gateway"}
    except Exception:
        pass

    return {"error": "تعذر جلب الطقس", "city": city}


def _weather_desc(code: int, lang: str = "ar") -> str:
    codes = {
        0: {"ar": "سماء صافية", "en": "Clear sky"}, 1: {"ar": "غائم جزئياً", "en": "Partly cloudy"},
        2: {"ar": "غائم", "en": "Cloudy"}, 3: {"ar": "غائم كلياً", "en": "Overcast"},
        45: {"ar": "ضباب", "en": "Fog"}, 48: {"ar": "ضباب متجمد", "en": "Freezing fog"},
        51: {"ar": "رذاذ خفيف", "en": "Light drizzle"}, 61: {"ar": "أمطار خفيفة", "en": "Light rain"},
        63: {"ar": "أمطار متوسطة", "en": "Moderate rain"}, 65: {"ar": "أمطار غزيرة", "en": "Heavy rain"},
        71: {"ar": "ثلوج خفيفة", "en": "Light snow"}, 80: {"ar": "زخات مطر", "en": "Rain showers"},
        95: {"ar": "عاصفة رعدية", "en": "Thunderstorm"},
    }
    info = codes.get(code, {"ar": "غير معروف", "en": "Unknown"})
    return info.get(lang, info["ar"])


# ================================================================
# الأخبار (Wikipedia أساسي → GNews API احتياطي → AI Gateway)
# ================================================================
async def get_news(country: str = "us", lang: str = "en") -> Dict[str, Any]:
    """
    جلب الأخبار. الترتيب: Wikipedia → GNews API → AI Gateway.
    """

    # الطبقة 1: Wikipedia (مجاني، أساسي)
    try:
        endpoint = "بوابة:الأحداث_الجارية" if lang == "ar" else "Portal:Current_events"
        wiki_lang = "ar" if lang == "ar" else "en"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"https://{wiki_lang}.wikipedia.org/api/rest_v1/page/summary/{endpoint}")
            if resp.status_code == 200:
                data = resp.json()
                title = data.get("title", "آخر الأحداث" if lang == "ar" else "Current events")
                url = data.get("content_urls", {}).get("desktop", {}).get("page", f"https://{wiki_lang}.wikipedia.org/wiki/{endpoint}")
                return {
                    "articles": [{"title": title, "url": url, "source": "Wikipedia"}],
                    "source": "wikipedia",
                }
    except Exception as e:
        logger.warning(f"Wikipedia news failed: {e}")

    # الطبقة 2: GNews API
    for key in NEWS_API_KEYS:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    "https://gnews.io/api/v4/top-headlines",
                    params={"country": country, "lang": lang, "apikey": key, "max": 5}
                )
                if resp.status_code == 200:
                    articles = resp.json().get("articles", [])
                    if articles:
                        return {
                            "articles": [
                                {"title": a["title"], "url": a["url"], "source": a.get("source", {}).get("name", "")}
                                for a in articles[:5]
                            ],
                            "source": "gnews",
                        }
        except Exception:
            continue

    # محاولة NewsAPI (قديم)
    for key in [os.getenv("NEWS_API_KEY", ""), os.getenv("NEWS_API_KEY_2", "")]:
        if not key: continue
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    "https://newsapi.org/v2/top-headlines",
                    params={"country": country, "apiKey": key, "pageSize": 5}
                )
                if resp.status_code == 200:
                    articles = resp.json().get("articles", [])
                    if articles:
                        return {
                            "articles": [
                                {"title": a["title"], "url": a["url"], "source": a.get("source", {}).get("name", "")}
                                for a in articles[:5]
                            ],
                            "source": "newsapi",
                        }
        except Exception:
            continue

    # الطبقة 3: AI Gateway
    try:
        from app.infrastructure.ai.ai_gateway import ai_gateway
        prompt = f"أعطني آخر 5 عناوين أخبار رئيسية اليوم. اللغة: {'العربية' if lang == 'ar' else 'English'}."
        text, _ = await ai_gateway.route(prompt, task="general")
        if text:
            lines = [l.strip() for l in text.split("\n") if l.strip()][:5]
            return {
                "articles": [{"title": l, "url": "", "source": "AI"} for l in lines],
                "source": "ai_gateway",
            }
    except Exception:
        pass

    return {"articles": [], "source": "none"}


# ================================================================
# يوتيوب (Invidious أساسي → YouTube API احتياطي → AI Gateway)
# ================================================================
async def search_youtube(query: str, max_results: int = 3, lang: str = "ar") -> Optional[str]:
    """
    بحث يوتيوب. الترتيب: Invidious → YouTube API → AI Gateway.
    """

    # الطبقة 1: Invidious (مجاني)
    for instance in ["https://inv.nadeko.net", "https://yewtu.be", "https://invidious.snopyta.org"]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{instance}/api/v1/search",
                    params={"q": query, "type": "video", "sort": "relevance"}
                )
                if resp.status_code == 200 and resp.json():
                    items = resp.json()
                    results = [
                        f"🎬 **{i['title']}**\n   🔗 https://youtube.com/watch?v={i['videoId']}"
                        for i in items[:max_results] if i.get("videoId")
                    ]
                    if results:
                        return "\n\n".join(results)
        except Exception:
            continue

    # الطبقة 2: YouTube Data API
    for key in YOUTUBE_API_KEYS:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    "https://www.googleapis.com/youtube/v3/search",
                    params={"key": key, "q": query, "part": "snippet", "type": "video", "maxResults": max_results}
                )
                if resp.status_code == 200:
                    items = resp.json().get("items", [])
                    if items:
                        return "\n\n".join(
                            f"🎬 **{i['snippet']['title']}**\n   🔗 https://youtube.com/watch?v={i['id']['videoId']}"
                            for i in items[:max_results]
                        )
        except Exception:
            continue

    # الطبقة 3: AI Gateway
    try:
        from app.infrastructure.ai.ai_gateway import ai_gateway
        prompt = f"اقترح {max_results} فيديوهات يوتيوب عن '{query}' مع روابطها."
        text, _ = await ai_gateway.route(prompt, task="general")
        if text:
            return text.strip()
    except Exception:
        pass

    return None


logger.info("✅ External Services v9.0 initialized (Wikipedia→GNews→AI, 3-layer fallback)")
