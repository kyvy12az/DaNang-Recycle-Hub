// Mock data for DaNang Recycle Hub Admin Dashboard

export interface User {
  id: string; name: string; email: string; phone: string; role: 'user' | 'seller' | 'buyer' | 'admin';
  greenPoints: number; totalKg: number; totalTransactions: number; walletBalance: number;
  status: 'active' | 'locked'; createdAt: string; avatar: string;
}

export interface WastePost {
  id: string; userId: string; userName: string; wasteType: string; weight: number; estimatedPrice: number;
  status: 'pending' | 'approved' | 'collected' | 'rejected'; images: string[];
  address: string; scheduledTime: string; notes: string; collectorName?: string; createdAt: string;
}

export interface Transaction {
  id: string; userId: string; userName: string; type: 'deposit' | 'withdraw' | 'payment';
  amount: number; status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string; createdAt: string;
}

export interface WalletHistory {
  id: string; userId: string; userName: string; type: 'credit' | 'debit';
  amount: number; pointsChange: number; reason: string; createdAt: string;
}

export type RewardGroup = 'financial' | 'green_gift' | 'voucher';

export const REWARD_GROUP_LABELS: Record<RewardGroup, string> = {
  financial: 'Quà tài chính',
  green_gift: 'Quà tặng xanh',
  voucher: 'Voucher',
};

export interface Reward {
  id: string; name: string; description: string; pointsRequired: number;
  stock: number; status: 'available' | 'out_of_stock'; image: string;
  totalRedeemed: number; category: string; group: RewardGroup;
}

export interface RewardHistory {
  id: string; userId: string; userName: string; rewardId: string; rewardName: string;
  pointsUsed: number; status: 'pending' | 'delivered' | 'returned'; createdAt: string;
}

export interface CollectionPoint {
  id: string; name: string; address: string; lat: number; lng: number;
  type: 'collection' | 'dealer' | 'center'; status: 'active' | 'inactive';
  workingHours: string; contact: string; createdAt: string;
}

export interface EducationPost {
  id: string; title: string; description: string; content: string;
  category: 'recycling' | 'saving' | 'environment'; status: 'published' | 'draft';
  featured: boolean; image: string; createdAt: string;
}

export interface AILog {
  id: string; userId: string; userName: string; imageUrl: string;
  predictedClass: string; confidence: number; isCorrect: boolean | null;
  createdAt: string;
}

export interface SupportTicket {
  id: string; userId: string; userName: string; subject: string;
  type: 'support' | 'transaction_error' | 'fraud_report' | 'dispute';
  status: 'new' | 'in_progress' | 'closed'; priority: 'low' | 'medium' | 'high';
  description: string; createdAt: string;
}

export interface SystemNotification {
  id: string; title: string; message: string;
  type: 'push' | 'email' | 'sms';
  target: 'all' | 'specific';
  status: 'sent' | 'scheduled' | 'draft';
  sentAt: string; createdAt: string;
}

const vietnameseNames = [
  'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường', 'Phạm Minh Đức', 'Hoàng Thị Em',
  'Võ Quốc Phong', 'Đặng Thanh Giang', 'Bùi Văn Hải', 'Ngô Thị Lan', 'Dương Minh Khoa',
  'Trịnh Văn Lâm', 'Mai Thị Ngọc', 'Lý Quang Ơn', 'Phan Đình Phúc', 'Huỳnh Thị Quỳnh',
  'Đỗ Văn Rạng', 'Vũ Thị Sương', 'Tạ Minh Tuấn', 'Hồ Thị Uyên', 'Chu Văn Vinh',
];

const wasteTypes = ['Nhựa PET', 'Giấy carton', 'Kim loại', 'Thủy tinh', 'Nhựa HDPE', 'Vải', 'Điện tử', 'Gỗ'];
const districts = ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang'];

export const mockUsers: User[] = vietnameseNames.map((name, i) => ({
  id: `U${String(i + 1).padStart(4, '0')}`,
  name,
  email: `${name.toLowerCase().replace(/\s/g, '.').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@email.com`,
  phone: `0${90 + (i % 10)}${String(1000000 + Math.floor(Math.random() * 9000000))}`,
  role: i === 0 ? 'admin' : i < 5 ? 'seller' : i < 12 ? 'buyer' : 'user',
  greenPoints: Math.floor(Math.random() * 5000),
  totalKg: Math.floor(Math.random() * 500),
  totalTransactions: Math.floor(Math.random() * 50),
  walletBalance: Math.floor(Math.random() * 5000000),
  status: i === 17 ? 'locked' : 'active',
  createdAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
  avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
}));

