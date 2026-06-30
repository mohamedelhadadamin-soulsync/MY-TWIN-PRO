import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { useTwinStore } from '../store/useTwinStore';
import { apiPost } from '../lib/httpClient';

export type TwinGender = 'male' | 'female';
export type EmotionTone = 'neutral' | 'happy' | 'sad' | 'excited' | 'calm' | 'serious';

const IOS_VOICES: Record<TwinGender, string> = { male: 'com.apple.ttsbundle.Maged-compact', female: 'com.apple.ttsbundle.Laila-compact' };

let _speakingQueue: Array<{ text: string; resolve: () => void }> = [];
let _isProcessingQueue = false;

function stripMarkdown(text: string): string {
  return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '').replace(/[#*_~>{}\[\]|]/g, '').replace(/\n{2,}/g, ' ').replace(/\s+/g, ' ').trim();
}

// ✅ محاولة ElevenLabs أولاً
async function speakViaElevenLabs(text: string, gender: string): Promise<boolean> {
  try {
    const response = await apiPost('/api/tts/elevenlabs', { text, voice_gender: gender, premium: true });
    if (response?.audio_base64) {
      const FileSystem = require('expo-file-system');
      const path = FileSystem.cacheDirectory + 'tts_11l.mp3';
      await FileSystem.writeAsStringAsync(path, response.audio_base64, { encoding: FileSystem.EncodingType.Base64 });
      const { sound } = await Audio.Sound.createAsync({ uri: path });
      await sound.playAsync();
      return true;
    }
  } catch (e) { console.log('ElevenLabs fallback'); }
  return false;
}

export async function speakResponse(text: string, options?: { emotion?: EmotionTone; onStart?: () => void; onDone?: () => void }): Promise<void> {
  const clean = stripMarkdown(text).slice(0, 800);
  if (!clean.trim()) { options?.onDone?.(); return; }

  const store = useTwinStore.getState();
  const gender: TwinGender = store.twinGender === 'male' ? 'male' : 'female';

  return new Promise((resolve) => {
    _speakingQueue.push({ text: clean, resolve });
    if (!_isProcessingQueue) processQueue(gender);
    options?.onStart?.();
  });
}

async function processQueue(gender: TwinGender): Promise<void> {
  if (_speakingQueue.length === 0) { _isProcessingQueue = false; return; }
  _isProcessingQueue = true;
  const { text, resolve } = _speakingQueue.shift()!;

  try {
    const elevenSuccess = await speakViaElevenLabs(text, gender);
    if (!elevenSuccess) {
      await Speech.stop();
      const opts: Speech.SpeechOptions = {
        language: 'ar-SA',
        pitch: gender === 'female' ? 1.22 : 0.88,
        rate: 0.95,
        onDone: () => { resolve(); processQueue(gender); },
        onError: () => { resolve(); processQueue(gender); },
        onStopped: () => { resolve(); processQueue(gender); },
      };
      if (Platform.OS === 'ios') opts.voice = IOS_VOICES[gender];
      Speech.speak(text, opts);
    } else {
      resolve(); processQueue(gender);
    }
  } catch { resolve(); processQueue(gender); }
}

export async function stopSpeaking(): Promise<void> { await Speech.stop(); }
export async function isSpeaking(): Promise<boolean> { return Speech.isSpeakingAsync(); }
