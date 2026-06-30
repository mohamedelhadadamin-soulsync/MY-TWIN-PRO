import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, ScrollView, Animated,
  Dimensions, Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useEnergyStore } from '../../store/useEnergyStore';
import { useTheme } from '../../utils/theme';
import { router } from 'expo-router';
import { apiPost } from '../../lib/httpClient';
import {
  ArrowLeft, Sparkles, ImageIcon, Download, RefreshCw,
  Wand2, Layers, X, Check, Save, MessageSquare, Zap,
  Maximize, Monitor, Smartphone, Square, RectangleVertical,
  Camera, Palette, Cloud, Moon, Sun, Flower, Building,
  Heart, Copy,
} from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as ClipboardModule from 'expo-clipboard';

const { width: SCREEN_W } = Dimensions.get('window');

// ── الأنماط ──────────────────────────────────────────
const STYLES = [
  { id: 'realistic', label_ar: 'واقعي', label_en: 'Realistic', icon: Camera, color: '#10B981' },
  { id: 'anime', label_ar: 'أنمي', label_en: 'Anime', icon: Heart, color: '#EC4899' },
  { id: 'digital_art', label_ar: 'فن رقمي', label_en: 'Digital Art', icon: Monitor, color: '#3B82F6' },
  { id: 'oil_painting', label_ar: 'لوحة زيتية', label_en: 'Oil Painting', icon: Palette, color: '#F59E0B' },
  { id: '3d_render', label_ar: 'ثلاثي الأبعاد', label_en: '3D Render', icon: Maximize, color: '#8B5CF6' },
  { id: 'fantasy', label_ar: 'فانتازيا', label_en: 'Fantasy', icon: Cloud, color: '#6366F1' },
  { id: 'cyberpunk', label_ar: 'سايبربانك', label_en: 'Cyberpunk', icon: Zap, color: '#06B6D4' },
  { id: 'noir', label_ar: 'نوار', label_en: 'Noir', icon: Moon, color: '#6B7280' },
  { id: 'watercolor', label_ar: 'ألوان مائية', label_en: 'Watercolor', icon: Flower, color: '#14B8A6' },
  { id: 'pixel_art', label_ar: 'بكسل آرت', label_en: 'Pixel Art', icon: Layers, color: '#EF4444' },
  { id: 'architecture', label_ar: 'معماري', label_en: 'Architecture', icon: Building, color: '#78716C' },
  { id: 'portrait', label_ar: 'بورتريه', label_en: 'Portrait', icon: Camera, color: '#D946EF' },
];

// ── الأحجام ──────────────────────────────────────────
const SIZES = [
  { id: '1024x1024', label: '1:1 مربع', icon: Square, w: 1024, h: 1024 },
  { id: '768x1024', label: '3:4 عمودي', icon: Smartphone, w: 768, h: 1024 },
  { id: '1024x768', label: '4:3 أفقي', icon: Monitor, w: 1024, h: 768 },
  { id: '1280x720', label: '16:9 عريض', icon: RectangleVertical, w: 1280, h: 720 },
];

// ── النصوص ───────────────────────────────────────────
const T = {
  ar: {
    title: 'مختبر الصور',
    subtitle: 'ماذا تريد أن ترسم؟',
    prompt: 'وصف الصورة',
    placeholder: 'اكتب وصفاً تفصيلياً للصورة...\nمثال: غروب شمس على شاطئ استوائي، نخيل، أمواج هادئة',
    style: 'النمط الفني',
    size: 'الحجم',
    enhance: '🪄 حسّن الوصف',
    generate: '⚡ توليد الصورة',
    result: 'النتيجة',
    save: 'حفظ في المعرض',
    copy: 'نسخ الرابط',
    copied: 'تم النسخ!',
    saved: 'تم الحفظ تلقائياً ✓',
    discuss: '💬 ناقش الصورة',
    retry: 'إعادة',
    loading: 'جاري رسم الصورة...',
    enhancing: 'جاري تحسين الوصف...',
    error: 'فشل توليد الصورة - حاول مجدداً',
  },
  en: {
    title: 'Image Lab',
    subtitle: 'What do you want to create?',
    prompt: 'Image Description',
    placeholder: 'Write a detailed description...\nExample: Sunset on a tropical beach, palm trees, gentle waves',
    style: 'Art Style',
    size: 'Size',
    enhance: '🪄 Enhance Prompt',
    generate: '⚡ Generate Image',
    result: 'Result',
    save: 'Save to Gallery',
    copy: 'Copy Link',
    copied: 'Copied!',
    saved: 'Saved automatically ✓',
    discuss: '💬 Discuss Image',
    retry: 'Retry',
    loading: 'Creating your image...',
    enhancing: 'Enhancing prompt...',
    error: 'Image generation failed - try again',
  },
};

