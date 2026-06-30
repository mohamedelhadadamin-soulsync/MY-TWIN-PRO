import { useState, useRef, useCallback } from 'react';
import { apiPost } from './httpClient';
import { useTwinStore } from '../store/useTwinStore';

interface StreamingState {
  isStreaming: boolean;
  error: string | null;
}

export function useStreamingChat() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const { addMessage, setStreamingText, setThinking, setThinkingStage, updateBond, setTwinEnergy } = useTwinStore();

  const sendStreamingMessage = useCallback(
    async (message: string, image?: string) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setState({ isStreaming: true, error: null });
      setThinking(true);
      setThinkingStage('thinking');

      const userMsgId = `msg_${Date.now().toString(36)}_user`;
      addMessage({
        id: userMsgId,
        role: 'user',
        content: message,
        timestamp: Date.now(),
        image,
      });

      const twinMsgId = `msg_${Date.now().toString(36)}_twin`;
      addMessage({
        id: twinMsgId,
        role: 'twin',
        content: '',
        timestamp: Date.now(),
        thinkingStage: 'thinking',
      });

      let accumulatedText = '';
      setStreamingText(accumulatedText);
      setThinkingStage('memory');

      try {
        const store = useTwinStore.getState();

        // محاكاة مرحلة استرجاع الذاكرة
        await new Promise(resolve => setTimeout(resolve, 300));
        setThinkingStage('generating');

        // استخدام apiPost العادي بدلاً من streamChat
        const response = await apiPost('/api/chat', {
          message,
          history: store.chatHistory.slice(-10).map((h) => ({
            role: h.role,
            content: h.content,
          })),
          lang: store.lang,
        });

        const fullText = response?.reply || '';

        // محاكاة تأثير البث عبر تحديث النص تدريجياً
        for (let i = 0; i < fullText.length; i += 3) {
          accumulatedText = fullText.substring(0, i + 3);
          setStreamingText(accumulatedText);
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        useTwinStore.setState((s) => ({
          chatHistory: s.chatHistory.map((msg) =>
            msg.id === twinMsgId
              ? { ...msg, content: fullText, thinkingStage: 'complete', provider: response?.provider || 'orchestrator' }
              : msg
          ),
        }));

        // تحديث الطاقة والترابط
        const newEnergy = Math.max(0, store.twinEnergy - 2);
        setTwinEnergy(newEnergy);
        
        const newBond = Math.min(store.bondLevel + (Math.random() * 0.3 + 0.1), 100);
        updateBond(newBond);

        setThinking(false);
        setThinkingStage('complete');
        setStreamingText('');
        setState({ isStreaming: false, error: null });
        return fullText;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          setState({ isStreaming: false, error: null });
          return '';
        }

        setThinking(false);
        setThinkingStage('complete');
        setStreamingText('');

        const errorMsg =
          error.message === 'SESSION_EXPIRED'
            ? 'انتهت الجلسة، الرجاء تسجيل الدخول مجدداً'
            : 'حدث خطأ في الاتصال';

        useTwinStore.setState((s) => ({
          chatHistory: s.chatHistory.map((msg) =>
            msg.id === twinMsgId
              ? { ...msg, content: errorMsg, failed: true, thinkingStage: 'complete' }
              : msg
          ),
        }));

        setState({ isStreaming: false, error: errorMsg });
        return '';
      }
    },
    [addMessage, setStreamingText, setThinking, setThinkingStage, updateBond, setTwinEnergy]
  );

  const cancelStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setState({ isStreaming: false, error: null });
    setThinking(false);
    setStreamingText('');
  }, [setThinking, setStreamingText]);

  return {
    sendStreamingMessage,
    cancelStream,
    isStreaming: state.isStreaming,
    error: state.error,
  };
}
