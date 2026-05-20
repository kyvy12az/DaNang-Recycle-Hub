export type UserRole = 'seller' | 'buyer' | null;

export type WasteCategory =
  | 'plastic'
  | 'paper'
  | 'metal'
  | 'glass'
  | 'electronics'
  | 'organic'
  | 'hazardous'
  | 'textile'
  | 'residual'
  | 'other';

export interface WasteType {
  id: string;
  name: string;
  category: WasteCategory;
  pricePerKg: number;
  icon: string;
  color: string;
}

export interface WasteItem {
  id: string;
  wasteType: WasteType;
  quantity: number;
  estimatedPrice: number;
}

export interface WasteListing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  items: WasteItem[];
  totalPrice: number;
  totalWeight: number;
  address: string;
  district: string;
  note: string;
  pickupTime: string;
  status: 'available' | 'accepted' | 'completed' | 'cancelled';
  createdAt: string;
  imageUrl: string;
  greenPoints: number;
}

export interface Transaction {
  id: string;
  listingId: string;
  type: 'sell' | 'buy';
  items: WasteItem[];
  totalPrice: number;
  greenPoints: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
  partnerName: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  isRead?: boolean;
  mediaUrl?: string;              
  mediaType?: 'image' | 'video';
}

export interface EducationTip {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  category: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string | number; // string for URL, number for require()  
  role: UserRole;
  greenPoints: number;
  totalTransactions: number;
  totalWeight: number;
  joinDate: string;
  address: string;
  phone: string;
}

export interface WalletTransaction {
  id: string;
  type: 'sale' | 'purchase' | 'reward_redeem' | 'withdrawal' | 'point_to_cash' | 'bonus';
  amount: number; // VND
  points: number; // Điểm xanh
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  relatedId?: string;
}

export type GameWasteGroup = 'recyclable' | 'hazardous' | 'organic' | 'non-recyclable';

export interface GameAnswerOption {
  value: GameWasteGroup;
  label: string;
  hint: string;
}

export interface GameQuestion {
  id: string;
  imageUrl: string;
  wasteName: string;
  options: GameAnswerOption[];
  answer: GameWasteGroup;
  explanation: string;
}

export interface GameBadge {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  rewardPoints: number;
  accentColor: string;
  unlocked: boolean;
}

export interface GameStreakTier {
  days: number;
  rewardPoints: number;
}

export interface GameSummary {
  totalPoints: number;
  dailyPoints: number;
  dailyPlaysUsed: number;
  dailyPlaysLimit: number;
  streakDays: number;
  unlockedBadgeIds: string[];
  lastPlayedDate: string | null;
}

export interface GameSessionState {
  currentQuestionId: string | null;
  selectedAnswer: GameWasteGroup | null;
  result: 'idle' | 'correct' | 'incorrect';
  isLocked: boolean;
}
