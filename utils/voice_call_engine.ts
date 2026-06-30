/**
 * Voice Call Engine v1.5 – محرك المكالمات الصوتية (STT حقيقي)
 * =================================================================
 * يسجل صوت المستخدم ← يرسله لـ /api/stt/transcribe ← يحصل على النص
 * ← يرسل النص لـ /api/chat ← يحصل على الرد ← يتحدث بالرد عبر TTS
 */
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { useTwinStore } from '../store/useTwinStore';
import { apiPost } from '../lib/httpClient';

type CallState = 'idle' | 'listening' | 'thinking' | 'speaking';
type Callback = (state: CallState, text?: string) => void;

let recording: Audio.Recording | null = null;
let callActive = false;

export async function startVoiceCall(
  userId: string,
  twinName: string,
  lang: string,
  onStateChange: Callback
): Promise<void> {
  callActive = true;

  const processTurn = async () => {
    if (!callActive) return;

    // 1. استماع – تسجيل صوت المستخدم
    onStateChange('listening');
    let userText = '';

    try {
      // إعدادات التسجيل
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const recordingOptions: Audio.RecordingOptions = {
        isMeteringEnabled: true,
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.PCM_16_BIT,
          audioEncoder: Audio.AndroidAudioEncoder.PCM,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: { mimeType: 'audio/wav', bitsPerSecond: 256000 },
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      recording = newRecording;

      // تسجيل لمدة 6 ثوانٍ
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          if (recording) {
            try {
              await recording.stopAndUnloadAsync();
              recording = null;
            } catch (e) {}
          }
          resolve();
        }, 6000);
      });

      if (recording) {
        await recording.stopAndUnloadAsync();
        recording = null;
      }

      // ✅ STT حقيقي: تحويل الصوت المسجل إلى نص
      const uri = newRecording.getURI();
      if (uri) {
        try {
          // قراءة الملف الصوتي كـ base64
          const base64Audio = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // إرسال إلى راوتر STT
          const sttResponse = await apiPost('/api/stt/transcribe', {
            audio_base64: base64Audio,
            language: lang,
            user_id: userId,
          });

          if (sttResponse?.text && sttResponse.text.trim()) {
            userText = sttResponse.text.trim();
          } else {
            // فشل STT – استخدم نصاً احتياطياً
            userText = '';
          }
        } catch (sttError) {
          console.warn('[VoiceCall] STT failed:', sttError);
          userText = '';
        }
      }

      // إذا لم نحصل على نص، نعود للاستماع
      if (!userText) {
        if (callActive) processTurn();
        return;
      }

      // 2. تفكير – إرسال النص للتوأم
      onStateChange('thinking');

      const store = useTwinStore.getState();
      const response = await apiPost('/api/chat', {
        message: userText,
        history: store.chatHistory.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        lang,
        user_id: userId,
      });

      const reply = response.reply || 'أنا هنا معك 💜';

      // 3. تحدث – تحويل الرد إلى صوت
      onStateChange('speaking', reply);

      const gender = store.twinGender === 'male' ? 'male' : 'female';
      const voice =
        Platform.OS === 'ios'
          ? gender === 'female'
            ? 'com.apple.ttsbundle.Laila-compact'
            : 'com.apple.ttsbundle.Maged-compact'
          : undefined;

      await Speech.speak(reply, {
        language: lang === 'ar' ? 'ar-SA' : 'en-US',
        pitch: gender === 'female' ? 1.2 : 0.9,
        rate: 0.95,
        voice,
        onDone: () => {
          if (callActive) processTurn();
        },
        onError: () => {
          if (callActive) processTurn();
        },
      });
    } catch (e) {
      console.error('[VoiceCall] Error:', e);
      onStateChange('idle');
    }
  };

  // بدء الدورة الأولى
  await processTurn();
}

export async function endVoiceCall(): Promise<void> {
  callActive = false;
  if (recording) {
    try {
      await recording.stopAndUnloadAsync();
    } catch (e) {}
    recording = null;
  }
  await Speech.stop();
}

export function isCallActive(): boolean {
  return callActive;
}
