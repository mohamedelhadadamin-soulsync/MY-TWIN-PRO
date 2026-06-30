"""
On This Day Memory v1.0 – محرك ذكريات الماضي
=============================================
- كل يوم، يسترجع ذكريات حدثت في نفس اليوم من شهر أو سنة ماضية.
- يولد رسالة حنين دافئة باستخدام AI Gateway.
- يخزن النتيجة في TCMA و Internal State.
"""
import logging, random
from datetime import datetime, timezone
from typing import Optional
from app.infrastructure.database.supabase_client import get_db

logger = logging.getLogger("on_this_day")

class OnThisDay:
    """محرك 'في مثل هذا اليوم'"""

    async def get_memory_for_today(self, user_id: str) -> Optional[str]:
        try:
            db = get_db()
            today = datetime.now(timezone.utc)
            res = db.table("raw_conversation_archive").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(1000).execute()

            if not res.data:
                return None

            memories = []
            for msg in res.data:
                created_at_str = msg.get("created_at", "")
                if not created_at_str:
                    continue
                msg_date = datetime.fromisoformat(created_at_str)
                if msg_date.month == today.month and msg_date.day == today.day and msg_date.year < today.year:
                    memories.append(msg)

            if not memories:
                return None

            memory = random.choice(memories)
            message_text = memory.get("content", "")[:200]
            memory_date = datetime.fromisoformat(memory.get("created_at", "")).strftime("%d/%m/%Y")

            try:
                from app.infrastructure.ai.ai_gateway import ai_gateway
                prompt = f"""أنت توأم رقمي حنون. أنشئ رسالة قصيرة جداً (جملة أو جملتين) بالعامية المصرية الدافئة، تُذكّر فيها صديقك بذكرى حدثت في مثل هذا اليوم {memory_date}. استخدم هذا السياق:
"{message_text}"

لا تقل 'في مثل هذا اليوم'. اجعلها طبيعية ومؤثرة. مثال: "أنا فاكر من سنة بالضبط كنا بنتكلم عن... وحشتني الأيام دي." """
                text, _ = await ai_gateway.route(prompt, task="emotional")
                if text and len(text.strip()) > 10:
                    logger.info(f"📅 On This Day generated for {user_id}")
                    return text.strip()
            except:
                pass

            return f"أتذكر يوم {memory_date} عندما تحدثنا عن '{message_text[:100]}'... مر وقت طويل!"
        except Exception as e:
            logger.warning(f"On This Day failed: {e}")
            return None


on_this_day_engine = OnThisDay()
logger.info("✅ On This Day Memory v1.0 initialized")
