import React, { useState, useRef, useEffect, useCallback } from 'react';

type CallState = 'idle' | 'listening' | 'thinking' | 'speaking';
import {
  View, FlatList, StyleSheet, StatusBar, KeyboardAvoidingView,
  Platform, Image, Animated, Text, Alert, TouchableOpacity,
  Modal, TextInput, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useTheme } from '../../utils/theme';
import { apiPost, apiGet } from '../../lib/httpClient';
import { speakResponse, stopSpeaking } from '../../utils/voice_engine';
import { startVoiceCall, endVoiceCall } from '../../utils/voice_call_engine';
import TypingIndicator from '../../components/TypingIndicator';
import {
  Menu, Volume2, VolumeX, Phone, PhoneOff, X, Heart, Sparkles,
} from 'lucide-react-native';
import { COLORS, ThinkingBar, WelcomeState, EnergyModal } from './ChatComponents';
import { UserBubble, TwinBubble, ToolChip } from './ChatBubbles';
import { ChatInput } from './ChatInput';

const { width: SCREEN_W } = Dimensions.get('window');
const APP_LOGO = require('../../assets/logo.png');

export default function Chat() {
  const insets = useSafeAreaInsets();
  const {
    userId, twinName, chatHistory, addMessage,
    lang, twinEnergy, setTwinEnergy, updateBond,
    openMenu, voiceEnabled, setVoiceEnabled, bondLevel,
  } = useTwinStore();
  const theme = useTheme();
  const isDark = theme.isDark;
  const isRTL = lang === 'ar';
  const isAr = lang === 'ar';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [activeToolsList, setActiveToolsList] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [adStatus, setAdStatus] = useState<any>(null);
  const [thinkingStage, setThinkingStage] = useState('idle');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [moodLabel, setMoodLabel] = useState('');
  const [inCall, setInCall] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [callState, setCallState] = useState<CallState>('idle');
  const [callReply, setCallReply] = useState('');
  const flatRef = useRef<FlatList>(null);
  const attachAnim = useRef(new Animated.Value(0)).current;
  const heartbeatAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackItemId, setFeedbackItemId] = useState<string | null>(null);

  const energyColor = twinEnergy > 60 ? '#34C759' : twinEnergy > 25 ? '#FF9500' : '#FF3B30';

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(heartbeatAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
      Animated.timing(heartbeatAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    if (inCall) {
      Animated.loop(Animated.sequence([
        Animated.timing(waveAnim1, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(waveAnim1, { toValue: 0.2, duration: 800, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(waveAnim2, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(waveAnim2, { toValue: 0.2, duration: 1000, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(waveAnim3, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(waveAnim3, { toValue: 0.2, duration: 1200, useNativeDriver: true }),
      ])).start();
    } else {
      waveAnim1.setValue(0); waveAnim2.setValue(0); waveAnim3.setValue(0);
    }
  }, [inCall]);

  useEffect(() => { apiGet('/api/ads/status').then(setAdStatus).catch(() => {}); }, []);
  useEffect(() => { Animated.spring(attachAnim, { toValue: showAttach ? 1 : 0, useNativeDriver: true, tension: 65, friction: 11 }).start(); }, [showAttach]);

  useEffect(() => {
    if (userId) {
      const g = useTwinStore.getState().twinGender || 'female';
      apiGet(`/api/avatar/get?user_id=${userId}&gender=${g}`).then(res => { if (res?.image_url) setAvatarUrl(res.image_url); }).catch(() => {});
      apiGet(`/api/consciousness/status?user_id=${userId}&lang=${lang}`).then((res: any) => { if (res?.mood_label) setMoodLabel(res.mood_label); }).catch(() => {});
    }
  }, [userId, lang]);

  useEffect(() => {
    if (inCall) {
      callTimerRef.current = setInterval(() => setCallTime(prev => prev + 1), 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setCallTime(0);
    }
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current); };
  }, [inCall]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleLike = useCallback((item: any) => {
    addMessage({ id: 'like_' + Date.now(), role: 'twin', content: isAr ? 'شكراً لك! 💜' : 'Thank you! 💜', timestamp: Date.now() });
    item.liked = true;
  }, [addMessage, isAr]);

  const handleDislike = useCallback((item: any) => {
    setFeedbackItemId(item.id); setFeedbackModalVisible(true); item.disliked = true;
  }, []);

  const submitFeedback = useCallback(async () => {
    if (!feedbackText.trim()) return;
    try { await apiPost('/api/feedback', { message_id: feedbackItemId, feedback: feedbackText, type: 'dislike' }); } catch (e) {}
    addMessage({ id: 'feedback_' + Date.now(), role: 'twin', content: isAr ? 'شكراً لملاحظاتك! 💜' : 'Thanks! 💜', timestamp: Date.now() });
    setFeedbackModalVisible(false); setFeedbackText(''); setFeedbackItemId(null);
  }, [feedbackText, feedbackItemId, addMessage, isAr]);

  const sendMessage = useCallback(async (msg?: string, imageBase64?: string) => {
    const message = (msg || input).trim();
    if (!message && !imageBase64 && activeToolsList.length === 0) return;
    if (twinEnergy <= 0 && !activeToolsList.length) {
      const freshAdStatus = await apiGet('/api/ads/status'); setAdStatus(freshAdStatus); setShowEnergyModal(true); return;
    }
    addMessage({ id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36), role: 'user', content: message || '📷 صورة', image: imageBase64, timestamp: Date.now() });
    setInput(''); setLoading(true); setThinkingStage('thinking');
    try {
      setThinkingStage('memory'); await new Promise(resolve => setTimeout(resolve, 400));
      setThinkingStage('generating');
      const response = await apiPost('/api/chat', { message, history: chatHistory.slice(-10).map(m => ({ role: m.role, content: m.content })), lang });
      addMessage({ id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36), role: 'twin', content: response.reply, timestamp: Date.now(), emotion: response.emotion?.primary });
      updateBond(Math.min(bondLevel + (Math.random() * 0.3 + 0.1), 100));
      if (voiceEnabled && !inCall) { try { await speakResponse(response.reply); } catch {} }
      setThinkingStage('completed');
    } catch (error: any) {
      addMessage({ id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36), role: 'twin', content: isAr ? 'عذراً، حدث خطأ 💜' : 'Connection error 💜', timestamp: Date.now(), failed: true });
    } finally { setLoading(false); setTimeout(() => setThinkingStage('idle'), 2000); }
  }, [input, loading, voiceEnabled, lang, addMessage, activeToolsList, twinEnergy, chatHistory, bondLevel, updateBond, inCall]);

  const send = useCallback(async (msg?: string, imageBase64?: string) => { if (loading) return; await sendMessage(msg, imageBase64); }, [loading, sendMessage]);

  const toggleTTS = useCallback(() => {
    if (voiceEnabled) stopSpeaking();
    setVoiceEnabled(!voiceEnabled);
  }, [voiceEnabled, setVoiceEnabled]);

  const startCall = useCallback(async () => {
    setInCall(true);
    setCallState('listening');
    setCallReply('');
    await startVoiceCall(userId, twinName, lang, (state, text) => {
      const mappedState = state === 'thinking' ? 'listening' : state;
      setCallState(mappedState);
      if (text) setCallReply(text);
    });
  }, [userId, twinName, lang]);
  const endCall = useCallback(async () => {
    await endVoiceCall();
    setInCall(false);
    setCallState('idle');
    setCallReply('');
  }, []);

  const renderMsg = useCallback(({ item }: any) => {
    if (item.role === 'user') return <UserBubble item={item} isDark={isDark} isRTL={isRTL} />;
    return <TwinBubble item={item} isDark={isDark} isRTL={isRTL} isLast={false} userId={userId} onCopy={() => {}} onRetry={() => {}} onRegenerate={() => {}} onLike={() => handleLike(item)} onDislike={() => handleDislike(item)} provider={item.provider} lang={lang} twinName={twinName} />;
  }, [isDark, isRTL, lang, userId, twinName, handleLike, handleDislike]);

  if (inCall) {
    return (
      <View style={[styles.callRoot, { backgroundColor: isDark ? '#0A0014' : '#F5F0FF' }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.callBgGlow}>
          <Animated.View style={[styles.callGlowCircle, { opacity: waveAnim1, transform: [{ scale: waveAnim1.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.5] }) }] }]} />
          <Animated.View style={[styles.callGlowCircle2, { opacity: waveAnim2, transform: [{ scale: waveAnim2.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.3] }) }] }]} />
        </View>
        <View style={styles.callContainer}>
          <Animated.View style={{ transform: [{ scale: heartbeatAnim }] }}>
            <View style={styles.callAvatarGlow}>
              <Image source={avatarUrl ? { uri: avatarUrl } : APP_LOGO} style={styles.callAvatar} />
            </View>
          </Animated.View>
          <Text style={styles.callName}>{twinName}</Text>
          <View style={styles.callStateRow}>
            {callState === 'listening' && <Animated.View style={{ opacity: waveAnim1 }}><Sparkles size={16} stroke={colors.accent} /></Animated.View>}
            {callState === 'speaking' && <Animated.View style={{ opacity: waveAnim2 }}><Sparkles size={16} stroke="#10B981" /></Animated.View>}
            <Text style={styles.callStatus}>
              {callState === 'listening' ? (isAr ? 'أستمع إليك...' : 'Listening...') :
               callState === 'speaking' ? (isAr ? 'أحدثك...' : 'Speaking...') :
               callState === 'thinking' ? (isAr ? 'أفكر...' : 'Thinking...') :
               isAr ? 'جاري الاتصال...' : 'Connecting...'}
            </Text>
          </View>
          {callReply && callState === 'speaking' ? (
            <View style={styles.callReplyCard}><Text style={styles.callReplyText} numberOfLines={3}>{callReply}</Text></View>
          ) : null}
          <Text style={styles.callTimeText}>{formatTime(callTime)}</Text>
          <View style={styles.callWaveContainer}>
            {[waveAnim1, waveAnim2, waveAnim3].map((anim, i) => (
              <Animated.View key={i} style={[styles.callWave, { height: 30 + i * 10, opacity: anim.interpolate({ inputRange: [0.2, 1], outputRange: [0.3, 0.9] }), transform: [{ scaleY: anim }], backgroundColor: callState === 'speaking' ? '#10B981' : colors.accent }]} />
            ))}
          </View>
        </View>
        <TouchableOpacity style={styles.endCallBtn} onPress={endCall}><PhoneOff size={28} stroke="#FFF" /></TouchableOpacity>
        <TouchableOpacity style={styles.backToChatBtn} onPress={endCall}><Text style={styles.backToChatText}>{isAr ? 'العودة للمحادثة' : 'Back to Chat'}</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={[styles.header, { paddingTop: insets.top + 4, paddingBottom: 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={openMenu} style={styles.menuBtn}><Menu size={22} stroke={colors.text} /></TouchableOpacity>
          <View style={styles.headerCenter}>
            <Animated.View style={{ transform: [{ scale: heartbeatAnim }] }}>
              <Image source={avatarUrl ? { uri: avatarUrl } : APP_LOGO} style={styles.headerAvatar} />
            </Animated.View>
            <View>
              <Text style={[styles.headerName, { color: colors.text }]}>{twinName}</Text>
              <View style={styles.headerMeta}>
                {moodLabel ? <Text style={[styles.moodText, { color: colors.subtext }]}>{moodLabel}</Text> : null}
                <View style={[styles.energyDot, { backgroundColor: energyColor }]} />
                <Text style={[styles.energyText, { color: colors.subtext }]}>⚡ {twinEnergy}%</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={startCall} style={styles.iconBtn}><Phone size={20} stroke={colors.text} /></TouchableOpacity>
            <TouchableOpacity onPress={toggleTTS} style={styles.iconBtn}>
              {voiceEnabled ? <Volume2 size={20} stroke={colors.accent} /> : <VolumeX size={20} stroke={colors.subtext} />}
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          ref={flatRef} data={chatHistory} keyExtractor={(item) => item.id} renderItem={renderMsg}
          ListHeaderComponent={chatHistory.length === 0 ? <WelcomeState isDark={isDark} lang={lang} twinName={twinName} onSuggestion={(s: string) => send(s)} /> : null}
          ListFooterComponent={loading ? (<View><View style={styles.typingRow}><Image source={avatarUrl ? { uri: avatarUrl } : APP_LOGO} style={{ width: 28, height: 28, borderRadius: 14 }} /><TypingIndicator /></View><ThinkingBar stage={thinkingStage} isDark={isDark} /></View>) : null}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive"
        />

        {activeToolsList.length > 0 && (<View style={[styles.toolsRow, { backgroundColor: colors.headerBg }]}>{activeToolsList.map((tool: any) => (<ToolChip key={tool.id} label={tool.label} icon={tool.icon} color={tool.color} onClose={() => setActiveToolsList(prev => prev.filter(t => t.id !== tool.id))} />))}</View>)}

        <ChatInput
          input={input} setInput={setInput} loading={loading} isRTL={isRTL} isDark={isDark} colors={colors} lang={lang}
          onSend={send} showAttach={showAttach} setShowAttach={setShowAttach} attachAnim={attachAnim}
          bottomInset={Math.max(insets.bottom - 8, 4)} isRecording={isRecording}
          onMicPress={() => setIsRecording(!isRecording)} onCallPress={startCall}
        />
      </KeyboardAvoidingView>

      <EnergyModal visible={showEnergyModal} onClose={() => setShowEnergyModal(false)} onWatchAd={async () => { setShowEnergyModal(false); try { const data = await apiPost('/api/ads/reward', { ad_type: 'rewarded' }); if (data.success) { setTwinEnergy(Math.min(100, twinEnergy + 20)); const freshStatus = await apiGet('/api/ads/status'); setAdStatus(freshStatus); } } catch (e) { Alert.alert('خطأ', 'فشل تحميل الإعلان'); } }} adStatus={adStatus} lang={lang} />

      <Modal visible={feedbackModalVisible} transparent animationType="slide" onRequestClose={() => setFeedbackModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.text }]}>{isAr ? 'أخبرنا لماذا؟' : 'Tell us why?'}</Text><TouchableOpacity onPress={() => setFeedbackModalVisible(false)}><X size={24} stroke={colors.text} /></TouchableOpacity></View>
            <TextInput style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, textAlign: isAr ? 'right' : 'left' }]} placeholder={isAr ? 'اكتب ملاحظاتك...' : 'Write feedback...'} placeholderTextColor={colors.subtext} value={feedbackText} onChangeText={setFeedbackText} multiline />
            <TouchableOpacity style={[styles.modalSubmit, { backgroundColor: colors.accent }]} onPress={submitFeedback} disabled={!feedbackText.trim()}><Text style={styles.modalSubmitText}>{isAr ? 'إرسال' : 'Submit'}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 0.5 },
  menuBtn: { padding: 8, borderRadius: 10 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerName: { fontSize: 16, fontWeight: '700' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  moodText: { fontSize: 11, fontWeight: '500' },
  energyDot: { width: 6, height: 6, borderRadius: 3 },
  energyText: { fontSize: 11, fontWeight: '600' },
  headerIcons: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8, borderRadius: 10 },
  listContent: { paddingHorizontal: 0, paddingVertical: 8, flexGrow: 1 },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingVertical: 10, gap: 10 },
  toolsRow: { flexDirection: 'row', padding: 8, borderTopWidth: 1, borderTopColor: '#E5E5EA', gap: 8 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', borderRadius: 20, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalInput: { borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 15, marginBottom: 16, minHeight: 100, textAlignVertical: 'top' },
  modalSubmit: { borderRadius: 14, padding: 14, alignItems: 'center' },
  modalSubmitText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  callRoot: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  callBgGlow: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  callGlowCircle: { position: 'absolute', width: SCREEN_W * 0.6, height: SCREEN_W * 0.6, borderRadius: SCREEN_W * 0.3, backgroundColor: '#7C3AED20' },
  callGlowCircle2: { position: 'absolute', width: SCREEN_W * 0.4, height: SCREEN_W * 0.4, borderRadius: SCREEN_W * 0.2, backgroundColor: '#A78BFA15' },
  callContainer: { alignItems: 'center', gap: 16, zIndex: 10 },
  callAvatarGlow: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#7C3AED', justifyContent: 'center', alignItems: 'center', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  callAvatar: { width: 100, height: 100, borderRadius: 50 },
  callName: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  callStateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  callStatus: { fontSize: 16, color: '#A78BFA' },
  callReplyCard: { backgroundColor: '#7C3AED15', borderRadius: 16, padding: 16, maxWidth: '80%', borderWidth: 1, borderColor: '#7C3AED30' },
  callReplyText: { fontSize: 15, color: '#A78BFA', textAlign: 'center', lineHeight: 24 },
  callTimeText: { fontSize: 18, fontWeight: '600', color: '#7C3AED' },
  callWaveContainer: { flexDirection: 'row', gap: 6, height: 60, alignItems: 'flex-end' },
  callWave: { width: 6, borderRadius: 3 },
  endCallBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', marginTop: 30, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  backToChatBtn: { marginTop: 16, padding: 10 },
  backToChatText: { color: '#A78BFA', fontSize: 13, fontWeight: '600' },
});
