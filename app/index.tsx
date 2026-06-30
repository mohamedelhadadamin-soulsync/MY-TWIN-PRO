import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { apiGet } from '../lib/httpClient';

export default function Index() {
  const { userId } = useTwinStore();
  const navigated = useRef(false);

  useEffect(() => {
    if (navigated.current) return;

    const checkUserStatus = async () => {
      try {
        if (userId) {
          // timeout 5 ثوانٍ للخادم
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);

          try {
            const profile = await apiGet(`/api/profile?user_id=${userId}`);
            clearTimeout(timeout);

            if (!navigated.current) {
              navigated.current = true;
              if (profile?.onboarded === true) {
                router.replace('/twin-mind');
              } else {
                router.replace('/onboarding');
              }
            }
          } catch {
            clearTimeout(timeout);
            if (!navigated.current) {
              navigated.current = true;
              router.replace('/splash');
            }
          }
        } else {
          if (!navigated.current) {
            navigated.current = true;
            router.replace('/splash');
          }
        }
      } catch {
        if (!navigated.current) {
          navigated.current = true;
          router.replace('/splash');
        }
      }
    };

    // تأخير بسيط يضمن اكتمال hydration الـ store أولاً
    const timer = setTimeout(checkUserStatus, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0014' }}>
      <ActivityIndicator size="large" color="#7C3AED" />
    </View>
  );
}
