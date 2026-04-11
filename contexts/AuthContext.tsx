import axios from 'axios';

import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useMutation } from '@tanstack/react-query';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'email' | 'google' | 'zalo';
  phone?: string;
  address?: string;
  greenPoints?: number;
  totalWeight?: number;
  totalTransactions?: number;
  createdAt?: string;
}

const STORAGE_KEY = 'auth_user';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          console.log('Failed to parse stored user', e);
        }
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {

      try {
        const response = await axios.post(
          'http://192.168.1.160:5000/api/login',
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
        const userToSave: AuthUser = {
          id: data.user.id || data.user._id,
          name: data.user.name,
          email: data.user.email,
          avatar:  data.user.avatar ||'https://avatarngau.sbs/wp-content/uploads/2025/09/hinh-anh-chung-tay-bao-ve-moi-truong.png',
          provider: 'email',
          phone: data.user.phone,
          address: data.user.address,
          greenPoints: data.user.greenPoints || 0,
          totalWeight: data.user.totalWeight || 0,
          totalTransactions: data.user.totalTransactions || 0,
          createdAt: data.user.createdAt,
        };
        setUser(userToSave);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userToSave));
        if (data.token) {
          await AsyncStorage.setItem('user_token', data.token);
        }
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      try {
        const response = await axios.post(
          'http://192.168.1.160:5000/api/register',
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
        const userToSave: AuthUser = {
          id: data.user.id || data.user._id,
          name: data.user.name,
          email: data.user.email,
          avatar: data.user.avatar || 'https://avatarngau.sbs/wp-content/uploads/2025/09/hinh-anh-chung-tay-bao-ve-moi-truong.png',
          provider: 'email',
          phone: data.user.phone,
          address: data.user.address,
          greenPoints: data.user.greenPoints || 0,
          totalWeight: data.user.totalWeight || 0,
          totalTransactions: data.user.totalTransactions || 0,
          createdAt: data.user.createdAt,
        };

        setUser(userToSave);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userToSave));

        if (data.token) {
          await AsyncStorage.setItem('user_token', data.token);
        }
        console.log('Đăng ký thành công và đã lưu User vào State');
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
    socialLogin: socialLoginMutation.mutate,
    isSocialLogging: socialLoginMutation.isPending,
    socialLoginError: socialLoginMutation.error?.message ?? null,
    logout,
  };
});
