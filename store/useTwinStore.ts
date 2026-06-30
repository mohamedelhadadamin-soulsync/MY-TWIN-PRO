import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, apiGet } from '../lib/httpClient';
import { useEnergyStore } from './useEnergyStore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'twin' | 'system';
  content: string;
  timestamp: number;
  emotion?: string;
  provider?: string;
  failed?: boolean;
  image?: string;
  thinkingStage?: string;
}

export type Tier = 'free' | 'plus' | 'premium' | 'pro' | 'yearly';
export type TwinGender = 'female' | 'male';
export type TwinStyle = 'supportive' | 'coach' | 'wise' | 'fun' | 'calm';
export type ReplyStyle = 'short' | 'medium' | 'long';
export type Theme = 'dark' | 'light';
export type Lang = 'ar' | 'en';

export interface TwinStore {
  userId: string;
  twinName: string;
  twinGender: TwinGender;
  twinStyle: TwinStyle;
  twinTraits: string[];
  replyStyle: ReplyStyle;
  tier: Tier;
  theme: Theme;
  lang: Lang;
  calmMode: boolean;
  voiceEnabled: boolean;
  voicePersonality: string;
  chatHistory: ChatMessage[];
  totalMessages: number;
  isThinking: boolean;
  thinkingStage: string;
  streamingText: string;
  twinEnergy: number;
  bondLevel: number;
  relationshipDims: Record<string, number>;
  journeyPhase: string;
  attachmentStyle: string;
  activeStudySession: any;
  activeBusinessProject: any;
  activeLifePlan: any;
  recentDreams: any[];
  tasks: any[];
  userStats: any;
  recommendations: string[];
  proactiveMessage: string;
  menuVisible: boolean;
  points: number;
  badges: string[];

  isOnline: boolean;
  lastSyncTimestamp: string | null;
  conversationStreak: number;
  usedMemoryCount: number;
  awarenessScore: number;
  dailyNotificationsSent: number;
  dailyNotificationsLimit: number;
  activeProjectContext: any | null;
  suggestedCapability: { type: string; route: string; label_ar: string; label_en: string } | null;

  setAuth: (userId: string) => void;
  setTier: (tier: Tier) => void;
  setLang: (lang: Lang) => void;
  toggleTheme: () => void;
  toggleCalmMode: () => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setVoicePersonality: (personality: string) => void;
  setTwinName: (name: string) => void;
  setTwinGender: (gender: TwinGender) => void;
  setTwinStyle: (style: TwinStyle) => void;
  setReplyStyle: (style: ReplyStyle) => void;
  setTwinTraits: (traits: string[]) => void;
  addMessage: (msg: Partial<ChatMessage>) => void;
  sendMessage: (message: string) => Promise<{ success: boolean; error?: string }>;
  setThinking: (thinking: boolean) => void;
  setThinkingStage: (stage: string) => void;
  setStreamingText: (text: string) => void;
  setTwinEnergy: (val: number) => void;
  updateBond: (val: number) => void;
  getEnergyPercent: () => number;

  setOnline: (online: boolean) => void;
  setConversationStreak: (streak: number) => void;
  incrementUsedMemory: () => void;
  setAwarenessData: (score: number, sent: number, limit: number) => void;
  syncWithServer: () => Promise<void>;
  resetToDefaults: () => void;

  loadProjectContext: (project: any) => void;
  clearProjectContext: () => void;
  setSuggestedCapability: (cap: { type: string; route: string; label_ar: string; label_en: string } | null) => void;

  getUserStats: () => Promise<void>;
  getRecommendations: () => Promise<void>;
  getMemories: (limit?: number) => Promise<void>;
  getRelationshipInsights: () => Promise<void>;
  getWeeklyReport: () => Promise<void>;
  getRelationshipHealth: () => Promise<void>;
  generateBusinessIdea: (budget: number, interests: string, location: string) => Promise<any>;
  analyzeMarket: (query: string) => Promise<any>;
  generateFeasibility: (idea: string, budget: number) => Promise<any>;
  generateBusinessCanvas: (idea: string) => Promise<any>;
  generateMarketingPlan: (idea: string, budget: number) => Promise<any>;
  startStudySession: (concept: string) => Promise<any>;
  getStudyQuestion: (topic: string) => Promise<any>;
  answerStudyQuestion: (questionId: string, answer: string) => Promise<any>;
  endStudySession: () => Promise<void>;
  startCoachingSession: (topic: string) => Promise<any>;
  getLifeAdvice: (topic: string) => Promise<any>;
  getNutritionPlan: (goal: string) => Promise<any>;
  getFitnessPlan: (goal: string) => Promise<any>;
  createLifePlan: (details: string) => Promise<any>;
  getDeviceStatus: () => Promise<any>;
  sendDeviceCommand: (device: string, command: string) => Promise<any>;
  smartHomeCommand: (command: string) => Promise<any>;
  generateImage: (prompt: string, style: string) => Promise<string>;
  generateContent: (type: string, topic: string) => Promise<any>;
  createTask: (title: string, dueDate?: string, priority?: string) => Promise<any>;
  listTasks: () => Promise<void>;
  completeTask: (taskId: string) => Promise<any>;
  generateCode: (prompt: string, language: string) => Promise<any>;
  debugCode: (code: string, language: string) => Promise<any>;
  interpretDream: (dreamText: string) => Promise<any>;
  clearHistory: () => void;
  logout: () => void;
  openMenu: () => void;
  closeMenu: () => void;
}

