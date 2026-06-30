import React, { memo, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, Share,
  Linking, Animated,
} from 'react-native';
import {
  Copy, Share2, RotateCcw, ThumbsUp, ThumbsDown,
  X, Sparkles, Zap, Cpu, Shield, Brain,
} from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';

const APP_LOGO = require('../../assets/logo.png');
import { getEmotionColor } from '../../utils/theme';

export const COLORS = {
  light: {
    bg: '#FFFFFF', headerBg: '#FAFAFA', border: '#E8E8E8', text: '#1A1A1A',
    subtext: '#8E8E93', bubbleUser: '#7C3AED', userText: '#FFFFFF',
    twinText: '#1A1A1A', inputBg: '#F2F2F7', inputBorder: '#E5E5EA',
    sendActive: '#7C3AED', sendInactive: '#C7C7CC', retryColor: '#FF3B30',
    likeActive: '#34C759', dislikeActive: '#FF3B30', accent: '#7C3AED',
    codeBg: '#1C1C1E', tableBorder: '#E5E5EA', blockquoteBg: '#F2F2F7',
    link: '#5856D6', twinBg: '#F9F9FB', shadowColor: '#00000008',
  },
  dark: {
    bg: '#000000', headerBg: '#1C1C1E', border: '#38383A', text: '#FFFFFF',
    subtext: '#8E8E93', bubbleUser: '#7C3AED', userText: '#FFFFFF',
    twinText: '#FFFFFF', inputBg: '#2C2C2E', inputBorder: '#38383A',
    sendActive: '#A78BFA', sendInactive: '#48484A', retryColor: '#FF453A',
    likeActive: '#30D158', dislikeActive: '#FF453A', accent: '#A78BFA',
    codeBg: '#0A0A0A', tableBorder: '#38383A', blockquoteBg: '#2C2C2E',
    link: '#5E5CE6', twinBg: '#0D0D0F', shadowColor: '#FFFFFF05',
  },
};

const emotionEmoji: Record<string, string> = {
  joy: '😊', sadness: '😢', anger: '😠', fear: '😨', love: '❤️',
  surprise: '😮', neutral: '😌', caring: '🤝', supportive: '💪',
};

export const MarkdownRenderer = memo(({ content, isDark }: { content: string; isDark: boolean }) => {
  const c = isDark ? COLORS.dark : COLORS.light;
  const styles = useMemo(() => ({
    body: { color: c.twinText, fontSize: 16, lineHeight: 26 },
    code_inline: { backgroundColor: c.codeBg, color: '#FF375F', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    code_block: { backgroundColor: c.codeBg, padding: 16, borderRadius: 12, marginVertical: 12 },
    link: { color: c.link, fontWeight: '600' as const },
    blockquote: { backgroundColor: c.blockquoteBg, borderLeftColor: c.accent, borderLeftWidth: 3, paddingLeft: 16, paddingVertical: 4, borderRadius: 4 },
    table: { borderColor: c.tableBorder, borderWidth: 1, borderRadius: 8 },
  }), [isDark]);

  const handleLinkPress = (url: string): boolean => {
    WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));
    return true;
  };

  return <Markdown style={styles as any} onLinkPress={handleLinkPress}>{content}</Markdown>;
});

export const UserBubble = memo(({ item, isDark }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start(); }, []);
  const c = isDark ? COLORS.dark : COLORS.light;
  const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View style={[styles.userRow, { opacity: fadeAnim }]}>
      <View style={[styles.userBubble, { backgroundColor: c.bubbleUser }]}>
        <Text style={[styles.userText, { color: '#FFF' }]}>{item.content}</Text>
        <Text style={[styles.userTime, { color: 'rgba(255,255,255,0.6)' }]}>{time}</Text>
      </View>
    </Animated.View>
  );
});

