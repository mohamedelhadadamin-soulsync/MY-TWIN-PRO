import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  Image, Animated, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import { apiPost } from '../lib/httpClient';
import { COUNTRIES, getCountryByCode } from '../lib/countries';
import * as Localization from 'expo-localization';
import {
  Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Globe,
  Phone, MapPin, ChevronDown, X, Check, Sparkles,
} from 'lucide-react-native';

const APP_LOGO = require('../assets/logo.png');

// ============================================================
// NEURON NETWORK – خلايا عصبية ذهبية
// ============================================================
const NeuronNetwork = ({ isDark }: { isDark: boolean }) => {
  const neurons = useRef(
    Array.from({ length: 15 }).map(() => ({
      x: 5 + Math.random() * 90,
      y: 2 + Math.random() * 96,
      pulse: new Animated.Value(0.15 + Math.random() * 0.35),
      size: 2 + Math.random() * 5,
      delay: Math.random() * 2500,
    }))
  ).current;

  useEffect(() => {
    neurons.forEach(n => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(n.delay),
          Animated.timing(n.pulse, { toValue: 0.9, duration: 2000, useNativeDriver: true }),
          Animated.timing(n.pulse, { toValue: 0.15, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const lineColor = isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.12)';
  const nodeColor = isDark ? '#A78BFA' : '#7C3AED';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {neurons.map((n, i) => (
        <React.Fragment key={i}>
          {neurons.slice(i + 1).map((n2, j) => {
            const dx = n2.x - n.x;
            const dy = n2.y - n.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 35) return null;
            return (
              <View
                key={`${i}-${j}`}
                style={{
                  position: 'absolute',
                  left: `${n.x}%`,
                  top: `${n.y}%`,
                  width: `${dist}%`,
                  height: 1,
                  backgroundColor: lineColor,
                  transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
                }}
              />
            );
          })}
          <Animated.View
            style={{
              position: 'absolute',
              left: `${n.x}%`,
              top: `${n.y}%`,
              width: n.size,
              height: n.size,
              borderRadius: n.size / 2,
              backgroundColor: nodeColor,
              opacity: n.pulse,
              shadowColor: '#A855F7',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 5,
            }}
          />
        </React.Fragment>
      ))}
    </View>
  );
};

// ============================================================
// مكون اختيار الدولة
// ============================================================
const CountryPickerModal = ({
  visible, onClose, onSelect, selectedCountry, isAr, colors,
}: {
  visible: boolean; onClose: () => void;
  onSelect: (country: typeof COUNTRIES[0]) => void;
  selectedCountry: typeof COUNTRIES[0];
  isAr: boolean; colors: any;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity style={st.modalOverlay} activeOpacity={1} onPress={onClose}>
      <View style={[st.modalContent, { backgroundColor: colors.card }]}>
        <View style={st.modalHeader}>
          <Text style={[st.modalTitle, { color: colors.text }]}>
            {isAr ? 'اختر الدولة' : 'Select Country'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={22} stroke={colors.subtext} />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ maxHeight: 400 }}>
          {COUNTRIES.map((country) => (
            <TouchableOpacity
              key={country.code}
              style={[
                st.countryOption,
                {
                  borderColor: selectedCountry.code === country.code ? colors.accent : 'transparent',
                  backgroundColor: selectedCountry.code === country.code ? colors.accentLight : 'transparent',
                },
              ]}
              onPress={() => { onSelect(country); onClose(); }}
            >
              <Text style={[st.countryOptionText, { color: colors.text }]}>
                {isAr ? country.name_ar : country.name_en} ({country.dialCode})
              </Text>
              {selectedCountry.code === country.code && <Check size={18} stroke={colors.accent} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </TouchableOpacity>
  </Modal>
);

export default function Login() {
  const { setAuth, lang, setLang } = useTwinStore();
  const isAr = lang === 'ar';
  const isDark = useTheme().isDark;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // مصر افتراضي
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isSignup, setIsSignup] = useState(false); // وضع التسجيل أو الدخول

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const formSlide = useRef(new Animated.Value(30)).current;

  // اكتشاف الدولة تلقائياً
  useEffect(() => {
    try {
      const locales = Localization.getLocales();
      if (locales && locales.length > 0) {
        const region = locales[0].regionCode;
        if (region) {
          const detected = getCountryByCode(region);
          if (detected) setSelectedCountry(detected);
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.timing(formSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleLanguage = () => setLang(lang === 'ar' ? 'en' : 'ar');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(isAr ? 'خطأ' : 'Error', isAr ? 'أدخل البريد وكلمة المرور' : 'Enter email and password');
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost('/api/auth/login', { email: email.trim(), password });
      if (data?.token && data?.user_id) {
        setAuth(data.user_id);
        router.replace(data?.onboarded ? '/twin-mind' : '/onboarding');
      } else {
        Alert.alert(isAr ? 'خطأ' : 'Error', isAr ? 'بيانات دخول غير صحيحة' : 'Invalid credentials');
      }
    } catch (e: any) {
      Alert.alert(isAr ? 'خطأ' : 'Error', e.message || (isAr ? 'فشل تسجيل الدخول' : 'Login failed'));
    } finally { setLoading(false); }
  };

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(isAr ? 'خطأ' : 'Error', isAr ? 'أدخل البريد وكلمة المرور' : 'Enter email and password');
      return;
    }
    if (password.length < 6) {
      Alert.alert(isAr ? 'خطأ' : 'Error', isAr ? 'كلمة المرور 6 أحرف على الأقل' : 'Min 6 characters');
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost('/api/auth/signup', {
        email: email.trim(),
        password,
        lang: isAr ? 'ar' : 'en',
        twin_name: isAr ? 'توأمك' : 'MyTwin',
        country: selectedCountry.code,
        dial_code: selectedCountry.dialCode,
        phone: phone.trim() || undefined,
      });
      if (data?.token && data?.user_id) {
        setAuth(data.user_id);
        router.replace('/onboarding');
      } else {
        Alert.alert(isAr ? 'تم ✅' : 'Done ✅', isAr ? 'تم إنشاء الحساب. سجل دخول الآن.' : 'Account created. Sign in now.');
        setIsSignup(false);
      }
    } catch (e: any) {
      Alert.alert(isAr ? 'خطأ' : 'Error', e.message || (isAr ? 'فشل إنشاء الحساب' : 'Signup failed'));
    } finally { setLoading(false); }
  };

  const colors = {
    bg: isDark ? '#0A0014' : '#FAFAF8',
    card: isDark ? '#1A1226' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1226',
    subtext: isDark ? '#A78BFA' : '#6B5B8A',
    accent: '#7C3AED',
    accentLight: '#7C3AED15',
    border: isDark ? '#2D1B4D' : '#E0D9F5',
    inputBg: isDark ? '#161122' : '#F8F6F2',
  };

  return (
    <View style={[st.root, { backgroundColor: colors.bg }]}>
      <NeuronNetwork isDark={isDark} />

      {/* زر اللغة */}
      <TouchableOpacity style={st.langBtn} onPress={toggleLanguage}>
        <Globe size={22} stroke={colors.accent} />
        <Text style={[st.langText, { color: colors.accent }]}>
          {isAr ? 'English' : 'العربية'}
        </Text>
      </TouchableOpacity>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={st.container}>
          {/* اللوجو مع نبض كوني */}
          <Animated.View style={[st.logoContainer, { transform: [{ scale: logoScale }] }]}>
            <View style={st.logoGlow}>
              <Image source={APP_LOGO} style={st.logo} resizeMode="contain" />
            </View>
            {/* نبضات حول اللوجو */}
            <Animated.View style={[st.pulseRing, { opacity: fadeAnim }]} />
          </Animated.View>

          <Animated.Text style={[st.heading, { color: colors.text, opacity: fadeAnim }]}>
            My Twin
          </Animated.Text>

          <Animated.Text style={[st.tagline, { color: colors.subtext, opacity: fadeAnim }]}>
            {isSignup
              ? (isAr ? 'وُلد توأمك الرقمي الآن ✨' : 'Your Digital Twin is being born ✨')
              : (isAr ? 'توأمك الرقمي .. دائماً معك' : 'Your Twin AI .. Always There')
            }
          </Animated.Text>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: formSlide }], width: '100%' }}>
            {/* حقل البريد */}
            <View style={[st.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Mail size={20} stroke={colors.subtext} />
              <TextInput
                style={[st.input, { color: colors.text, textAlign: isAr ? 'right' : 'left' }]}
                placeholder={isAr ? 'البريد الإلكتروني' : 'Email'}
                placeholderTextColor={colors.subtext}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* حقل كلمة المرور */}
            <View style={[st.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Lock size={20} stroke={colors.subtext} />
              <TextInput
                style={[st.input, { color: colors.text, flex: 1, textAlign: isAr ? 'right' : 'left' }]}
                placeholder={isAr ? 'كلمة المرور' : 'Password'}
                placeholderTextColor={colors.subtext}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} stroke={colors.subtext} /> : <Eye size={20} stroke={colors.subtext} />}
              </TouchableOpacity>
            </View>

            {/* حقول إضافية للتسجيل فقط */}
            {isSignup && (
              <>
                {/* اختيار الدولة */}
                <TouchableOpacity
                  style={[st.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                  onPress={() => setShowCountryPicker(true)}
                >
                  <MapPin size={20} stroke={colors.subtext} />
                  <Text style={[st.input, { color: colors.text, flex: 1, textAlign: isAr ? 'right' : 'left' }]}>
                    {isAr ? selectedCountry.name_ar : selectedCountry.name_en} ({selectedCountry.dialCode})
                  </Text>
                  <ChevronDown size={18} stroke={colors.subtext} />
                </TouchableOpacity>

                {/* رقم الهاتف */}
                <View style={[st.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Phone size={20} stroke={colors.subtext} />
                  <Text style={[st.dialCode, { color: colors.subtext }]}>{selectedCountry.dialCode}</Text>
                  <TextInput
                    style={[st.input, { color: colors.text, flex: 1, textAlign: isAr ? 'right' : 'left' }]}
                    placeholder={isAr ? 'رقم الهاتف (اختياري)' : 'Phone (optional)'}
                    placeholderTextColor={colors.subtext}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </>
            )}

            {/* زر تسجيل الدخول أو إنشاء الحساب */}
            <TouchableOpacity
              style={[st.primaryBtn, { backgroundColor: colors.accent }]}
              onPress={isSignup ? handleSignup : handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  {isSignup ? (
                    <Sparkles size={20} stroke="#FFF" />
                  ) : (
                    <LogIn size={20} stroke="#FFF" />
                  )}
                  <Text style={st.primaryBtnText}>
                    {isSignup
                      ? (isAr ? '✨ ولادة التوأم' : '✨ Birth Twin')
                      : (isAr ? 'تسجيل الدخول' : 'Sign In')
                    }
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* تبديل الوضع */}
            <TouchableOpacity
              style={[st.outlineBtn, { borderColor: colors.accent }]}
              onPress={() => setIsSignup(!isSignup)}
              disabled={loading}
            >
              <UserPlus size={20} stroke={colors.accent} />
              <Text style={[st.outlineBtnText, { color: colors.accent }]}>
                {isSignup
                  ? (isAr ? 'لدي حساب بالفعل' : 'I already have an account')
                  : (isAr ? 'إنشاء توأم جديد' : 'Create New Twin')
                }
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* مودال اختيار الدولة */}
      <CountryPickerModal
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        onSelect={setSelectedCountry}
        selectedCountry={selectedCountry}
        isAr={isAr}
        colors={colors}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  langBtn: { position: 'absolute', top: 50, right: 20, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 20, backgroundColor: '#7C3AED15', zIndex: 10 },
  langText: { fontWeight: '600', fontSize: 14 },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logoGlow: { shadowColor: '#A855F7', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  logo: { width: 130, height: 130, borderRadius: 34 },
  pulseRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1.5,
    borderColor: '#A855F7',
    opacity: 0.3,
  },
  heading: { fontSize: 38, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  tagline: { fontSize: 15, textAlign: 'center', marginBottom: 28, lineHeight: 22, paddingHorizontal: 20 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14, gap: 12, width: '100%' },
  dialCode: { fontSize: 16, fontWeight: '600', marginRight: 4 },
  input: { flex: 1, fontSize: 16 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, marginBottom: 12, gap: 8 },
  primaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 17 },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderWidth: 1.5, gap: 8, marginBottom: 16 },
  outlineBtnText: { fontWeight: '700', fontSize: 17 },

  // مودال
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '88%', borderRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  countryOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 6 },
  countryOptionText: { fontSize: 15, fontWeight: '600' },
});
