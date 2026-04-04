import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import Colors from '@/constants/colors';

interface OTPInputProps {
  length?: number;
  value: string[];
  onChange: (otp: string[]) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export default function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
}: OTPInputProps) {
  const inputRefs = useRef<TextInput[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  useEffect(() => {
    // Auto submit when all fields filled
    const otpString = value.join('');
    if (otpString.length === length && onComplete) {
      onComplete(otpString);
    }
  }, [value, length, onComplete]);

  const handleChangeText = (text: string, index: number) => {
    if (disabled) return;

    const newOtp = [...value];
    // Only accept numbers
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length > 0) {
      newOtp[index] = numericText.slice(-1);
      onChange(newOtp);
      
      // Move to next input
      if (index < length - 1 && numericText) {
        inputRefs.current[index + 1]?.focus();
        setFocusedIndex(index + 1);
      }
    } else {
      newOtp[index] = '';
      onChange(newOtp);
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (disabled) return;

    const { key } = e.nativeEvent;

    // Handle backspace
    if (key === 'Backspace') {
      if (value[index] === '' && index > 0) {
        // If current is empty, go back and clear previous
        const newOtp = [...value];
        newOtp[index - 1] = '';
        onChange(newOtp);
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      } else {
        // Clear current
        const newOtp = [...value];
        newOtp[index] = '';
        onChange(newOtp);
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }, (_, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            if (ref) inputRefs.current[index] = ref;
          }}
          style={[
            styles.input,
            focusedIndex === index && styles.inputFocused,
            value[index] && styles.inputFilled,
            error && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
          value={value[index] || ''}
          onChangeText={(text) => handleChangeText(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          keyboardType="numeric"
          maxLength={1}
          editable={!disabled}
          selectTextOnFocus
          caretHidden={false}
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          testID={`otp-input-${index}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  input: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  inputFocused: {
    borderColor: Colors.primaryLight,
    backgroundColor: '#F1F8E9',
    shadowColor: Colors.primaryLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  inputFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#E8F5E9',
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: '#FFEBEE',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    color: '#9E9E9E',
  },
});
