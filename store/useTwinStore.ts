import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, apiGet } from '../lib/httpClient';

// ── استيراد آمن لـ useEnergyStore ────────────────────────────
let useEnergyStore: any = null;
try {
  useEnergyStore = require('./useEnergyStore').useEnergyStore;
} catch {}

const safeEnergy = () => {
  try { return useEnergyStore?.getState?.() ?? null; }
  catch { return null; }
};

// ================================================================
// Types
// ================================================================
export interface ChatMessage {
  id:             string;
  role:           'user' | 'twin' | 'system';
  content:        string;
  timestamp:      number;
  emotion?:       string;
  provider?:      string;
  failed?:        boolean;
  image?:         string;
  thinkingStage?: string;
  liked?:         boolean;
  disliked?:      boolean;
  replyTo?:       { id: string; content: string; role: string } | null;
}

export type Tier         = 'free' | 'plus' | 'premium' | 'pro' | 'yearly';
export type TwinGender   = 'female' | 'male';
export type TwinStyle    = 'supportive' | 'coach' | 'wise' | 'fun' | 'calm';
export type ReplyStyle   = 'short' | 'medium' | 'long';
export type Theme        = 'dark' | 'light';
export type Lang         = 'ar' | 'en';

// ================================================================
// Store Interface
// ================================================================
export interface TwinStore {
  // ── بيانات المستخدم ──────────────────────────────────────────
  userId:               string;
  twinName:             string;
  twinGender:           TwinGender;
  twinStyle:            TwinStyle;
  twinTraits:           string[];
  replyStyle:           ReplyStyle;
  tier:                 Tier;
  theme:                Theme;
  lang:                 Lang;
  calmMode:             boolean;
  voiceEnabled:         boolean;
  voicePersonality:     string;
  // ── المحادثة ─────────────────────────────────────────────────
  chatHistory:          ChatMessage[];
  totalMessages:        number;
  isThinking:           boolean;
  thinkingStage:        string;
  streamingText:        string;
  // ── الطاقة والعلاقة ──────────────────────────────────────────
  twinEnergy:           number;
  bondLevel:            number;
  relationshipDims:     Record<string, number>;
  journeyPhase:         string;
  attachmentStyle:      string;
  // ── الميزات ──────────────────────────────────────────────────
  activeStudySession:   any;
  activeBusinessProject:any;
  activeLifePlan:       any;
  recentDreams:         any[];
  tasks:                any[];
  // ── النظام ───────────────────────────────────────────────────
  userStats:            any;
  recommendations:      string[];
  proactiveMessage:     string;
  menuVisible:          boolean;
  points:               number;
  badges:               string[];
  isOnline:             boolean;
  lastSyncTimestamp:    string | null;
  conversationStreak:   number;
  usedMemoryCount:      number;
  awarenessScore:       number;
  dailyNotificationsSent:  number;
  dailyNotificationsLimit: number;
  activeProjectContext:    any | null;
  suggestedCapability:     { type: string; route: string; label_ar: string; label_en: string } | null;

