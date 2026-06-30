import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import * as Clipboard from 'expo-clipboard';
import { AlertTriangle, RefreshCw, Copy } from 'lucide-react-native';

// مكون عرض الخطأ (وظيفي – يدعم الخطافات)
const ErrorFallback = ({
  featureName,
  error,
  onRetry,
  onCopy,
}: {
  featureName: string;
  error?: Error;
  onRetry: () => void;
  onCopy: () => void;
}) => {
  const { lang } = useTwinStore();
  const theme = useTheme();
  const isAr = lang === 'ar';
  const isDark = theme?.mode === 'dark' || theme?.name === 'dark';

  const colors = {
    bg: isDark ? '#0F0A1A' : '#FAFAF8',
    text: isDark ? '#FFFFFF' : '#1A1226',
    subtext: isDark ? '#A78BFA' : '#6B7280',
    accent: '#7C3AED',
    danger: '#EF4444',
    dangerLight: '#EF444415',
    border: isDark ? '#2D1B4D' : '#E8E8E3',
    retryBtn: '#7C3AED',
    copyBtn: isDark ? '#1A1226' : '#F3F0FF',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.dangerLight }]}>
        <AlertTriangle size={48} stroke={colors.danger} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {isAr
          ? `حدث خطأ في ${featureName}`
          : `Error in ${featureName}`}
      </Text>

      <Text style={[styles.message, { color: colors.subtext }]}>
        {error?.message || (isAr ? 'خطأ غير معروف' : 'Unknown error')}
      </Text>

      <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.retryBtn }]} onPress={onRetry} activeOpacity={0.8}>
        <RefreshCw size={18} stroke="#FFF" />
        <Text style={styles.retryText}>
          {isAr ? 'إعادة المحاولة' : 'Retry'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.copyBtn, { backgroundColor: colors.copyBtn, borderColor: colors.border }]} onPress={onCopy} activeOpacity={0.7}>
        <Copy size={16} stroke={colors.subtext} />
        <Text style={[styles.copyText, { color: colors.subtext }]}>
          {isAr ? 'نسخ التفاصيل' : 'Copy details'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// مكون حدود الخطأ (كلاسي – ضروري لـ Error Boundary)
interface Props {
  children: React.ReactNode;
  featureName: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class FeatureErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`❌ ${this.props.featureName}:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleCopyDetails = () => {
    const details = this.state.error
      ? `${this.state.error.name}: ${this.state.error.message}`
      : '';
    Clipboard.setStringAsync(details);
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          featureName={this.props.featureName}
          error={this.state.error}
          onRetry={this.handleReset}
          onCopy={this.handleCopyDetails}
        />
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
    padding: 28,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  copyText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
