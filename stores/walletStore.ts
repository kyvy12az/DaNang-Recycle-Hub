import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Generate mock transactions for initial state
function generateMockTransactions(): TransactionRecord[] {
  const now = new Date();
  return [
    {
      id: 'TXN001',
      type: 'sale',
      amount: 95000,
      description: 'Bán 10kg nhựa PET',
      status: 'completed',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'TXN002',
      type: 'deposit',
      amount: 500000,
      bankName: 'Vietcombank',
      description: 'Nạp tiền Vietcombank',
      status: 'completed',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'TXN003',
      type: 'bonus',
      amount: 5000,
      description: 'Thưởng điểm xanh tuần 10',
      status: 'completed',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'TXN004',
      type: 'redeem',
      amount: 15000,
      description: 'Đổi voucher Highlands Coffee',
      status: 'completed',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'TXN005',
      type: 'sale',
      amount: 32000,
      description: 'Bán 5kg giấy carton',
      status: 'completed',
      timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'TXN006',
      type: 'withdraw',
      amount: 100000,
      bankName: 'MoMo',
      description: 'Rút tiền về MoMo',
      status: 'completed',
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'TXN007',
      type: 'deposit',
      amount: 200000,
      bankName: 'Techcombank',
      description: 'Nạp tiền Techcombank',
      status: 'completed',
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'TXN008',
      type: 'sale',
      amount: 125000,
      description: 'Bán 8kg nhôm phế liệu',
      status: 'completed',
      timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'TXN009',
      type: 'bonus',
      amount: 10000,
      description: 'Thưởng ngườii dùng thân thiết',
      status: 'completed',
      timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'TXN010',
      type: 'redeem',
      amount: 20000,
      description: 'Đổi túi vải tái chế',
      status: 'completed',
      timestamp: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export interface Bank {
  id: string;
  name: string;
  code: string;
  icon: string;
  url: string;
  color: string;
}

export interface VietQRBank {
  id: number;
  name: string;
  code: string; // Tên viết tắt (VCB, MB,...)
  bin: string;
  shortName: string;
  logo: string; // URL logo thực tế
  transferSupported: number;
}

export type TransactionType = 'deposit' | 'withdraw' | 'sale' | 'redeem' | 'bonus';

export interface TransactionRecord {
  id: string;
  type: TransactionType;
  amount: number;
  bankName?: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  note?: string;
}

interface WalletState {
  vndBalance: number;
  selectedBank: Bank | null;
  pendingAmount: number;
  pendingType: 'deposit' | 'withdraw' | null;
  otpAttempts: number;
  lastOtpTime: number | null;
  transactions: TransactionRecord[];
  greenPoints: number;
  
  // Actions
  setSelectedBank: (bank: Bank | null) => void;
  setPendingTransaction: (type: 'deposit' | 'withdraw', amount: number) => void;
  clearPendingTransaction: () => void;
  incrementOtpAttempts: () => void;
  resetOtpAttempts: () => void;
  setLastOtpTime: (time: number) => void;
  
  // Transaction actions
  deposit: (amount: number, bankName: string) => void;
  withdraw: (amount: number, bankName: string) => boolean;
  addFromSale: (orderId: string, amount: number, points: number, description: string) => void;
  addGreenPoints: (points: number, description?: string) => void;
  deductForPurchase: (orderId: string, amount: number, description: string) => void;
  
  // Getters
  canWithdraw: (amount: number) => boolean;
  getFormattedBalance: () => string;
}

fetchBanks: async () => {
  try {
    const response = await fetch('https://api.vietqr.io/v2/banks');
    const data = await response.json();
    if (data.code === '00') {
      // Lưu data.data vào state của bạn
      return data.data;
    }
  } catch (error) {
    console.error('Lỗi khi lấy danh sách ngân hàng:', error);
  }
}

export const MOCK_BANKS: Bank[] = [
  { id: '1', name: 'Vietcombank', code: 'VCB', icon: 'landmark', url: 'https://vietcombank.vn/pay', color: '#1B5E20' },
  { id: '2', name: 'BIDV', code: 'BIDV', icon: 'landmark', url: 'https://bidv.vn/payment', color: '#01579B' },
  { id: '3', name: 'Techcombank', code: 'TCB', icon: 'landmark', url: 'https://techcombank.com/pay', color: '#D32F2F' },
  { id: '4', name: 'MoMo', code: 'MOMO', icon: 'wallet', url: 'https://momo.vn/pay', color: '#D500F9' },
  { id: '5', name: 'ZaloPay', code: 'ZALO', icon: 'wallet', url: 'https://zalopay.vn/pay', color: '#00B0FF' },
  { id: '6', name: 'Agribank', code: 'AGB', icon: 'landmark', url: 'https://agribank.com.vn/pay', color: '#2E7D32' },
  { id: '7', name: 'Sacombank', code: 'SCB', icon: 'landmark', url: 'https://sacombank.com/pay', color: '#00695C' },
];

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      vndBalance: 250000, // Mock số dư ban đầu
      selectedBank: null,
      pendingAmount: 0,
      pendingType: null,
      otpAttempts: 0,
      lastOtpTime: null,
      transactions: generateMockTransactions(),
      greenPoints: 150, // Mock điểm xanh ban đầu

      setSelectedBank: (bank) => set({ selectedBank: bank }),
      
      setPendingTransaction: (type, amount) => set({ 
        pendingType: type, 
        pendingAmount: amount 
      }),
      
      clearPendingTransaction: () => set({ 
        pendingType: null, 
        pendingAmount: 0,
        selectedBank: null 
      }),
      
      incrementOtpAttempts: () => set((state) => ({ 
        otpAttempts: state.otpAttempts + 1 
      })),
      
      resetOtpAttempts: () => set({ otpAttempts: 0 }),
      
      setLastOtpTime: (time) => set({ lastOtpTime: time }),

      deposit: (amount, bankName) => {
        const newTransaction: TransactionRecord = {
          id: `TXN${Date.now()}`,
          type: 'deposit',
          amount,
          bankName,
          status: 'completed',
          timestamp: new Date().toISOString(),
        };
        
        set((state) => ({
          vndBalance: state.vndBalance + amount,
          transactions: [newTransaction, ...state.transactions],
        }));
      },

      withdraw: (amount, bankName) => {
        if (get().vndBalance < amount) return false;
        
        const newTransaction: TransactionRecord = {
          id: `TXN${Date.now()}`,
          type: 'withdraw',
          amount,
          bankName,
          status: 'completed',
          timestamp: new Date().toISOString(),
        };
        
        set((state) => ({
          vndBalance: state.vndBalance - amount,
          transactions: [newTransaction, ...state.transactions],
        }));
        return true;
      },

      addFromSale: (orderId, amount, points, description) => {
        const newTransaction: TransactionRecord = {
          id: orderId,
          type: 'sale',
          amount,
          description,
          status: 'completed',
          timestamp: new Date().toISOString(),
        };
        
        set((state) => ({
          vndBalance: state.vndBalance + amount,
          greenPoints: state.greenPoints + points,
          transactions: [newTransaction, ...state.transactions],
        }));
      },

      addGreenPoints: (points, description = 'Thưởng game phân loại rác') => {
        if (points <= 0) return;

        const newTransaction: TransactionRecord = {
          id: `GAME${Date.now()}`,
          type: 'bonus',
          amount: points,
          description,
          status: 'completed',
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          greenPoints: state.greenPoints + points,
          transactions: [newTransaction, ...state.transactions],
        }));
      },

      canWithdraw: (amount) => get().vndBalance >= amount,
      
      getFormattedBalance: () => {
        return get().vndBalance.toLocaleString('vi-VN') + ' ₫';
      },
    }),
    {
      name: 'wallet-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