const initialState = {
  userId: '',
  twinName: 'توأمك',
  twinGender: 'female' as TwinGender,
  twinStyle: 'supportive' as TwinStyle,
  twinTraits: [] as string[],
  replyStyle: 'medium' as ReplyStyle,
  tier: 'free' as Tier,
  theme: 'light' as Theme,
  lang: 'ar' as Lang,
  calmMode: false,
  voiceEnabled: true,
  voicePersonality: 'friend',
  chatHistory: [] as ChatMessage[],
  totalMessages: 0,
  isThinking: false,
  thinkingStage: 'idle',
  streamingText: '',
  twinEnergy: 100,
  bondLevel: 0,
  relationshipDims: {},
  journeyPhase: 'introduction',
  attachmentStyle: 'unknown',
  activeStudySession: null,
  activeBusinessProject: null,
  activeLifePlan: null,
  recentDreams: [] as any[],
  tasks: [] as any[],
  userStats: null,
  recommendations: [] as string[],
  proactiveMessage: '',
  menuVisible: false,
  points: 0,
  badges: [] as string[],
  isOnline: true,
  lastSyncTimestamp: null,
  conversationStreak: 0,
  usedMemoryCount: 0,
  awarenessScore: 0,
  dailyNotificationsSent: 0,
  dailyNotificationsLimit: 2,
  activeProjectContext: null,
  suggestedCapability: null,
};

const generateId = () => 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);

