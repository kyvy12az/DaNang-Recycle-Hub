import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
  size?: number;
}

/**
 * Standardized back button component used across all pages
 * Provides consistent styling and behavior for navigation
 */
export default function BackButton({ 
  onPress, 
  color = Colors.white,
  size = 24 
}: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.button}
      activeOpacity={0.7}
      accessible={true}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <ArrowLeft size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
