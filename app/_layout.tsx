import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="splash" />
          <Stack.Screen name="twin-mind" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="login" />
          <Stack.Screen name="onboarding" />
        </Stack>
      </View>
    </ErrorBoundary>
  );
}
