import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, DimensionValue } from 'react-native';
import { LocalizedText as Text } from '../../i18n/LocalizedComponents';
import { Hairstyle } from '../../types';
import { AppIcon } from '../AppIcon';
import { EXPLORE_THEME, inferHairLength } from './ExploreTypes';
import { favoritesStore } from '../../services/favoritesStore';

interface HairstyleCardProps {
  hair: Hairstyle;
  onOpenDetail: (hair: Hairstyle) => void;
  onTryOn: (hair: Hairstyle) => void;
  cardWidth?: DimensionValue;
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600';

export const HairstyleCard: React.FC<HairstyleCardProps> = ({
  hair,
  onOpenDetail,
  onTryOn,
  cardWidth
}) => {
  const [imageError, setImageError] = useState(false);
  const [isFav, setIsFav] = useState(favoritesStore.isFavorite(hair.id));

  const isMale = hair.gender === 'nam';
  const lengthTag = inferHairLength(hair);
  const lengthLabel = lengthTag === 'Short' ? 'Ngắn' : lengthTag === 'Medium' ? 'Vừa' : 'Dài';

  const handleToggleFavorite = (e: any) => {
    e.stopPropagation?.();
    const next = favoritesStore.toggleFavorite(hair.id);
    setIsFav(next);
  };

  return (
    <TouchableOpacity
      style={[styles.card, cardWidth ? { width: cardWidth } : null]}
      activeOpacity={0.92}
      onPress={() => onOpenDetail(hair)}
      accessibilityRole="button"
      accessibilityLabel={`Xem chi tiết kiểu tóc ${hair.name}`}
    >
      {/* 4:5 Aspect Ratio Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageError || !hair.imageUrl ? FALLBACK_IMG : hair.imageUrl }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />

        {/* Favorite Heart Button */}
        <TouchableOpacity
          style={styles.favBtn}
          onPress={handleToggleFavorite}
          activeOpacity={0.8}
          accessibilityLabel={isFav ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        >
          <AppIcon
            name={isFav ? 'heartFilled' : 'heart'}
            size={18}
            color={isFav ? EXPLORE_THEME.heartActive : EXPLORE_THEME.heartInactive}
          />
        </TouchableOpacity>

        {/* Gender Badge on Image */}
        <View style={[styles.genderBadgeOnImg, isMale ? styles.maleBadge : styles.femaleBadge]}>
          <Text style={[styles.genderBadgeText, isMale ? styles.maleBadgeText : styles.femaleBadgeText]}>
            {isMale ? 'Nam' : 'Nữ'}
          </Text>
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.content}>
        {/* Metadata Badges */}
        <View style={styles.metaRow}>
          <View style={styles.lengthTag}>
            <Text style={styles.lengthTagText}>{lengthLabel}</Text>
          </View>
          <Text style={styles.categoryText} numberOfLines={1}>
            {hair.category}
          </Text>
        </View>

        {/* Name */}
        <Text style={styles.hairName} numberOfLines={1}>
          {hair.name}
        </Text>

        {/* Description Snippet */}
        <Text style={styles.description} numberOfLines={2}>
          {hair.description}
        </Text>

        {/* Primary CTA Button: Thử kiểu tóc */}
        <TouchableOpacity
          style={styles.tryOnBtn}
          activeOpacity={0.85}
          onPress={(e) => {
            e.stopPropagation?.();
            onTryOn(hair);
          }}
          accessibilityLabel={`Thử kiểu tóc ${hair.name}`}
        >
          <AppIcon name="scissors" size={15} color="#FFFFFF" style={styles.tryOnIcon} />
          <Text style={styles.tryOnBtnText}>Thử kiểu tóc</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: EXPLORE_THEME.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.85,
    backgroundColor: EXPLORE_THEME.tagBg,
    position: 'relative',
    overflow: 'hidden'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 2
  },
  genderBadgeOnImg: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 2
  },
  maleBadge: {
    backgroundColor: 'rgba(234, 240, 246, 0.94)'
  },
  maleBadgeText: {
    color: EXPLORE_THEME.maleBadgeText
  },
  femaleBadge: {
    backgroundColor: 'rgba(248, 236, 238, 0.94)'
  },
  femaleBadgeText: {
    color: EXPLORE_THEME.femaleBadgeText
  },
  genderBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2
  },
  content: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  lengthTag: {
    backgroundColor: EXPLORE_THEME.tagBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  lengthTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: EXPLORE_THEME.textSecondary
  },
  categoryText: {
    fontSize: 11,
    color: EXPLORE_THEME.textMuted,
    flex: 1
  },
  hairName: {
    fontSize: 15,
    fontWeight: '800',
    color: EXPLORE_THEME.text,
    marginBottom: 4
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    color: EXPLORE_THEME.textSecondary,
    marginBottom: 10,
    minHeight: 32
  },
  tryOnBtn: {
    backgroundColor: EXPLORE_THEME.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6
  },
  tryOnIcon: {
    marginRight: 2
  },
  tryOnBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
