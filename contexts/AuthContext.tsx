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
}

const STORAGE_KEY = 'auth_user';
const MOCK_ADMIN_EMAIL = 'kyvydev@admin.com';
const MOCK_ADMIN_PASSWORD = 'kyvydev';
const MOCK_ADMIN_USER: AuthUser = {
  id: 'mock-admin',
  name: 'Ky Vy Dev',
  email: MOCK_ADMIN_EMAIL,
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  provider: 'email',
};

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
      if (
        email.trim().toLowerCase() === MOCK_ADMIN_EMAIL &&
        password === MOCK_ADMIN_PASSWORD
      ) {
        return { user: MOCK_ADMIN_USER, token: 'mock-admin-token' };
      }

      try {
        const response = await axios.post(
          'http://192.168.1.55:5000/api/login',
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
          avatar: data.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
          provider: 'email',
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
          'http://192.168.1.55:5000/api/register',
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
          avatar: data.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
          provider: 'email',
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
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
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
