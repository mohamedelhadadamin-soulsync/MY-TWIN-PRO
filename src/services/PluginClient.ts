import { capabilityGate } from './CapabilityGate';

export interface PluginInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  route: string;
  icon: string;
  color: string;
  enabled: boolean;
}

const ALL_PLUGINS: PluginInfo[] = [
  { id: 'study', nameAr: 'المذاكرة الذكية', nameEn: 'Smart Study', description: '', route: '/features/study-mode', icon: 'study', color: '#3B82F6', enabled: true },
  { id: 'code_lab', nameAr: 'مختبر البرمجة', nameEn: 'Code Lab', description: '', route: '/features/code-lab', icon: 'code_lab', color: '#10B981', enabled: true },
  { id: 'business', nameAr: 'تحليل الأعمال', nameEn: 'Business Analyzer', description: '', route: '/features/business-analyzer', icon: 'business', color: '#F59E0B', enabled: true },
  { id: 'life_coach', nameAr: 'مدرب الحياة', nameEn: 'Life Coach', description: '', route: '/features/life-coach', icon: 'life_coach', color: '#EC4899', enabled: true },
  { id: 'dreams', nameAr: 'تفسير الأحلام', nameEn: 'Dream Journal', description: '', route: '/features/dreams', icon: 'dreams', color: '#6366F1', enabled: true },
  { id: 'creator', nameAr: 'كتابة المحتوى', nameEn: 'Content Creator', description: '', route: '/features/content-creator', icon: 'creator', color: '#D946EF', enabled: true },
  { id: 'smart_home', nameAr: 'المنزل الذكي', nameEn: 'Smart Home', description: '', route: '/features/smart-home', icon: 'smart_home', color: '#06B6D4', enabled: true },
  { id: 'pass', nameAr: 'المساعد الشخصي', nameEn: 'P.A.S.S.', description: '', route: '/features/task-manager', icon: 'pass', color: '#F97316', enabled: true },
  { id: 'image_lab', nameAr: 'إنشاء الصور', nameEn: 'Image Creator', description: '', route: '/features/image-creator', icon: 'image_lab', color: '#8B5CF6', enabled: true },
];

class PluginRegistry {
  private plugins: Map<string, PluginInfo> = new Map();

  constructor() {
    this.loadPlugins();
  }

  private loadPlugins(): void {
    ALL_PLUGINS.forEach(p => {
      // تحديث حالة التفعيل بناءً على CapabilityGate
      const enabled = capabilityGate.isCapabilityAvailable(p.id);
      this.plugins.set(p.id, { ...p, enabled });
    });
  }

  getAll(): PluginInfo[] {
    return Array.from(this.plugins.values());
  }

  getEnabled(): PluginInfo[] {
    return this.getAll().filter(p => p.enabled);
  }

  hasFeature(id: string): boolean {
    return this.getEnabled().some(p => p.id === id);
  }

  refresh(): void {
    this.loadPlugins();
  }
}

export const pluginRegistry = new PluginRegistry();