export const useTwinStore = create<TwinStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAuth: (userId) => {
        set({ userId });
        const tier = get().tier;
        useEnergyStore.getState().setTier(tier);
      },
      setTier: (tier) => {
        set({ tier });
        useEnergyStore.getState().setTier(tier);
      },
      setLang: (lang) => set({ lang }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      toggleCalmMode: () => set((s) => ({ calmMode: !s.calmMode })),
      setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
      setVoicePersonality: (personality) => set({ voicePersonality: personality }),
      setTwinName: (name) => set({ twinName: name }),
      setTwinGender: (gender) => set({ twinGender: gender }),
      setTwinStyle: (style) => set({ twinStyle: style }),
      setReplyStyle: (style) => set({ replyStyle: style }),
      setTwinTraits: (traits) => set({ twinTraits: traits }),
      setThinking: (thinking) => set({ isThinking: thinking }),
      setThinkingStage: (stage) => set({ thinkingStage: stage }),
      setStreamingText: (text) => set({ streamingText: text }),
      setOnline: (online) => set({ isOnline: online }),
      setConversationStreak: (streak) => set({ conversationStreak: streak }),
      incrementUsedMemory: () => set((s) => ({ usedMemoryCount: s.usedMemoryCount + 1 })),
      setAwarenessData: (score, sent, limit) => set({
        awarenessScore: score,
        dailyNotificationsSent: sent,
        dailyNotificationsLimit: limit,
      }),
      syncWithServer: async () => {
        const { userId } = get();
        if (!userId) return;
        try {
          const res = await apiGet(`/api/stats/dashboard?user_id=${userId}`);
          if (res) set({ userStats: res, lastSyncTimestamp: new Date().toISOString(), isOnline: true });
        } catch (e) { set({ isOnline: false }); }
      },
      resetToDefaults: () => set({ ...initialState }),

      addMessage: (msg) =>
        set((s) => ({
          chatHistory: [...s.chatHistory, {
            id: msg.id || generateId(),
            role: msg.role || 'user',
            content: msg.content || '',
            timestamp: msg.timestamp || Date.now(),
            emotion: msg.emotion,
            provider: msg.provider,
            failed: msg.failed,
            image: msg.image,
            thinkingStage: msg.thinkingStage,
          }].slice(-200),
          totalMessages: s.totalMessages + 1,
          twinEnergy: Math.max(0, s.twinEnergy - 2),
          bondLevel: Math.min(s.bondLevel + (Math.random() * 0.3 + 0.1), 100),
        })),

      sendMessage: async (message: string) => {
        const state = get();
        
        const energyStore = useEnergyStore.getState();
        if (!energyStore.consumeEnergy(1)) {
          return { success: false, error: 'out_of_energy' };
        }

        set({ isThinking: true, thinkingStage: 'thinking' });
        state.addMessage({ role: 'user', content: message });
        const twinMsgId = generateId();
        state.addMessage({ id: twinMsgId, role: 'twin', content: '', thinkingStage: 'thinking' });

        try {
          const response = await apiPost('/api/chat', {
            message,
            history: state.chatHistory.slice(-10).map((m) => ({ role: m.role, content: m.content })),
            lang: state.lang,
          });

          set((s) => ({
            chatHistory: s.chatHistory.map((m) =>
              m.id === twinMsgId ? { ...m, content: response.reply, provider: response.provider || 'orchestrator', thinkingStage: 'complete' } : m
            ),
            isThinking: false,
            thinkingStage: 'complete',
          }));

          if (response.suggested_capability) {
            set({ suggestedCapability: response.suggested_capability });
          } else {
            set({ suggestedCapability: null });
          }

          set((s) => ({ usedMemoryCount: s.usedMemoryCount + 1 }));
          return { success: true };
        } catch (error) {
          set((s) => ({
            chatHistory: s.chatHistory.map((m) =>
              m.id === twinMsgId ? { ...m, content: 'عذراً، حدث خطأ في الاتصال 💜', failed: true, thinkingStage: 'complete' } : m
            ),
            isThinking: false,
            thinkingStage: 'complete',
          }));
          return { success: false, error: 'network_error' };
        }
      },

      setTwinEnergy: (val) => set({ twinEnergy: Math.max(0, Math.min(100, Math.round(val))) }),
      updateBond: (val) => set({ bondLevel: Math.min(100, Math.round(val)) }),
      getEnergyPercent: () => get().twinEnergy,

      loadProjectContext: (project) => {
        const { lang } = get();
        const isAr = lang === 'ar';
        let contextMsg = '';
        
        if (project.type === 'code_lab') {
          contextMsg = isAr
            ? `📁 سياق المشروع: ${project.title}\n📝 الكود:\n\`\`\`\n${project.data?.code || ''}\n\`\`\`\n💡 هذا مشروع برمجي. يمكنني مناقشته معك.`
            : `📁 Project context: ${project.title}\n📝 Code:\n\`\`\`\n${project.data?.code || ''}\n\`\`\`\n💡 This is a coding project. I can discuss it with you.`;
        } else if (project.type === 'business') {
          contextMsg = isAr
            ? `📁 سياق المشروع: ${project.title}\n📊 التحليل:\n${project.preview}\n💡 هذا تحليل أعمال. يمكنني مناقشته معك.`
            : `📁 Project context: ${project.title}\n📊 Analysis:\n${project.preview}\n💡 This is a business analysis. I can discuss it with you.`;
        } else if (project.type === 'content') {
          contextMsg = isAr
            ? `📁 سياق المشروع: ${project.title}\n✍️ المحتوى:\n${project.preview}\n💡 هذا محتوى مكتوب. يمكنني مناقشته معك.`
            : `📁 Project context: ${project.title}\n✍️ Content:\n${project.preview}\n💡 This is written content. I can discuss it with you.`;
        } else if (project.type === 'dream') {
          contextMsg = isAr
            ? `📁 سياق الحلم: ${project.title}\n🌙 الحلم:\n${project.data?.dream_text || ''}\n🔮 التفسير:\n${project.data?.interpretation?.substring(0, 300) || ''}\n💡 هذا حلم تم تفسيره. يمكنني مناقشته معك.`
            : `📁 Dream context: ${project.title}\n🌙 Dream:\n${project.data?.dream_text || ''}\n🔮 Interpretation:\n${project.data?.interpretation?.substring(0, 300) || ''}\n💡 This is an interpreted dream. I can discuss it with you.`;
        } else if (project.type === 'study') {
          contextMsg = isAr
            ? `📁 سياق الجلسة الدراسية: ${project.title}\n📚 المفهوم:\n${project.data?.concept || project.preview}\n💡 هذه جلسة دراسية. يمكنني مناقشتها معك.`
            : `📁 Study session context: ${project.title}\n📚 Concept:\n${project.data?.concept || project.preview}\n💡 This is a study session. I can discuss it with you.`;
        } else if (project.type === 'life_coach') {
          contextMsg = isAr
            ? `📁 سياق التدريب: ${project.title}\n💪 التفاصيل:\n${project.preview}\n💡 هذه جلسة تدريب حياة. يمكنني مناقشتها معك.`
            : `📁 Coaching context: ${project.title}\n💪 Details:\n${project.preview}\n💡 This is a life coaching session. I can discuss it with you.`;
        } else if (project.type === 'task') {
          contextMsg = isAr
            ? `📁 سياق المهمة: ${project.title}\n✅ التفاصيل:\n${project.preview}\n💡 هذه مهمة. يمكنني مناقشتها معك.`
            : `📁 Task context: ${project.title}\n✅ Details:\n${project.preview}\n💡 This is a task. I can discuss it with you.`;
        } else {
          contextMsg = isAr
            ? `📁 سياق المشروع: ${project.title}\n💡 يمكنك مناقشة هذا المشروع معي.`
            : `📁 Project context: ${project.title}\n💡 You can discuss this project with me.`;
        }

        set({
          activeProjectContext: project,
          chatHistory: [{
            id: generateId(),
            role: 'system',
            content: contextMsg,
            timestamp: Date.now(),
          }],
        });
      },

      clearProjectContext: () => set({ activeProjectContext: null }),
      
      setSuggestedCapability: (cap) => set({ suggestedCapability: cap }),

      getUserStats: async () => { try { const res = await apiGet(`/api/stats/dashboard?user_id=${get().userId}`); set({ userStats: res, isOnline: true, lastSyncTimestamp: new Date().toISOString() }); } catch (e) { set({ isOnline: false }); } },
      getRecommendations: async () => { try { const res = await apiGet(`/api/recommendations/daily?user_id=${get().userId}`); set({ recommendations: res.recommendations?.map((r: any) => r.message) || [] }); } catch (e) {} },
      getMemories: async (limit = 20) => { try { await apiGet(`/api/memories?user_id=${get().userId}&limit=${limit}`); } catch (e) {} },
      getRelationshipInsights: async () => { try { await apiGet(`/api/relationship/insights?user_id=${get().userId}`); } catch (e) {} },
      getWeeklyReport: async () => { try { await apiGet(`/api/reports/weekly?user_id=${get().userId}`); } catch (e) {} },
      getRelationshipHealth: async () => { try { await apiGet(`/api/relationship/health?user_id=${get().userId}`); } catch (e) {} },

      generateBusinessIdea: async (budget, interests, location) => { useEnergyStore.getState().consumeEnergy(1); return await apiPost('/api/business/generate-idea', { user_id: get().userId, budget, interests, location, lang: get().lang }); },
      analyzeMarket: async (query) => { useEnergyStore.getState().consumeEnergy(1); return await apiPost('/api/business/market-research', { user_id: get().userId, query, lang: get().lang }); },
      generateFeasibility: async (idea, budget) => { useEnergyStore.getState().consumeEnergy(1); return await apiPost('/api/business/feasibility', { user_id: get().userId, idea, budget, lang: get().lang }); },
      generateBusinessCanvas: async (idea) => { useEnergyStore.getState().consumeEnergy(1); return await apiPost('/api/business/canvas', { user_id: get().userId, idea, lang: get().lang }); },
      generateMarketingPlan: async (idea, budget) => { useEnergyStore.getState().consumeEnergy(1); return await apiPost('/api/business/marketing-plan', { user_id: get().userId, idea, budget, lang: get().lang }); },

      startStudySession: async (concept) => { useEnergyStore.getState().consumeEnergy(1); const result = await apiPost('/api/study/start', { user_id: get().userId, concept, language: get().lang }); set({ activeStudySession: { concept, explanation: result.explanation, depth: 0, accuracy: 0 } }); return result; },
      getStudyQuestion: async (topic) => { useEnergyStore.getState().consumeEnergy(1); return await apiPost('/api/study/question', { user_id: get().userId, topic, lang: get().lang }); },
      answerStudyQuestion: async (questionId, answer) => { return await apiPost('/api/study/answer', { user_id: get().userId, question_id: questionId, answer, lang: get().lang }); },
      endStudySession: async () => { await apiPost('/api/study/end', { user_id: get().userId }); set({ activeStudySession: null }); },

      startCoachingSession: async (topic) => { useEnergyStore.getState().consumeEnergy(1); return await apiPost('/api/life-coach/start', { user_id: get().userId, topic, lang: get().lang }); },
      getLifeAdvice: async (topic) => { useEnergyStore.getState().consumeEnergy(1); return await apiPost('/api/life-coach/advice', { user_id: get().userId, topic, lang: get().lang }); },
      getNutritionPlan: async (goal) => { useEnergyStore.getState().consumeEnergy(1); return await apiPost('/api/life-coach/nutrition', { user_id: get().userId, goal, lang: get().lang }); },
      getFitnessPlan: async (goal) => { useEnergyStore.getState().consumeEnergy(1); return await apiPost('/api/life-coach/fitness', { user_id: get().userId, goal, lang: get().lang }); },
      createLifePlan: async (details) => { useEnergyStore.getState().consumeEnergy(1); const result = await apiPost('/api/life-coach/plan', { user_id: get().userId, details, lang: get().lang }); set({ activeLifePlan: result }); return result; },

      getDeviceStatus: async () => { return await apiGet(`/api/smart-home/status?user_id=${get().userId}`); },
      sendDeviceCommand: async (device, command) => { return await apiPost('/api/smart-home/command', { user_id: get().userId, device, command }); },
      smartHomeCommand: async (command) => { useEnergyStore.getState().consumeEnergy(1); return await apiPost('/api/smart-home/command', { user_id: get().userId, command }); },

      generateImage: async (prompt, style) => { useEnergyStore.getState().consumeEnergy(1); const res = await apiPost('/api/image-lab/generate', { user_id: get().userId, prompt, style }); return res.image_url || ''; },
      generateContent: async (type, topic) => { useEnergyStore.getState().consumeEnergy(1); return await apiPost('/api/content/generate', { user_id: get().userId, type, topic, lang: get().lang }); },

      createTask: async (title, dueDate, priority) => { const res = await apiPost('/api/tasks/create', { user_id: get().userId, title, due_date: dueDate, priority }); set((s) => ({ tasks: [...s.tasks, res.task || res] })); return res; },
      listTasks: async () => { try { const res = await apiGet(`/api/tasks?user_id=${get().userId}`); set({ tasks: res.tasks || res || [] }); } catch (e) {} },
      completeTask: async (taskId) => { const res = await apiPost('/api/tasks/complete', { user_id: get().userId, task_id: taskId }); set((s) => ({ tasks: s.tasks.map((t: any) => t.id === taskId ? { ...t, status: 'completed' } : t) })); return res; },

      generateCode: async (prompt, language) => { useEnergyStore.getState().consumeEnergy(1); return await apiPost('/api/code-lab/generate', { user_id: get().userId, prompt, language }); },
      debugCode: async (code, language) => { useEnergyStore.getState().consumeEnergy(1); return await apiPost('/api/code-lab/debug', { user_id: get().userId, code, language }); },

      interpretDream: async (dreamText) => { useEnergyStore.getState().consumeEnergy(1); return await apiPost('/api/dreams/interpret', { user_id: get().userId, dream_text: dreamText, lang: get().lang }); },

      clearHistory: () => set({ chatHistory: [], totalMessages: 0 }),
      logout: () => { set({ ...initialState }); useEnergyStore.getState().resetDaily(); },
      openMenu: () => set({ menuVisible: true }),
      closeMenu: () => set({ menuVisible: false }),
    }),
    {
      name: 'mytwin-store-v4',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userId: state.userId,
        twinName: state.twinName,
        twinGender: state.twinGender,
        twinStyle: state.twinStyle,
        twinTraits: state.twinTraits,
        tier: state.tier,
        theme: state.theme,
        lang: state.lang,
        calmMode: state.calmMode,
        voiceEnabled: state.voiceEnabled,
        voicePersonality: state.voicePersonality,
        bondLevel: state.bondLevel,
        journeyPhase: state.journeyPhase,
        attachmentStyle: state.attachmentStyle,
        points: state.points,
        badges: state.badges,
        conversationStreak: state.conversationStreak,
        usedMemoryCount: state.usedMemoryCount,
        awarenessScore: state.awarenessScore,
        dailyNotificationsSent: state.dailyNotificationsSent,
        dailyNotificationsLimit: state.dailyNotificationsLimit,
        activeProjectContext: state.activeProjectContext,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) console.warn('[MyTwin Store] Rehydration failed – starting fresh');
      },
    }
  )
);
