import { Hairstyle } from '../../types';

export const EXPLORE_THEME = {
  background: '#FAF7F2',
  primary: '#A66A45',
  primaryDark: '#8B4E2B',
  primarySoft: '#F4ECE1',
  text: '#352820',
  textSecondary: '#6F5F53',
  textMuted: '#9B8B7D',
  card: '#FFFFFF',
  border: '#E9DED2',
  tagBg: '#F5ECE1',
  accentTag: '#EFE2D3',
  maleBadgeBg: '#EAF0F6',
  maleBadgeText: '#3B6898',
  femaleBadgeBg: '#F8ECEE',
  femaleBadgeText: '#A84C62',
  heartActive: '#C44D3F',
  heartInactive: '#A66A45'
};

export type GenderFilter = 'All' | 'Men' | 'Women';
export type LengthFilter = 'All' | 'Short' | 'Medium' | 'Long';
export type StyleTypeFilter =
  | 'All'
  | 'Layer'
  | 'Two Block'
  | 'Bob'
  | 'Mullet'
  | 'Ivy League'
  | 'Buzz Cut'
  | 'Pixie'
  | 'Crop'
  | 'Quiff'
  | 'Wolf Cut'
  | 'Sóng lơi';

export type TextureFilter = 'All' | 'Straight' | 'Wavy' | 'Curly';
export type AestheticFilter = 'All' | 'Korean' | 'Elegant' | 'Edgy' | 'Natural';
export type SortOption = 'featured' | 'popular' | 'name_asc';

export interface ExploreFilterState {
  gender: GenderFilter;
  length: LengthFilter;
  styleType: StyleTypeFilter;
  texture: TextureFilter;
  aesthetic: AestheticFilter;
  sort: SortOption;
}

export const DEFAULT_FILTERS: ExploreFilterState = {
  gender: 'All',
  length: 'All',
  styleType: 'All',
  texture: 'All',
  aesthetic: 'All',
  sort: 'featured'
};

/**
 * Loại bỏ dấu tiếng Việt để tìm kiếm không phụ thuộc dấu
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Suy luận độ dài tóc từ metadata, tên và mô tả
 */
export function inferHairLength(hair: Hairstyle): 'Short' | 'Medium' | 'Long' {
  const text = `${hair.name} ${hair.description} ${hair.category}`.toLowerCase();
  if (
    text.includes('ngắn') ||
    text.includes('short') ||
    text.includes('buzz') ||
    text.includes('crop') ||
    text.includes('pixie') ||
    text.includes('tém') ||
    text.includes('bob') ||
    text.includes('quiff') ||
    text.includes('ivy league')
  ) {
    return 'Short';
  }
  if (
    text.includes('dài') ||
    text.includes('long') ||
    text.includes('lưng') ||
    text.includes('ngực') ||
    text.includes('water wave')
  ) {
    return 'Long';
  }
  return 'Medium';
}

/**
 * Suy luận kết cấu tóc (Thẳng, Uốn gợn, Xoăn)
 */
export function inferHairTexture(hair: Hairstyle): 'Straight' | 'Wavy' | 'Curly' {
  const text = `${hair.name} ${hair.description} ${hair.category}`.toLowerCase();
  if (
    text.includes('xoăn') ||
    text.includes('curly') ||
    text.includes('hippie') ||
    text.includes('xù mì')
  ) {
    return 'Curly';
  }
  if (
    text.includes('uốn') ||
    text.includes('sóng') ||
    text.includes('wavy') ||
    text.includes('wave') ||
    text.includes('cụp') ||
    text.includes('lơi')
  ) {
    return 'Wavy';
  }
  return 'Straight';
}

/**
 * Suy luận phong cách (Hàn Quốc, Lịch lãm, Cá tính, Tự nhiên)
 */
export function inferHairAesthetic(hair: Hairstyle): 'Korean' | 'Elegant' | 'Edgy' | 'Natural' {
  const text = `${hair.name} ${hair.description} ${hair.category}`.toLowerCase();
  if (
    text.includes('hàn quốc') ||
    text.includes('korean') ||
    text.includes('two block') ||
    text.includes('comma') ||
    text.includes('mái bay') ||
    text.includes('mái thưa')
  ) {
    return 'Korean';
  }
  if (
    text.includes('lịch lãm') ||
    text.includes('pompadour') ||
    text.includes('side part') ||
    text.includes('slick back') ||
    text.includes('ivy league') ||
    text.includes('thanh lịch')
  ) {
    return 'Elegant';
  }
  if (
    text.includes('cá tính') ||
    text.includes('wolf cut') ||
    text.includes('mullet') ||
    text.includes('tomboy') ||
    text.includes('blunt bob') ||
    text.includes('hime cut') ||
    text.includes('shag')
  ) {
    return 'Edgy';
  }
  return 'Natural';
}

/**
 * Danh sách 30 kiểu tóc chuẩn (15 Nam, 15 Nữ) dùng làm fallback đồng bộ
 */