  // ── Actions ───────────────────────────────────────────────────
  setAuth:              (userId: string) => void;
  setTier:              (tier: Tier) => void;
  setLang:              (lang: Lang) => void;
  toggleTheme:          () => void;
  toggleCalmMode:       () => void;
  setVoiceEnabled:      (enabled: boolean) => void;
  setVoicePersonality:  (personality: string) => void;
  setTwinName:          (name: string) => void;
  setTwinGender:        (gender: TwinGender) => void;
  setTwinStyle:         (style: TwinStyle) => void;
  setReplyStyle:        (style: ReplyStyle) => void;
  setTwinTraits:        (traits: string[]) => void;
  // ── المحادثة ─────────────────────────────────────────────────
  addMessage:           (msg: Partial<ChatMessage>) => void;
  updateMessage:        (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage:        (id: string) => void;
  sendMessage:          (message: string) => Promise<{ success: boolean; error?: string }>;
  setThinking:          (thinking: boolean) => void;
  setThinkingStage:     (stage: string) => void;
  setStreamingText:     (text: string) => void;
  clearHistory:         () => void;
  // ── الطاقة ───────────────────────────────────────────────────
  setTwinEnergy:        (val: number) => void;
  updateBond:           (val: number) => void;
  getEnergyPercent:     () => number;
  // ── النظام ───────────────────────────────────────────────────
  setOnline:            (online: boolean) => void;
  setConversationStreak:(streak: number) => void;
  incrementUsedMemory:  () => void;
  setAwarenessData:     (score: number, sent: number, limit: number) => void;
  syncWithServer:       () => Promise<void>;
  resetToDefaults:      () => void;
  loadProjectContext:   (project: any) => void;
  clearProjectContext:  () => void;
  setSuggestedCapability:(cap: { type: string; route: string; label_ar: string; label_en: string } | null) => void;
  openMenu:             () => void;
  closeMenu:            () => void;
  logout:               () => void;
  // ── API Actions ───────────────────────────────────────────────
  getUserStats:          () => Promise<void>;
  getRecommendations:    () => Promise<void>;
  getMemories:           (limit?: number) => Promise<void>;
  getRelationshipInsights:() => Promise<void>;
  getWeeklyReport:       () => Promise<void>;
  getRelationshipHealth: () => Promise<void>;
  generateBusinessIdea:  (budget: number, interests: string, location: string) => Promise<any>;
  analyzeMarket:         (query: string) => Promise<any>;
  generateFeasibility:   (idea: string, budget: number) => Promise<any>;
  generateBusinessCanvas:(idea: string) => Promise<any>;
  generateMarketingPlan: (idea: string, budget: number) => Promise<any>;
  startStudySession:     (concept: string) => Promise<any>;
  getStudyQuestion:      (topic: string) => Promise<any>;
  answerStudyQuestion:   (questionId: string, answer: string) => Promise<any>;
  endStudySession:       () => Promise<void>;
  startCoachingSession:  (topic: string) => Promise<any>;
  getLifeAdvice:         (topic: string) => Promise<any>;
  getNutritionPlan:      (goal: string) => Promise<any>;
  getFitnessPlan:        (goal: string) => Promise<any>;
  createLifePlan:        (details: string) => Promise<any>;
  getDeviceStatus:       () => Promise<any>;
  sendDeviceCommand:     (device: string, command: string) => Promise<any>;
  smartHomeCommand:      (command: string) => Promise<any>;
  generateImage:         (prompt: string, style: string) => Promise<string>;
  generateContent:       (type: string, topic: string) => Promise<any>;
  createTask:            (title: string, dueDate?: string, priority?: string) => Promise<any>;
  listTasks:             () => Promise<void>;
  completeTask:          (taskId: string) => Promise<any>;
  generateCode:          (prompt: string, language: string) => Promise<any>;
  debugCode:             (code: string, language: string) => Promise<any>;
  interpretDream:        (dreamText: string) => Promise<any>;
}

// ================================================================
// Initial State
// ================================================================
const initialState = {
  userId:               '',
  twinName:             'توأمك',
  twinGender:           'female' as TwinGender,
  twinStyle:            'supportive' as TwinStyle,
  twinTraits:           [] as string[],
  replyStyle:           'medium' as ReplyStyle,
  tier:                 'free' as Tier,
  theme:                'light' as Theme,
  lang:                 'ar' as Lang,
  calmMode:             false,
  voiceEnabled:         true,
  voicePersonality:     'friend',
  chatHistory:          [] as ChatMessage[],
  totalMessages:        0,
  isThinking:           false,
  thinkingStage:        'idle',
  streamingText:        '',
  twinEnergy:           100,
  bondLevel:            0,
  relationshipDims:     {} as Record<string, number>,
  journeyPhase:         'introduction',
  attachmentStyle:      'unknown',
  activeStudySession:   null,
  activeBusinessProject:null,
  activeLifePlan:       null,
  recentDreams:         [] as any[],
  tasks:                [] as any[],
  userStats:            null,
  recommendations:      [] as string[],
  proactiveMessage:     '',
  menuVisible:          false,
  points:               0,
  badges:               [] as string[],
  isOnline:             true,
  lastSyncTimestamp:    null as string | null,
  conversationStreak:   0,
  usedMemoryCount:      0,
  awarenessScore:       0,
  dailyNotificationsSent:  0,
  dailyNotificationsLimit: 2,
  activeProjectContext:    null,
  suggestedCapability:     null,
};

const generateId = () =>
  'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);

// ================================================================
// Store
// ================================================================
export const useTwinStore = create<TwinStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ── Auth ────────────────────────────────────────────────
      setAuth: (userId) => {
        set({ userId });
        safeEnergy()?.setTier?.(get().tier);
      },
      setTier: (tier) => {
        set({ tier });
        safeEnergy()?.setTier?.(tier);
      },

