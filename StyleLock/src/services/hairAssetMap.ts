/**
 * Hair Asset Resolver
 * Maps hairstyle catalog items to dedicated transparent PNG hair models (mẫu tóc trong suốt).
 * Ensures that during virtual try-on, ONLY the hair is overlaid onto the user's face,
 * completely excluding the original model's body, suit, face or background.
 */

export const HAIR_OVERLAYS: Record<string, any> = {
  twoblock: require('../../assets/hairstyles/twoblock.png'),
  undercut: require('../../assets/hairstyles/undercut.png'),
  sidepart: require('../../assets/hairstyles/sidepart.png'),
  bob: require('../../assets/hairstyles/bob.png'),
  curly: require('../../assets/hairstyles/curly.png')
};

export interface HairColorOption {
  id: string;
  name: string;
  colorHex: string;
  tintColor?: string;
  textColor: string;
}

export const HAIR_COLORS: HairColorOption[] = [
  { id: 'natural', name: 'Đen Tự Nhiên', colorHex: '#1E2322', textColor: '#FFFFFF' },
  { id: 'choco', name: 'Nâu Socola', colorHex: '#3D2817', tintColor: '#4A301D', textColor: '#FFFFFF' },
  { id: 'chestnut', name: 'Nâu Hạt Dẻ', colorHex: '#5A3825', tintColor: '#6B422B', textColor: '#FFFFFF' },
  { id: 'ash_brown', name: 'Nâu Khói', colorHex: '#544A42', tintColor: '#61554C', textColor: '#FFFFFF' },
  { id: 'moss_brown', name: 'Nâu Rêu', colorHex: '#38483B', tintColor: '#3F5243', textColor: '#FFFFFF' },
  { id: 'burgundy', name: 'Đỏ Rượu', colorHex: '#581D22', tintColor: '#682228', textColor: '#FFFFFF' },
  { id: 'platinum', name: 'Bạch Kim', colorHex: '#8C8C8C', tintColor: '#9E9E9E', textColor: '#FFFFFF' }
];

export function resolveHairOverlaySource(hairstyle?: {
  name?: string;
  category?: string;
  overlayUrl?: any;
  imageUrl?: string;
}) {
  if (!hairstyle) return HAIR_OVERLAYS.twoblock;

  // If already an explicit overlay asset
  if (hairstyle.overlayUrl) {
    if (typeof hairstyle.overlayUrl === 'string') {
      return { uri: hairstyle.overlayUrl };
    }
    return hairstyle.overlayUrl;
  }

  const name = (hairstyle.name || '').toLowerCase();
  const cat = (hairstyle.category || '').toLowerCase();

  if (
    name.includes('two block') ||
    cat.includes('two block') ||
    name.includes('layer') ||
    cat.includes('layer')
  ) {
    return HAIR_OVERLAYS.twoblock;
  }

  if (
    name.includes('undercut') ||
    cat.includes('undercut') ||
    name.includes('fade') ||
    name.includes('buzz') ||
    name.includes('pompadour')
  ) {
    return HAIR_OVERLAYS.undercut;
  }

  if (
    name.includes('side part') ||
    cat.includes('side part') ||
    name.includes('7/3') ||
    name.includes('classic') ||
    name.includes('rẽ ngôi')
  ) {
    return HAIR_OVERLAYS.sidepart;
  }

  if (
    name.includes('bob') ||
    cat.includes('bob') ||
    name.includes('sleek') ||
    name.includes('pixie') ||
    cat.includes('female')
  ) {
    return HAIR_OVERLAYS.bob;
  }

  if (
    name.includes('curly') ||
    cat.includes('curly') ||
    name.includes('xoăn') ||
    name.includes('mullet') ||
    name.includes('wave')
  ) {
    return HAIR_OVERLAYS.curly;
  }

  // Default to clean Two block hair overlay
  return HAIR_OVERLAYS.twoblock;
}
