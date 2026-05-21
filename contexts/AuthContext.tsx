import axios from 'axios';

import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import createContextHook from '@nkzw/create-context-hook';
import { useMutation } from '@tanstack/react-query';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  provider: 'email' | 'google' | 'zalo';
  phone?: string;
  address?: string;
  greenPoints?: number;
  walletBalance?: number;
  totalWeight?: number;
  totalTransactions?: number;
  createdAt?: string;
}

type RealtimeUserStats = Pick<AuthUser, 'greenPoints' | 'walletBalance' | 'totalWeight' | 'totalTransactions'>;

const STORAGE_KEY = 'auth_user';
const TOKEN_KEY = 'user_token_secure';
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://172.26.40.30:5000').replace(/\/$/, '');

type GoogleProfile = {
  name: string;
  email: string;
  avatar?: string | null;
};

const normalizeUser = (user: any, provider: AuthUser['provider']): AuthUser => ({
  id: user.id || user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar ?? null,
  provider,
  phone: user.phone,
  address: user.address,
  greenPoints: user.greenPoints || 0,
  walletBalance: user.walletBalance ?? 50000,
  totalWeight: user.totalWeight || 0,
  totalTransactions: user.totalTransactions || 0,
  createdAt: user.createdAt,
});

const saveToken = async (token: string) => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Không thể lưu token an toàn:', error);
    throw new Error('Không thể lưu token an toàn');
  }
};

const getStoredToken = async () => {
  const secureToken = await SecureStore.getItemAsync(TOKEN_KEY);
  if (secureToken) {
    return secureToken;
  }

  const legacyToken = await AsyncStorage.getItem('user_token');
  if (legacyToken) {
    await saveToken(legacyToken);
    await AsyncStorage.removeItem('user_token');
    return legacyToken;
  }

  return null;
};

const clearStoredToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await AsyncStorage.removeItem('user_token');
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          getStoredToken(),
        ]);

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
          await AsyncStorage.removeItem(STORAGE_KEY);
          await clearStoredToken();
        }
      } catch (error) {
        console.log('Failed to restore stored user', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/login`,
          { email, password },
          {
            headers: { 'bypass-tunnel-reminder': 'true' },
            timeout: 10000 // Thêm timeout để xử lý khi Server không phản hồi
          }
        );
        return response.data;
      } catch (error: any) {
        // Cực kỳ quan trọng: Throw lỗi để mutateAsync nhận diện thất bại
        const msg = error.response?.data?.message || error.message || 'Không thể kết nối đến máy chủ';
        throw new Error(msg);
      }
    },
    onSuccess: async (data) => {
      if (data && data.user) {
        const userToSave = normalizeUser(data.user, data.user.provider || 'email');
        setUser(userToSave);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userToSave));
        if (data.token) await saveToken(data.token);
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/register`,
          { name, email, password },
          { headers: { 'bypass-tunnel-reminder': 'true' } }
        );
        return response.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Đăng ký thất bại');
      }
    },
    onSuccess: async (data) => {
      if (data && data.user) {
        const userToSave = normalizeUser(data.user, data.user.provider || 'email');
        setUser(userToSave);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userToSave));
        if (data.token) await saveToken(data.token);
      }
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: async ({ idToken, profile }: { idToken: string; profile: GoogleProfile }) => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/google`,
          { idToken, profile },
          { headers: { 'bypass-tunnel-reminder': 'true' } }
        );
        return response.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi đăng nhập Google');
      }
    },
    onSuccess: async (data) => {
      if (data && data.user) {
        const userToSave = normalizeUser(data.user, data.user.provider || 'google');
        setUser(userToSave);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userToSave));
        if (data.token) await saveToken(data.token);
      }
    },
  });

  const socialLoginMutation = useMutation({
    mutationFn: async (provider: 'google' | 'zalo') => {
      await new Promise((r) => setTimeout(r, 2000));
      const names = { google: 'Nguyễn Văn A', zalo: 'Trần Thị B' };
      const emails = { google: 'nguyenvana@gmail.com', zalo: 'tranthib@zalo.me' };
      const mockUser: AuthUser = {
        id: 'user_' + provider + '_' + Date.now(),
        name: names[provider],
        email: emails[provider],
        avatar: 'https://avatarngau.sbs/wp-content/uploads/2025/09/hinh-anh-chung-tay-bao-ve-moi-truong.png',
        provider,
      };
      return mockUser;
    },
    onSuccess: async (data) => {
      setUser(data);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
  });

  const logout = useCallback(async () => {
    try {
    const token = await getStoredToken();
    if (user?.id && token) {
      await axios.put(
        `${API_BASE_URL}/api/user/status`,
        { isOnline: false, lastSeen: new Date() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
  } catch (err) {
    console.error('Lỗi cập nhật trạng thái:', err);
  }

  setUser(null);
  await AsyncStorage.removeItem(STORAGE_KEY);
  await clearStoredToken();
}, [user]);


  const updateAvatarUrl = useCallback(async (avatarUrl: string) => {
    if (!user) return;

    const updatedUser: AuthUser = {
      ...user,
      avatar: avatarUrl,
    };

    setUser(updatedUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
  }, [user]);

  const updateRealtimeStats = useCallback(async (stats: RealtimeUserStats) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;

      const updatedUser: AuthUser = {
        ...currentUser,
        greenPoints: stats.greenPoints ?? currentUser.greenPoints,
        walletBalance: stats.walletBalance ?? currentUser.walletBalance,
        totalWeight: stats.totalWeight ?? currentUser.totalWeight,
        totalTransactions: stats.totalTransactions ?? currentUser.totalTransactions,
      };

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser)).catch((error) => {
        console.error('KhÃ´ng thá»ƒ lÆ°u cáº­p nháº­t vÃ­ realtime:', error);
      });

      return updatedUser;
    });
  }, []);

  const updateUser = useCallback(async (fields: { name?: string; address?: string; phone?: string }) => {
    if (!user) throw new Error('Chưa đăng nhập');

    const token = await getStoredToken();

    const response = await axios.put(
      `${API_BASE_URL}/api/users/profile`,
      fields,
      {
        headers: {
          'bypass-tunnel-reminder': 'true',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const updatedData = response.data?.user ?? response.data ?? {};
    const updatedUser: AuthUser = {
      ...user,
      name: updatedData.name ?? fields.name ?? user.name,
      address: updatedData.address ?? fields.address ?? user.address,
      phone: updatedData.phone ?? fields.phone ?? user.phone,
      greenPoints: updatedData.greenPoints ?? user.greenPoints,
      walletBalance: updatedData.walletBalance ?? user.walletBalance,
      totalWeight: updatedData.totalWeight ?? user.totalWeight,
      totalTransactions: updatedData.totalTransactions ?? user.totalTransactions,
    };

    setUser(updatedUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
  }, [user]);

  const getAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getStoredToken();
      return token;
    } catch (error) {
      console.error('Không thể lấy token:', error);
      return null;
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error?.message ?? null,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    registerError: registerMutation.error?.message ?? null,
    isRegistering: registerMutation.isPending,
    loginWithGoogle: googleLoginMutation.mutateAsync,
    isGoogleLogging: googleLoginMutation.isPending,
    googleLoginError: googleLoginMutation.error?.message ?? null,
    socialLogin: socialLoginMutation.mutateAsync,
    isSocialLogging: socialLoginMutation.isPending,
    socialLoginError: socialLoginMutation.error?.message ?? null,
    logout,
    updateAvatarUrl,
    updateUser,
    updateRealtimeStats,
    getAuthToken,
  };
});