export const mockWastePosts: WastePost[] = Array.from({ length: 30 }, (_, i) => {
  const user = mockUsers[i % mockUsers.length];
  const statuses: WastePost['status'][] = ['pending', 'approved', 'collected', 'rejected'];
  return {
    id: `WP${String(i + 1).padStart(4, '0')}`,
    userId: user.id, userName: user.name,
    wasteType: wasteTypes[i % wasteTypes.length],
    weight: Math.floor(Math.random() * 50) + 1,
    estimatedPrice: Math.floor(Math.random() * 500000) + 10000,
    status: statuses[i % 4],
    images: [`https://picsum.photos/seed/waste${i}/200/200`],
    address: `${Math.floor(Math.random() * 200) + 1} Đường ${['Trần Phú', 'Nguyễn Văn Linh', 'Điện Biên Phủ', 'Lê Duẩn', 'Bạch Đằng'][i % 5]}, ${districts[i % districts.length]}, Đà Nẵng`,
    scheduledTime: new Date(2025, 3, Math.floor(Math.random() * 28) + 1, 8 + Math.floor(Math.random() * 10)).toISOString(),
    notes: ['Rác đã phân loại sẵn', 'Cần thu gom gấp', 'Liên hệ trước khi đến', ''][i % 4],
    collectorName: i % 4 === 2 ? vietnameseNames[Math.floor(Math.random() * 5)] : undefined,
    createdAt: new Date(2025, 2 + Math.floor(i / 10), (i % 28) + 1).toISOString(),
  };
});

export const mockTransactions: Transaction[] = Array.from({ length: 40 }, (_, i) => {
  const user = mockUsers[i % mockUsers.length];
  const types: Transaction['type'][] = ['deposit', 'withdraw', 'payment'];
  const statuses: Transaction['status'][] = ['pending', 'completed', 'failed', 'cancelled'];
  return {
    id: `TXN${String(i + 1).padStart(5, '0')}`,
    userId: user.id, userName: user.name,
    type: types[i % 3],
    amount: Math.floor(Math.random() * 2000000) + 50000,
    status: statuses[i % 4],
    description: ['Nạp tiền ví', 'Rút tiền', 'Thanh toán thu gom rác', 'Mua phế liệu'][i % 4],
    createdAt: new Date(2025, 3, Math.floor(Math.random() * 14) + 1).toISOString(),
  };
});

export const mockWalletHistories: WalletHistory[] = Array.from({ length: 30 }, (_, i) => {
  const user = mockUsers[i % mockUsers.length];
  return {
    id: `WH${String(i + 1).padStart(4, '0')}`,
    userId: user.id, userName: user.name,
    type: i % 3 === 0 ? 'debit' : 'credit',
    amount: Math.floor(Math.random() * 1000000) + 10000,
    pointsChange: (i % 3 === 0 ? -1 : 1) * (Math.floor(Math.random() * 200) + 10),
    reason: ['Thu gom rác thành công', 'Nạp tiền', 'Đổi quà', 'Hoàn tiền', 'Bán phế liệu'][i % 5],
    createdAt: new Date(2025, 3, Math.floor(Math.random() * 14) + 1).toISOString(),
  };
});

