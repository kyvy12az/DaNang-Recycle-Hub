import { WasteType, WasteListing, Transaction, Reward, ChatMessage, EducationTip, UserProfile } from '@/types';
import Colors from '@/constants/colors';

export const wasteTypes: WasteType[] = [
  { id: '0', name: 'Rác hữu cơ', category: 'organic', pricePerKg: 0, icon: 'leaf', color: '#66BB6A' },
  { id: '0b', name: 'Pin đã qua sử dụng', category: 'hazardous', pricePerKg: 15000, icon: 'battery', color: '#7E57C2' },
  { id: '1', name: 'Nhựa PET', category: 'plastic', pricePerKg: 10000, icon: 'bottle-water', color: Colors.plastic },
  { id: '2', name: 'Nhựa HDPE', category: 'plastic', pricePerKg: 8000, icon: 'package', color: Colors.plastic },
  { id: '3', name: 'Giấy carton', category: 'paper', pricePerKg: 6000, icon: 'newspaper', color: Colors.paper },
  { id: '4', name: 'Giấy báo', category: 'paper', pricePerKg: 4000, icon: 'file-text', color: Colors.paper },
  { id: '5', name: 'Nhôm lon', category: 'metal', pricePerKg: 25000, icon: 'cylinder', color: Colors.metal },
  { id: '6', name: 'Sắt vụn', category: 'metal', pricePerKg: 7000, icon: 'wrench', color: Colors.metal },
  { id: '7', name: 'Chai thủy tinh', category: 'glass', pricePerKg: 3000, icon: 'wine', color: Colors.glass },
  { id: '8', name: 'Đồ điện tử', category: 'electronics', pricePerKg: 15000, icon: 'smartphone', color: '#7E57C2' },
  { id: '9', name: 'Quần áo cũ', category: 'textile', pricePerKg: 5000, icon: 'shirt', color: '#8E24AA' },
  { id: '10', name: 'Giày dép cũ', category: 'textile', pricePerKg: 5000, icon: 'footprints', color: '#5E35B1' },
];

