"""
DREAM PERSONALITY v1.0 – تحليل شخصية الحالم من أحلامه
=========================================================
- بعد 30 حلماً: تقرير Dream DNA كامل
- أكثر الرموز، المشاعر، الأشخاص، الأماكن
- نمط الأحلام، مستوى التوتر، مؤشر السلام الداخلي
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from collections import Counter

logger = logging.getLogger(__name__)

class DreamPersonality:
    def __init__(self):
        self.ai_route = None
        self.memory_client = None

    async def generate_dream_dna(self, user_id: str, lang: str = "ar") -> Dict[str, Any]:
        """توليد تقرير Dream DNA بعد تحليل الأحلام"""
        dreams = await self._get_all_dreams(user_id)
        if len(dreams) < 5:
            return {"ready": False, "message": "يحتاج 5 أحلام على الأقل لتحليل Dream DNA", "dreams_count": len(dreams)}

        all_symbols = self._extract_all_symbols(dreams)
        all_emotions = self._extract_all_emotions(dreams)
        all_people = self._extract_all_people(dreams)
        all_places = self._extract_all_places(dreams)
        patterns = self._detect_patterns(dreams)

        dna = {
            "total_dreams": len(dreams),
            "top_symbols": Counter(all_symbols).most_common(10),
            "top_emotions": Counter(all_emotions).most_common(5),
            "top_people": Counter(all_people).most_common(5),
            "top_places": Counter(all_places).most_common(5),
            "patterns": patterns,
            "stress_index": self._calculate_stress_index(all_emotions),
            "creativity_index": self._calculate_creativity_index(all_symbols),
            "inner_peace_index": self._calculate_peace_index(all_emotions),
            "transformation_index": self._calculate_transformation_index(dreams),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

        if self.memory_client:
            try:
                await self.memory_client.store_entity("dream_dna", user_id, dna)
            except: pass

        return {"ready": True, "dna": dna}

    async def _get_all_dreams(self, user_id: str) -> List[Dict]:
        if self.memory_client:
            try:
                insights = await self.memory_client.get_entity_list("reflection_insights", user_id) or []
                return [i for i in insights if i.get("insight_type") == "dream"]
            except: pass
        return []

    def _extract_all_symbols(self, dreams: List[Dict]) -> List[str]:
        symbols = []
        for d in dreams:
            text = str(d.get("insight_text", "")) + " " + str(d.get("metadata", {}).get("dream_text", ""))
            for symbol in ["ماء", "نار", "بحر", "ثعبان", "طيران", "سقوط", "كلب", "قطة", "طفل", "موت"]:
                if symbol in text:
                    symbols.append(symbol)
        return symbols

    def _extract_all_emotions(self, dreams: List[Dict]) -> List[str]:
        return [d.get("related_emotion", "neutral") for d in dreams if d.get("related_emotion")]

    def _extract_all_people(self, dreams: List[Dict]) -> List[str]:
        people = []
        for d in dreams:
            metadata = d.get("metadata", {})
            mentioned = metadata.get("mentioned_people", [])
            for p in mentioned:
                people.append(p.get("name", ""))
        return people

    def _extract_all_places(self, dreams: List[Dict]) -> List[str]:
        places = []
        for d in dreams:
            text = str(d.get("insight_text", ""))
            for place in ["بيت", "مدرسة", "مسجد", "سوق", "شارع", "غابة", "جبل"]:
                if place in text:
                    places.append(place)
        return places

    def _detect_patterns(self, dreams: List[Dict]) -> List[str]:
        patterns = []
        emotions = self._extract_all_emotions(dreams)
        fear_count = sum(1 for e in emotions if e in ["fear", "anxiety", "خوف", "قلق"])
        joy_count = sum(1 for e in emotions if e in ["joy", "فرح", "سعادة"])
        if fear_count > len(dreams) * 0.4: patterns.append("أحلام القلق متكررة")
        if joy_count > len(dreams) * 0.5: patterns.append("أحلام إيجابية غالباً")
        if len(dreams) > 10: patterns.append("حالم نشط ومنتظم")
        return patterns

    def _calculate_stress_index(self, emotions: List[str]) -> float:
        stress_emotions = ["fear", "anxiety", "خوف", "قلق", "حزن", "غضب"]
        count = sum(1 for e in emotions if e in stress_emotions)
        return round((count / max(len(emotions), 1)) * 100, 1)

    def _calculate_creativity_index(self, symbols: List[str]) -> float:
        return round(min(len(set(symbols)) * 7, 100), 1)

    def _calculate_peace_index(self, emotions: List[str]) -> float:
        peace_emotions = ["joy", "calm", "neutral", "فرح", "سلام", "هدوء"]
        count = sum(1 for e in emotions if e in peace_emotions)
        return round((count / max(len(emotions), 1)) * 100, 1)

    def _calculate_transformation_index(self, dreams: List[Dict]) -> float:
        if len(dreams) < 10: return 30
        transformation_keywords = ["تغير", "تحول", "جديد", "بداية", "نهاية", "نمو"]
        count = 0
        for d in dreams:
            text = str(d.get("insight_text", ""))
            if any(kw in text for kw in transformation_keywords):
                count += 1
        return round((count / len(dreams)) * 100, 1)


dream_personality = DreamPersonality()
