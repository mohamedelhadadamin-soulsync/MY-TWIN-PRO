import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, RotateCcw } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * 🛡️ FeatureErrorBoundary
 * يحمي أي ميزة (Feature) من إسقاط التطبيق بالكامل.
 * ضعه حول أي مكون جديد أو مُعدّل.
 */
export class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[FeatureErrorBoundary]', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View style={styles.container}>
          <AlertTriangle size={40} stroke="#F59E0B" />
          <Text style={styles.title}>حدث خطأ في هذه الميزة</Text>
          <Text style={styles.subtitle}>باقي التطبيق يعمل بشكل طبيعي. يمكنك إعادة المحاولة.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={this.handleRetry}>
            <RotateCcw size={18} stroke="#FFF" />
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0014', padding: 30 },
  title: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#A78BFA', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#7C3AED', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});

export default FeatureErrorBoundary;