export const mockListings: WasteListing[] = [
  {
    id: '1',
    sellerId: 'u1',
    sellerName: 'Chị Hoa',
    sellerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    items: [
      { id: 'i1', wasteType: wasteTypes[0], quantity: 5, estimatedPrice: 50000 },
      { id: 'i2', wasteType: wasteTypes[2], quantity: 3, estimatedPrice: 18000 },
    ],
    totalPrice: 68000,
    totalWeight: 8,
    address: '15 Nguyễn Văn Linh, Hải Châu',
    district: 'Hải Châu',
    note: 'Đã phân loại sạch sẽ',
    pickupTime: 'Chiều nay (14:00 - 17:00)',
    status: 'available',
    createdAt: '10 phút trước',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
    greenPoints: 80,
  },
  {
    id: '2',
    sellerId: 'u2',
    sellerName: 'Anh Minh',
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    items: [
      { id: 'i3', wasteType: wasteTypes[4], quantity: 2, estimatedPrice: 50000 },
    ],
    totalPrice: 50000,
    totalWeight: 2,
    address: '88 Trần Phú, Hải Châu',
    district: 'Hải Châu',
    note: 'Lon bia đã rửa sạch',
    pickupTime: 'Sáng mai (8:00 - 11:00)',
    status: 'available',
    createdAt: '25 phút trước',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
    greenPoints: 40,
  },
  {
    id: '3',
    sellerId: 'u3',
    sellerName: 'Cô Lan',
    sellerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    items: [
      { id: 'i4', wasteType: wasteTypes[2], quantity: 10, estimatedPrice: 60000 },
      { id: 'i5', wasteType: wasteTypes[0], quantity: 3, estimatedPrice: 30000 },
    ],
    totalPrice: 90000,
    totalWeight: 13,
    address: '42 Lê Duẩn, Thanh Khê',
    district: 'Thanh Khê',
    note: 'Thùng carton từ hàng online',
    pickupTime: 'Chiều nay (14:00 - 17:00)',
    status: 'available',
    createdAt: '1 giờ trước',
    imageUrl: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=400',
    greenPoints: 130,
  },
  {
    id: '4',
    sellerId: 'u4',
    sellerName: 'Anh Tuấn',
    sellerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    items: [
      { id: 'i6', wasteType: wasteTypes[5], quantity: 15, estimatedPrice: 105000 },
      { id: 'i7', wasteType: wasteTypes[4], quantity: 3, estimatedPrice: 75000 },
    ],
    totalPrice: 180000,
    totalWeight: 18,
    address: '120 Điện Biên Phủ, Thanh Khê',
    district: 'Thanh Khê',
    note: 'Sắt từ sửa nhà, nhôm cũ',
    pickupTime: 'Sáng nay (8:00 - 11:00)',
    status: 'available',
    createdAt: '2 giờ trước',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
    greenPoints: 180,
  },
  {
    id: '5',
    sellerId: 'u5',
    sellerName: 'Chị Mai',
    sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    items: [
      { id: 'i8', wasteType: wasteTypes[6], quantity: 8, estimatedPrice: 24000 },
      { id: 'i9', wasteType: wasteTypes[0], quantity: 2, estimatedPrice: 20000 },
    ],
    totalPrice: 44000,
    totalWeight: 10,
    address: '67 Ngô Quyền, Sơn Trà',
    district: 'Sơn Trà',
    note: 'Chai lọ và nhựa hỗn hợp',
    pickupTime: 'Ngày mai (8:00 - 11:00)',
    status: 'available',
    createdAt: '3 giờ trước',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
    greenPoints: 100,
  },
  {
    id: '6',
    sellerId: 'u6',
    sellerName: 'Bác Hùng',
    sellerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    items: [
      { id: 'i10', wasteType: wasteTypes[7], quantity: 4, estimatedPrice: 60000 },
    ],
    totalPrice: 60000,
    totalWeight: 4,
    address: '200 Võ Nguyên Giáp, Ngũ Hành Sơn',
    district: 'Ngũ Hành Sơn',
    note: 'Linh kiện máy tính cũ',
    pickupTime: 'Chiều mai (14:00 - 17:00)',
    status: 'available',
    createdAt: '4 giờ trước',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
    greenPoints: 60,
  },
  {
    id: '7',
    sellerId: 'u7',
    sellerName: 'Chị Thảo',
    sellerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    items: [
      { id: 'i11', wasteType: wasteTypes[3], quantity: 20, estimatedPrice: 80000 },
      { id: 'i12', wasteType: wasteTypes[2], quantity: 5, estimatedPrice: 30000 },
    ],
    totalPrice: 110000,
    totalWeight: 25,
    address: '55 Phan Châu Trinh, Hải Châu',
    district: 'Hải Châu',
    note: 'Báo cũ và carton số lượng lớn',
    pickupTime: 'Sáng mai (8:00 - 11:00)',
    status: 'available',
    createdAt: '5 giờ trước',
    imageUrl: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=400',
    greenPoints: 250,
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 't1',
    listingId: '1',
    type: 'sell',
    items: [
      { id: 'i1', wasteType: wasteTypes[0], quantity: 5, estimatedPrice: 50000 },
    ],
    totalPrice: 50000,
    greenPoints: 50,
    status: 'completed',
    date: '20/02/2026',
    partnerName: 'Anh Đức (Ve chai)',
  },
  {
    id: 't2',
    listingId: '2',
    type: 'sell',
    items: [
      { id: 'i2', wasteType: wasteTypes[2], quantity: 8, estimatedPrice: 48000 },
    ],
    totalPrice: 48000,
    greenPoints: 80,
    status: 'completed',
    date: '18/02/2026',
    partnerName: 'Chị Nga (Thu mua)',
  },
  {
    id: 't3',
    listingId: '3',
    type: 'sell',
    items: [
      { id: 'i3', wasteType: wasteTypes[4], quantity: 3, estimatedPrice: 75000 },
    ],
    totalPrice: 75000,
    greenPoints: 60,
    status: 'completed',
    date: '15/02/2026',
    partnerName: 'Anh Phong (Đại lý)',
  },
];

export const mockRewards: Reward[] = [
  {
    id: 'r1',
    title: 'Giảm 20% Highlands Coffee',
    description: 'Áp dụng tại mọi chi nhánh Highlands Coffee Đà Nẵng',
    pointsCost: 50,
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
    category: 'Ẩm thực',
    isAvailable: true,
  },
  {
    id: 'r2',
    title: 'Túi vải tái chế miễn phí',
    description: 'Túi vải canvas in logo DaNang Recycle Hub',
    pointsCost: 100,
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400',
    category: 'Quà tặng',
    isAvailable: true,
  },
  {
    id: 'r3',
    title: 'Vé tham quan Bà Nà Hills',
    description: 'Giảm 50% giá vé cáp treo Bà Nà Hills cho 1 người',
    pointsCost: 500,
    imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400',
    category: 'Du lịch',
    isAvailable: true,
  },
  {
    id: 'r4',
    title: 'Cây xanh mini',
    description: 'Cây sen đá hoặc xương rồng kèm chậu tái chế',
    pointsCost: 150,
    imageUrl: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
    category: 'Quà tặng',
    isAvailable: true,
  },
  {
    id: 'r5',
    title: 'Giảm 30% Phở Lý Quốc Sư',
    description: 'Áp dụng chi nhánh 35 Trần Phú, Hải Châu',
    pointsCost: 120,
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400',
    category: 'Ẩm thực',
    isAvailable: true,
  },
];

