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
  totalWeight?: number;
  totalTransactions?: number;
  createdAt?: string;
}

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
          { headers: { 'bypass-tunnel-reminder': 'true' } }
        );
        return response.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
      }
    },
    onSuccess: async (data) => {
      if (data && data.user) {
        const userToSave = normalizeUser(data.user, data.user.provider || 'email');
        setUser(userToSave);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userToSave));
        if (data.token) {
          await saveToken(data.token);
        }
        console.log('Đăng nhập thành công và đã lưu User vào State');
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
        console.log('LỖI PHẢI HỒI TỪ BE:', JSON.stringify(error.response?.data));
        throw new Error(error.response?.data?.message || 'Đăng ký thất bại');
      }
    },
    onSuccess: async (data) => {
      if (data && data.user) {
        const userToSave = normalizeUser(data.user, data.user.provider || 'email');

        setUser(userToSave);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userToSave));

        if (data.token) {
          await saveToken(data.token);
        }
        console.log('Đăng ký thành công và đã lưu User vào State');
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
        throw new Error(error.response?.data?.message || 'Đăng nhập Google thất bại');
      }
    },
    onSuccess: async (data) => {
      if (data && data.user) {
        const userToSave = normalizeUser(data.user, data.user.provider || 'google');
        setUser(userToSave);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userToSave));
        if (data.token) {
          await saveToken(data.token);
        }
        console.log('Đăng nhập Google thành công và đã lưu User vào State')
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
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    await clearStoredToken();
    console.log('Đã đăng xuất và xóa User khỏi State');
  }, []);

  const updateAvatarUrl = useCallback(async (avatarUrl: string) => {
    if (!user) return;
    
    const updatedUser: AuthUser = {
      ...user,
      avatar: avatarUrl,
    };
    
    setUser(updatedUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
  }, [user]);

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
    login: loginMutation.mutate,
    loginError: loginMutation.error?.message ?? null,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerError: registerMutation.error?.message ?? null,
    isRegistering: registerMutation.isPending,
    loginWithGoogle: googleLoginMutation.mutate,
    isGoogleLogging: googleLoginMutation.isPending,
    googleLoginError: googleLoginMutation.error?.message ?? null,
    socialLogin: socialLoginMutation.mutate,
    isSocialLogging: socialLoginMutation.isPending,
    socialLoginError: socialLoginMutation.error?.message ?? null,
    logout,
    updateAvatarUrl,
    updateUser,  
    getAuthToken,
  };
});