export const FALLBACK_30_HAIRSTYLES: Hairstyle[] = [
  // 15 KIỂU TÓC NAM
  {
    id: 'hs-male-1',
    name: 'Two Block',
    category: 'Korean',
    gender: 'nam',
    imageUrl: 'https://res.cloudinary.com/cmxpmg9p/image/upload/v1791979533/suppcxdbcyrcnxnvzcnw.png',
    description: 'Tóc hai lớp, phần trên dài và phồng, hai bên cắt gọn; phong cách Hàn Quốc trẻ trung.',
    suitableFace: 'Mặt tròn, mặt trái xoan'
  },
  {
    id: 'hs-male-2',
    name: 'Comma Hair',
    category: 'Korean',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
    description: 'Mái uốn cong hình dấu phẩy, tạo vẻ lịch lãm và thời trang.',
    suitableFace: 'Mặt trái xoan, mặt dài'
  },
  {
    id: 'hs-male-3',
    name: 'Layer nam',
    category: 'Layer',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800',
    description: 'Tỉa nhiều lớp, tóc mềm mại, tự nhiên, dễ kết hợp với mái rủ.',
    suitableFace: 'Mọi khuôn mặt'
  },
  {
    id: 'hs-male-4',
    name: 'Textured Crop',
    category: 'Short',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=800',
    description: 'Tóc ngắn, phần mái tỉa texture tạo độ rối tự nhiên, cá tính.',
    suitableFace: 'Mặt vuông, mặt góc cạnh'
  },
  {
    id: 'hs-male-5',
    name: 'French Crop',
    category: 'Short',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800',
    description: 'Hai bên gọn, mái ngắn đổ về phía trước, ít tốn công tạo kiểu.',
    suitableFace: 'Mặt tròn, mặt vuông'
  },
  {
    id: 'hs-male-6',
    name: 'Side Part',
    category: 'Side Part & Quiff',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1595152452543-e5fc28ebc2b8?w=800',
    description: 'Tóc chia ngôi lệch, phù hợp phong cách trưởng thành, chỉn chu.',
    suitableFace: 'Mặt trái xoan, mặt dài'
  },
  {
    id: 'hs-male-7',
    name: 'Quiff',
    category: 'Side Part & Quiff',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800',
    description: 'Phần tóc trước vuốt dựng và tạo độ phồng, năng động.',
    suitableFace: 'Mặt tròn, mặt ngắn'
  },
  {
    id: 'hs-male-8',
    name: 'Modern Pompadour',
    category: 'Side Part & Quiff',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800',
    description: 'Phần tóc phía trước vuốt cao, có độ phồng rõ rệt, lịch lãm.',
    suitableFace: 'Mặt tròn, mặt vuông'
  },
  {
    id: 'hs-male-9',
    name: 'Slick Back',
    category: 'Undercut & Fade',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
    description: 'Tóc vuốt ngược ra sau, phong cách nam tính và gọn gàng.',
    suitableFace: 'Mặt góc cạnh, mặt trái xoan'
  },
  {
    id: 'hs-male-10',
    name: 'Middle Part (Curtain Hair)',
    category: 'Korean',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
    description: 'Tóc rẽ ngôi giữa, mái buông hai bên, mang phong cách Hàn Quốc.',
    suitableFace: 'Mặt thon dài, mặt trái xoan'
  },
  {
    id: 'hs-male-11',
    name: 'Messy Hair',
    category: 'Layer',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    description: 'Tóc rối có chủ đích, tạo vẻ tự nhiên, phóng khoáng.',
    suitableFace: 'Mặt trái xoan, mặt tròn'
  },
  {
    id: 'hs-male-12',
    name: 'Wolf Cut nam',
    category: 'Layer & Mullet',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800',
    description: 'Tỉa layer nhiều tầng, phần gáy dài hơn, mang phong cách cá tính.',
    suitableFace: 'Mặt góc cạnh, mặt dài'
  },
  {
    id: 'hs-male-13',
    name: 'Mullet nam',
    category: 'Layer & Mullet',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800',
    description: 'Phần trước và hai bên gọn hơn, tóc gáy để dài, nổi bật và phá cách.',
    suitableFace: 'Mặt góc cạnh, mặt trái tim'
  },
  {
    id: 'hs-male-14',
    name: 'Buzz Cut',
    category: 'Short',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800',
    description: 'Tóc cắt rất ngắn, tối giản, dễ chăm sóc.',
    suitableFace: 'Mặt vuông, xương hàm rõ nét'
  },
  {
    id: 'hs-male-15',
    name: 'Ivy League',
    category: 'Short',
    gender: 'nam',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    description: 'Tóc ngắn gọn, phần trên dài vừa đủ để chải lệch hoặc tạo phồng, thanh lịch.',
    suitableFace: 'Mặt trái xoan, mặt vuông'
  },

  // 15 KIỂU TÓC NỮ
  {
    id: 'hs-female-1',
    name: 'Layer nữ sóng lơi',
    category: 'Layer',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
    description: 'Tóc tỉa layer bồng bềnh kết hợp uốn sóng lơi nhẹ nhàng, tôn dáng mặt tự nhiên.',
    suitableFace: 'Mặt tròn, mặt vuông'
  },
  {
    id: 'hs-female-2',
    name: 'Bob ngắn mái thưa',
    category: 'Short',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
    description: 'Tóc bob ngang cằm trẻ trung, kết hợp mái thưa chuẩn Hàn Quốc giúp gương mặt nhỏ gọn.',
    suitableFace: 'Mặt nhỏ, V-line'
  },
  {
    id: 'hs-female-3',
    name: 'Hippie Curly Retro',
    category: 'Curly',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800',
    description: 'Xoăn xù mì phong cách retro cổ điển cá tính, tạo độ dày dặn và nét riêng biệt.',
    suitableFace: 'Mặt dài, mặt trái xoan'
  },
  {
    id: 'hs-female-4',
    name: 'Pixie Cut cá tính',
    category: 'Short',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800',
    description: 'Tóc tém pixie sắc sảo, cắt ngắn gọn gàng khoe trọn đường nét thanh tú và xương quai xanh.',
    suitableFace: 'Mặt trái xoan, mặt góc cạnh'
  },
  {
    id: 'hs-female-5',
    name: 'Hime Cut phong cách Nhật',
    category: 'Korean',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    description: 'Tóc công chúa Nhật Bản với hai dải tóc mai cắt bằng ngang cằm độc đáo, thu hút.',
    suitableFace: 'Mặt tròn, mặt trái xoan'
  },
  {
    id: 'hs-female-6',
    name: 'Butterfly Cut bồng bềnh',
    category: 'Layer',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
    description: 'Tỉa layer cánh bướm nhiều tầng cao cấp, tạo độ phồng và hiệu ứng bay tự nhiên.',
    suitableFace: 'Mặt dài, mặt góc cạnh'
  },
  {
    id: 'hs-female-7',
    name: 'Uốn gợn sóng Water Wave',
    category: 'Curly',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
    description: 'Sóng nước óng ả mềm mại, phong cách thanh lịch nữ tính cho mái tóc dài.',
    suitableFace: 'Mọi khuôn mặt'
  },
  {
    id: 'hs-female-8',
    name: 'Mái bay Hàn Quốc',
    category: 'Korean',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800',
    description: 'Tóc dài buông xõa kết hợp mái bay thanh thoát, che khuyết điểm hai bên hàm hoàn hảo.',
    suitableFace: 'Mặt vuông, gò má cao'
  },
  {
    id: 'hs-female-9',
    name: 'Tóc uốn cụp chữ C',
    category: 'Short',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
    description: 'Đuôi tóc uốn cong chữ C nhẹ nhàng ôm trọn gương mặt, dễ chăm sóc tại nhà.',
    suitableFace: 'Mặt tròn, mặt vuông'
  },
  {
    id: 'hs-female-10',
    name: 'Tóc thẳng tỉa đuôi chữ V',
    category: 'Layer',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
    description: 'Mái tóc suôn mượt tự nhiên, phần đuôi tỉa chữ V thanh thoát, hiện đại.',
    suitableFace: 'Mặt tròn, mặt trái xoan'
  },
  {
    id: 'hs-female-11',
    name: 'Tóc Wolf Cut nữ',
    category: 'Layer & Mullet',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
    description: 'Tỉa layer tầng phá cách, phần gáy bay bổng tạo diện mạo sắc sảo và cuốn hút.',
    suitableFace: 'Mặt dài, mặt trái tim'
  },
  {
    id: 'hs-female-12',
    name: 'Tóc ngắn Blunt Bob',
    category: 'Short',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800',
    description: 'Tóc bob cắt chân bằng dứt khoát ngang cằm, tối giản mà vô cùng thời thượng.',
    suitableFace: 'Mặt V-line, mặt trái xoan'
  },
  {
    id: 'hs-female-13',
    name: 'Tóc xoăn lọn to Hàn Quốc',
    category: 'Curly',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800',
    description: 'Lọn sóng to bồng bềnh chuẩn sao Hàn, mang lại diện mạo kiêu kỳ, sang trọng.',
    suitableFace: 'Mặt tròn, mặt vuông'
  },
  {
    id: 'hs-female-14',
    name: 'Tóc Shag Mullet nữ',
    category: 'Layer & Mullet',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1507152832244-10d45c7eda57?w=800',
    description: 'Sự kết hợp giữa Shag cổ điển và Mullet hiện đại, phóng khoáng và nổi bật.',
    suitableFace: 'Mặt góc cạnh, cá tính'
  },
  {
    id: 'hs-female-15',
    name: 'Tóc tém Tomboy thanh lịch',
    category: 'Short',
    gender: 'nu',
    imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800',
    description: 'Kiểu tóc tém cắt gọn gàng, năng động nhưng không kém phần thanh lịch, cá tính.',
    suitableFace: 'Mặt thon nhỏ, mặt góc cạnh'
  }
];

export const TRENDING_HAIRSTYLE_NAMES = [
  'Two Block',
  'Layer nữ sóng lơi',
  'Comma Hair',
  'Butterfly Cut bồng bềnh',
  'Layer nam',
  'Bob ngắn mái thưa',
  'Mullet nam',
  'Mái bay Hàn Quốc'
];