export const mockChatMessages: ChatMessage[] = [
  { id: 'c1', senderId: 'buyer1', text: 'Chào bạn, tôi muốn thu mua lô rác này', timestamp: '10:30', isMe: false },
  { id: 'c2', senderId: 'me', text: 'Chào anh, vâng ạ. Anh xem chi tiết nhé', timestamp: '10:31', isMe: true },
  { id: 'c3', senderId: 'buyer1', text: 'Nhựa PET này đã rửa sạch chưa bạn?', timestamp: '10:32', isMe: false },
  { id: 'c4', senderId: 'me', text: 'Dạ rồi ạ, em đã phân loại và rửa sạch hết rồi', timestamp: '10:33', isMe: true },
  { id: 'c5', senderId: 'buyer1', text: 'Tốt lắm! Tôi sẽ qua lấy chiều nay được không?', timestamp: '10:34', isMe: false },
  { id: 'c6', senderId: 'me', text: 'Được ạ, anh qua khoảng 2-3h chiều nhé!', timestamp: '10:35', isMe: true },
];

export const mockEducationTips: EducationTip[] = [
  {
    id: 'e1',
    title: 'Cách phân loại rác tại nhà',
    summary: 'Hướng dẫn 4 nhóm rác cơ bản giúp tái chế hiệu quả',
    content: 'Rác hữu cơ (thức ăn thừa, lá cây), Rác tái chế (nhựa, giấy, kim loại), Rác nguy hại (pin, bóng đèn), Rác còn lại. Phân loại đúng giúp tăng giá trị tái chế lên 300%.',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400',
    category: 'Hướng dẫn',
  },
  {
    id: 'e2',
    title: 'Tác hại nhựa biển ở Đà Nẵng',
    summary: 'Mỗi năm 8 triệu tấn nhựa đổ ra biển toàn cầu',
    content: 'Bãi biển Đà Nẵng đang đối mặt với ô nhiễm nhựa nghiêm trọng. Mỗi km bờ biển có hàng trăm mảnh nhựa. Tái chế là giải pháp hiệu quả nhất.',
    imageUrl: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=400',
    category: 'Môi trường',
  },
  {
    id: 'e3',
    title: '5 mẹo giảm rác nhựa hàng ngày',
    summary: 'Những thay đổi nhỏ tạo nên sự khác biệt lớn',
    content: '1. Mang túi vải khi đi chợ. 2. Dùng bình nước cá nhân. 3. Từ chối ống hút nhựa. 4. Chọn sản phẩm ít bao bì. 5. Tái sử dụng hộp nhựa.',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
    category: 'Mẹo hay',
  },
];

export const mockProfile: UserProfile = {
  id: 'me',
  name: 'Nguyễn Kỳ Vỹ',
  avatar: require('@/assets/images/avatars/Avt-Vy.jpg'),
  role: 'seller',
  greenPoints: 1250,
  totalTransactions: 15,
  totalWeight: 87,
  joinDate: '01/2026',
  address: 'Cổ Thành, xã Triệu Phong, tỉnh Quảng Trị',
  phone: '0813 748 360',
};

export const mockAIResults = [
  { wasteType: wasteTypes[0], quantity: 5 },
  { wasteType: wasteTypes[2], quantity: 2 },
];

export const pickupTimeOptions = [
  'Sáng nay (8:00 - 11:00)',
  'Chiều nay (14:00 - 17:00)',
  'Sáng mai (8:00 - 11:00)',
  'Chiều mai (14:00 - 17:00)',
];

// Discussion Comments Mockdata
export interface DiscussionComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  likesCount: number;
  isLiked?: boolean;
  replies?: DiscussionComment[];
}

