import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
  TouchableOpacity,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { LocalizedText as Text } from '../i18n/LocalizedComponents';
import { backendApi } from '../services/backendApi';
import { Hairstyle } from '../types';
import { BottomNavBar } from '../components/BottomNavBar';
import { favoritesStore } from '../services/favoritesStore';
import { AppIcon } from '../components/AppIcon';

// Explore Modular Components
import {
  EXPLORE_THEME,
  ExploreFilterState,
  DEFAULT_FILTERS,
  GenderFilter,
  FALLBACK_30_HAIRSTYLES,
  removeVietnameseTones,
  inferHairLength,
  inferHairTexture,
  inferHairAesthetic,
  TRENDING_HAIRSTYLE_NAMES
} from '../components/explore/ExploreTypes';
import { ExploreHeader } from '../components/explore/ExploreHeader';
import { ExploreSearchBar } from '../components/explore/ExploreSearchBar';
import { GenderTabs } from '../components/explore/GenderTabs';
import { FilterChips } from '../components/explore/FilterChips';
import { TrendingSection } from '../components/explore/TrendingSection';
import { HairstyleCard } from '../components/explore/HairstyleCard';
import { FilterPanelModal } from '../components/explore/FilterPanelModal';

interface HairstyleSelectScreenProps {
  navigation: any;
  route?: any;
}

