/**
 * اختبار شاشة Twin Mind – المكون الرئيسي للوعي
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import TwinMindCenter from '../app/twin-mind';

// Mock للـ stores
jest.mock('../store/useTwinStore', () => ({
  useTwinStore: () => ({
    userId: 'test_user',
    twinName: 'توأمي',
    lang: 'ar',
  }),
}));

jest.mock('../store/useEnergyStore', () => ({
  useEnergyStore: () => ({
    getRemainingMessages: () => 15,
    dailyMessageLimit: 20,
  }),
}));

jest.mock('../utils/theme', () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock('../lib/httpClient', () => ({
  apiGet: () => Promise.resolve({ unified_feeling: 'أنا اليوم نشيط', pending_questions: [] }),
}));

describe('TwinMindCenter', () => {
  it('يعرض اسم التوأم', async () => {
    const { getByText } = render(<TwinMindCenter />);
    await waitFor(() => {
      expect(getByText('توأمي')).toBeTruthy();
    });
  });

  it('يعرض الشعور الموحد', async () => {
    const { getByText } = render(<TwinMindCenter />);
    await waitFor(() => {
      expect(getByText('أنا اليوم نشيط')).toBeTruthy();
    });
  });
});
