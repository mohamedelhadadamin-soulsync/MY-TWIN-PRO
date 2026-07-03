import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet } from '../lib/httpClient';

export default function Index() {
  const navigated = useRef(false);
  const [statusText, setStatusText] = useState('جاري التحميل...');

  useEffect(() => {
    if (navigated.current) return;

    const run = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('mytwin-user');
        
        if (storedUserId) {
          setStatusText('تم العثور على الجلسة...');
          try {
            const profile = await apiGet(`/api/profile?user_id=${storedUserId}`);
            setStatusText('جار التوجيه...');
            await new Promise(r => setTimeout(r, 500));
            if (!navigated.current) {
              navigated.current = true;
              router.replace(profile?.onboarded ? '/twin-mind' : '/onboarding');
            }
          } catch {
            setStatusText('تعذر الاتصال بالخادم. جار التوجيه للتسجيل...');
            await new Promise(r => setTimeout(r, 1500));
            if (!navigated.current) {
              navigated.current = true;
              router.replace('/splash');
            }
          }
        } else {
          setStatusText('لا توجد جلسة. جار التوجيه لشاشة البداية...');
          await new Promise(r => setTimeout(r, 1000));
          if (!navigated.current) {
            navigated.current = true;
            router.replace('/splash');
          }
        }
      } catch (e) {
        console.error('Index error:', e);
        setStatusText('حدث خطأ. إعادة المحاولة...');
        await new Promise(r => setTimeout(r, 1500));
        if (!navigated.current) {
          navigated.current = true;
          router.replace('/splash');
        }
      }
    };

    const timer = setTimeout(run, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0014' }}>
      <ActivityIndicator size="large" color="#7C3AED" />
      <Text style={{ color: '#A78BFA', marginTop: 16, fontSize: 14, textAlign: 'center', paddingHorizontal: 20 }}>
        {statusText}
      </Text>
    </View>
  );
}