      // ── Settings ────────────────────────────────────────────
      setLang:             (lang)        => set({ lang }),
      toggleTheme:         ()            => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      toggleCalmMode:      ()            => set(s => ({ calmMode: !s.calmMode })),
      setVoiceEnabled:     (enabled)     => set({ voiceEnabled: enabled }),
      setVoicePersonality: (personality) => set({ voicePersonality: personality }),
      setTwinName:         (name)        => set({ twinName: name }),
      setTwinGender:       (gender)      => set({ twinGender: gender }),
      setTwinStyle:        (style)       => set({ twinStyle: style }),
      setReplyStyle:       (style)       => set({ replyStyle: style }),
      setTwinTraits:       (traits)      => set({ twinTraits: traits }),
      setThinking:         (thinking)    => set({ isThinking: thinking }),
      setThinkingStage:    (stage)       => set({ thinkingStage: stage }),
      setStreamingText:    (text)        => set({ streamingText: text }),
      setOnline:           (online)      => set({ isOnline: online }),
      setConversationStreak:(streak)     => set({ conversationStreak: streak }),
      incrementUsedMemory: ()            => set(s => ({ usedMemoryCount: s.usedMemoryCount + 1 })),
      setAwarenessData:    (score, sent, limit) => set({
        awarenessScore: score,
        dailyNotificationsSent: sent,
        dailyNotificationsLimit: limit,
      }),

      // ── Menu ────────────────────────────────────────────────
      openMenu:  () => set({ menuVisible: true }),
      closeMenu: () => set({ menuVisible: false }),

      // ── Energy & Bond ────────────────────────────────────────
      setTwinEnergy:    (val) => set({ twinEnergy: Math.max(0, Math.min(100, Math.round(val))) }),
      updateBond:       (val) => set({ bondLevel: Math.min(100, Math.round(val)) }),
      getEnergyPercent: ()    => get().twinEnergy,

      // ── Project Context ──────────────────────────────────────
      loadProjectContext: (project) => {
        const { lang } = get();
        const isAr = lang === 'ar';
        let ctx = '';
        if (project.type === 'code_lab') {
          ctx = isAr
            ? `📁 ${project.title}\n\`\`\`\n${project.data?.code || ''}\n\`\`\``
            : `📁 ${project.title}\n\`\`\`\n${project.data?.code || ''}\n\`\`\``;
        } else {
          ctx = `📁 ${project.title}\n${project.preview || ''}`;
        }
        set({
          activeProjectContext: project,
          chatHistory: [
            { id: generateId(), role: 'system', content: ctx, timestamp: Date.now() },
            { id: generateId(), role: 'user', content: isAr ? `أريد مناقشة "${project.title}"` : `Let's discuss "${project.title}"`, timestamp: Date.now() + 1 },
          ],
        });
      },
      clearProjectContext:   () => set({ activeProjectContext: null }),
      setSuggestedCapability:(cap) => set({ suggestedCapability: cap }),

      // ================================================================
      // Chat Actions – الأهم: addMessage + updateMessage + removeMessage
      // ================================================================
      addMessage: (msg) =>
        set(s => ({
          chatHistory: [...s.chatHistory, {
            id:           msg.id        || generateId(),
            role:         msg.role      || 'user',
            content:      msg.content   || '',
            timestamp:    msg.timestamp || Date.now(),
            emotion:      msg.emotion,
            provider:     msg.provider,
            failed:       msg.failed    || false,
            image:        msg.image,
            thinkingStage:msg.thinkingStage,
            liked:        msg.liked     || false,
            disliked:     msg.disliked  || false,
            replyTo:      msg.replyTo   || null,
          }].slice(-200),
          totalMessages: s.totalMessages + 1,
          twinEnergy:    Math.max(0, s.twinEnergy - (msg.role === 'user' ? 2 : 0)),
        })),

