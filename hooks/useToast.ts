import { useState, useRef, useEffect, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
}

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timeoutRefs.current[id]) {
      clearTimeout(timeoutRefs.current[id]);
      delete timeoutRefs.current[id];
    }
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) => {
    const id = String(++toastId);
    const newToast: ToastMessage = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    const timeout = setTimeout(() => {
      removeToast(id);
    }, duration);
    
    timeoutRefs.current[id] = timeout;
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => {
    addToast(message, 'success', duration || 3000);
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    addToast(message, 'error', duration || 4000);
  }, [addToast]);

  const info = useCallback((message: string, duration?: number) => {
    addToast(message, 'info', duration || 3000);
  }, [addToast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return { toasts, success, error, info, removeToast };
};
