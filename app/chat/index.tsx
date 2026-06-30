import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, StatusBar, KeyboardAvoidingView,
  Platform, Image, Animated, Text, Alert, TouchableOpacity,
  Modal, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTwinStore } from '../../store/useTwinStore';
import { useTheme } from '../../utils/theme';
import { apiPost, apiGet } from '../../lib/httpClient';
import { speakResponse, stopSpeaking } from '../../utils/voice_engine';
import TypingIndicator from '../../components/TypingIndicator';
import {
  Menu, Volume2, VolumeX, Mic, Heart, X,
} from 'lucide-react-native';
import { COLORS, ThinkingBar, WelcomeState, EnergyModal } from './ChatComponents';
import { UserBubble, TwinBubble, ToolChip } from './ChatBubbles';
import { ChatInput } from './ChatInput';

const APP_LOGO = require('../../assets/logo.png');

export default function Chat() {
  const insets = useSafeAreaInsets();
  const {
    userId, twinName, tier, chatHistory, addMessage,
    lang, twinEnergy, setTwinEnergy, updateBond,
    openMenu, closeMenu, voiceEnabled, setVoiceEnabled,
    bondLevel,
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
  const flatRef = useRef<FlatList>(null);
  const attachAnim = useRef(new Animated.Value(0)).current;
  const heartbeatAnim = useRef(new Animated.Value(1)).current;

  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackItemId, setFeedbackItemId] = useState<string | null>(null);

  const contextLimit = tier === 'free' ? 15 : tier === 'plus' ? 40 : 100;
  const isNearLimit = chatHistory.length >= contextLimit - 3;
  const energyColor = twinEnergy > 60 ? '#34C759' : twinEnergy > 25 ? '#FF9500' : '#FF3B30';

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(heartbeatAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
      Animated.timing(heartbeatAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => { apiGet('/api/ads/status').then(setAdStatus).catch(() => {}); }, []);
  useEffect(() => { Animated.spring(attachAnim, { toValue: showAttach ? 1 : 0, useNativeDriver: true, tension: 65, friction: 11 }).start(); }, [showAttach]);

  useEffect(() => {
    if (userId) {
      apiGet(`/api/avatar/get?user_id=${userId}`).then(res => {
        if (res?.image_url) setAvatarUrl(res.image_url);
      }).catch(() => {});
    }
  }, [userId]);

  const handleLike = useCallback((item: any) => {
    addMessage({
      id: 'like_' + Date.now(),
      role: 'twin',
      content: isAr ? 'شكراً لك! سعيد لأنك أحببت ردي 💜' : 'Thank you! Glad you liked my response 💜',
      timestamp: Date.now(),
    });
    item.liked = true;
  }, [addMessage, isAr]);

  const handleDislike = useCallback((item: any) => {
    setFeedbackItemId(item.id);
    setFeedbackModalVisible(true);
    item.disliked = true;
  }, []);

  const submitFeedback = useCallback(async () => {
    if (!feedbackText.trim()) return;
    try {
      await apiPost('/api/feedback', { message_id: feedbackItemId, feedback: feedbackText, type: 'dislike' });
      addMessage({
        id: 'feedback_' + Date.now(),
        role: 'twin',
        content: isAr ? 'شكراً لملاحظاتك! سأتحسن من أجلك 💜' : 'Thanks for your feedback! I will improve for you 💜',
        timestamp: Date.now(),
      });
    } catch (e) {}
    setFeedbackModalVisible(false);
    setFeedbackText('');
    setFeedbackItemId(null);
  }, [feedbackText, feedbackItemId, addMessage, isAr]);

  const sendMessage = useCallback(async (msg?: string, imageBase64?: string) => {
    const message = (msg || input).trim();
    if (!message && !imageBase64 && activeToolsList.length === 0) return;
    if (twinEnergy <= 0 && !activeToolsList.length) {
      const freshAdStatus = await apiGet('/api/ads/status');
      setAdStatus(freshAdStatus);
      setShowEnergyModal(true);
      return;
    }
    addMessage({ id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36), role: 'user', content: message || (imageBase64 ? '📷 صورة' : ''), image: imageBase64, timestamp: Date.now() });
    setInput(''); setLoading(true); setThinkingStage('thinking');
    try {
      setThinkingStage('memory'); await new Promise(resolve => setTimeout(resolve, 400));
      setThinkingStage('generating');
      const response = await apiPost('/api/chat', { message, history: chatHistory.slice(-10).map(m => ({ role: m.role, content: m.content })), lang });
      addMessage({ id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36), role: 'twin', content: response.reply, timestamp: Date.now(), emotion: response.emotion?.primary, provider: response.provider || 'orchestrator' });
      const newBond = Math.min(bondLevel + (Math.random() * 0.3 + 0.1), 100); updateBond(newBond);
      if (voiceEnabled) { try { await speakResponse(response.reply); } catch {} }
      setThinkingStage('completed');
    } catch (error: any) {
      const errMsg = lang === 'ar' ? 'عذراً، حدث خطأ في الاتصال 💜' : 'Connection error. Please try again 💜';
      addMessage({ id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36), role: 'twin', content: errMsg, timestamp: Date.now(), failed: true, provider: 'error' });
    } finally { setLoading(false); setTimeout(() => setThinkingStage('idle'), 2000); }
  }, [input, loading, voiceEnabled, lang, addMessage, activeToolsList, twinEnergy, chatHistory, bondLevel, updateBond]);

  const send = useCallback(async (msg?: string, imageBase64?: string) => { if (loading) return; await sendMessage(msg, imageBase64); }, [loading, sendMessage]);
  const toggleSound = useCallback(() => { if (voiceEnabled) stopSpeaking(); setVoiceEnabled(!voiceEnabled); }, [voiceEnabled, setVoiceEnabled]);
  const handleVoiceInput = useCallback(async () => { if (isRecording) { setIsRecording(false); return; } setIsRecording(true); try { setTimeout(() => { setIsRecording(false); }, 3000); } catch { setIsRecording(false); } }, [isRecording]);

  const renderMsg = useCallback(({ item }: any) => {
    if (item.role === 'user') return <UserBubble item={item} isDark={isDark} isRTL={isRTL} />;
    return <TwinBubble item={item} isDark={isDark} isRTL={isRTL} isLast={false} userId={userId} onCopy={() => {}} onRetry={() => {}} onRegenerate={() => {}} onLike={() => handleLike(item)} onDislike={() => handleDislike(item)} provider={item.provider} lang={lang} twinName={twinName} />;
  }, [isDark, isRTL, lang, userId, twinName, handleLike, handleDislike]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View style={[styles.header, { paddingTop: insets.top + 4, paddingBottom: 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={openMenu} style={styles.menuBtn}><Menu size={22} stroke={colors.text} /></TouchableOpacity>
          <View style={styles.headerCenter}>
            <Animated.View style={{ transform: [{ scale: heartbeatAnim }] }}>
              <Image source={avatarUrl ? { uri: avatarUrl } : APP_LOGO} style={{ width: 36, height: 36, borderRadius: 18, marginBottom: 2 }} />
            </Animated.View>
            <Text style={[styles.headerName, { color: colors.text }]}>{twinName}</Text>
            <View style={styles.miniIndicators}>
              <View style={[styles.energyDot, { backgroundColor: energyColor }]} />
              <Text style={[styles.miniText, { color: colors.subtext }]}>⚡ {twinEnergy}%</Text>
              <Heart size={10} stroke={colors.accent} fill={colors.accent} />
              <Text style={[styles.miniText, { color: colors.accent }]}>{Math.round(bondLevel)}%</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity onPress={handleVoiceInput} style={[styles.iconBtn, isRecording && styles.recordingBtn]}><Mic size={22} stroke={isRecording ? "#FF3B30" : colors.text} fill={isRecording ? "#FF3B3020" : "transparent"} /></TouchableOpacity>
            <TouchableOpacity onPress={toggleSound} style={styles.iconBtn}>{voiceEnabled ? <Volume2 size={22} stroke={colors.text} /> : <VolumeX size={22} stroke={colors.text} />}</TouchableOpacity>
          </View>
        </View>

        <FlatList
          ref={flatRef} data={chatHistory} keyExtractor={(item) => item.id} renderItem={renderMsg}
          ListHeaderComponent={chatHistory.length === 0 ? <WelcomeState isDark={isDark} lang={lang} twinName={twinName} onSuggestion={(s: string) => send(s)} /> : null}
          ListFooterComponent={loading ? (<View><View style={styles.typingRow}><Image source={APP_LOGO} style={{ width: 28, height: 28, borderRadius: 14 }} /><TypingIndicator /></View><ThinkingBar stage={thinkingStage} isDark={isDark} /></View>) : null}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive"
        />

        {activeToolsList.length > 0 && (<View style={[styles.toolsRow, { backgroundColor: colors.headerBg }]}>{activeToolsList.map((tool: any) => (<ToolChip key={tool.id} label={tool.label} icon={tool.icon} color={tool.color} onClose={() => setActiveToolsList(prev => prev.filter(t => t.id !== tool.id))} />))}</View>)}

        <ChatInput input={input} setInput={setInput} loading={loading} isRTL={isRTL} isDark={isDark} colors={colors} lang={lang} onSend={send} showAttach={showAttach} setShowAttach={setShowAttach} attachAnim={attachAnim} bottomInset={Math.max(insets.bottom - 8, 4)} voiceEnabled={voiceEnabled} toggleSound={toggleSound} />
      </KeyboardAvoidingView>

      <EnergyModal visible={showEnergyModal} onClose={() => setShowEnergyModal(false)} onWatchAd={async () => { setShowEnergyModal(false); try { const data = await apiPost('/api/ads/reward', { ad_type: 'rewarded' }); if (data.success) { setTwinEnergy(Math.min(100, twinEnergy + 20)); const freshStatus = await apiGet('/api/ads/status'); setAdStatus(freshStatus); } } catch (e) { Alert.alert('خطأ', 'فشل تحميل الإعلان'); } }} adStatus={adStatus} lang={lang} />

      <Modal visible={feedbackModalVisible} transparent animationType="slide" onRequestClose={() => setFeedbackModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{isAr ? 'أخبرنا لماذا؟' : 'Tell us why?'}</Text>
              <TouchableOpacity onPress={() => setFeedbackModalVisible(false)}><X size={24} stroke={colors.text} /></TouchableOpacity>
            </View>
            <TextInput style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, textAlign: isAr ? 'right' : 'left' }]} placeholder={isAr ? 'اكتب ملاحظاتك هنا...' : 'Write your feedback here...'} placeholderTextColor={colors.subtext} value={feedbackText} onChangeText={setFeedbackText} multiline />
            <TouchableOpacity style={[styles.modalSubmit, { backgroundColor: colors.accent }]} onPress={submitFeedback} disabled={!feedbackText.trim()}>
              <Text style={styles.modalSubmitText}>{isAr ? 'إرسال' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 0.5 },
  menuBtn: { padding: 6, borderRadius: 10 },
  headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: 10 },
  headerName: { fontSize: 16, fontWeight: '700' },
  miniIndicators: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  energyDot: { width: 5, height: 5, borderRadius: 3 },
  miniText: { fontSize: 10, fontWeight: '600' },
  iconBtn: { padding: 6, borderRadius: 10 },
  recordingBtn: { backgroundColor: '#FF3B3015' },
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
  limitWarning: { padding: 8, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, backgroundColor: '#F59E0B20', borderColor: '#F59E0B', marginBottom: 8 },
  limitWarningText: { fontSize: 11, fontWeight: '600', textAlign: 'center', color: '#F59E0B' },
  energyBarContainer: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 2 },
  energyBarBg: { height: 3, borderRadius: 2, overflow: 'hidden' },
  energyBarFill: { height: '100%', borderRadius: 2 },
  bondBarContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 3 },
  bondBarBg: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  bondBarFill: { height: '100%', borderRadius: 2 },
  bondText: { fontSize: 9, fontWeight: '700' },
});