      // ✅ تحديث رسالة موجودة (للـ Streaming)
      updateMessage: (id, updates) =>
        set(s => ({
          chatHistory: s.chatHistory.map(m =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      // ✅ حذف رسالة
      removeMessage: (id) =>
        set(s => ({
          chatHistory: s.chatHistory.filter(m => m.id !== id),
        })),

      // ── sendMessage (legacy - للـ store actions القديمة) ────────
      sendMessage: async (message) => {
        const state = get();
        const energy = safeEnergy();
        if (energy && !energy.consumeEnergy?.(1)) {
          return { success: false, error: 'out_of_energy' };
        }
        set({ isThinking: true, thinkingStage: 'thinking' });
        state.addMessage({ role: 'user', content: message });
        const twinMsgId = generateId();
        state.addMessage({ id: twinMsgId, role: 'twin', content: '' });
        try {
          const response = await apiPost('/api/chat', {
            message,
            history: state.chatHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
            lang: state.lang,
          });
          set(s => ({
            chatHistory: s.chatHistory.map(m =>
              m.id === twinMsgId
                ? { ...m, content: response.reply, provider: response.provider || 'orchestrator' }
                : m
            ),
            isThinking:   false,
            thinkingStage:'complete',
            suggestedCapability: response.suggested_capability || null,
          }));
          return { success: true };
        } catch {
          set(s => ({
            chatHistory: s.chatHistory.map(m =>
              m.id === twinMsgId
                ? { ...m, content: 'عذراً، حدث خطأ في الاتصال 💜', failed: true }
                : m
            ),
            isThinking:    false,
            thinkingStage: 'complete',
          }));
          return { success: false, error: 'network_error' };
        }
      },

      clearHistory: () => set({ chatHistory: [], totalMessages: 0 }),

      // ── Sync & Reset ─────────────────────────────────────────────
      syncWithServer: async () => {
        const { userId } = get();
        if (!userId) return;
        try {
          const res = await apiGet(`/api/stats/dashboard?user_id=${userId}`);
          if (res) set({ userStats: res, lastSyncTimestamp: new Date().toISOString(), isOnline: true });
        } catch { set({ isOnline: false }); }
      },
      resetToDefaults: () => set({ ...initialState }),
      logout: () => {
        set({ ...initialState });
        safeEnergy()?.resetDaily?.();
      },

      // ── API Actions ──────────────────────────────────────────────
      getUserStats:           async () => { try { const res = await apiGet(`/api/stats/dashboard?user_id=${get().userId}`); set({ userStats: res, isOnline: true, lastSyncTimestamp: new Date().toISOString() }); } catch { set({ isOnline: false }); } },
      getRecommendations:     async () => { try { const res = await apiGet(`/api/recommendations/daily?user_id=${get().userId}`); set({ recommendations: res.recommendations?.map((r: any) => r.message) || [] }); } catch {} },
      getMemories:            async (limit = 20) => { try { await apiGet(`/api/memories?user_id=${get().userId}&limit=${limit}`); } catch {} },
      getRelationshipInsights:async () => { try { await apiGet(`/api/relationship/insights?user_id=${get().userId}`); } catch {} },
      getWeeklyReport:        async () => { try { await apiGet(`/api/reports/weekly?user_id=${get().userId}`); } catch {} },
      getRelationshipHealth:  async () => { try { await apiGet(`/api/relationship/health?user_id=${get().userId}`); } catch {} },

      generateBusinessIdea:   async (budget, interests, location) => { safeEnergy()?.consumeEnergy?.(1); return await apiPost('/api/business/generate-idea',  { user_id: get().userId, budget, interests, location, lang: get().lang }); },
      analyzeMarket:          async (query)          => { safeEnergy()?.consumeEnergy?.(1); return await apiPost('/api/business/market-research', { user_id: get().userId, query, lang: get().lang }); },
      generateFeasibility:    async (idea, budget)   => { safeEnergy()?.consumeEnergy?.(1); return await apiPost('/api/business/feasibility',     { user_id: get().userId, idea, budget, lang: get().lang }); },
      generateBusinessCanvas: async (idea)           => { safeEnergy()?.consumeEnergy?.(1); return await apiPost('/api/business/canvas',          { user_id: get().userId, idea, lang: get().lang }); },
      generateMarketingPlan:  async (idea, budget)   => { safeEnergy()?.consumeEnergy?.(1); return await apiPost('/api/business/marketing-plan',  { user_id: get().userId, idea, budget, lang: get().lang }); },

      startStudySession:    async (concept)              => { safeEnergy()?.consumeEnergy?.(1); const r = await apiPost('/api/study/start',    { user_id: get().userId, concept, language: get().lang }); set({ activeStudySession: { concept, explanation: r.explanation } }); return r; },
      getStudyQuestion:     async (topic)                => { safeEnergy()?.consumeEnergy?.(1); return await apiPost('/api/study/question',  { user_id: get().userId, topic, lang: get().lang }); },
      answerStudyQuestion:  async (questionId, answer)   => { return await apiPost('/api/study/answer',    { user_id: get().userId, question_id: questionId, answer, lang: get().lang }); },
      endStudySession:      async ()                     => { await apiPost('/api/study/end', { user_id: get().userId }); set({ activeStudySession: null }); },

      startCoachingSession: async (topic)  => { safeEnergy()?.consumeEnergy?.(1); return await apiPost('/api/life-coach/start',    { user_id: get().userId, topic, lang: get().lang }); },
      getLifeAdvice:        async (topic)  => { safeEnergy()?.consumeEnergy?.(1); return await apiPost('/api/life-coach/advice',   { user_id: get().userId, topic, lang: get().lang }); },
      getNutritionPlan:     async (goal)   => { safeEnergy()?.consumeEnergy?.(1); return await apiPost('/api/life-coach/nutrition',{ user_id: get().userId, goal,  lang: get().lang }); },
      getFitnessPlan:       async (goal)   => { safeEnergy()?.consumeEnergy?.(1); return await apiPost('/api/life-coach/fitness',  { user_id: get().userId, goal,  lang: get().lang }); },
      createLifePlan:       async (details)=> { safeEnergy()?.consumeEnergy?.(1); const r = await apiPost('/api/life-coach/plan', { user_id: get().userId, details, lang: get().lang }); set({ activeLifePlan: r }); return r; },

      getDeviceStatus:      async ()                   => { return await apiGet(`/api/smart-home/status?user_id=${get().userId}`); },
      sendDeviceCommand:    async (device, command)    => { return await apiPost('/api/smart-home/command', { user_id: get().userId, device, command }); },
      smartHomeCommand:     async (command)            => { safeEnergy()?.consumeEnergy?.(1); return await apiPost('/api/smart-home/command', { user_id: get().userId, command }); },

      generateImage:   async (prompt, style) => { safeEnergy()?.consumeEnergy?.(1); const r = await apiPost('/api/image-lab/generate', { user_id: get().userId, prompt, style }); return r.image_url || ''; },
      generateContent: async (type, topic)   => { safeEnergy()?.consumeEnergy?.(1); return await apiPost('/api/content/generate',     { user_id: get().userId, type, topic, lang: get().lang }); },

      createTask:   async (title, dueDate, priority) => { const r = await apiPost('/api/tasks/create',   { user_id: get().userId, title, due_date: dueDate, priority }); set(s => ({ tasks: [...s.tasks, r.task || r] })); return r; },
      listTasks:    async ()                          => { try { const r = await apiGet(`/api/tasks?user_id=${get().userId}`); set({ tasks: r.tasks || r || [] }); } catch {} },
      completeTask: async (taskId)                   => { const r = await apiPost('/api/tasks/complete', { user_id: get().userId, task_id: taskId }); set(s => ({ tasks: s.tasks.map((t: any) => t.id === taskId ? { ...t, status: 'completed' } : t) })); return r; },

      generateCode:   async (prompt, language) => { safeEnergy()?.consumeEnergy?.(1); return await apiPost('/api/code-lab/generate', { user_id: get().userId, prompt, language }); },
      debugCode:      async (code, language)   => { safeEnergy()?.consumeEnergy?.(1); return await apiPost('/api/code-lab/debug',    { user_id: get().userId, code,   language }); },
      interpretDream: async (dreamText)        => { safeEnergy()?.consumeEnergy?.(1); return await apiPost('/api/dreams/interpret',  { user_id: get().userId, dream_text: dreamText, lang: get().lang }); },
    }),
    {
      name:    'mytwin-store-v4',
      version: 4,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState: any, version: number) => {
        // كل إصدار قديم يرجع للـ initial state بأمان
        if (version < 4) {
          return {
            ...initialState,
            // نحتفظ فقط بالبيانات الشخصية
            userId:            persistedState?.userId            || '',
            twinName:          persistedState?.twinName          || 'توأمك',
            twinGender:        persistedState?.twinGender        || 'female',
            tier:              persistedState?.tier              || 'free',
            lang:              persistedState?.lang              || 'ar',
            theme:             persistedState?.theme             || 'light',
            bondLevel:         persistedState?.bondLevel         || 0,
            conversationStreak:persistedState?.conversationStreak|| 0,
            points:            persistedState?.points            || 0,
            badges:            persistedState?.badges            || [],
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        userId:               state.userId,
        twinName:             state.twinName,
        twinGender:           state.twinGender,
        twinStyle:            state.twinStyle,
        twinTraits:           state.twinTraits,
        tier:                 state.tier,
        theme:                state.theme,
        lang:                 state.lang,
        calmMode:             state.calmMode,
        voiceEnabled:         state.voiceEnabled,
        voicePersonality:     state.voicePersonality,
        bondLevel:            state.bondLevel,
        journeyPhase:         state.journeyPhase,
        attachmentStyle:      state.attachmentStyle,
        points:               state.points,
        badges:               state.badges,
        conversationStreak:   state.conversationStreak,
        usedMemoryCount:      state.usedMemoryCount,
        awarenessScore:       state.awarenessScore,
        dailyNotificationsSent:  state.dailyNotificationsSent,
        dailyNotificationsLimit: state.dailyNotificationsLimit,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) console.warn('[TwinStore] Rehydration failed - using fresh state');
      },
    }
  )
);
