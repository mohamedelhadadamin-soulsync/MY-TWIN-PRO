/**
 * اختبار شاشة المحادثة
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import Chat from '../app/chat/index';

jest.mock('../store/useTwinStore', () => ({
  useTwinStore: () => ({
    userId: 'test',
    twinName: 'توأمي',
    lang: 'ar',
    chatHistory: [],
    addMessage: jest.fn(),
    voiceEnabled: true,
    setVoiceEnabled: jest.fn(),
    twinEnergy: 100,
    bondLevel: 50,
    openMenu: jest.fn(),
    tier: 'free',
    twinGender: 'female',
  }),
}));

jest.mock('../utils/theme', () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock('../../utils/voice_engine', () => ({
  speakResponse: jest.fn(),
  stopSpeaking: jest.fn(),
}));

jest.mock('../../lib/httpClient', () => ({
  apiGet: () => Promise.resolve({}),
  apiPost: () => Promise.resolve({ reply: 'مرحباً' }),
}));

describe('Chat Screen', () => {
  it('يعرض شاشة المحادثة بدون انهيار', () => {
    const { getByText } = render(<Chat />);
    expect(getByText('توأمي')).toBeTruthy();
  });
});
