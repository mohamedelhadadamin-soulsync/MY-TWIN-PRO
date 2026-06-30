import React from 'react';

/**
 * Plugin Client v1.1 – سجل الميزات المركزي للواجهة الأمامية
 * =============================================================
 */
interface PluginInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  route: string;
  icon: string;
  color: string;
  enabled: boolean;
}

const DEFAULT_PLUGINS: PluginInfo[] = [
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
  private loaded: boolean = false;

  async loadFromBackend(): Promise<void> {
    try {
      // استخدام الرابط الصحيح لـ API
      const response = await fetch('https://my-twin-pro-production-b744.up.railway.app/');
      const data = await response.json();
      
      if (data && data.plugins && Array.isArray(data.plugins)) {
        this.plugins.clear();
        data.plugins.forEach((p: any) => {
          this.plugins.set(p.id, {
            id: p.id,
            nameAr: p.name_ar,
            nameEn: p.name_en,
            description: p.description || '',
            route: DEFAULT_PLUGINS.find(d => d.id === p.id)?.route || `/features/${p.id}`,
            icon: p.id,
            color: '#7C3AED',
            enabled: p.initialized,
          });
        });
        this.loaded = true;
        return;
      }
    } catch (e) {
      console.warn('PluginRegistry: Backend unreachable, using defaults');
    }
    this.loadDefaults();
  }

  private loadDefaults(): void {
    DEFAULT_PLUGINS.forEach(p => this.plugins.set(p.id, p));
    this.loaded = true;
  }

  getAll(): PluginInfo[] {
    if (!this.loaded) this.loadDefaults();
    return Array.from(this.plugins.values());
  }

  getEnabled(): PluginInfo[] {
    return this.getAll().filter(p => p.enabled);
  }

  hasFeature(id: string): boolean {
    const plugin = this.plugins.get(id);
    return plugin ? plugin.enabled : false;
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}

export const pluginRegistry = new PluginRegistry();

export function usePluginRegistry() {
  const [plugins, setPlugins] = React.useState<PluginInfo[]>(pluginRegistry.getEnabled());
  
  React.useEffect(() => {
    if (!pluginRegistry.isLoaded()) {
      pluginRegistry.loadFromBackend().then(() => {
        setPlugins(pluginRegistry.getEnabled());
      });
    }
  }, []);

  return {
    plugins,
    allPlugins: pluginRegistry.getAll(),
    hasFeature: (id: string) => pluginRegistry.hasFeature(id),
    isLoaded: pluginRegistry.isLoaded(),
  };
}