export const TwinBubble = memo(({ item, isDark, isRTL, isLast, onCopy, onRetry, onRegenerate, onLike, onDislike, lang, twinName }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  const c = isDark ? COLORS.dark : COLORS.light;
  const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const emotion = item.emotion || 'neutral';
  const emoji = emotionEmoji[emotion] || '😌';
  const isLiked = item.liked === true;
  const isDisliked = item.disliked === true;

  return (
    <Animated.View style={[styles.twinRow, { opacity: fadeAnim }]}>
      <View style={styles.twinAvatarContainer}>
        <Image source={APP_LOGO} style={styles.twinAvatar} />
        <Text style={[styles.twinName, { color: c.text }]}>{twinName || 'MyTwin'}</Text>
        {item.emotion && <Text style={styles.emotionEmoji}>{emoji}</Text>}
        <Text style={[styles.timestamp, { color: c.subtext }]}>{time}</Text>
      </View>

      <View style={[styles.twinCard, { backgroundColor: c.twinBg, borderColor: c.border }]}>
        <View style={styles.twinContent}>
          <MarkdownRenderer content={item.content} isDark={isDark} />
        </View>

        <View style={[styles.actionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={() => Clipboard.setStringAsync(item.content)} style={styles.actionBtn}>
            <Copy size={15} stroke={c.subtext} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Share.share({ message: item.content })} style={styles.actionBtn}>
            <Share2 size={15} stroke={c.subtext} />
          </TouchableOpacity>
          {isLast && (
            <TouchableOpacity onPress={() => onRegenerate(item)} style={styles.actionBtn}>
              <RotateCcw size={15} stroke={c.subtext} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => onLike(item)} style={[styles.actionBtn, isLiked && { backgroundColor: c.likeActive + '20' }]}>
            <ThumbsUp size={15} stroke={isLiked ? c.likeActive : c.subtext} fill={isLiked ? c.likeActive : 'none'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDislike(item)} style={[styles.actionBtn, isDisliked && { backgroundColor: c.dislikeActive + '20' }]}>
            <ThumbsDown size={15} stroke={isDisliked ? c.dislikeActive : c.subtext} fill={isDisliked ? c.dislikeActive : 'none'} />
          </TouchableOpacity>
        </View>

        {item.failed && (
          <TouchableOpacity onPress={() => onRetry(item)} style={styles.retryBtn}>
            <RotateCcw size={14} stroke={c.retryColor} />
            <Text style={[styles.retryText, { color: c.retryColor }]}>إعادة المحاولة</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
});

export const ToolChip = memo(({ label, icon: Icon, color, onClose }: any) => (
  <View style={[styles.toolChip, { backgroundColor: color + '12', borderColor: color + '25' }]}>
    <Icon size={14} stroke={color} />
    <Text style={[styles.toolChipText, { color }]}>{label}</Text>
    {onClose && <TouchableOpacity onPress={onClose}><X size={12} stroke={color} /></TouchableOpacity>}
  </View>
));

const styles = StyleSheet.create({
  userRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20, paddingHorizontal: 12 },
  userBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderBottomRightRadius: 4, maxWidth: '85%' },
  userText: { fontSize: 16, lineHeight: 24 },
  userTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  twinRow: { marginBottom: 24, paddingHorizontal: 12 },
  twinAvatarContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10, flexWrap: 'wrap' },
  twinAvatar: { width: 36, height: 36, borderRadius: 18 },
  twinName: { fontSize: 14, fontWeight: '700' },
  twinCard: { borderRadius: 20, borderWidth: 0.5, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  emotionEmoji: { fontSize: 14 },
  timestamp: { fontSize: 11 },
  twinContent: { marginBottom: 12 },
  actionRow: { alignItems: 'center', gap: 2, marginTop: 4, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: '#E8E8EA' },
  actionBtn: { padding: 8, borderRadius: 8 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 10, backgroundColor: 'rgba(255,59,48,0.08)', alignSelf: 'flex-start', marginTop: 8 },
  retryText: { fontSize: 13, fontWeight: '600' },
  toolChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  toolChipText: { fontSize: 13, fontWeight: '600' },
});
