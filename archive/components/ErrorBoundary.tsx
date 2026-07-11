import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Shield, RefreshCw } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // يمكن إرسال الخطأ إلى Sentry أو أي خدمة تحليل
    try {
      const Sentry = require('@sentry/react-native');
      Sentry.captureException(error);
    } catch (e) {}
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.iconWrap}>
            <Shield size={48} stroke="#7C3AED" />
          </View>
          <Text style={styles.title}>حدث خطأ غير متوقع</Text>
          <Text style={styles.subtitle}>
            نعمل على إصلاح المشكلة. يمكنك المحاولة مرة أخرى.
          </Text>
          {this.state.error && (
            <Text style={styles.errorText} numberOfLines={3}>
              {this.state.error.message}
            </Text>
          )}
          <TouchableOpacity style={styles.retryBtn} onPress={this.handleReset}>
            <RefreshCw size={20} stroke="#FFF" />
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0014',
    padding: 30,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#7C3AED20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#A78BFA',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default ErrorBoundary;
