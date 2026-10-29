import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Platform,
  Linking
} from 'react-native';
import * as Location from 'expo-location';
import { LocalizedText as Text, LocalizedTextInput as TextInput, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import { DataState } from '../components/DataState';
import { backendApi } from '../services/backendApi';
import { Hairstyle, Salon } from '../types';
import { AppIcon } from '../components/AppIcon';
import { BottomNavBar } from '../components/BottomNavBar';
import { NotificationBellButton } from '../components/NotificationBellButton';
import { useLanguage } from '../i18n/LanguageContext';
import { favoritesStore } from '../services/favoritesStore';

interface SalonListScreenProps {
  navigation: any;
  route?: { params?: { selectedHairstyle?: Hairstyle; userPhotoUri?: string } };
}

type MainFilterType = 'All' | 'Distance' | 'Rating' | 'Price';
type DistanceSubFilter = 'nearest' | '2km' | '5km' | '10km';
type PriceSubFilter = 'lowToHigh' | 'highToLow' | 'under200' | '200to400' | 'over400';
type RatingSubFilter = 'highest' | '4.8' | '4.5' | '4.0';

export const SalonListScreen: React.FC<SalonListScreenProps> = ({ navigation, route }) => {
  const { language } = useLanguage();
  const selectedHairstyle: Hairstyle | undefined = route?.params?.selectedHairstyle;
  const userPhotoUri: string | undefined = route?.params?.userPhotoUri;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedLocationQuery, setAppliedLocationQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<MainFilterType>('All');
  const [distanceSubFilter, setDistanceSubFilter] = useState<DistanceSubFilter>('nearest');
  const [priceSubFilter, setPriceSubFilter] = useState<PriceSubFilter>('lowToHigh');
  const [ratingSubFilter, setRatingSubFilter] = useState<RatingSubFilter>('highest');

  const [, setFavVersion] = useState<number>(0);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [usingFallbackLocation, setUsingFallbackLocation] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadSalons = async () => {
      setLoading(true);
      setLoadError(undefined);
      try {
        let location: { latitude: number; longitude: number } | undefined;
        if (!appliedLocationQuery) {
          try {
          const permission = await Location.requestForegroundPermissionsAsync();
          if (permission.status === Location.PermissionStatus.GRANTED) {
            const current = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced
            });
            location = {
              latitude: current.coords.latitude,
              longitude: current.coords.longitude
            };
          }
        } catch {
          // Backend mặc định dùng trung tâm TP.HCM khi thiết bị không cấp được vị trí.
          }
        }
        if (isMounted) setUsingFallbackLocation(!location && !appliedLocationQuery);
        const apiSalons = await backendApi.getSalons(location, appliedLocationQuery);
        if (isMounted) setSalons(apiSalons);
      } catch (error) {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Không tải được danh sách salon.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSalons();

    const unsubscribe = favoritesStore.subscribe(() => {
      if (isMounted) setFavVersion((v) => v + 1);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [reloadKey, appliedLocationQuery]);

  const toggleFavorite = (id: string) => {
    favoritesStore.toggleFavorite(id);
    setFavVersion((v) => v + 1);
  };

  const handleToggleFilter = (filterKey: MainFilterType) => {
    if (activeFilter === filterKey) {
      setActiveFilter('All');
    } else {
      setActiveFilter(filterKey);
      if (filterKey === 'Distance') setDistanceSubFilter('nearest');
      if (filterKey === 'Price') setPriceSubFilter('lowToHigh');
      if (filterKey === 'Rating') setRatingSubFilter('highest');
    }
  };

  const salonsToDisplay = useMemo(() => {
    let list = salons.filter((salon) => {
      // Filter by Distance
      if (activeFilter === 'Distance') {
        const d = salon.distanceKm;
        if (d === undefined) return distanceSubFilter === 'nearest';
        if (distanceSubFilter === '2km') return d <= 2.0;
        if (distanceSubFilter === '5km') return d <= 5.0;
        if (distanceSubFilter === '10km') return d <= 10.0;
        return true;
      }

      // Filter by Price
      if (activeFilter === 'Price') {
        const min = salon.minPrice;
        if (min === undefined) return priceSubFilter === 'lowToHigh' || priceSubFilter === 'highToLow';
        if (priceSubFilter === 'under200') return min <= 200000;
        if (priceSubFilter === '200to400') return min >= 200000 && min <= 400000;
        if (priceSubFilter === 'over400') return min >= 400000;
        return true;
      }

      // Filter by Rating
      if (activeFilter === 'Rating') {
        if (ratingSubFilter === '4.8') return salon.rating >= 4.8;
        if (ratingSubFilter === '4.5') return salon.rating >= 4.5;
        if (ratingSubFilter === '4.0') return salon.rating >= 4.0;
        return true;
      }

      return true;
    });

    // Sort according to activeFilter & subFilter
    if (activeFilter === 'Distance') {
      list = [...list].sort((a, b) => {
        const da = a.distanceKm ?? parseFloat(a.distance) ?? 99;
        const db = b.distanceKm ?? parseFloat(b.distance) ?? 99;
        return da - db;
      });
    } else if (activeFilter === 'Price') {
      list = [...list].sort((a, b) => {
        if (a.minPrice === undefined && b.minPrice === undefined) return 0;
        if (a.minPrice === undefined) return 1;
        if (b.minPrice === undefined) return -1;
        const pa = a.minPrice;
        const pb = b.minPrice;
        return priceSubFilter === 'highToLow' ? pb - pa : pa - pb;
      });
    } else if (activeFilter === 'Rating') {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [salons, activeFilter, distanceSubFilter, priceSubFilter, ratingSubFilter]);

  const handleSelectSalon = async (salon: Salon) => {
    if (salon.isExternal) {
      if (salon.mapUrl) {
        try {
          await Linking.openURL(salon.mapUrl);
        } catch {
          Alert.alert('Không mở được bản đồ', 'Vui lòng thử lại sau.');
        }
      } else {
        navigation.navigate('SalonDetail', { salon, selectedHairstyle, userPhotoUri });
      }
      return;
    }
    if (!salon.bookingEligible) {
      Alert.alert(
        language === 'vi' ? 'Salon chưa nhận lịch' : 'Salon is not bookable yet',
        language === 'vi'
          ? 'Salon cần được duyệt và có ít nhất một dịch vụ, một stylist đang hoạt động.'
          : 'The salon needs approval plus at least one active service and stylist.'
      );
      return;
    }
    navigation.navigate('SalonDetail', {
      salon,
      selectedHairstyle,
      userPhotoUri
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <Text style={styles.brandTitle}>StyleLock</Text>

        <View style={styles.headerRightActions}>
          <NotificationBellButton navigation={navigation} style={styles.headerIconBtn} />
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <AppIcon name="user" size={20} color="#B8895A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Screen Header Title */}
        <Text style={styles.screenHeading}>Nearby Salons</Text>

        {/* Selected Hairstyle Context Banner (if coming from Try-On) */}
        {selectedHairstyle && (
          <View style={styles.contextBanner}>
            <Image source={{ uri: selectedHairstyle.imageUrl }} style={styles.contextImg} />
            <View style={styles.contextText}>
              <Text style={styles.contextTitle}>SELECTED HAIRSTYLE</Text>
              <Text style={styles.contextName}>{selectedHairstyle.name}</Text>
              <Text style={styles.contextSub}>
                {language === 'vi' ? 'Salon có dữ liệu phù hợp với kiểu tóc này' : 'Salons matching this hairstyle'}
              </Text>
            </View>
          </View>
        )}

        {/* Search & Filter Area */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <AppIcon name="search" size={18} color="#6F6255" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search salons near you..."
              placeholderTextColor="#9B8B7A"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={() => setAppliedLocationQuery(searchQuery.trim())}
            />
            <TouchableOpacity onPress={() => setAppliedLocationQuery(searchQuery.trim())} activeOpacity={0.8}>
              <Text style={{ color: '#B8895A', fontWeight: '700' }}>
                {language === 'vi' ? 'Tìm' : 'Search'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.locationStatus}>
            {appliedLocationQuery
              ? (language === 'vi' ? `Khu vực: ${appliedLocationQuery}` : `Area: ${appliedLocationQuery}`)
              : usingFallbackLocation
              ? (language === 'vi' ? 'Đang hiển thị khu vực trung tâm TP.HCM' : 'Showing central Ho Chi Minh City')
              : (language === 'vi' ? 'Đang dùng vị trí hiện tại của bạn' : 'Using your current location')}
          </Text>

          {/* Filter Chips Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {/* Distance */}
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'Distance' && styles.activeChip]}
              onPress={() => handleToggleFilter('Distance')}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, activeFilter === 'Distance' && styles.activeChipText]}>
                Distance
              </Text>
            </TouchableOpacity>

            {/* Rating */}
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'Rating' && styles.activeChip]}
              onPress={() => handleToggleFilter('Rating')}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, activeFilter === 'Rating' && styles.activeChipText]}>
                Rating
              </Text>
            </TouchableOpacity>

            {/* Price */}
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'Price' && styles.activeChip]}
              onPress={() => handleToggleFilter('Price')}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, activeFilter === 'Price' && styles.activeChipText]}>
                Price
              </Text>
            </TouchableOpacity>

          </ScrollView>

          {/* Sub-Filter Options Bar (Appears when Distance, Price, or Rating is selected) */}
          {activeFilter === 'Distance' && (
            <View style={styles.subFilterBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFilterScroll}>
                <TouchableOpacity
                  style={[styles.subFilterChip, distanceSubFilter === 'nearest' && styles.subFilterChipActive]}
                  onPress={() => setDistanceSubFilter('nearest')}
                >
                  <Text style={[styles.subFilterChipText, distanceSubFilter === 'nearest' && styles.subFilterChipTextActive]}>
                    {language === 'vi' ? '📍 Gần nhất' : '📍 Nearest'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subFilterChip, distanceSubFilter === '2km' && styles.subFilterChipActive]}
                  onPress={() => setDistanceSubFilter('2km')}
                >
                  <Text style={[styles.subFilterChipText, distanceSubFilter === '2km' && styles.subFilterChipTextActive]}>
                    {language === 'vi' ? 'Dưới 2 km' : '< 2 km'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subFilterChip, distanceSubFilter === '5km' && styles.subFilterChipActive]}
                  onPress={() => setDistanceSubFilter('5km')}
                >
                  <Text style={[styles.subFilterChipText, distanceSubFilter === '5km' && styles.subFilterChipTextActive]}>
                    {language === 'vi' ? 'Dưới 5 km' : '< 5 km'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subFilterChip, distanceSubFilter === '10km' && styles.subFilterChipActive]}
                  onPress={() => setDistanceSubFilter('10km')}
                >
                  <Text style={[styles.subFilterChipText, distanceSubFilter === '10km' && styles.subFilterChipTextActive]}>
                    {language === 'vi' ? 'Dưới 10 km' : '< 10 km'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {activeFilter === 'Price' && (
            <View style={styles.subFilterBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFilterScroll}>
                <TouchableOpacity
                  style={[styles.subFilterChip, priceSubFilter === 'lowToHigh' && styles.subFilterChipActive]}
                  onPress={() => setPriceSubFilter('lowToHigh')}
                >
                  <Text style={[styles.subFilterChipText, priceSubFilter === 'lowToHigh' && styles.subFilterChipTextActive]}>
                    {language === 'vi' ? 'Giá thấp → cao' : 'Price: Low to High'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subFilterChip, priceSubFilter === 'highToLow' && styles.subFilterChipActive]}
                  onPress={() => setPriceSubFilter('highToLow')}
                >
                  <Text style={[styles.subFilterChipText, priceSubFilter === 'highToLow' && styles.subFilterChipTextActive]}>
                    {language === 'vi' ? 'Giá cao → thấp' : 'Price: High to Low'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subFilterChip, priceSubFilter === 'under200' && styles.subFilterChipActive]}
                  onPress={() => setPriceSubFilter(priceSubFilter === 'under200' ? 'lowToHigh' : 'under200')}
                >
                  <Text style={[styles.subFilterChipText, priceSubFilter === 'under200' && styles.subFilterChipTextActive]}>
                    {language === 'vi' ? 'Dưới 200k' : '< 200k'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subFilterChip, priceSubFilter === '200to400' && styles.subFilterChipActive]}
                  onPress={() => setPriceSubFilter(priceSubFilter === '200to400' ? 'lowToHigh' : '200to400')}
                >
                  <Text style={[styles.subFilterChipText, priceSubFilter === '200to400' && styles.subFilterChipTextActive]}>
                    200k - 400k
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subFilterChip, priceSubFilter === 'over400' && styles.subFilterChipActive]}
                  onPress={() => setPriceSubFilter(priceSubFilter === 'over400' ? 'lowToHigh' : 'over400')}
                >
                  <Text style={[styles.subFilterChipText, priceSubFilter === 'over400' && styles.subFilterChipTextActive]}>
                    {language === 'vi' ? 'Trên 400k' : '> 400k'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {activeFilter === 'Rating' && (
            <View style={styles.subFilterBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFilterScroll}>
                <TouchableOpacity
                  style={[styles.subFilterChip, ratingSubFilter === 'highest' && styles.subFilterChipActive]}
                  onPress={() => setRatingSubFilter('highest')}
                >
                  <Text style={[styles.subFilterChipText, ratingSubFilter === 'highest' && styles.subFilterChipTextActive]}>
                    {language === 'vi' ? '★ Điểm cao nhất' : '★ Highest rating'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subFilterChip, ratingSubFilter === '4.8' && styles.subFilterChipActive]}
                  onPress={() => setRatingSubFilter(ratingSubFilter === '4.8' ? 'highest' : '4.8')}
                >
                  <Text style={[styles.subFilterChipText, ratingSubFilter === '4.8' && styles.subFilterChipTextActive]}>
                    4.8★+
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subFilterChip, ratingSubFilter === '4.5' && styles.subFilterChipActive]}
                  onPress={() => setRatingSubFilter(ratingSubFilter === '4.5' ? 'highest' : '4.5')}
                >
                  <Text style={[styles.subFilterChipText, ratingSubFilter === '4.5' && styles.subFilterChipTextActive]}>
                    4.5★+
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Salon Cards List */}
        <View style={styles.salonList}>
          <DataState
            loading={loading}
            error={loadError}
            empty={!loading && !loadError && salonsToDisplay.length === 0}
            emptyText="Không tìm thấy salon phù hợp."
            onRetry={() => setReloadKey((k) => k + 1)}
          />
          {salonsToDisplay.map((salon) => {
            const isFav = favoritesStore.isFavorite(salon.id);
            const isSupported = selectedHairstyle
              ? salon.supportedHairstyles.includes(selectedHairstyle.id)
              : true;

            const addressParts = salon.address.split(',').map((part) => part.trim()).filter(Boolean);
            const areaName = addressParts.slice(-3, -1).join(', ') || salon.address;

            return (
              <View key={salon.id} style={styles.salonCard}>
                {/* Salon Image + Favorite Heart Button + Highlight Badge */}
                <View style={styles.imageContainer}>
                  {salon.imageUrl ? (
                    <Image source={{ uri: salon.imageUrl }} style={styles.salonImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.salonImg, styles.salonImgPlaceholder]}>
                      <AppIcon name="salon" size={34} color="#B8895A" />
                      <Text style={styles.salonImgPlaceholderText}>Salon chưa cập nhật ảnh</Text>
                    </View>
                  )}
                  
                  {/* Floating Price/Distance Badge on Image */}
                  <View style={[
                    styles.imageHighlightBadge,
                    activeFilter === 'Price' && styles.imageHighlightPrice,
                    activeFilter === 'Distance' && styles.imageHighlightDistance
                  ]}>
                    <Text style={styles.imageHighlightText}>
                      {activeFilter === 'Distance'
                        ? `📍 ${salon.distance}`
                        : `🏷️ ${salon.priceRange}`}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.favBtn}
                    onPress={() => toggleFavorite(salon.id)}
                    activeOpacity={0.85}
                  >
                    <AppIcon
                      name={isFav ? "heartFilled" : "heart"}
                      size={18}
                      color={isFav ? "#B65A4B" : "#B8895A"}
                    />
                  </TouchableOpacity>
                </View>

                {/* Salon Info Content */}
                <View style={styles.cardContent}>
                  {/* Title & Rating */}
                  <View style={styles.titleRow}>
                    <Text style={styles.salonName} numberOfLines={1}>{salon.name}</Text>
                    <View style={styles.ratingRow}>
                      <Text style={styles.starIcon}>★</Text>
                      <Text style={styles.ratingScore}>
                        {salon.isExternal
                          ? 'Geoapify'
                          : salon.reviewCount > 0
                            ? salon.rating.toFixed(1)
                            : (language === 'vi' ? 'Chưa có đánh giá' : 'No reviews')}
                      </Text>
                    </View>
                  </View>

                  {/* Subtitle / Specialization */}
                  <Text style={styles.serviceDesc} numberOfLines={1}>
                    {salon.services.length > 0
                      ? salon.services.slice(0, 3).map((service) => service.name).join(' · ')
                      : salon.isExternal
                        ? (language === 'vi' ? 'Địa điểm từ Geoapify' : 'Location from Geoapify')
                        : (language === 'vi' ? 'Salon chưa cập nhật dịch vụ' : 'Services not updated')}
                  </Text>

                  {/* Distance & Location */}
                  <View style={styles.locationRow}>
                    <View style={[styles.distancePill, activeFilter === 'Distance' && styles.distancePillActive]}>
                      <AppIcon
                        name="pin"
                        size={12}
                        color={activeFilter === 'Distance' ? '#B8895A' : '#6F6255'}
                        style={styles.locationIcon}
                      />
                      <Text style={[styles.distanceText, activeFilter === 'Distance' && styles.distanceTextActive]}>
                        {salon.distance}
                      </Text>
                    </View>
                    <Text style={styles.locationDot}>•</Text>
                    <Text style={styles.locationText} numberOfLines={1}>
                      {areaName}
                    </Text>
                  </View>

                  {/* Price Row (Prominently displayed) */}
                  <View style={[styles.priceTagRow, activeFilter === 'Price' && styles.priceTagRowActive]}>
                    <View style={styles.priceTagLeft}>
                      <Text style={styles.priceTagEmoji}>🏷️</Text>
                      <Text style={[styles.priceTagLabel, activeFilter === 'Price' && styles.priceTagLabelActive]}>
                        {language === 'vi' ? 'Bảng giá: ' : 'Price: '}
                      </Text>
                      <Text style={[styles.priceTagValue, activeFilter === 'Price' && styles.priceTagValueActive]}>
                        {salon.priceRange}
                      </Text>
                    </View>
                    {salon.minPrice ? (
                      <Text style={[styles.minPriceHint, activeFilter === 'Price' && styles.minPriceHintActive]}>
                        {language === 'vi'
                          ? `(Từ ${(salon.minPrice).toLocaleString('vi-VN')}đ)`
                          : `(From ${(salon.minPrice).toLocaleString()}đ)`}
                      </Text>
                    ) : null}
                  </View>

                  {/* Hairstyle Match Tag (if applicable) */}
                  {selectedHairstyle && isSupported && (
                    <View
                      style={[
                        styles.matchBadge,
                        isSupported ? styles.matchSupported : styles.matchWarning
                      ]}
                    >
                      <Text
                        style={[
                          styles.matchBadgeText,
                          isSupported ? styles.matchSupportedText : styles.matchWarningText
                        ]}
                      >
                        ✓ Kiểu tóc có trong danh mục của salon
                      </Text>
                    </View>
                  )}

                  {/* Actions Row (Book Button + Info Button) */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.bookBtn, !salon.isExternal && !salon.bookingEligible && { opacity: 0.55 }]}
                      activeOpacity={0.85}
                      onPress={() => void handleSelectSalon(salon)}
                    >
                      <Text style={styles.bookBtnText}>
                        {salon.isExternal
                          ? (language === 'vi' ? 'Xem vị trí' : 'View location')
                          : !salon.bookingEligible
                            ? (language === 'vi' ? 'Chưa nhận lịch' : 'Not bookable')
                          : (language === 'vi' ? 'Đặt lịch' : 'Book')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.infoBtn}
                      activeOpacity={0.85}
                      onPress={() =>
                        Alert.alert(
                          salon.name,
                          `Địa chỉ: ${salon.address}\nSĐT: ${salon.phone}\nGiờ làm việc: ${salon.openingHours}\nBảng giá: ${salon.priceRange}`
                        )
                      }
                    >
                      <AppIcon name="info" size={18} color="#B8895A" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 95 }} />
      </ScrollView>

      <BottomNavBar active="Salons" navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFE6D8'
  },
  topAppBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#EFE6D8'
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center'
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#B8895A',
    letterSpacing: -0.5
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20
  },
  screenHeading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#241F1A',
    marginBottom: 16
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E7D8',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5D9CA'
  },
  contextImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#FFFFFF'
  },
  contextText: {
    flex: 1
  },
  contextTitle: {
    color: '#B8895A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  contextName: {
    color: '#241F1A',
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 2
  },
  contextSub: {
    color: '#6F6255',
    fontSize: 11
  },
  searchSection: {
    marginBottom: 18
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 46,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    marginBottom: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }
    })
  },
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#241F1A'
  },
  locationStatus: {
    color: '#6F6255',
    fontSize: 11,
    marginBottom: 10,
    paddingHorizontal: 4
  },
  chipScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  activeChip: {
    backgroundColor: '#B8895A',
    borderColor: '#B8895A'
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6F6255'
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  subFilterBar: {
    marginTop: 10,
    marginBottom: 4
  },
  subFilterScroll: {
    gap: 8,
    paddingRight: 20
  },
  subFilterChip: {
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFE3D3'
  },
  subFilterChipActive: {
    backgroundColor: '#2C2219',
    borderColor: '#2C2219'
  },
  subFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6F6255'
  },
  subFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  salonList: {
    gap: 16
  },
  salonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }
    })
  },
  imageContainer: {
    width: '100%',
    height: 165,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3E7D8'
  },
  salonImg: {
    width: '100%',
    height: '100%'
  },
  salonImgPlaceholder: {
    backgroundColor: '#F3E7D8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7
  },
  salonImgPlaceholderText: {
    color: '#8A6A4C',
    fontSize: 12,
    fontWeight: '600'
  },
  imageHighlightBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(44, 34, 25, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 2
  },
  imageHighlightPrice: {
    backgroundColor: 'rgba(184, 137, 90, 0.94)'
  },
  imageHighlightDistance: {
    backgroundColor: 'rgba(74, 107, 70, 0.94)'
  },
  imageHighlightText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }
    })
  },
  cardContent: {
    paddingTop: 12,
    paddingHorizontal: 2
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3
  },
  salonName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#241F1A',
    flex: 1,
    marginRight: 8
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  starIcon: {
    fontSize: 14,
    color: '#8A7748'
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#241F1A'
  },
  serviceDesc: {
    fontSize: 13,
    color: '#6F6255',
    marginBottom: 6
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFE3D3'
  },
  distancePillActive: {
    backgroundColor: '#F7EFE3',
    borderColor: '#B8895A'
  },
  locationIcon: {
    marginRight: 1
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6F6255'
  },
  distanceTextActive: {
    color: '#B8895A',
    fontWeight: '700'
  },
  locationDot: {
    fontSize: 12,
    color: '#9B8B7A'
  },
  locationText: {
    fontSize: 12,
    color: '#6F6255',
    flex: 1
  },
  priceTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFE6D8',
    marginBottom: 10
  },
  priceTagRowActive: {
    backgroundColor: '#FBF3E8',
    borderColor: '#B8895A'
  },
  priceTagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  priceTagEmoji: {
    fontSize: 12
  },
  priceTagLabel: {
    fontSize: 12,
    color: '#6F6255',
    fontWeight: '500'
  },
  priceTagLabelActive: {
    color: '#8A5D2E',
    fontWeight: '600'
  },
  priceTagValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B8895A'
  },
  priceTagValueActive: {
    color: '#8A5D2E',
    fontWeight: '800'
  },
  minPriceHint: {
    fontSize: 11,
    color: '#9B8B7A',
    fontStyle: 'italic'
  },
  minPriceHintActive: {
    color: '#8A5D2E',
    fontWeight: '600'
  },
  matchBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start'
  },
  matchSupported: {
    backgroundColor: '#F3E7D8'
  },
  matchWarning: {
    backgroundColor: 'rgba(230, 57, 70, 0.08)'
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '600'
  },
  matchSupportedText: {
    color: '#B8895A'
  },
  matchWarningText: {
    color: '#B65A4B'
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  bookBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#B8895A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  infoBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  }
});


