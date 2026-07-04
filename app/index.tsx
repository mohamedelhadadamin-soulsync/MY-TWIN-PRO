import React, { useState, useEffect, lazy, Suspense } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

// مكون خفيف للتحميل
function Fallback() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7C3AED" />
      <Text style={styles.text}>جاري تهيئة الوعي...</Text>
    </View>
  );
}

// المكون الرئيسي يتم تحميله بشكل كسول
const AppEntry = lazy(() => import('../components/AppEntry'));

export default function Index() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // تأخير بسيط لضمان استقرار الشاشة قبل تحميل المكون الثقيل
    const timer = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return <Fallback />;
  }

  return (
    <Suspense fallback={<Fallback />}>
      <AppEntry />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0014',
  },
  text: {
    color: '#A78BFA',
    marginTop: 16,
    fontSize: 14,
  },
});