export default function ImageCreator() {
  const insets = useSafeAreaInsets();
  const { lang, userId } = useTwinStore();
  const addProject = useProjectStore((s) => s.addProject);
  const consumeEnergy = useEnergyStore((s) => s.consumeEnergy);
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;
  const t = T[lang] || T['ar'];

  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#2D2D2D',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#8B5CF6',
    accentLight: '#8B5CF620',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    inputBg: isDark ? '#161122' : '#FDFDF9',
    success: '#10B981',
    warning: '#F59E0B',
  };

  const currentStyle = STYLES.find((s) => s.id === selectedStyle)!;
  const currentSize = SIZES.find((s) => s.id === selectedSize)!;

  // ── تحسين الوصف ─────────────────────────────────
  const handleEnhance = useCallback(async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    try {
      const res = await apiPost('/api/image-lab/enhance-prompt', {
        user_id: userId,
        prompt: prompt.trim(),
        style: selectedStyle,
      });
      if (res?.enhanced) {
        setPrompt(res.enhanced);
      }
    } catch (e) {
      // فشل التحسين - نستمر بالوصف الحالي
    } finally {
      setEnhancing(false);
    }
  }, [prompt, selectedStyle, userId]);

  // ── توليد الصورة ────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    // استهلاك الطاقة
    if (!consumeEnergy(1)) return;

    setLoading(true);
    setCurrentImage(null);
    try {
      const result = await apiPost('/api/image-lab/generate', {
        user_id: userId,
        prompt: prompt.trim(),
        style: selectedStyle,
        size: selectedSize,
      });

      if (result?.image_url) {
        setCurrentImage(result.image_url);

        // حفظ تلقائي في مشاريع الوعي
        addProject({
          type: 'image_lab',
          title: prompt.trim().substring(0, 50) + (prompt.trim().length > 50 ? '...' : ''),
          preview: `[صورة] ${prompt.trim().substring(0, 100)}`,
          data: {
            prompt: prompt.trim(),
            style: selectedStyle,
            size: selectedSize,
            image_url: result.image_url,
            provider: result.provider || 'unknown',
          },
          tags: ['image', selectedStyle],
          pinned: false,
        });

        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start();
      }
    } catch (e: any) {
      Alert.alert(isAr ? 'خطأ' : 'Error', t.error);
    } finally {
      setLoading(false);
    }
  }, [prompt, selectedStyle, selectedSize, userId, addProject, consumeEnergy]);

  // ── تحميل الصورة ────────────────────────────────
  const handleDownload = async () => {
    if (!currentImage) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const localUri = FileSystem.cacheDirectory + `mytwin-${Date.now()}.png`;
        await FileSystem.downloadAsync(currentImage, localUri);
        await MediaLibrary.saveToLibraryAsync(localUri);
        Alert.alert('✅', isAr ? 'تم حفظ الصورة في المعرض' : 'Image saved to gallery!');
      }
    } catch {
      Alert.alert(isAr ? 'خطأ' : 'Error', isAr ? 'فشل الحفظ' : 'Save failed');
    }
  };

  // ── نسخ الرابط ──────────────────────────────────
  const handleCopy = async () => {
    if (!currentImage) return;
    await ClipboardModule.setStringAsync(currentImage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── مناقشة الصورة ───────────────────────────────
  const handleDiscuss = () => {
    const project = {
      type: 'image_lab',
      title: prompt.trim().substring(0, 50),
      preview: `[صورة] ${prompt.trim().substring(0, 100)}`,
      data: {
        prompt: prompt.trim(),
        style: selectedStyle,
        size: selectedSize,
        image_url: currentImage,
      },
    };
    useTwinStore.getState().loadProjectContext(project);
    router.push('/chat');
  };

  return (
    <View style={[st.root, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      {/* ── هيدر ─────────────────────────────────── */}
      <View style={[st.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} stroke={colors.text} />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <ImageIcon size={22} stroke={colors.accent} />
          <Text style={[st.headerTitle, { color: colors.text }]}>{t.title}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* ── سؤال توجيهي ────────────────────────── */}
        <Text style={[st.subtitle, { color: colors.text }]}>{t.subtitle}</Text>

        {/* ── بطاقة الإدخال ───────────────────────── */}
        <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[st.iconWrap, { backgroundColor: colors.accentLight }]}>
            <Sparkles size={44} stroke={colors.accent} />
          </View>

          {/* حقل الوصف */}
          <TextInput
            style={[st.promptInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder={t.placeholder}
            placeholderTextColor={colors.subtext}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* زر تحسين الوصف */}
          {prompt.trim().length > 10 && (
            <TouchableOpacity
              style={[st.enhanceBtn, { backgroundColor: colors.accentLight }]}
              onPress={handleEnhance}
              disabled={enhancing}
            >
              {enhancing ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <>
                  <Wand2 size={16} stroke={colors.accent} />
                  <Text style={[st.enhanceBtnText, { color: colors.accent }]}>{t.enhance}</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* اختيار النمط والحجم */}
          <View style={st.optionsRow}>
            {/* النمط */}
            <TouchableOpacity
              style={[st.optionPicker, { borderColor: colors.border, flex: 1 }]}
              onPress={() => setShowStylePicker(true)}
            >
              <currentStyle.icon size={16} stroke={currentStyle.color} />
              <Text style={[st.optionPickerText, { color: colors.text }]} numberOfLines={1}>
                {isAr ? currentStyle.label_ar : currentStyle.label_en}
              </Text>
            </TouchableOpacity>

            {/* الحجم */}
            <TouchableOpacity
              style={[st.optionPicker, { borderColor: colors.border, flex: 1 }]}
              onPress={() => setShowSizePicker(true)}
            >
              <currentSize.icon size={16} stroke={colors.subtext} />
              <Text style={[st.optionPickerText, { color: colors.text }]} numberOfLines={1}>
                {currentSize.label}
              </Text>
            </TouchableOpacity>
          </View>

          {/* زر التوليد */}
          <TouchableOpacity
            style={[
              st.submitBtn,
              { backgroundColor: colors.accent, opacity: prompt.trim() && !loading ? 1 : 0.6 },
            ]}
            onPress={handleGenerate}
            disabled={loading || !prompt.trim()}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Sparkles size={20} stroke="#FFF" />
                <Text style={st.submitBtnText}>{t.generate}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── النتيجة ────────────────────────────── */}
        {currentImage && (
          <Animated.View
            style={[
              st.resultCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* الصورة */}
            <Image
              source={{ uri: currentImage }}
              style={[st.resultImage, { aspectRatio: currentSize.w / currentSize.h }]}
              resizeMode="cover"
            />

            {/* شريط الأدوات */}
            <View style={st.toolbar}>
              <TouchableOpacity onPress={handleDownload} style={st.toolbarBtn}>
                <Download size={18} stroke={colors.accent} />
                <Text style={[st.toolbarBtnText, { color: colors.accent }]}>{t.save}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCopy} style={st.toolbarBtn}>
                {copied ? <Check size={18} stroke={colors.success} /> : <Copy size={18} stroke={colors.subtext} />}
                <Text style={[st.toolbarBtnText, { color: colors.subtext }]}>{copied ? t.copied : t.copy}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleGenerate} style={st.toolbarBtn}>
                <RefreshCw size={18} stroke={colors.subtext} />
              </TouchableOpacity>
            </View>

            {/* زر المناقشة + شارة الحفظ */}
            <View style={st.bottomBar}>
              <TouchableOpacity onPress={handleDiscuss} style={st.discussBtn}>
                <MessageSquare size={16} stroke="#7C3AED" />
                <Text style={st.discussBtnText}>{t.discuss}</Text>
              </TouchableOpacity>
              <View style={st.savedBadge}>
                <Save size={14} stroke={colors.success} />
                <Text style={[st.savedText, { color: colors.success }]}>{t.saved}</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── مودال اختيار النمط ──────────────────── */}
      <Modal visible={showStylePicker} transparent animationType="fade" onRequestClose={() => setShowStylePicker(false)}>
        <TouchableOpacity style={st.modalOverlay} activeOpacity={1} onPress={() => setShowStylePicker(false)}>
          <View style={[st.modalContent, { backgroundColor: colors.card }]}>
            <View style={st.modalHeader}>
              <Text style={[st.modalTitle, { color: colors.text }]}>{t.style}</Text>
              <TouchableOpacity onPress={() => setShowStylePicker(false)}>
                <X size={22} stroke={colors.subtext} />
              </TouchableOpacity>
            </View>
            <View style={st.styleGrid}>
              {STYLES.map((style) => {
                const Icon = style.icon;
                const isSelected = selectedStyle === style.id;
                return (
                  <TouchableOpacity
                    key={style.id}
                    style={[
                      st.styleCard,
                      {
                        borderColor: isSelected ? style.color : colors.border,
                        backgroundColor: isSelected ? style.color + '10' : 'transparent',
                      },
                    ]}
                    onPress={() => { setSelectedStyle(style.id); setShowStylePicker(false); }}
                  >
                    <Icon size={24} stroke={style.color} />
                    <Text style={[st.styleLabel, { color: colors.text }]}>
                      {isAr ? style.label_ar : style.label_en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── مودال اختيار الحجم ──────────────────── */}
      <Modal visible={showSizePicker} transparent animationType="fade" onRequestClose={() => setShowSizePicker(false)}>
        <TouchableOpacity style={st.modalOverlay} activeOpacity={1} onPress={() => setShowSizePicker(false)}>
          <View style={[st.modalContent, { backgroundColor: colors.card }]}>
            <View style={st.modalHeader}>
              <Text style={[st.modalTitle, { color: colors.text }]}>{t.size}</Text>
              <TouchableOpacity onPress={() => setShowSizePicker(false)}>
                <X size={22} stroke={colors.subtext} />
              </TouchableOpacity>
            </View>
            {SIZES.map((size) => {
              const Icon = size.icon;
              const isSelected = selectedSize === size.id;
              return (
                <TouchableOpacity
                  key={size.id}
                  style={[
                    st.sizeOption,
                    {
                      borderColor: isSelected ? colors.accent : 'transparent',
                      backgroundColor: isSelected ? colors.accentLight : 'transparent',
                    },
                  ]}
                  onPress={() => { setSelectedSize(size.id); setShowSizePicker(false); }}
                >
                  <Icon size={20} stroke={colors.text} />
                  <Text style={[st.sizeLabel, { color: colors.text }]}>{size.label}</Text>
                  <Text style={[st.sizeDim, { color: colors.subtext }]}>{size.w}×{size.h}</Text>
                  {isSelected && <Check size={18} stroke={colors.accent} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 60 },
  subtitle: { fontSize: 20, fontWeight: '800', marginBottom: 16, textAlign: 'center' },

  // بطاقة الإدخال
  card: { borderRadius: 24, padding: 20, borderWidth: 1, alignItems: 'center', marginBottom: 20 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  promptInput: {
    width: '100%', borderRadius: 16, padding: 16, fontSize: 15,
    borderWidth: 1, minHeight: 120, marginBottom: 12, textAlignVertical: 'top',
  },
  enhanceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
    alignSelf: 'flex-end', marginBottom: 16,
  },
  enhanceBtnText: { fontSize: 13, fontWeight: '600' },
  optionsRow: { flexDirection: 'row', gap: 10, marginBottom: 16, width: '100%' },
  optionPicker: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 14, padding: 14,
  },
  optionPickerText: { fontSize: 13, fontWeight: '600' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, width: '100%', gap: 8,
  },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 17 },

  // النتيجة
  resultCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  resultImage: { width: '100%', borderRadius: 16 },
  toolbar: {
    flexDirection: 'row', justifyContent: 'center', gap: 16,
    padding: 14, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.1)',
  },
  toolbarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 10 },
  toolbarBtnText: { fontSize: 12, fontWeight: '600' },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.08)',
    backgroundColor: 'rgba(128,128,128,0.03)',
  },
  discussBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#7C3AED15', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 16,
  },
  discussBtnText: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#10B98115', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16,
  },
  savedText: { fontSize: 11, fontWeight: '600' },

  // مودال
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '88%', borderRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },

  // شبكة الأنماط
  styleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  styleCard: {
    width: '30%', padding: 16, borderRadius: 18, borderWidth: 1.5,
    alignItems: 'center', gap: 8,
  },
  styleLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // خيارات الحجم
  sizeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 16, borderWidth: 1.5, marginBottom: 8,
  },
  sizeLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  sizeDim: { fontSize: 12, fontWeight: '500' },
});
