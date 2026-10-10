import { Hairstyle, Salon, Booking } from '../types';

export const MOCK_HAIRSTYLES: Hairstyle[] = [
  {
    id: 'hs-1',
    name: 'Layer Nam Hiện Đại',
    category: 'Layer',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400',
    description: 'Kiểu tóc Layer nam tỉa tầng tự nhiên, trẻ trung và dễ tạo kiểu hàng ngày.',
    suitableFace: 'Mặt tròn, mặt trái xoan',
    tag: 'Hot Trend'
  },
  {
    id: 'hs-2',
    name: 'Two Block Hàn Quốc',
    category: 'Two Block',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
    description: 'Phong cách nam thần Hàn Quốc với phần mái cắt gọn hai bên và chia tầng.',
    suitableFace: 'Mặt dài, mặt vuông',
    tag: 'Bán chạy'
  },
  {
    id: 'hs-3',
    name: 'Undercut Fade Lịch Lãm',
    category: 'Undercut',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    description: 'Sát hai bên tạo vẻ ngoài nam tính, sang trọng thích hợp môi trường công sở.',
    suitableFace: 'Mặt vuông, mặt góc cạnh',
    tag: 'Lịch lãm'
  },
  {
    id: 'hs-4',
    name: 'Side Part 7/3 Cổ Điển',
    category: 'Side Part',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    description: 'Rẽ ngôi 7/3 vuốt ngược nhẹ, tạo sự thanh lịch chỉn chu.',
    suitableFace: 'Mặt trái xoan',
    tag: 'Classic'
  },
  {
    id: 'hs-5',
    name: 'Mullet Xoăn Nhẹ',
    category: 'Mullet',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    description: 'Phá cách cá tính với phần đuôi dài và uốn sóng nhẹ.',
    suitableFace: 'Mặt thon dài, mặt V-line',
    tag: 'Cá tính'
  },
  {
    id: 'hs-6',
    name: 'Curly Short Waves',
    category: 'Curly',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
    description: 'Tóc xoăn xù sóng nhỏ cuốn hút và lãng tử.',
    suitableFace: 'Mặt gầy, mặt dài',
    tag: 'Mới'
  },
  {
    id: 'hs-7',
    name: 'Buzz Cut Thể Thao',
    category: 'Short',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    description: 'Tóc cua thể thao mát mẻ, gọn gàng và không mất công chăm sóc.',
    suitableFace: 'Mặt góc cạnh, đầu tròn',
    tag: 'Gọn gàng'
  },
  {
    id: 'hs-8',
    name: 'Wolf Cut Nữ Phá Cách',
    category: 'Wolf Cut',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    description: 'Tỉa so le cá tính kết hợp giữa Mullet và Shag cut năng động.',
    suitableFace: 'Mặt trái xoan, mặt tròn',
    tag: 'Trend 2026'
  },
  {
    id: 'hs-9',
    name: 'Layer Nữ Sóng Lơi',
    category: 'Layer',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    description: 'Tỉa tầng bay bổng kết hợp xoăn lơi mềm mại tôn lên vẻ quyến rũ.',
    suitableFace: 'Mặt tròn, mặt vuông',
    tag: 'Yêu thích'
  },
  {
    id: 'hs-10',
    name: 'Bob Ngắn Mái Thưa',
    category: 'Bob',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    description: 'Tóc Bob ngang cằm trẻ trung hack tuổi cực kì hiệu quả.',
    suitableFace: 'Mặt nhỏ, mặt V-line',
    tag: 'Hack tuổi'
  },
  {
    id: 'hs-11',
    name: 'Tóc Dài Uốn Sóng Nước',
    category: 'Long',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    description: 'Sóng nước dạt dào sang trọng cho những buổi tiệc trang trọng.',
    suitableFace: 'Mọi khuôn mặt',
    tag: 'Sang trọng'
  },
  {
    id: 'hs-12',
    name: 'Pixie Cut Năng Động',
    category: 'Short',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
    description: 'Ngắn gọn cá tính dành cho những cô nàng hiện đại tự tin.',
    suitableFace: 'Mặt V-line, mặt trái xoan',
    tag: 'Cá tính'
  },
  {
    id: 'hs-13',
    name: 'Hippie Curly Retro',
    category: 'Curly',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    description: 'Xoăn xù Hippie cổ điển rực rỡ phong cách vintage.',
    suitableFace: 'Mặt thon dài',
    tag: 'Vintage'
  },
  {
    id: 'hs-14',
    name: 'Hime Cut Nhật Bản',
    category: 'Long',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    description: 'Phong cách tiểu thư Nhật Bản với phần mái bằng và hai lọn tóc ôm má.',
    suitableFace: 'Mặt tròn, mặt vuông',
    tag: 'Nhật Bản'
  },
  {
    id: 'hs-15',
    name: 'Textured Crop Nam',
    category: 'Short',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400',
    description: 'Phần mái cắt bằng đánh rối textured tự nhiên độc đáo.',
    suitableFace: 'Mặt dài, trán cao',
    tag: 'Trẻ trung'
  },
  {
    id: 'hs-16',
    name: 'French Crop Ngắn',
    category: 'Short',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400',
    description: 'Mái ngắn tỉa lộn xộn nhẹ nhàng phong cách Châu Âu.',
    suitableFace: 'Mặt góc cạnh',
    tag: 'Gọn gàng'
  },
  {
    id: 'hs-17',
    name: 'Tóc Cụp Chữ C Ngang Vai',
    category: 'Bob',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    description: 'Đuôi tóc uốn cụp ôm lấy gương mặt thanh thoát.',
    suitableFace: 'Mặt vuông, mặt tròn',
    tag: 'Thanh lịch'
  },
  {
    id: 'hs-18',
    name: 'Comma Hair Sành Điệu',
    category: 'Side Part',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
    description: 'Mái tóc uốn cong dạng dấu phẩy đặc trưng của Idol Kpop.',
    suitableFace: 'Mặt trái xoan',
    tag: 'Kpop Idol'
  },
  {
    id: 'hs-19',
    name: 'Tóc Thẳng Thác Nước',
    category: 'Long',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    description: 'Suôn mượt óng ả tự nhiên thể hiện nét đẹp thuần khiết.',
    suitableFace: 'Mọi khuôn mặt',
    tag: 'Tự nhiên'
  },
  {
    id: 'hs-20',
    name: 'Short Quiff Hiện Đại',
    category: 'Quiff',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400',
    description: 'Vuốt dựng nhẹ phần mái tạo cảm giác cao ráo năng động.',
    suitableFace: 'Mặt tròn, mặt thấp',
    tag: 'Năng động'
  }
];

