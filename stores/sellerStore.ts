import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WasteItem, WasteType } from '@/types';

export interface AIRecognitionResult {
  wasteType: WasteType;
  confidence: number;
  estimatedWeight: number;
  group?: 'recyclable' | 'organic' | 'hazardous' | 'non-recyclable';
  status?: 'success' | 'low-confidence' | 'fallback' | 'needs-review';
  guidance?: string;
}

interface SellerState {
  // Danh sách rác đang được nhận diện
  recognizedItems: WasteItem[];
  // Ảnh đã chụp
  capturedImageUri: string | null;
  // Kết quả AI
  aiResults: AIRecognitionResult[];
  // Trạng thái
  isLoading: boolean;
  error: string | null;
  confidenceThreshold: number;

  // Actions
  setCapturedImage: (uri: string | null) => void;
  setRecognizedItems: (items: WasteItem[]) => void;
  addRecognizedItem: (item: WasteItem) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  setAIResults: (results: AIRecognitionResult[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
}

export const useSellerStore = create<SellerState>()(
  persist(
    (set) => ({
      recognizedItems: [],
      capturedImageUri: null,
      aiResults: [],
      isLoading: false,
      error: null,
      confidenceThreshold: 0.7,

      setCapturedImage: (uri) => set({ capturedImageUri: uri }),

      setRecognizedItems: (items) => set({ recognizedItems: items }),

      addRecognizedItem: (item) =>
        set((state) => ({
          recognizedItems: [...state.recognizedItems, item],
        })),

      updateItemQuantity: (itemId, quantity) =>
        set((state) => ({
          recognizedItems: state.recognizedItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity: Math.max(0.5, quantity),
                  estimatedPrice: item.wasteType.pricePerKg * Math.max(0.5, quantity),
                }
              : item
          ),
        })),

      removeItem: (itemId) =>
        set((state) => ({
          recognizedItems: state.recognizedItems.filter((item) => item.id !== itemId),
        })),

      setAIResults: (results) => set({ aiResults: results }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearAll: () =>
        set({
          recognizedItems: [],
          capturedImageUri: null,
          aiResults: [],
          error: null,
        }),
    }),
    {
      name: 'seller-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        confidenceThreshold: state.confidenceThreshold,
      }),
    }
  )
);
