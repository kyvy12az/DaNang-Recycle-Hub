import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface EcoLoaderProps {
  message?: string;
}

const EcoLoader = ({ message = "Đang tải dữ liệu..." }: EcoLoaderProps) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Tạo hiệu ứng xoay liên tục (animate-spin)
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000, // 1 giây cho một vòng quay
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => animation.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#D1D5DB',
    borderTopColor: '#4CAF50',
  },
  loadingText: {
    marginTop: 16,
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EcoLoader;