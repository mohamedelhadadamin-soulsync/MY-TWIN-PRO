"""
BUSINESS ADVISOR v1.1 – مستشار الأعمال الدائم (100%)
========================================================
- متابعة المشاريع النشطة مع KPIs حقيقية
- اقتراح تحسينات دورية
- تحذيرات استباقية بناءً على بيانات مالية حقيقية
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class BusinessAdvisor:
    def __init__(self):
        self.ai_route = None
        self.memory_client = None

    async def get_weekly_advice(self, user_id: str, project_name: str = None, language: str = "ar") -> Dict[str, Any]:
        projects = []
        if project_name:
            proj = await self._get_project(user_id, project_name)
            if proj: projects = [proj]
        else:
            projects = await self._get_all_projects(user_id)

        if not projects:
            return {"message": "لا توجد مشاريع نشطة", "suggestions": []}

        active_project = projects[0]
        advice = await self._generate_advice(active_project, language)
        kpis = await self._check_kpis(active_project)
        alerts = self._generate_alerts(kpis)

        return {
            "project": active_project.get("name", ""),
            "advice": advice,
            "kpi_alerts": alerts,
            "next_steps": await self._suggest_next_steps(active_project, language),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

    async def _get_project(self, user_id: str, project_name: str) -> Optional[Dict]:
        if self.memory_client:
            try:
                return await self.memory_client.get_entity("business_project", f"{user_id}_{project_name}")
            except: pass
        return None

    async def _get_all_projects(self, user_id: str) -> List[Dict]:
        if self.memory_client:
            try:
                return await self.memory_client.get_entity_list("business_project", user_id) or []
            except: pass
        return []

    async def _generate_advice(self, project: Dict, language: str) -> str:
        if not self.ai_route:
            return "استمر في تطوير مشروعك وراقب مؤشرات الأداء."
        prompt = f"""قدم نصيحة أسبوعية لمشروع: {project.get('name', '')}. البيانات: {project.get('data', {})}. كن موجزاً (3 جمل). اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            return text.strip() if text else "استمر في تطوير مشروعك."
        except:
            return "استمر في تطوير مشروعك."

    async def _check_kpis(self, project: Dict) -> Dict[str, Any]:
        """فحص KPIs حقيقية من بيانات المشروع المخزنة"""
        data = project.get("data", {})
        financials = data.get("financials", data.get("financial_analysis", {}))
        revenue = financials.get("revenue", {}).get("monthly", 0)
        roi = financials.get("profitability", {}).get("roi_percent", 0)
        cac = financials.get("unit_economics", {}).get("cac", 0)
        ltv_cac = financials.get("unit_economics", {}).get("ltv_cac_ratio", 0)
        runway = financials.get("cash_flow", {}).get("runway_months", 0)
        return {"revenue": revenue, "roi": roi, "cac": cac, "ltv_cac": ltv_cac, "runway": runway}

    def _generate_alerts(self, kpis: Dict) -> List[Dict]:
        alerts = []
        if kpis.get("revenue", 0) < 1000:
            alerts.append({"type": "warning", "message": "الإيرادات الشهرية منخفضة (أقل من 1000)"})
        if kpis.get("roi", 0) < 10:
            alerts.append({"type": "danger", "message": "ROI منخفض جداً (< 10%)"})
        if kpis.get("cac", 0) > 100:
            alerts.append({"type": "warning", "message": "تكلفة اكتساب العميل مرتفعة"})
        if kpis.get("ltv_cac", 0) < 3:
            alerts.append({"type": "danger", "message": "نسبة LTV/CAC أقل من 3، النموذج غير مستدام"})
        if kpis.get("runway", 0) < 6:
            alerts.append({"type": "warning", "message": "المدرج النقدي أقل من 6 أشهر"})
        return alerts

    async def _suggest_next_steps(self, project: Dict, language: str) -> List[str]:
        if not self.ai_route:
            return ["راجع خطة التسويق", "حلل المنافسين"]
        prompt = f"""اقترح 3 خطوات تالية لمشروع: {project.get('name', '')}. البيانات: {project.get('data', {})}. اللغة: {language}."""
        try:
            text, _ = await self.ai_route(prompt, task="business")
            return [line.strip("- ") for line in text.split("\n") if line.strip().startswith("-")][:3]
        except:
            return []

business_advisor = BusinessAdvisor()