export const mockRewards: Reward[] = [
  { id: 'R001', name: 'Voucher Grab 50K', description: 'Giảm 50,000đ cho chuyến đi Grab', pointsRequired: 500, stock: 100, status: 'available', image: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=400&q=80', totalRedeemed: 245, category: 'Voucher', group: 'voucher' },
  { id: 'R002', name: 'Túi vải tái chế', description: 'Túi vải thân thiện môi trường', pointsRequired: 200, stock: 50, status: 'available', image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&q=80', totalRedeemed: 180, category: 'Quà tặng', group: 'green_gift' },
  { id: 'R003', name: 'Bình giữ nhiệt inox', description: 'Bình giữ nhiệt inox 500ml', pointsRequired: 800, stock: 0, status: 'out_of_stock', image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80', totalRedeemed: 95, category: 'Quà tặng', group: 'green_gift' },
  { id: 'R004', name: 'Voucher Now 30K', description: 'Giảm 30,000đ trên ShopeeFood', pointsRequired: 300, stock: 200, status: 'available', image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80', totalRedeemed: 410, category: 'Voucher', group: 'voucher' },
  { id: 'R005', name: 'Chậu cây mini', description: 'Cây cảnh mini để bàn', pointsRequired: 150, stock: 30, status: 'available', image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&q=80', totalRedeemed: 320, category: 'Quà tặng', group: 'green_gift' },
  { id: 'R006', name: 'Card điện thoại 100K', description: 'Thẻ nạp điện thoại mệnh giá 100,000đ', pointsRequired: 1000, stock: 25, status: 'available', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80', totalRedeemed: 78, category: 'Tài chính', group: 'financial' },
  { id: 'R007', name: 'Card điện thoại 50K', description: 'Thẻ nạp điện thoại mệnh giá 50,000đ', pointsRequired: 550, stock: 60, status: 'available', image: 'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?w=400&q=80', totalRedeemed: 132, category: 'Tài chính', group: 'financial' },
];

export const mockRewardHistory: RewardHistory[] = Array.from({ length: 20 }, (_, i) => {
  const user = mockUsers[i % mockUsers.length];
  const reward = mockRewards[i % mockRewards.length];
  const statuses: RewardHistory['status'][] = ['pending', 'delivered', 'returned'];
  return {
    id: `RH${String(i + 1).padStart(4, '0')}`,
    userId: user.id, userName: user.name,
    rewardId: reward.id, rewardName: reward.name,
    pointsUsed: reward.pointsRequired,
    status: statuses[i % 3],
    createdAt: new Date(2025, 3, Math.floor(Math.random() * 14) + 1).toISOString(),
  };
});

export const mockCollectionPoints: CollectionPoint[] = [
  { id: 'CP001', name: 'Điểm thu gom Hải Châu', address: '15 Trần Phú, Hải Châu', lat: 16.0544, lng: 108.2022, type: 'collection', status: 'active', workingHours: '7:00 - 17:00', contact: '0901234567', createdAt: '2024-01-15' },
  { id: 'CP002', name: 'Đại lý phế liệu Thanh Khê', address: '200 Điện Biên Phủ, Thanh Khê', lat: 16.0678, lng: 108.1856, type: 'dealer', status: 'active', workingHours: '6:00 - 18:00', contact: '0912345678', createdAt: '2024-02-20' },
  { id: 'CP003', name: 'Trung tâm tái chế Liên Chiểu', address: 'KCN Hòa Khánh, Liên Chiểu', lat: 16.0889, lng: 108.1456, type: 'center', status: 'active', workingHours: '8:00 - 17:00', contact: '0923456789', createdAt: '2024-03-10' },
  { id: 'CP004', name: 'Điểm thu gom Sơn Trà', address: '50 Ngô Quyền, Sơn Trà', lat: 16.0711, lng: 108.2233, type: 'collection', status: 'active', workingHours: '7:00 - 16:00', contact: '0934567890', createdAt: '2024-04-05' },
  { id: 'CP005', name: 'Đại lý phế liệu Ngũ Hành Sơn', address: '88 Lê Văn Hiến, Ngũ Hành Sơn', lat: 16.0234, lng: 108.2456, type: 'dealer', status: 'inactive', workingHours: '7:00 - 17:00', contact: '0945678901', createdAt: '2024-05-12' },
  { id: 'CP006', name: 'Điểm thu gom Cẩm Lệ', address: '120 Cách Mạng Tháng 8, Cẩm Lệ', lat: 16.0123, lng: 108.2067, type: 'collection', status: 'active', workingHours: '6:30 - 17:30', contact: '0956789012', createdAt: '2024-06-01' },
];

export const mockEducationPosts: EducationPost[] = [
  { id: 'ED001', title: '10 cách tái chế rác nhựa tại nhà', description: 'Hướng dẫn chi tiết cách tái chế nhựa đơn giản', content: '...', category: 'recycling', status: 'published', featured: true, image: '♻️', createdAt: '2025-01-15' },
  { id: 'ED002', title: 'Phân loại rác đúng cách', description: 'Cách phân loại rác thải sinh hoạt', content: '...', category: 'environment', status: 'published', featured: false, image: '🗑️', createdAt: '2025-02-10' },
  { id: 'ED003', title: 'Tiết kiệm năng lượng mùa hè', description: 'Mẹo giảm hóa đơn điện hiệu quả', content: '...', category: 'saving', status: 'draft', featured: false, image: '💡', createdAt: '2025-03-05' },
  { id: 'ED004', title: 'Tái chế quần áo cũ thành túi xách', description: 'DIY túi xách từ quần áo không dùng nữa', content: '...', category: 'recycling', status: 'published', featured: true, image: '👕', createdAt: '2025-03-20' },
  { id: 'ED005', title: 'Bảo vệ biển Đà Nẵng', description: 'Chiến dịch dọn rác bãi biển', content: '...', category: 'environment', status: 'published', featured: false, image: '🏖️', createdAt: '2025-04-01' },
];

export const mockAILogs: AILog[] = Array.from({ length: 25 }, (_, i) => {
  const user = mockUsers[i % mockUsers.length];
  const classes = ['Nhựa PET', 'Giấy', 'Kim loại', 'Thủy tinh', 'Hữu cơ', 'Nhựa HDPE', 'Pin/Ắc quy'];
  return {
    id: `AI${String(i + 1).padStart(4, '0')}`,
    userId: user.id, userName: user.name,
    imageUrl: `https://picsum.photos/seed/ai${i}/100/100`,
    predictedClass: classes[i % classes.length],
    confidence: Math.round((0.65 + Math.random() * 0.34) * 100) / 100,
    isCorrect: i % 5 === 0 ? false : i % 7 === 0 ? null : true,
    createdAt: new Date(2025, 3, Math.floor(Math.random() * 14) + 1).toISOString(),
  };
});

export const mockSupportTickets: SupportTicket[] = Array.from({ length: 15 }, (_, i) => {
  const user = mockUsers[i % mockUsers.length];
  const types: SupportTicket['type'][] = ['support', 'transaction_error', 'fraud_report', 'dispute'];
  const statuses: SupportTicket['status'][] = ['new', 'in_progress', 'closed'];
  const priorities: SupportTicket['priority'][] = ['low', 'medium', 'high'];
  const subjects = ['Không rút được tiền', 'Bài đăng bị từ chối sai', 'Nghi ngờ gian lận', 'Chưa nhận được quà', 'Lỗi ứng dụng'];
  return {
    id: `TK${String(i + 1).padStart(4, '0')}`,
    userId: user.id, userName: user.name,
    subject: subjects[i % subjects.length],
    type: types[i % types.length],
    status: statuses[i % 3],
    priority: priorities[i % 3],
    description: 'Mô tả chi tiết vấn đề gặp phải...',
    createdAt: new Date(2025, 3, Math.floor(Math.random() * 14) + 1).toISOString(),
  };
});

export const mockNotifications: SystemNotification[] = Array.from({ length: 10 }, (_, i) => {
  const types: SystemNotification['type'][] = ['push', 'email', 'sms'];
  const statuses: SystemNotification['status'][] = ['sent', 'scheduled', 'draft'];
  return {
    id: `NTF${String(i + 1).padStart(4, '0')}`,
    title: ['Nhắc lịch thu gom', 'Bài đăng được duyệt', 'Nạp tiền thành công', 'Quà đã sẵn sàng', 'Cập nhật ứng dụng'][i % 5],
    message: 'Nội dung thông báo chi tiết...',
    type: types[i % 3],
    target: i % 3 === 0 ? 'all' : 'specific',
    status: statuses[i % 3],
    sentAt: statuses[i % 3] === 'sent' ? new Date(2025, 3, Math.floor(Math.random() * 14) + 1).toISOString() : '',
    createdAt: new Date(2025, 3, Math.floor(Math.random() * 14) + 1).toISOString(),
  };
});

// Dashboard chart data
export const dailyWasteData = Array.from({ length: 14 }, (_, i) => ({
  date: `${i + 1}/04`,
  kg: Math.floor(Math.random() * 300) + 100,
  transactions: Math.floor(Math.random() * 30) + 5,
}));

export const wasteByTypeData = wasteTypes.map(type => ({
  name: type,
  value: Math.floor(Math.random() * 1000) + 100,
}));

export const monthlyRevenueData = ['T1', 'T2', 'T3', 'T4'].map(month => ({
  month,
  revenue: Math.floor(Math.random() * 50000000) + 10000000,
  users: Math.floor(Math.random() * 200) + 50,
}));