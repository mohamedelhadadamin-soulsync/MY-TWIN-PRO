import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { apiGet } from '../lib/httpClient';

export default function Index() {
  const { userId } = useTwinStore();
  const navigated = useRef(false);
  const [debugMsg, setDebugMsg] = useState('جاري التشخيص...');

  useEffect(() => {
    if (navigated.current) return;

    const run = async () => {
      try {
        if (userId) {
          setDebugMsg(`تم العثور على userId: ${userId.substring(0, 8)}...`);
          try {
            const profile = await apiGet(`/api/profile?user_id=${userId}`);
            setDebugMsg('تم الاتصال بالخادم. جاري التوجيه...');
            await new Promise(r => setTimeout(r, 500));
            if (!navigated.current) {
              navigated.current = true;
              router.replace(profile?.onboarded ? '/twin-mind' : '/onboarding');
            }
          } catch {
            setDebugMsg('فشل الاتصال بالخادم. التوجيه للتسجيل...');
            await new Promise(r => setTimeout(r, 1500));
            if (!navigated.current) {
              navigated.current = true;
              router.replace('/splash');
            }
          }
        } else {
          setDebugMsg('لا توجد جلسة. التوجيه لشاشة البداية...');
          await new Promise(r => setTimeout(r, 1000));
          if (!navigated.current) {
            navigated.current = true;
            router.replace('/splash');
          }
        }
      } catch {
        setDebugMsg('خطأ. إعادة المحاولة...');
        await new Promise(r => setTimeout(r, 1500));
        if (!navigated.current) {
          navigated.current = true;
          router.replace('/splash');
        }
      }
    };

    const timer = setTimeout(run, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0014' }}>
      <ActivityIndicator size="large" color="#7C3AED" />
      <Text style={{ color: '#A78BFA', marginTop: 16, fontSize: 14, textAlign: 'center', paddingHorizontal: 20 }}>
        {debugMsg}
      </Text>
    </View>
  );
}
