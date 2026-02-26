import { create } from 'zustand';

export interface WalletTransaction {
  id: string;
  type: 'sale' | 'purchase' | 'reward_redeem' | 'withdrawal' | 'point_to_cash' | 'bonus';
  amount: number; // VND
  points: number; // Điểm xanh
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  relatedId?: string; // ID của listing, reward, etc.
}

interface WalletState {
  vndBalance: number; // Số dư VND
  greenPoints: number; // Điểm xanh
  transactions: WalletTransaction[];
  
  // Actions
  addFromSale: (listingId: string, amount: number, points: number, description: string) => void;
  deductForPurchase: (listingId: string, amount: number, description: string) => void;
  redeemReward: (rewardId: string, pointsCost: number, rewardTitle: string) => void;
  convertPointsToCash: (points: number) => void; // 1000 điểm = 10,000 VND
  withdrawCash: (amount: number) => void;
  addBonus: (points: number, description: string) => void;
  resetWallet: () => void;
}

// Mock initial transactions
const mockInitialTransactions: WalletTransaction[] = [
  {
    id: 't1',
    type: 'sale',
    amount: 68000,
    points: 80,
    description: 'Bán 8kg nhựa PET + giấy carton',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h trước
    status: 'completed',
    relatedId: '1',
  },
  {
    id: 't2',
    type: 'sale',
    amount: 50000,
    points: 40,
    description: 'Bán 2kg nhôm lon',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 ngày trước
    status: 'completed',
    relatedId: '2',
  },
  {
    id: 't3',
    type: 'reward_redeem',
    amount: 0,
    points: -500,
    description: 'Đổi voucher Highlands Coffee 20%',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 ngày trước
    status: 'completed',
    relatedId: 'r1',
  },
  {
    id: 't4',
    type: 'sale',
    amount: 90000,
    points: 130,
    description: 'Bán 13kg giấy + nhựa',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 't5',
    type: 'bonus',
    amount: 0,
    points: 100,
    description: '🎉 Thưởng đăng ký thành viên mới',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 't6',
    type: 'point_to_cash',
    amount: 50000,
    points: -5000,
    description: 'Chuyển 5,000 điểm thành 50,000₫',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 't7',
    type: 'withdrawal',
    amount: -100000,
    points: 0,
    description: 'Rút tiền về VietcomBank ***1234',
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
];

export const useWalletStore = create<WalletState>((set) => ({
  vndBalance: 258000, // Số dư khởi đầu
  greenPoints: 1850, // Điểm khởi đầu
  transactions: mockInitialTransactions,

  addFromSale: (listingId, amount, points, description) => 
    set((state) => ({
      vndBalance: state.vndBalance + amount,
      greenPoints: state.greenPoints + points,
      transactions: [
        {
          id: `t_${Date.now()}`,
          type: 'sale',
          amount,
          points,
          description,
          date: new Date().toISOString(),
          status: 'completed',
          relatedId: listingId,
        },
        ...state.transactions,
      ],
    })),

  deductForPurchase: (listingId, amount, description) =>
    set((state) => ({
      vndBalance: state.vndBalance - amount,
      transactions: [
        {
          id: `t_${Date.now()}`,
          type: 'purchase',
          amount: -amount,
          points: 0,
          description,
          date: new Date().toISOString(),
          status: 'completed',
          relatedId: listingId,
        },
        ...state.transactions,
      ],
    })),

  redeemReward: (rewardId, pointsCost, rewardTitle) =>
    set((state) => ({
      greenPoints: state.greenPoints - pointsCost,
      transactions: [
        {
          id: `t_${Date.now()}`,
          type: 'reward_redeem',
          amount: 0,
          points: -pointsCost,
          description: `Đổi thưởng: ${rewardTitle}`,
          date: new Date().toISOString(),
          status: 'completed',
          relatedId: rewardId,
        },
        ...state.transactions,
      ],
    })),

  convertPointsToCash: (points) =>
    set((state) => {
      const cashAmount = (points / 1000) * 10000; // 1000 điểm = 10k VND
      return {
        greenPoints: state.greenPoints - points,
        vndBalance: state.vndBalance + cashAmount,
        transactions: [
          {
            id: `t_${Date.now()}`,
            type: 'point_to_cash',
            amount: cashAmount,
            points: -points,
            description: `Chuyển ${points.toLocaleString()} điểm thành ${cashAmount.toLocaleString()}₫`,
            date: new Date().toISOString(),
            status: 'completed',
          },
          ...state.transactions,
        ],
      };
    }),

  withdrawCash: (amount) =>
    set((state) => ({
      vndBalance: state.vndBalance - amount,
      transactions: [
        {
          id: `t_${Date.now()}`,
          type: 'withdrawal',
          amount: -amount,
          points: 0,
          description: `Rút tiền ${amount.toLocaleString()}₫`,
          date: new Date().toISOString(),
          status: 'completed',
        },
        ...state.transactions,
      ],
    })),

  addBonus: (points, description) =>
    set((state) => ({
      greenPoints: state.greenPoints + points,
      transactions: [
        {
          id: `t_${Date.now()}`,
          type: 'bonus',
          amount: 0,
          points,
          description,
          date: new Date().toISOString(),
          status: 'completed',
        },
        ...state.transactions,
      ],
    })),

  resetWallet: () =>
    set({
      vndBalance: 258000,
      greenPoints: 1850,
      transactions: mockInitialTransactions,
    }),
}));
