import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { ToastMessage } from '@/hooks/useToast';
import { CheckCircle, AlertCircle, Info } from 'lucide-react-native';

interface ToastDisplayProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastDisplay({ toasts, onDismiss }: ToastDisplayProps) {
  const insets = useSafeAreaInsets();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color={Colors.white} />;
      case 'error':
        return <AlertCircle size={20} color={Colors.white} />;
      case 'info':
      default:
        return <Info size={20} color={Colors.white} />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'info':
      default:
        return '#2196F3';
    }
  };

  return (
    <View style={[styles.container, { top: insets.top + 16 }]}>
      {toasts.map((toast) => (
        <View
          key={toast.id}
          style={[
            styles.toast,
            { backgroundColor: getBackgroundColor(toast.type) },
          ]}
        >
          <View style={styles.toastContent}>
            {getIcon(toast.type)}
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    pointerEvents: 'none',
  },
  toast: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    lineHeight: 20,
  },
});