export const HairstyleSelectScreen: React.FC<HairstyleSelectScreenProps> = ({
  navigation,
  route
}) => {
  const userPhotoUri = route?.params?.userPhotoUri;
  const { width } = useWindowDimensions();

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<ExploreFilterState>(DEFAULT_FILTERS);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

  // Data State
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>(FALLBACK_30_HAIRSTYLES);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [, setFavTick] = useState<number>(0);

  // Load Hairstyles from Backend API with Fallback
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setLoadError(undefined);
      try {
        const apiData = await backendApi.getHairstyles();
        if (isMounted) {
          if (apiData && apiData.length > 0) {
            setHairstyles(apiData);
          } else {
            setHairstyles(FALLBACK_30_HAIRSTYLES);
          }
        }
      } catch (err) {
        if (isMounted) {
          // If network error, still provide the curated 30 hairstyles so user experience is uninterrupted
          setHairstyles(FALLBACK_30_HAIRSTYLES);
          setLoadError('Không thể kết nối đến máy chủ. Đang hiển thị danh mục offline.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadData();

    const unsubFav = favoritesStore.subscribe(() => {
      if (isMounted) setFavTick((t) => t + 1);
    });

    return () => {
      isMounted = false;
      unsubFav();
    };
  }, [reloadKey]);

  // Gender Counts
  const maleCount = useMemo(
    () => hairstyles.filter((h) => h.gender === 'nam').length,
    [hairstyles]
  );
  const femaleCount = useMemo(
    () => hairstyles.filter((h) => h.gender === 'nu').length,
    [hairstyles]
  );

  // Active filters count (for badge and reset button)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.gender !== 'All') count += 1;
    if (filters.length !== 'All') count += 1;
    if (filters.styleType !== 'All') count += 1;
    if (filters.texture !== 'All') count += 1;
    if (filters.aesthetic !== 'All') count += 1;
    if (filters.sort !== 'featured') count += 1;
    if (searchQuery.trim().length > 0) count += 1;
    return count;
  }, [filters, searchQuery]);

  // Filter & Search Logic
  const filteredHairstyles = useMemo(() => {
    const rawSearch = searchQuery.trim();
    const cleanSearch = removeVietnameseTones(rawSearch);

    return hairstyles
      .filter((hair) => {
        // 1. Gender Filter
        if (filters.gender === 'Men' && hair.gender !== 'nam') return false;
        if (filters.gender === 'Women' && hair.gender !== 'nu') return false;

        // 2. Length Filter
        if (filters.length !== 'All' && inferHairLength(hair) !== filters.length) {
          return false;
        }

        // 3. Texture Filter
        if (filters.texture !== 'All' && inferHairTexture(hair) !== filters.texture) {
          return false;
        }

        // 4. Aesthetic Filter
        if (filters.aesthetic !== 'All' && inferHairAesthetic(hair) !== filters.aesthetic) {
          return false;
        }

        // 5. Style Type Filter
        if (filters.styleType !== 'All') {
          const styleTarget = removeVietnameseTones(filters.styleType);
          const hairText = removeVietnameseTones(
            `${hair.name} ${hair.description} ${hair.category}`
          );
          if (!hairText.includes(styleTarget)) return false;
        }

        // 6. Search Query (Accent-insensitive)
        if (cleanSearch.length > 0) {
          const combined = removeVietnameseTones(
            `${hair.name} ${hair.description} ${hair.category} ${hair.suitableFace}`
          );
          if (!combined.includes(cleanSearch)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sort === 'name_asc') {
          return a.name.localeCompare(b.name, 'vi');
        }
        if (filters.sort === 'popular') {
          const aTrend = TRENDING_HAIRSTYLE_NAMES.some((n) =>
            a.name.toLowerCase().includes(n.toLowerCase())
          );
          const bTrend = TRENDING_HAIRSTYLE_NAMES.some((n) =>
            b.name.toLowerCase().includes(n.toLowerCase())
          );
          if (aTrend && !bTrend) return -1;
          if (!aTrend && bTrend) return 1;
        }
        return 0;
      });
  }, [hairstyles, filters, searchQuery]);

  // Actions
  const handleOpenDetail = useCallback(
    (hair: Hairstyle) => {
      navigation.navigate('HairstyleDetail', { hairstyle: hair });
    },
    [navigation]
  );

  const handleTryOn = useCallback(
    (hair: Hairstyle) => {
      if (userPhotoUri) {
        navigation.navigate('TryOnEditor', {
          userPhotoUri,
          hairstyle: hair
        });
      } else {
        navigation.navigate('CameraUpload', {
          preselectedHair: hair
        });
      }
    },
    [navigation, userPhotoUri]
  );

  const handleClearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
  }, []);

  const handleSelectGender = useCallback((gender: GenderFilter) => {
    setFilters((prev) => ({ ...prev, gender }));
  }, []);

  // Responsive Grid Calculations
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const numColumns = isDesktop ? 4 : isTablet ? 3 : 2;
  const gridGap = 12;
  const totalHorizontalPadding = 40; // 20 each side
  const availableWidth = width - totalHorizontalPadding - gridGap * (numColumns - 1);
  const cardWidth = Math.floor(availableWidth / numColumns);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Sticky Header Section */}
        <ExploreHeader
          navigation={navigation}
          totalCount={hairstyles.length}
        />

        {/* Search Bar with Filter Trigger */}
        <ExploreSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          onOpenFilter={() => setShowFilterModal(true)}
          activeFilterCount={activeFilterCount}
        />

        {/* Gender Segmented Tabs: Tất cả | Nam | Nữ */}
        <GenderTabs
          selectedGender={filters.gender}
          onSelectGender={handleSelectGender}
          maleCount={maleCount}
          femaleCount={femaleCount}
          totalCount={hairstyles.length}
        />

        {/* Quick Filter Chips */}
        <FilterChips
          filters={filters}
          onOpenFilterModal={() => setShowFilterModal(true)}
          onClearFilters={handleClearAllFilters}
          onSelectLength={(length) => setFilters((p) => ({ ...p, length }))}
          onSelectTexture={(texture) => setFilters((p) => ({ ...p, texture }))}
          onSelectSort={(sort) => setFilters((p) => ({ ...p, sort }))}
          activeFilterCount={activeFilterCount}
        />

        {/* Main Scroll Content */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Trending Carousel Section (Hidden during search or specific filter to keep focus) */}
          {searchQuery.trim().length === 0 &&
            filters.length === 'All' &&
            filters.styleType === 'All' &&
            filters.texture === 'All' && (
              <TrendingSection
                hairstyles={hairstyles}
                onSelectHair={handleTryOn}
                onOpenDetail={handleOpenDetail}
                onSeeAllTrending={() => {
                  setFilters((prev) => ({ ...prev, sort: 'popular' }));
                }}
              />
            )}

          {/* All Hairstyles Section Title & Count */}
          <View style={styles.galleryHeader}>
            <View>
              <Text style={styles.galleryTitle}>Tất cả kiểu tóc</Text>
              <Text style={styles.gallerySubtitle}>
                Hiển thị {filteredHairstyles.length} trên tổng {hairstyles.length} kiểu
              </Text>
            </View>

            {activeFilterCount > 0 && (
              <TouchableOpacity
                onPress={handleClearAllFilters}
                style={styles.resetInlineBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.resetInlineText}>Đặt lại bộ lọc</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={EXPLORE_THEME.primary} />
              <Text style={styles.loadingText}>Đang tải danh mục kiểu tóc...</Text>
            </View>
          )}

          {/* Error State Banner */}
          {loadError && (
            <View style={styles.errorBanner}>
              <AppIcon name="warning" size={18} color="#A84C62" />
              <Text style={styles.errorText}>{loadError}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => setReloadKey((k) => k + 1)}
              >
                <Text style={styles.retryBtnText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Empty State */}
          {!loading && filteredHairstyles.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <AppIcon name="scissors" size={32} color={EXPLORE_THEME.primary} />
              </View>
              <Text style={styles.emptyTitle}>Không tìm thấy kiểu tóc phù hợp</Text>
              <Text style={styles.emptyDesc}>
                Hãy thử nới lỏng bộ lọc hoặc tìm kiếm với từ khóa khác (ví dụ: Layer, Two Block, Bob, Sóng lơi...)
              </Text>
              <TouchableOpacity
                style={styles.emptyResetBtn}
                onPress={handleClearAllFilters}
                activeOpacity={0.85}
              >
                <AppIcon name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyResetText}>Xóa tất cả bộ lọc</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Responsive Hairstyles Grid */}
          {!loading && filteredHairstyles.length > 0 && (
            <View style={styles.gridContainer}>
              {filteredHairstyles.map((hair) => (
                <HairstyleCard
                  key={hair.id}
                  hair={hair}
                  onOpenDetail={handleOpenDetail}
                  onTryOn={handleTryOn}
                  cardWidth={cardWidth}
                />
              ))}
            </View>
          )}

          {/* Bottom Spacing for BottomNavBar */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Global Bottom Navigation Bar */}
        <BottomNavBar active="Explore" navigation={navigation} />

        {/* Advanced Filter Modal Bottom Sheet */}
        <FilterPanelModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          filters={filters}
          onApplyFilters={setFilters}
          matchingCount={filteredHairstyles.length}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: EXPLORE_THEME.background
  },
  container: {
    flex: 1,
    backgroundColor: EXPLORE_THEME.background
  },
  scrollContainer: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 24
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10
  },
  galleryTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: EXPLORE_THEME.text,
    letterSpacing: -0.3
  },
  gallerySubtitle: {
    fontSize: 12,
    color: EXPLORE_THEME.textSecondary,
    marginTop: 2
  },
  resetInlineBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  resetInlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: EXPLORE_THEME.primary
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 14,
    color: EXPLORE_THEME.textSecondary,
    fontWeight: '600'
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF0EF',
    borderWidth: 1,
    borderColor: '#E8B9B3',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#8A2D3E',
    fontWeight: '600'
  },
  retryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8B9B3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A2D3E'
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: EXPLORE_THEME.tagBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: EXPLORE_THEME.text,
    textAlign: 'center',
    marginBottom: 8
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: EXPLORE_THEME.textSecondary,
    textAlign: 'center',
    marginBottom: 20
  },
  emptyResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: EXPLORE_THEME.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  emptyResetText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
