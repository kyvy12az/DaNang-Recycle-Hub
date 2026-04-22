export interface CollectionPointItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  types: string[];
  description?: string;
}

export const mobileMockCollectionPoints: CollectionPointItem[] = [
  {
    id: 'mock-1',
    name: 'Tram Hai Chau 1',
    latitude: 16.0544,
    longitude: 108.2022,
    address: '15 Nguyen Van Linh, Hai Chau, Da Nang',
    types: ['Nhua', 'Giay', 'Kim loai'],
    description: 'Nhan thu gom tai che co ban',
  },
  {
    id: 'mock-2',
    name: 'Tram Thanh Khe',
    latitude: 16.0607,
    longitude: 108.186,
    address: '42 Le Duan, Thanh Khe, Da Nang',
    types: ['Giay', 'Thuy tinh', 'Kim loai'],
    description: 'Thu gom trong gio hanh chinh',
  },
  {
    id: 'mock-3',
    name: 'Diem Son Tra',
    latitude: 16.0756,
    longitude: 108.238,
    address: '67 Ngo Quyen, Son Tra, Da Nang',
    types: ['Nhua', 'Thiet bi dien tu nho'],
    description: 'Nhan rac tai che va do dien tu nho',
  },
  {
    id: 'mock-4',
    name: 'Tram Ngu Hanh Son',
    latitude: 16.001,
    longitude: 108.265,
    address: '200 Vo Nguyen Giap, Ngu Hanh Son, Da Nang',
    types: ['Nhua', 'Giay', 'Vo lon'],
    description: 'Diem tap ket ven bien',
  },
  {
    id: 'mock-5',
    name: 'Trung tam Lien Chieu',
    latitude: 16.074,
    longitude: 108.15,
    address: '100 Nguyen Luong Bang, Lien Chieu, Da Nang',
    types: ['Kim loai', 'Nhua kho', 'Giay carton'],
    description: 'Trung tam xu ly va phan loai',
  },
];
