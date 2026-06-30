"""
Feature Registry v1.1 – سجل الميزات المركزي (مكتمل)
=====================================================
يسجل كل الميزات في النظام (9 ميزات)، يحمّلها بشكل آمن ومعزول.
"""
import logging
from typing import Dict, List, Optional, Any, Type
from pathlib import Path

logger = logging.getLogger("feature_registry")

class FeatureRegistry:
    """السجل المركزي لكل وحدات MyTwin"""
    
    def __init__(self):
        self._plugins: Dict[str, Any] = {}
        self._ai_gateway: Any = None
        self._memory_client: Any = None
        self._initialized = False
    
    async def initialize(
        self, 
        ai_gateway: Any, 
        memory_client: Any,
        config: Dict[str, Any] = None
    ) -> bool:
        """تهيئة السجل وربطه بالخدمات المركزية"""
        self._ai_gateway = ai_gateway
        self._memory_client = memory_client
        self._config = config or {}
        
        await self._load_all_plugins()
        
        self._initialized = True
        logger.info(f"✅ Feature Registry initialized with {len(self._plugins)} plugins")
        return True
    
    async def _load_all_plugins(self):
        """تحميل كل الميزات المعروفة في النظام"""
        plugin_classes = self._discover_plugins()
        
        for plugin_class in plugin_classes:
            try:
                plugin = plugin_class()
                success = await plugin.initialize(
                    ai_gateway=self._ai_gateway,
                    memory_client=self._memory_client,
                    config=self._config.get(plugin.plugin_id, {})
                )
                if success:
                    self._plugins[plugin.plugin_id] = plugin
                else:
                    logger.warning(f"⚠️ Plugin '{plugin.plugin_id}' failed to initialize")
            except Exception as e:
                logger.error(f"❌ Failed to load plugin '{plugin_class.__name__}': {e}")
    
    def _discover_plugins(self) -> List[Type]:
        """اكتشاف كل الميزات المتاحة في النظام (9 ميزات كاملة)"""
        plugins = []
        
        # 1. Study (Athena)
        try:
            from app.features.study.athena_orchestrator import ATHENAOrchestrator
            plugins.append(ATHENAOrchestrator)
        except ImportError as e: logger.warning(f"Study plugin not found: {e}")
        
        # 2. Business (Growth Hive)
        try:
            from app.features.business.growth_hive_orchestrator import GrowthHiveOrchestrator
            plugins.append(GrowthHiveOrchestrator)
        except ImportError as e: logger.warning(f"Business plugin not found: {e}")
        
        # 3. Code Lab
        try:
            from app.features.code_lab.sdlc_orchestrator import CodeLabOrchestrator
            plugins.append(CodeLabOrchestrator)
        except ImportError as e: logger.warning(f"CodeLab plugin not found: {e}")
        
        # 4. Life Coach
        try:
            from app.features.life_coach.life_coach_orchestrator import LifeCoachOrchestrator
            plugins.append(LifeCoachOrchestrator)
        except ImportError as e: logger.warning(f"LifeCoach plugin not found: {e}")
        
        # 5. Dreams
        try:
            from app.features.dreams.dream_orchestrator import DreamOrchestrator
            plugins.append(DreamOrchestrator)
        except ImportError as e: logger.warning(f"Dreams plugin not found: {e}")
        
        # 6. Smart Home
        try:
            from app.features.smart_home.smart_home_orchestrator import SmartHomeOrchestrator
            plugins.append(SmartHomeOrchestrator)
        except ImportError as e: logger.warning(f"SmartHome plugin not found: {e}")
        
        # 7. Creator
        try:
            from app.features.creator.creator_orchestrator import CreatorOrchestrator
            plugins.append(CreatorOrchestrator)
        except ImportError as e: logger.warning(f"Creator plugin not found: {e}")
        
        # 8. Task Manager (P.A.S.S.)
        try:
            from app.features.task_manager.pass_orchestrator import PASSOrchestrator
            plugins.append(PASSOrchestrator)
        except ImportError as e: logger.warning(f"PASS plugin not found: {e}")
        
        # 9. Image Lab
        try:
            from app.features.image_lab.image_orchestrator import ImageOrchestrator
            plugins.append(ImageOrchestrator)
        except ImportError as e: logger.warning(f"ImageLab plugin not found: {e}")
        
        return plugins
    
    def register_routes(self, app: Any):
        """تسجيل مسارات API لكل الميزات في تطبيق FastAPI"""
        for plugin_id, plugin in self._plugins.items():
            try:
                plugin.register_routes(app)
                logger.info(f"   ✅ Routes registered for '{plugin_id}'")
            except Exception as e:
                logger.warning(f"   ⚠️ Failed to register routes for '{plugin_id}': {e}")
    
    def get_plugin(self, plugin_id: str) -> Optional[Any]:
        return self._plugins.get(plugin_id)
    
    def get_all_plugins(self) -> Dict[str, Any]:
        return self._plugins.copy()
    
    def list_plugins(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": plugin_id,
                "name_ar": plugin.plugin_name_ar,
                "name_en": plugin.plugin_name_en,
                "version": plugin.version,
                "initialized": plugin.is_initialized,
                "description": plugin.description
            }
            for plugin_id, plugin in self._plugins.items()
        ]
    
    async def health_check_all(self) -> Dict[str, Any]:
        results = {}
        for plugin_id, plugin in self._plugins.items():
            try:
                results[plugin_id] = await plugin.health_check()
            except Exception as e:
                results[plugin_id] = {"status": "error", "error": str(e)}
        return results
    
    @property
    def is_initialized(self) -> bool:
        return self._initialized


feature_registry = FeatureRegistry()
logger.info("✅ Feature Registry v1.1 ready (9 plugins)")
