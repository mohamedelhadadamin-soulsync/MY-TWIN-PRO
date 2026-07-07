"""
ENERGY SCHEDULER v1.0 – جدولة المهام حسب طاقة المستخدم
==========================================================
- يستخدم Energy Store لتحديد أفضل وقت لكل مهمة
- يقترح تعديل الجدول حسب الطاقة الحالية
"""
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class EnergyScheduler:
    def __init__(self):
        pass

    def schedule(self, tasks: List[Dict], current_energy: int) -> Dict[str, Any]:
        """توزيع المهام حسب الطاقة"""
        high_energy_tasks = []
        low_energy_tasks = []

        for task in tasks:
            if task.get("status") != "pending": continue
            energy_req = task.get("energy_required", 3)
            if energy_req <= current_energy / 30:
                high_energy_tasks.append(task)
            else:
                low_energy_tasks.append(task)

        return {
            "do_now": high_energy_tasks[:3],
            "do_later": low_energy_tasks,
            "current_energy": current_energy,
            "suggestion": self._generate_suggestion(current_energy, high_energy_tasks, low_energy_tasks),
        }

    def _generate_suggestion(self, energy: int, high: List, low: List) -> str:
        if energy > 70: return f"طاقتك عالية! أنجز {len(high)} مهام مهمة الآن."
        if energy > 40: return f"طاقتك متوسطة. أنجز مهمة أو اثنتين وخذ استراحة."
        return f"طاقتك منخفضة. أنجز مهمة بسيطة أو خذ استراحة."


energy_scheduler = EnergyScheduler()
