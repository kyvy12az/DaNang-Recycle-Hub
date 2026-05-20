import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

interface ScreenHeaderProps {
  title: string;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
  showBackButton?: boolean;
}

/**
 * Standardized header component with back button and title
 * Matches the design shown in reference image: ← Thông tin Khách hàng
 * Used across all pages for consistent navigation and header styling
 */
export default function ScreenHeader({
  title,
  onBackPress,
  rightAction,
  backgroundColor = Colors.white,
  titleColor = Colors.text,
  showBackButton = true,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        { 
          backgroundColor,
          paddingTop: insets.top + 8,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Back Button */}
        {showBackButton && (
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={24} color={titleColor} />
          </TouchableOpacity>
        )}

        {/* Title */}
        <Text
          style={[styles.title, { color: titleColor }]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* Right Action Spacer or Custom Action */}
        <View style={styles.rightSpacer}>
          {rightAction}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  rightSpacer: {
    width: 40,
  },
});
