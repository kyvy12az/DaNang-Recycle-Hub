import Colors from '@/constants/colors';
import { GameAnswerOption, GameBadge, GameQuestion, GameStreakTier } from '@/types';

export const GAME_DAILY_PLAY_LIMIT = 5;

export const gameAnswerOptions: GameAnswerOption[] = [
  { value: 'recyclable', label: 'Tái chế được', hint: 'Nhựa, giấy, kim loại sạch' },
  { value: 'hazardous', label: 'Nguy hại', hint: 'Pin, bóng đèn, hóa chất' },
  { value: 'organic', label: 'Hữu cơ', hint: 'Thức ăn thừa, lá cây' },
  { value: 'non-recyclable', label: 'Còn lại', hint: 'Khăn giấy bẩn, rác lẫn tạp' },
];

export const gameQuestions: GameQuestion[] = [
  {
    id: 'q1',
    imageUrl: 'https://images.unsplash.com/photo-1527489377706-1e7d7c8b7a4f?w=900',
    wasteName: 'Vỏ chai nhựa PET',
    options: gameAnswerOptions,
    answer: 'recyclable',
    explanation: 'Chai nhựa PET là rác tái chế, cần rửa sạch và phân loại riêng.',
  },
  {
    id: 'q2',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900',
    wasteName: 'Pin điện thoại cũ',
    options: gameAnswerOptions,
    answer: 'hazardous',
    explanation: 'Pin thuộc nhóm rác nguy hại, không bỏ chung với rác thường.',
  },
  {
    id: 'q3',
    imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=900',
    wasteName: 'Vỏ rau củ thừa',
    options: gameAnswerOptions,
    answer: 'organic',
    explanation: 'Rác thực phẩm và vỏ rau củ là rác hữu cơ.',
  },
  {
    id: 'q4',
    imageUrl: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=900',
    wasteName: 'Khăn giấy bẩn',
    options: gameAnswerOptions,
    answer: 'non-recyclable',
    explanation: 'Khăn giấy bẩn thường không tái chế được và thuộc nhóm rác còn lại.',
  },
  {
    id: 'q5',
    imageUrl: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=900',
    wasteName: 'Lon nhôm nước ngọt',
    options: gameAnswerOptions,
    answer: 'recyclable',
    explanation: 'Lon nhôm là vật liệu tái chế có giá trị cao.',
  },
  {
    id: 'q6',
    imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=900',
    wasteName: 'Lá cây khô',
    options: gameAnswerOptions,
    answer: 'organic',
    explanation: 'Lá cây khô là rác hữu cơ, có thể ủ compost.',
  },
];

export const gameBadges: GameBadge[] = [
  {
    id: 'bronze',
    name: 'Green Spark',
    description: 'Mở khóa khi chạm mốc điểm đầu tiên.',
    pointsRequired: 20,
    rewardPoints: 10,
    accentColor: '#B87333',
    unlocked: false,
  },
  {
    id: 'silver',
    name: 'Eco Runner',
    description: 'Dành cho người chơi duy trì nhịp độ tốt.',
    pointsRequired: 60,
    rewardPoints: 20,
    accentColor: '#90A4AE',
    unlocked: false,
  },
  {
    id: 'gold',
    name: 'Ocean Guardian',
    description: 'Bảo vệ biển xanh bằng kiến thức phân loại rác.',
    pointsRequired: 120,
    rewardPoints: 40,
    accentColor: '#F9A825',
    unlocked: false,
  },
  {
    id: 'platinum',
    name: 'Recycle Legend',
    description: 'Cấp huy hiệu hiếm nhất cho người chơi bền bỉ.',
    pointsRequired: 220,
    rewardPoints: 80,
    accentColor: '#26C6DA',
    unlocked: false,
  },
];

export const gameStreakTiers: GameStreakTier[] = [
  { days: 3, rewardPoints: 15 },
  { days: 5, rewardPoints: 30 },
  { days: 7, rewardPoints: 50 },
  { days: 14, rewardPoints: 120 },
  { days: 30, rewardPoints: 300 },
  { days: 60, rewardPoints: 700 },
];

export const gameTheme = {
  primary: Colors.primary,
  primaryDark: Colors.primaryDark,
  accent: Colors.accent,
  sand: Colors.sand,
  greenPoint: Colors.greenPoint,
};