import React from 'react';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function WalletLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primaryDark,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="deposit"
        options={{
          title: 'Nạp tiền',
          headerBackTitle: 'Quay lại',
        }}
      />
      <Stack.Screen
        name="withdraw"
        options={{
          title: 'Rút tiền',
          headerBackTitle: 'Quay lại',
        }}
      />
      <Stack.Screen
        name="otp-verify"
        options={{
          title: 'Xác thực OTP',
          headerBackTitle: 'Quay lại',
        }}
      />

    </Stack>
  );
}
