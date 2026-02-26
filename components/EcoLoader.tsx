import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';

const logoImage = require('@/assets/images/logo.png');

interface EcoLoaderProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'overlay' | 'inline';
}

export default function EcoLoader({
  message = 'Đang tải...',
  size = 'medium',
  variant = 'default',
}: EcoLoaderProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.8)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const leafRotate1 = useRef(new Animated.Value(0)).current;
  const leafRotate2 = useRef(new Animated.Value(0)).current;
  const leafRotate3 = useRef(new Animated.Value(0)).current;

  const dims = size === 'small' ? 40 : size === 'medium' ? 64 : 88;
  const ringWidth = size === 'small' ? 3 : size === 'medium' ? 4 : 5;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.92,
          duration: 1000,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const createDotAnim = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

    createDotAnim(dot1Anim, 0).start();
    createDotAnim(dot2Anim, 200).start();
    createDotAnim(dot3Anim, 400).start();

    const createLeafOrbit = (anim: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

    createLeafOrbit(leafRotate1, 2400).start();
    createLeafOrbit(leafRotate2, 3200).start();
    createLeafOrbit(leafRotate3, 2800).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const leaf1Rotate = leafRotate1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const leaf2Rotate = leafRotate2.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const leaf3Rotate = leafRotate3.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderSpinner = () => (
    <View style={[styles.spinnerContainer, { width: dims * 2, height: dims * 2 }]}>
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: dims * 1.3,
            height: dims * 1.3,
            borderRadius: dims * 0.65,
            transform: [{ rotate: spin }, { scale: pulseAnim }],
          },
        ]}
      />

      {/* Orbiting dots with premium colors */}
      <Animated.View
        style={[
          styles.leafOrbit,
          {
            width: dims * 2,
            height: dims * 2,
            transform: [{ rotate: leaf1Rotate }],
          },
        ]}
      >
        <View style={[styles.orbitDot, styles.orbitDotGradient1, { top: 0, left: dims - 5 }]} />
      </Animated.View>

      <Animated.View
        style={[
          styles.leafOrbit,
          {
            width: dims * 2,
            height: dims * 2,
            transform: [{ rotate: leaf2Rotate }],
          },
        ]}
      >
        <View style={[styles.orbitDot, styles.orbitDotGradient2, { top: dims - 5, right: 0 }]} />
      </Animated.View>

      <Animated.View
        style={[
          styles.leafOrbit,
          {
            width: dims * 2,
            height: dims * 2,
            transform: [{ rotate: leaf3Rotate }],
          },
        ]}
      >
        <View style={[styles.orbitDot, styles.orbitDotGradient3, { bottom: 0, left: dims - 5 }]} />
      </Animated.View>

      {/* Premium gradient ring */}
      <Animated.View
        style={[
          styles.ringOuter,
          {
            width: dims,
            height: dims,
            borderRadius: dims / 2,
            borderWidth: ringWidth,
            transform: [{ rotate: spin }],
          },
        ]}
      />

      {/* Center logo with shadow */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            width: dims * 0.7,
            height: dims * 0.7,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Image
          source={logoImage}
          style={[styles.logoImage, { width: dims * 0.7, height: dims * 0.7 }]}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsRow}>
      {[dot1Anim, dot2Anim, dot3Anim].map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -6],
                  }),
                },
              ],
              opacity: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );

  if (variant === 'inline') {
    return (
      <View style={styles.inlineContainer}>
        {renderSpinner()}
        {message ? <Text style={styles.inlineMessage}>{message}</Text> : null}
        {renderDots()}
      </View>
    );
  }

  if (variant === 'overlay') {
    return (
      <View style={styles.overlayContainer}>
        <View style={styles.overlayCard}>
          {renderSpinner()}
          {message ? <Text style={styles.overlayMessage}>{message}</Text> : null}
          {renderDots()}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderSpinner()}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {renderDots()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: Colors.background,
  },
  inlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 32,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  overlayCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute' as const,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.15)',
  },
  ringOuter: {
    position: 'absolute' as const,
    borderColor: 'transparent',
    borderTopColor: '#4CAF50',
    borderRightColor: '#66BB6A',
    borderBottomColor: '#81C784',
    borderLeftColor: '#A5D6A7',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  logoWrapper: {
    position: 'absolute' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  leafOrbit: {
    position: 'absolute' as const,
  },
  orbitDot: {
    position: 'absolute' as const,
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  orbitDotGradient1: {
    backgroundColor: '#4CAF50',
    borderWidth: 1.5,
    borderColor: '#66BB6A',
  },
  orbitDotGradient2: {
    backgroundColor: '#00BCD4',
    borderWidth: 1.5,
    borderColor: '#26C6DA',
  },
  orbitDotGradient3: {
    backgroundColor: '#009688',
    borderWidth: 1.5,
    borderColor: '#26A69A',
  },
  message: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  inlineMessage: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  overlayMessage: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center' as const,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
});
