"""
Base Plugin – العقد الموحد لكل وحدات النظام
===============================================
كل ميزة في النظام (دراسة، برمجة، أعمال...) ترث من هذه الفئة.
تضمن: تسجيل موحد، وصول موحد للذكاء الاصطناعي، وصول موحد للذاكرة.
"""
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

class BasePlugin(ABC):
    """الفئة الأساسية التي ترث منها كل ميزة في MyTwin"""
    
    def __init__(self, name: str, version: str = "1.0.0"):
        self.name = name
        self.version = version
        self._initialized = False
        self._ai_gateway = None
        self._memory_client = None
        self._config: Dict[str, Any] = {}
    
    # ================================================================
    # خصائص يجب أن تنفذها كل ميزة
    # ================================================================
    @property
    @abstractmethod
    def plugin_id(self) -> str:
        """معرف فريد للميزة: study, business, code_lab, dreams..."""
        pass
    
    @property
    @abstractmethod
    def plugin_name_ar(self) -> str:
        """اسم الميزة بالعربية"""
        pass
    
    @property
    @abstractmethod
    def plugin_name_en(self) -> str:
        """اسم الميزة بالإنجليزية"""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """وصف قصير لما تفعله الميزة"""
        pass
    
    @property
    def dependencies(self) -> List[str]:
        """قائمة بالميزات الأخرى التي تعتمد عليها هذه الميزة (إن وجدت)"""
        return []
    
    @property
    def required_services(self) -> List[str]:
        """الخدمات المطلوبة: ai_gateway, tcm_memory, database, cache..."""
        return ["ai_gateway", "tcm_memory"]
    
    # ================================================================
    # دورة حياة الميزة
    # ================================================================
    async def initialize(self, ai_gateway: Any, memory_client: Any, config: Dict[str, Any] = None) -> bool:
        """تهيئة الميزة وربطها بالخدمات المركزية"""
        try:
            self._ai_gateway = ai_gateway
            self._memory_client = memory_client
            self._config = config or {}
            
            # تنفيذ أي تهيئة خاصة بالميزة
            await self._on_initialize()
            
            self._initialized = True
            logger.info(f"✅ Plugin '{self.plugin_id}' v{self.version} initialized")
            return True
        except Exception as e:
            logger.error(f"❌ Plugin '{self.plugin_id}' initialization failed: {e}")
            return False
    
    async def _on_initialize(self):
        """دالة فرعية للتجاوز – تنفذ عند تهيئة الميزة"""
        pass
    
    async def shutdown(self) -> bool:
        """إيقاف الميزة بشكل آمن"""
        try:
            await self._on_shutdown()
            self._initialized = False
            logger.info(f"👋 Plugin '{self.plugin_id}' shut down")
            return True
        except Exception as e:
            logger.error(f"Plugin '{self.plugin_id}' shutdown failed: {e}")
            return False
    
    async def _on_shutdown(self):
        """دالة فرعية للتجاوز – تنفذ عند إيقاف الميزة"""
        pass
    
    @property
    def is_initialized(self) -> bool:
        return self._initialized
    
    # ================================================================
    # وصول موحد للذكاء الاصطناعي
    # ================================================================
    @property
    def ai(self):
        """الوصول إلى بوابة الذكاء الاصطناعي الموحدة"""
        if not self._ai_gateway:
            raise RuntimeError(f"Plugin '{self.plugin_id}' not initialized. AI Gateway unavailable.")
        return self._ai_gateway
    
    @property
    def memory(self):
        """الوصول إلى طبقة الذاكرة (TCMA)"""
        if not self._memory_client:
            raise RuntimeError(f"Plugin '{self.plugin_id}' not initialized. Memory unavailable.")
        return self._memory_client
    
    # ================================================================
    # نقاط النهاية (Routes)
    # ================================================================
    def register_routes(self, app: Any) -> bool:
        """تسجيل مسارات API الخاصة بالميزة. يمكن تجاوزها."""
        return True
    
    # ================================================================
    # تشخيص
    # ================================================================
    async def health_check(self) -> Dict[str, Any]:
        """فحص صحة الميزة"""
        return {
            "plugin_id": self.plugin_id,
            "name_ar": self.plugin_name_ar,
            "name_en": self.plugin_name_en,
            "version": self.version,
            "initialized": self._initialized,
            "status": "healthy" if self._initialized else "not_initialized"
        }
    
    def __repr__(self) -> str:
        return f"<Plugin: {self.plugin_id} v{self.version}>"