export const MOCK_SALONS: Salon[] = [
  {
    id: 'sal-1',
    name: 'StyleLock Salon Studio - Cầu Giấy',
    address: '102 Xuân Thủy, Cầu Giấy, Hà Nội',
    distance: '0.8 km',
    rating: 4.9,
    reviewCount: 320,
    priceRange: '150k - 500k',
    phone: '0988123456',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600',
    openingHours: '08:30 - 20:30',
    supportedHairstyles: ['hs-1', 'hs-2', 'hs-3', 'hs-4', 'hs-8', 'hs-9', 'hs-10', 'hs-18'],
    services: [
      { id: 'srv-1', name: 'Cắt tóc + Gội massage', price: 150000, durationMinutes: 45 },
      { id: 'srv-2', name: 'Cắt + Uốn Layer / Two Block', price: 350000, durationMinutes: 90 },
      { id: 'srv-3', name: 'Cắt + Nhuộm thời trang', price: 450000, durationMinutes: 120 },
      { id: 'srv-4', name: 'Combo Định hình kiểu Try-on', price: 500000, durationMinutes: 120 }
    ]
  },
  {
    id: 'sal-2',
    name: '30Shine Premium - Nguyễn Khánh Toàn',
    address: '45 Nguyễn Khánh Toàn, Cầu Giấy, Hà Nội',
    distance: '1.2 km',
    rating: 4.8,
    reviewCount: 450,
    priceRange: '120k - 400k',
    phone: '0977222333',
    imageUrl: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600',
    openingHours: '08:00 - 21:00',
    supportedHairstyles: ['hs-1', 'hs-2', 'hs-3', 'hs-5', 'hs-7', 'hs-15', 'hs-16', 'hs-20'],
    services: [
      { id: 'srv-1', name: 'Combo 7 bước cắt gội xả', price: 120000, durationMinutes: 40 },
      { id: 'srv-2', name: 'Uốn tạo kiểu Hàn Quốc', price: 300000, durationMinutes: 75 },
      { id: 'srv-3', name: 'Tẩy + Nhuộm màu hot trend', price: 400000, durationMinutes: 110 }
    ]
  },
  {
    id: 'sal-3',
    name: 'Lê Hiếu Hair Salon - Hoàn Kiếm',
    address: '18 Hàng Bài, Hoàn Kiếm, Hà Nội',
    distance: '3.5 km',
    rating: 5.0,
    reviewCount: 180,
    priceRange: '300k - 1.2M',
    phone: '0912345678',
    imageUrl: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=600',
    openingHours: '09:00 - 20:00',
    supportedHairstyles: ['hs-8', 'hs-9', 'hs-10', 'hs-11', 'hs-12', 'hs-13', 'hs-14', 'hs-17', 'hs-19'],
    services: [
      { id: 'srv-1', name: 'Cắt tóc nữ thiết kế', price: 300000, durationMinutes: 60 },
      { id: 'srv-2', name: 'Uốn xoăn sóng nước cao cấp', price: 800000, durationMinutes: 150 },
      { id: 'srv-3', name: 'Phục hồi tóc hư tổn Keratin', price: 600000, durationMinutes: 90 }
    ]
  },
  {
    id: 'sal-4',
    name: 'Barber Shop Authentic 1990s',
    address: '88 Trần Đại Nghĩa, Hai Bà Trưng, Hà Nội',
    distance: '4.1 km',
    rating: 4.7,
    reviewCount: 290,
    priceRange: '100k - 350k',
    phone: '0933444555',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600',
    openingHours: '09:00 - 21:30',
    supportedHairstyles: ['hs-3', 'hs-4', 'hs-5', 'hs-7', 'hs-15', 'hs-20'],
    services: [
      { id: 'srv-1', name: 'Cắt Barber + Cạo râu cổ điển', price: 100000, durationMinutes: 45 },
      { id: 'srv-2', name: 'Cắt + Vuốt tạo kiểu Sáp cao cấp', price: 150000, durationMinutes: 50 }
    ]
  },
  {
    id: 'sal-5',
    name: 'Korean Beauty Hair & Spa',
    address: '15 Kim Mã, Ba Đình, Hà Nội',
    distance: '2.4 km',
    rating: 4.9,
    reviewCount: 210,
    priceRange: '250k - 900k',
    phone: '0966888999',
    imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600',
    openingHours: '08:30 - 20:30',
    supportedHairstyles: ['hs-1', 'hs-2', 'hs-8', 'hs-9', 'hs-10', 'hs-14', 'hs-18'],
    services: [
      { id: 'srv-1', name: 'Cắt + Gội thư giãn kiểu Hàn', price: 250000, durationMinutes: 60 },
      { id: 'srv-2', name: 'Uốn phồng chân tóc', price: 400000, durationMinutes: 90 },
      { id: 'srv-3', name: 'Combo cắt uốn tạo dáng theo ảnh Try-on', price: 650000, durationMinutes: 130 }
    ]
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'BK-88219',
    customerName: 'Nguyễn Văn Minh',
    customerPhone: '0912345678',
    salonId: 'sal-1',
    salonName: 'StyleLock Salon Studio - Cầu Giấy',
    salonAddress: '102 Xuân Thủy, Cầu Giấy, Hà Nội',
    hairstyleId: 'hs-1',
    hairstyleName: 'Layer Nam Hiện Đại',
    tryOnImageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400',
    serviceName: 'Cắt + Uốn Layer / Two Block',
    date: '2026-09-03',
    timeSlot: '14:30',
    status: 'CONFIRMED',
    createdAt: '2026-09-02 16:30',
    totalPrice: 350000,
    qrCode: 'STYLELOCK-BK-88219'
  },
  {
    id: 'BK-88220',
    customerName: 'Trần Thị Thu Hà',
    customerPhone: '0987654321',
    salonId: 'sal-3',
    salonName: 'Lê Hiếu Hair Salon - Hoàn Kiếm',
    salonAddress: '18 Hàng Bài, Hoàn Kiếm, Hà Nội',
    hairstyleId: 'hs-9',
    hairstyleName: 'Layer Nữ Sóng Lơi',
    tryOnImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    serviceName: 'Uốn xoăn sóng nước cao cấp',
    date: '2026-09-04',
    timeSlot: '10:00',
    status: 'PENDING',
    createdAt: '2026-09-02 16:45',
    totalPrice: 800000,
    qrCode: 'STYLELOCK-BK-88220'
  }
];