export const mockEducationDiscussions: Record<string, DiscussionComment[]> = {
  'e1': [
    {
      id: 'c1',
      userId: 'u1',
      userName: 'Chị Hoa',
      userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      content: 'Cách phân loại này rất hữu ích! Nhưng em thắc mắc rác tái chế lẫn rác hữu cơ thì sao ạ? Như cốc giấy dính mỡ thì phân loại thế nào?',
      timestamp: '2 giờ trước',
      likesCount: 12,
      replies: [
        {
          id: 'r1',
          userId: 'u2',
          userName: 'Anh Minh',
          userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
          content: 'Nếu dính mỡ thì nên vứt vào rác hữu cơ em ơi. Vì rác tái chế phải sạch để có giá trị tái chế cao hơn.',
          timestamp: '1 giờ trước',
          likesCount: 8,
        }
      ]
    },
    {
      id: 'c2',
      userId: 'u3',
      userName: 'Thầy Tâm',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      content: 'Bài viết rất chi tiết và dễ hiểu. Tôi sẽ dạy cho học sinh của mình. Cảm ơn tác giả bài viết!',
      timestamp: '3 giờ trước',
      likesCount: 25,
      replies: []
    },
    {
      id: 'c3',
      userId: 'u4',
      userName: 'Bạn An',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      content: 'Mình vừa thực hiện theo hướng dẫn này từ 1 tháng trước, đã thu được 2kg rác tái chế. Giá bán cũng cao hơn lắm!',
      timestamp: '5 giờ trước',
      likesCount: 18,
      replies: [
        {
          id: 'r2',
          userId: 'u5',
          userName: 'Chi Chi',
          userAvatar: 'https://images.unsplash.com/photo-1517841905240-e3986f0b50a8?w=100',
          content: 'Wow, tuyệt quá! Mình cũng sẽ bắt đầu từ ngày mai. Cảm ơn bạn chia sẻ kinh nghiệm!',
          timestamp: '4 giờ trước',
          likesCount: 5,
        }
      ]
    },
    {
      id: 'c4',
      userId: 'u6',
      userName: 'Trưởng BQL chung cư',
      userAvatar: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=100',
      content: 'Tuyệt vời! Chúng tôi đang chuẩn bị lắp đặt 4 thùng rác phân loại tại tòa nhà. Bài viết này sẽ giúp cư dân hiểu rõ hơn.',
      timestamp: '6 giờ trước',
      likesCount: 32,
      replies: []
    },
  ],
  'e2': [
    {
      id: 'c5',
      userId: 'u7',
      userName: 'Anh Sơn',
      userAvatar: 'https://images.unsplash.com/photo-1537368310025-700d6d9b0e32?w=100',
      content: 'Con số 8 triệu tấn thực sự kinh khủng! Có cách nào để giảm thiểu được không ạ?',
      timestamp: '1 ngày trước',
      likesCount: 14,
      replies: [
        {
          id: 'r3',
          userId: 'u8',
          userName: 'Chuyên gia ENV',
          userAvatar: 'https://images.unsplash.com/photo-1552058544-f53b5baf8c1f?w=100',
          content: 'Cách tốt nhất là từng cá nhân bắt đầu từ việc giảm sử dụng nhựa. Mua sắm thông minh, sử dụng bồn chứa thay vì túi nhựa, v.v',
          timestamp: '1 ngày trước',
          likesCount: 22,
        }
      ]
    },
    {
      id: 'c6',
      userId: 'u9',
      userName: 'Cô Lan',
      userAvatar: 'https://images.unsplash.com/photo-1543003588-d2d5ffd47da1?w=100',
      content: 'Năm nay mình đã tham gia 3 chiến dịch dọn dẹp bãi biển ở Đà Nẵng. Lượng rác nhựa thực sự rất nhiều! 😞',
      timestamp: '1 ngày trước',
      likesCount: 28,
      replies: []
    },
  ],
  'e3': [
    {
      id: 'c7',
      userId: 'u10',
      userName: 'Bạn Liên',
      userAvatar: 'https://images.unsplash.com/photo-1519631128182-7716edda18e6?w=100',
      content: 'Mẹo số 2 về bình nước rất hay! Mình vừa mua bình thép không gỉ, sử dụng được hơn 1 năm rồi. Rất tiết kiệm!',
      timestamp: '12 giờ trước',
      likesCount: 19,
      replies: [
        {
          id: 'r4',
          userId: 'u11',
          userName: 'Bạn Khoa',
          userAvatar: 'https://images.unsplash.com/photo-1530268729831-4be0ea6deae4?w=100',
          content: 'Giá bình thép có đắt không bạn? Mình đang cân nhắc mua một cái.',
          timestamp: '11 giờ trước',
          likesCount: 8,
        },
        {
          id: 'r5',
          userId: 'u10',
          userName: 'Bạn Liên',
          userAvatar: 'https://images.unsplash.com/photo-1519631128182-7716edda18e6?w=100',
          content: 'Khoảng 200-400k tuỳ hãng bạn. Nhưng tính ra tiết kiệm được rất nhiều so với mua nước mỏ từng lần!',
          timestamp: '10 giờ trước',
          likesCount: 12,
        }
      ]
    },
    {
      id: 'c8',
      userId: 'u12',
      userName: 'Ông Tín',
      userAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100',
      content: 'Tôi 65 tuổi rồi nhưng vẫn áp dụng những mẹo này. Cảm giác tốt khi biết mình đang góp phần bảo vệ môi trường!',
      timestamp: '8 giờ trước',
      likesCount: 45,
      replies: []
    },
  ]
};

export const danangDistricts = [
  'Hải Châu',
  'Thanh Khê',
  'Sơn Trà',
  'Ngũ Hành Sơn',
  'Liên Chiểu',
  'Cẩm Lệ',
  'Hòa Vang',
];
