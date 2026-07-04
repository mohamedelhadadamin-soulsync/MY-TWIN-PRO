import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function Splash() {
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    const tests: [string, () => any][] = [
      ['useTwinStore',   () => require('../store/useTwinStore')],
      ['useEnergyStore', () => require('../store/useEnergyStore')],
      ['ErrorBoundary',  () => require('../components/ErrorBoundary')],
      ['theme',          () => require('../utils/theme')],
      ['httpClient',     () => require('../lib/httpClient')],
      ['auth',           () => require('../lib/auth')],
      ['tierConfig',     () => require('../lib/tierConfig')],
      ['voice_engine',   () => require('../utils/voice_engine')],
      ['notifications',  () => require('../lib/notifications')],
      ['SideMenu',       () => require('../components/SideMenu')],
      ['ChatBubbles',    () => require('./chat/ChatBubbles')],
      ['ChatComponents', () => require('./chat/ChatComponents')],
      ['ChatInput',      () => require('./chat/ChatInput')],
    ];

    const logs: string[] = [];

    for (const [name, fn] of tests) {
      try {
        fn();
        logs.push('✅ ' + name);
      } catch (e: any) {
        logs.push('❌ ' + name + ': ' + String(e?.message || e).slice(0, 100));
      }
    }

    setResults(logs);
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0A0014' }}
      contentContainerStyle={{ padding: 20, paddingTop: 60 }}
    >
      <Text style={{ color: '#A78BFA', fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
        🔍 Diagnostic Mode
      </Text>
      {results.length === 0 && (
        <Text style={{ color: '#F59E0B', fontSize: 13 }}>جاري الفحص...</Text>
      )}
      {results.map((r, i) => (
        <Text
          key={i}
          style={{
            color:       r.startsWith('✅') ? '#10B981' : '#EF4444',
            fontSize:    12,
            marginBottom:8,
            lineHeight:  18,
          }}
        >
          {r}
        </Text>
      ))}
    </ScrollView>
  );
}
