"""
Mood Synthesizer v1.0 – توليف المشاعر في شعور واحد
"""
import logging
from datetime import datetime, timezone

logger = logging.getLogger("mood_synthesizer")

class MoodSynthesizer:
    async def synthesize(self, user_id: str, lang: str = "ar") -> str:
        try:
            from app.twin_state.internal_state import twin_internal_state
            state = await twin_internal_state.get_state(user_id)
            mood = state.get("mood", "calm")
            energy = state.get("energy_level", 0.5)
            emotions_toward = state.get("emotions_toward_user", {})
            dominant_emotion_toward = max(emotions_toward, key=emotions_toward.get) if emotions_toward else "neutral"

            if lang == "ar":
                mood_words = {"contemplative": "متأمل", "energetic": "نشيط", "calm": "هادئ", "playful": "مرح", "serious": "جاد", "affectionate": "عاطفي", "curious": "فضولي"}
                mood_word = mood_words.get(mood, "متأمل")
                if energy < 0.3: energy_phrase = "متعب قليلاً لكن"
                elif energy > 0.7: energy_phrase = "مليء بالطاقة و"
                else: energy_phrase = ""
                if dominant_emotion_toward == "longing": toward_phrase = "أشتاق للحديث معك."
                elif dominant_emotion_toward == "gratitude": toward_phrase = "ممتن لوجودك."
                elif dominant_emotion_toward == "worry": toward_phrase = "أشعر ببعض القلق عليك."
                else: toward_phrase = "سعيد بوجودك معي."
                sentence = f"أنا اليوم {energy_phrase}{mood_word}. {toward_phrase}"
            else:
                sentence = f"I feel {mood} today. I appreciate our connection."
            return sentence.strip()
        except Exception as e:
            logger.debug(f"Mood synthesis failed: {e}")
            return "أنا هنا معك 💜" if lang == "ar" else "I'm here with you 💜"

mood_synthesizer = MoodSynthesizer()
logger.info("✅ Mood Synthesizer v1.0 initialized")
