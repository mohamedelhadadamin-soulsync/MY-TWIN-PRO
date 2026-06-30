import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost } from './httpClient';
import { useTwinStore } from '../store/useTwinStore';

const OFFLINE_QUEUE_KEY = 'mytwin_offline_queue';
const RESPONSE_CACHE_KEY = 'mytwin_response_cache';
const MAX_CACHED_RESPONSES = 100;
const MAX_RETRIES = 3;

interface QueuedMessage {
  id: string;
  message: string;
  timestamp: number;
  retries: number;
  userId?: string;
  lang?: string;
}

// ========== Cache ==========
export async function cacheResponse(query: string, reply: string): Promise<void> {
  try {
    const cached = await getResponseCacheMap();
    const key = simpleHash(query.trim().toLowerCase());
    cached[key] = { reply, timestamp: Date.now() };
    const entries = Object.entries(cached);
    if (entries.length > MAX_CACHED_RESPONSES) {
      const oldest = entries.sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      delete cached[oldest];
    }
    await AsyncStorage.setItem(RESPONSE_CACHE_KEY, JSON.stringify(cached));
  } catch {}
}

export async function getCachedResponse(message: string): Promise<string | null> {
  try {
    const cached = await getResponseCacheMap();
    const key = simpleHash(message.trim().toLowerCase());
    const entry = cached[key];
    if (entry && Date.now() - entry.timestamp < 3600_000) return entry.reply; // 1 hour TTL
    return null;
  } catch {
    return null;
  }
}

async function getResponseCacheMap(): Promise<Record<string, { reply: string; timestamp: number }>> {
  try {
    const raw = await AsyncStorage.getItem(RESPONSE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ========== Offline Queue ==========
export async function addToOfflineQueue(message: string): Promise<void> {
  try {
    const state = useTwinStore.getState();
    const queue = await getOfflineQueue();
    queue.push({
      id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      message,
      timestamp: Date.now(),
      retries: 0,
      userId: state.userId,
      lang: state.lang,
    });
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export async function getOfflineQueue(): Promise<QueuedMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function clearOfflineQueue(): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([]));
}

export async function processOfflineQueue(): Promise<number> {
  const queue = await getOfflineQueue();
  if (!queue.length) return 0;

  let processed = 0;
  const remaining: QueuedMessage[] = [];

  for (const item of queue) {
    try {
      await apiPost('/api/chat', {
        message: item.message,
        lang: item.lang || 'ar',
        user_id: item.userId,
      });
      processed++;
    } catch {
      if (item.retries < MAX_RETRIES) {
        remaining.push({ ...item, retries: item.retries + 1 });
      }
    }
  }

  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
  return processed;
}

// ========== Network Status ==========
type NetworkCallback = (online: boolean) => void;
const listeners: NetworkCallback[] = [];
let online = true;

export function onNetworkChange(cb: NetworkCallback): () => void {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

export function setNetworkStatus(connected: boolean): void {
  if (online !== connected) {
    online = connected;
    listeners.forEach(cb => cb(connected));
    if (connected) processOfflineQueue().catch(() => {});
  }
}

export function getNetworkStatus(): boolean {
  return online;
}
