/**
 * Hair Asset Resolver
 * Maps hairstyle catalog items to lightweight transparent SVG overlays.
 * These inline assets keep the camera screen buildable even when final PNG hair assets
 * are not present in the repo.
 */

function svgHairSource(path: string, accentPath?: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <rect width="160" height="160" fill="none"/>
      <path d="${path}" fill="#1E2322"/>
      ${accentPath ? `<path d="${accentPath}" fill="#5F6B55" opacity="0.55"/>` : ''}
    </svg>
  `;

  return { uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` };
}

export const HAIR_OVERLAYS: Record<string, any> = {
  twoblock: svgHairSource(
    'M33 72 C34 38 56 20 84 21 C113 22 134 43 134 76 C129 65 116 58 101 58 L101 114 C91 119 75 119 62 114 L62 58 C50 59 39 64 33 72 Z',
    'M62 42 C75 29 103 29 116 48 C96 41 77 42 62 52 Z'
  ),
  undercut: svgHairSource(
    'M35 76 C39 37 63 20 93 25 C118 29 132 47 133 77 C124 63 108 55 88 55 C68 55 49 62 35 76 Z M47 72 C49 98 60 118 80 124 C52 119 38 100 35 82 Z M125 72 C121 101 106 119 80 124 C101 117 113 96 113 72 Z',
    'M52 50 C71 36 98 35 117 52 C96 48 73 49 52 59 Z'
  ),
  sidepart: svgHairSource(
    'M28 75 C33 42 57 24 89 25 C116 26 136 48 137 78 C114 62 93 57 71 62 C55 66 41 70 28 75 Z M73 31 C78 60 72 88 56 113 C77 104 92 77 92 34 Z',
    'M38 62 C55 46 75 40 98 42 C79 48 61 57 43 73 Z'
  ),
  bob: svgHairSource(
    'M34 74 C34 42 56 22 81 22 C112 22 132 44 132 78 C132 105 121 130 105 138 C109 112 107 79 96 60 C85 67 63 69 47 61 C42 82 44 113 55 139 C40 132 34 105 34 74 Z',
    'M48 47 C64 33 95 31 115 52 C94 46 70 48 48 59 Z'
  ),
  curly: svgHairSource(
    'M30 77 C25 60 35 45 49 45 C48 30 68 19 82 30 C94 17 117 26 116 45 C134 48 140 68 128 82 C135 99 118 116 101 109 C91 124 67 124 59 108 C42 113 27 96 34 82 C32 80 31 79 30 77 Z',
    'M51 61 C62 49 76 51 82 63 C90 51 107 53 113 67 C95 61 72 62 51 72 Z'
  )
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
