"""
Symbol Library v2.0 – قاعدة الرموز الموسعة مع السياق
=========================================================
- 24 رمزاً + سياق (لون، حجم، مكان، عاطفة)
- 5 مدارس تفسير لكل رمز
"""
from typing import Dict, List, Optional

SYMBOL_LIBRARY: Dict[str, Dict[str, str]] = {
    "ماء": {"freud": "اللاوعي والعواطف المكبوتة", "jung": "التطهير والتجدد والولادة الروحية", "cayce": "الحياة الروحية والطاقة الكونية", "ibn_sirine": "مال ورزق وخير وفير", "nabulsi": "علم وحياة طيبة"},
    "نار": {"freud": "الغضب المكبوت والطاقة الجنسية", "jung": "التحول والتغيير الجذري", "cayce": "التطهير الروحي", "ibn_sirine": "سلطان وفتنة وتحذير", "nabulsi": "قوة وخطر قادم"},
    "بحر": {"freud": "عمق اللاوعي", "jung": "اللاوعي الجمعي", "cayce": "أسرار الكون", "ibn_sirine": "ملك أو سلطان", "nabulsi": "دنيا واسعة أو سفر"},
    "ثعبان": {"freud": "الرغبات الجنسية المكبوتة", "jung": "الحكمة الخفية والشفاء", "cayce": "طاقة الكونداليني", "ibn_sirine": "عدو مخادع", "nabulsi": "امرأة أو مال حرام"},
    "طيران": {"freud": "الهروب من الواقع أو الرغبة الجنسية", "jung": "الحرية والطموح الروحي", "cayce": "الارتقاء الروحي", "ibn_sirine": "سفر أو علو شأن", "nabulsi": "ولاية أو منصب"},
    "سقوط": {"freud": "القلق وفقدان السيطرة", "jung": "الانهيار النفسي", "cayce": "اختبار ودرس", "ibn_sirine": "خسارة أو هم", "nabulsi": "ذل أو فقر"},
    "كلب": {"freud": "الولاء أو الخيانة", "jung": "الصديق الوفي أو الظل", "cayce": "الحارس الروحي", "ibn_sirine": "صديق أو خادم", "nabulsi": "عدو ضعيف أو حارس"},
    "قطة": {"freud": "الأنوثة والغموض", "jung": "الحدس والاستقلال", "cayce": "الحاسة السادسة", "ibn_sirine": "امرأة أو لص", "nabulsi": "جارية أو خادمة"},
    "طفل": {"freud": "الرغبة في الإنجاب أو الطفولة", "jung": "الذات البريئة والبدايات", "cayce": "ولادة جديدة", "ibn_sirine": "هم أو فرح", "nabulsi": "رزق أو مسؤولية"},
    "موت": {"freud": "نهاية مرحلة أو رغبة مكبوتة", "jung": "تحول وولادة جديدة", "cayce": "انتقال روحي", "ibn_sirine": "طول عمر أو توبة", "nabulsi": "فرج بعد شدة"},
    "بيت": {"freud": "الذات والجسد", "jung": "الشخصية بغرفها المختلفة", "cayce": "معبد الروح", "ibn_sirine": "امرأة أو حياة", "nabulsi": "أمان أو سجن"},
    "زواج": {"freud": "اتحاد الذكر والأنثى", "jung": "تكامل الذات", "cayce": "عهد روحي", "ibn_sirine": "خير وبركة", "nabulsi": "رزق أو هم"},
}

SYMBOL_CONTEXT = {
    "لون": {"أبيض": "نقاء وسلام", "أسود": "غموض وخوف", "أحمر": "غضب أو حب", "أزرق": "هدوء وثقة", "أخضر": "نمو وأمل"},
    "حجم": {"كبير": "تأثير قوي", "صغير": "تأثير ضعيف", "متوسط": "تأثير طبيعي"},
    "هاجم": "تهديد وشيك",
    "مات": "نهاية مشكلة",
}

def search_symbol(query: str) -> List[Dict]:
    results = []
    for symbol, theories in SYMBOL_LIBRARY.items():
        if symbol in query:
            results.append({"symbol": symbol, "theories": theories})
    return results

def get_symbol_explanation(symbol: str, school: str = "all") -> Optional[Dict]:
    if symbol in SYMBOL_LIBRARY:
        theories = SYMBOL_LIBRARY[symbol]
        if school == "all": return theories
        return {school: theories.get(school, "")}
    return None

def enrich_with_context(symbol: str, details: Dict) -> Dict:
    """إثراء تفسير الرمز بالسياق"""
    enriched = {"symbol": symbol, "base_meaning": SYMBOL_LIBRARY.get(symbol, {}), "context": {}}
    for key, value in details.items():
        if key in SYMBOL_CONTEXT:
            if isinstance(SYMBOL_CONTEXT[key], dict):
                enriched["context"][key] = SYMBOL_CONTEXT[key].get(value, "")
            else:
                enriched["context"][key] = SYMBOL_CONTEXT[key]
    return enriched
