import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LocalizedText as Text } from '../../i18n/LocalizedComponents';
import { Hairstyle } from '../../types';
import { AppIcon } from '../AppIcon';
import { EXPLORE_THEME, TRENDING_HAIRSTYLE_NAMES } from './ExploreTypes';
import { favoritesStore } from '../../services/favoritesStore';

interface TrendingSectionProps {
  hairstyles: Hairstyle[];
  onSelectHair: (hair: Hairstyle) => void;
  onOpenDetail: (hair: Hairstyle) => void;
  onSeeAllTrending?: () => void;
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600';

export const TrendingSection: React.FC<TrendingSectionProps> = ({
  hairstyles,
  onSelectHair,
  onOpenDetail,
  onSeeAllTrending
}) => {
  const [, setFavTick] = useState(0);

  // Filter curated trending styles
  const trendingList = hairstyles.filter((h) =>
    TRENDING_HAIRSTYLE_NAMES.some((name) => h.name.toLowerCase().includes(name.toLowerCase()))
  );

  const listToRender = trendingList.length > 0 ? trendingList : hairstyles.slice(0, 6);

  const toggleFav = (id: string) => {
    favoritesStore.toggleFavorite(id);
    setFavTick((t) => t + 1);
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.titleWithIcon}>
            <AppIcon name="trendingUp" size={20} color={EXPLORE_THEME.primary} />
            <Text style={styles.title}>Đang thịnh hành</Text>
          </View>
          <Text style={styles.subtitle}>Những phong cách được yêu thích nhất</Text>
        </View>

        {onSeeAllTrending && (
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={onSeeAllTrending}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>Xem tất cả</Text>
            <AppIcon name="arrowRight" size={14} color={EXPLORE_THEME.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
      >
        {listToRender.map((hair) => {
          const isFav = favoritesStore.isFavorite(hair.id);
          const isMale = hair.gender === 'nam';

          return (
            <TouchableOpacity
              key={`trending-${hair.id}`}
              style={styles.trendingCard}
              activeOpacity={0.9}
              onPress={() => onOpenDetail(hair)}
            >
              <View style={styles.imgWrapper}>
                <Image
                  source={{ uri: hair.imageUrl || FALLBACK_IMG }}
                  style={styles.img}
                  resizeMode="cover"
                />

                {/* Trending Hot Tag */}
                <View style={styles.trendingTag}>
                  <Text style={styles.trendingTagText}>HOT</Text>
                </View>

                {/* Heart Button */}
                <TouchableOpacity
                  style={styles.favBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleFav(hair.id);
                  }}
                  activeOpacity={0.8}
                  accessibilityLabel="Yêu thích"
                >
                  <AppIcon
                    name={isFav ? 'heartFilled' : 'heart'}
                    size={17}
                    color={isFav ? EXPLORE_THEME.heartActive : EXPLORE_THEME.heartInactive}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.cardInfo}>
                <View style={styles.badgeRow}>
                  <View style={[styles.genderBadge, isMale ? styles.maleBadge : styles.femaleBadge]}>
                    <Text style={[styles.genderBadgeText, isMale ? styles.maleBadgeText : styles.femaleBadgeText]}>
                      {isMale ? 'Nam' : 'Nữ'}
                    </Text>
                  </View>
                  <Text style={styles.categoryText} numberOfLines={1}>
                    {hair.category}
                  </Text>
                </View>

                <Text style={styles.hairName} numberOfLines={1}>
                  {hair.name}
                </Text>

                <TouchableOpacity
                  style={styles.tryBtn}
                  activeOpacity={0.85}
                  onPress={(e) => {
                    e.stopPropagation();
                    onSelectHair(hair);
                  }}
                >
                  <Text style={styles.tryBtnText}>Thử ngay</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    backgroundColor: EXPLORE_THEME.background
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12
  },
  headerLeft: {
    flex: 1
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: EXPLORE_THEME.text
  },
  subtitle: {
    fontSize: 12,
    color: EXPLORE_THEME.textSecondary,
    marginTop: 2
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: EXPLORE_THEME.primary
  },
  carouselContent: {
    paddingHorizontal: 20,
    gap: 14
  },
  trendingCard: {
    width: 175,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: EXPLORE_THEME.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  imgWrapper: {
    width: '100%',
    height: 185,
    backgroundColor: EXPLORE_THEME.tagBg,
    position: 'relative'
  },
  img: {
    width: '100%',
    height: '100%'
  },
  trendingTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#C44D3F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  trendingTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2
  },
  cardInfo: {
    padding: 10
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  genderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  maleBadge: {
    backgroundColor: EXPLORE_THEME.maleBadgeBg
  },
  maleBadgeText: {
    color: EXPLORE_THEME.maleBadgeText,
    fontSize: 10,
    fontWeight: '700'
  },
  femaleBadge: {
    backgroundColor: EXPLORE_THEME.femaleBadgeBg
  },
  femaleBadgeText: {
    color: EXPLORE_THEME.femaleBadgeText,
    fontSize: 10,
    fontWeight: '700'
  },
  genderBadgeText: {
    fontSize: 10,
    fontWeight: '700'
  },
  categoryText: {
    fontSize: 11,
    color: EXPLORE_THEME.textMuted,
    flex: 1
  },
  hairName: {
    fontSize: 14,
    fontWeight: '800',
    color: EXPLORE_THEME.text,
    marginBottom: 8
  },
  tryBtn: {
    backgroundColor: EXPLORE_THEME.primary,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
