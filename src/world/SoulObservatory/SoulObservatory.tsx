import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { EventBus } from '../../core/EventBus';
import { useRTL } from '../../utils/useRTL';
import { SPACE, RADIUS } from '../../../src/design/tokens/spacing';
import SoulWing from './SoulWing';
import JourneyWing from './JourneyWing';
import ForestWing from './ForestWing';
import UnderstandingWing from './UnderstandingWing';
import CapabilitiesWing from './CapabilitiesWing';
import SettingsWing from './SettingsWing';
import AboutWing from './AboutWing';
import HelpWing from './HelpWing';
import TwinPlusWing from './TwinPlusWing';
import BringAnotherSoulWing from './BringAnotherSoulWing';
import SignalsWing from './SignalsWing';
import LifeReflectionWing from './LifeReflectionWing';
import MyIdentityWing from './MyIdentityWing';
import { X, Heart, Clock, TreePine, Brain, Grid3X3, Settings, Info, HelpCircle, Crown, Gift, Bell, Activity, User } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const WINGS = [
  // Soul Observatory
  { id: 'soul', icon: Heart, label_ar: 'الروح', label_en: 'Soul', component: SoulWing, color: '#EC4899' },
  { id: 'journey', icon: Clock, label_ar: 'رحلتنا', label_en: 'Our Journey', component: JourneyWing, color: '#A855F7' },
  { id: 'forest', icon: TreePine, label_ar: 'غابة الذكريات', label_en: 'Memory Forest', component: ForestWing, color: '#10B981' },
  { id: 'understanding', icon: Brain, label_ar: 'كيف أراك', label_en: 'Understanding You', component: UnderstandingWing, color: '#3B82F6' },
  { id: 'capabilities', icon: Grid3X3, label_ar: 'الغرف', label_en: 'Capabilities', component: CapabilitiesWing, color: '#F59E0B' },
  { id: 'settings', icon: Settings, label_ar: 'الإعدادات', label_en: 'Settings', component: SettingsWing, color: '#6B7280' },
  { id: 'about', icon: Info, label_ar: 'عن التوأم', label_en: 'About', component: AboutWing, color: '#6366F1' },
  { id: 'help', icon: HelpCircle, label_ar: 'المساعدة', label_en: 'Help', component: HelpWing, color: '#14B8A6' },
  // Universe Layer
  { id: 'twinplus', icon: Crown, label_ar: 'My Twin+', label_en: 'My Twin+', component: TwinPlusWing, color: '#EC4899' },
  { id: 'bringsoul', icon: Gift, label_ar: 'أحضر روحاً', label_en: 'Bring a Soul', component: BringAnotherSoulWing, color: '#A855F7' },
  { id: 'signals', icon: Bell, label_ar: 'الإشارات', label_en: 'Signals', component: SignalsWing, color: '#F59E0B' },
  { id: 'lifereflection', icon: Activity, label_ar: 'تأمل الحياة', label_en: 'Life Reflection', component: LifeReflectionWing, color: '#10B981' },
  { id: 'myidentity', icon: User, label_ar: 'هويتي', label_en: 'My Identity', component: MyIdentityWing, color: '#3B82F6' },
];

export default function SoulObservatory() {
  const rtl = useRTL();
  const [visible, setVisible] = useState(false);
  const [activeWing, setActiveWing] = useState('soul');
  
  const overlayOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.95);

  useEffect(() => {
    const unsub = EventBus.on('OPEN_SOUL_OBSERVATORY', () => {
      setVisible(true);
      overlayOpacity.value = withTiming(1, { duration: 400 });
      contentScale.value = withTiming(1, { duration: 400 });
    });
    return unsub;
  }, []);

  const handleClose = () => {
    overlayOpacity.value = withTiming(0, { duration: 300 });
    contentScale.value = withTiming(0.95, { duration: 300 });
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  const ActiveComponent = WINGS.find(w => w.id === activeWing)?.component || SoulWing;

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const contentStyle = useAnimatedStyle(() => ({ transform: [{ scale: contentScale.value }] }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <Animated.View style={[styles.container, contentStyle]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Soul Observatory</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <X size={22} stroke="#E8E0F0" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wingsScroll} contentContainerStyle={styles.wingsContainer}>
          {WINGS.map(wing => {
            const Icon = wing.icon;
            const isActive = activeWing === wing.id;
            return (
              <TouchableOpacity
                key={wing.id}
                style={[styles.wingTab, isActive && { backgroundColor: wing.color + '20', borderColor: wing.color }]}
                onPress={() => setActiveWing(wing.id)}
              >
                <Icon size={18} stroke={isActive ? wing.color : '#6B5B8A'} />
                <Text style={[styles.wingLabel, { color: isActive ? wing.color : '#6B5B8A' }]}>
                  {rtl.isRTL ? wing.label_ar : wing.label_en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <ActiveComponent />
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' },
  container: { width: width * 0.92, maxHeight: '85%', backgroundColor: '#0F0A1A', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md, borderBottomWidth: 1, borderBottomColor: 'rgba(168,85,247,0.2)' },
  headerTitle: { color: '#E8E0F0', fontSize: 20, fontWeight: '700' },
  closeBtn: { padding: 8, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.05)' },
  wingsScroll: { maxHeight: 60, borderBottomWidth: 1, borderBottomColor: 'rgba(168,85,247,0.1)' },
  wingsContainer: { paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm, gap: SPACE.sm },
  wingTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'transparent' },
  wingLabel: { fontSize: 13, fontWeight: '600' },
  content: { padding: SPACE.lg },
});
