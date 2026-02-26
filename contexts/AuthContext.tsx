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
      await new Promise((r) => setTimeout(r, 1500));
      if (!email || !password) throw new Error('Vui lòng nhập đầy đủ thông tin');
      if (password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
      const mockUser: AuthUser = {
        id: 'user_1',
        name: email.split('@')[0],
        email,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
        provider: 'email',
      };
      return mockUser;
    },
    onSuccess: async (data) => {
      setUser(data);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      await new Promise((r) => setTimeout(r, 1500));
      if (!name || !email || !password) throw new Error('Vui lòng nhập đầy đủ thông tin');
      if (password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
      if (!email.includes('@')) throw new Error('Email không hợp lệ');
      const mockUser: AuthUser = {
        id: 'user_' + Date.now(),
        name,
        email,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
        provider: 'email',
      };
      return mockUser;
    },
    onSuccess: async (data) => {
      setUser(data);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
