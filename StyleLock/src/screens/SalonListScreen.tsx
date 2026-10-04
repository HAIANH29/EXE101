import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Platform
} from 'react-native';
import { LocalizedText as Text, LocalizedTextInput as TextInput, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import { MOCK_SALONS } from '../services/mockData';
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

export const SalonListScreen: React.FC<SalonListScreenProps> = ({ navigation, route }) => {
  const { language } = useLanguage();
  const selectedHairstyle: Hairstyle | undefined = route?.params?.selectedHairstyle;
  const userPhotoUri: string | undefined = route?.params?.userPhotoUri;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('Open Now');
  const [, setFavVersion] = useState<number>(0);
  const [salons, setSalons] = useState<Salon[]>(MOCK_SALONS);

  useEffect(() => {
    let isMounted = true;

    const loadSalons = async () => {
      try {
        const apiSalons = await backendApi.getSalons();
        if (isMounted && apiSalons.length > 0) {
          setSalons(apiSalons);
        }
      } catch {
        // Keep mock salons when backend salon APIs are unavailable.
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
  }, []);

  const toggleFavorite = (id: string) => {
    favoritesStore.toggleFavorite(id);
    setFavVersion((v) => v + 1);
  };

  const salonsToDisplay = salons.filter((salon) => {
    const matchesSearch =
      salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.address.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'Rating') return matchesSearch && salon.rating >= 4.8;
    return matchesSearch;
  });

  const handleSelectSalon = (salon: Salon) => {
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
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }}
        >
          <AppIcon name="menu" size={22} color="#005C55" />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>StyleLock</Text>

        <View style={styles.headerRightActions}>
          <NotificationBellButton navigation={navigation} style={styles.headerIconBtn} />
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <AppIcon name="user" size={20} color="#005C55" />
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
              <Text style={styles.contextSub}>Partner salons matching this hairstyle</Text>
            </View>
          </View>
        )}

        {/* Search & Filter Area */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <AppIcon name="search" size={18} color="#687572" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search salons near you..."
              placeholderTextColor="#A9A29A"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filter Chips Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {/* Distance */}
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'Distance' && styles.activeChip]}
              onPress={() => setActiveFilter(activeFilter === 'Distance' ? 'All' : 'Distance')}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, activeFilter === 'Distance' && styles.activeChipText]}>
                Distance
              </Text>
            </TouchableOpacity>

            {/* Rating */}
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'Rating' && styles.activeChip]}
              onPress={() => setActiveFilter(activeFilter === 'Rating' ? 'All' : 'Rating')}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, activeFilter === 'Rating' && styles.activeChipText]}>
                Rating
              </Text>
            </TouchableOpacity>

            {/* Price */}
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'Price' && styles.activeChip]}
              onPress={() => setActiveFilter(activeFilter === 'Price' ? 'All' : 'Price')}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, activeFilter === 'Price' && styles.activeChipText]}>
                Price
              </Text>
            </TouchableOpacity>

            {/* Open Now */}
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'Open Now' && styles.activeChip]}
              onPress={() => setActiveFilter(activeFilter === 'Open Now' ? 'All' : 'Open Now')}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, activeFilter === 'Open Now' && styles.activeChipText]}>
                Open Now
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Salon Cards List */}
        <View style={styles.salonList}>
          {salonsToDisplay.map((salon) => {
            const isFav = favoritesStore.isFavorite(salon.id);
            const isSupported = selectedHairstyle
              ? salon.supportedHairstyles.includes(selectedHairstyle.id)
              : true;

            const areaName = salon.address.split(',')[1]?.trim() || 'Downtown';

            return (
              <View key={salon.id} style={styles.salonCard}>
                {/* Salon Image + Favorite Heart Button */}
                <View style={styles.imageContainer}>
                  <Image source={{ uri: salon.imageUrl }} style={styles.salonImg} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.favBtn}
                    onPress={() => toggleFavorite(salon.id)}
                    activeOpacity={0.85}
                  >
                    <AppIcon
                      name={isFav ? "heartFilled" : "heart"}
                      size={18}
                      color={isFav ? "#E63946" : "#005C55"}
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
                      <Text style={styles.ratingScore}>{salon.rating.toFixed(1)}</Text>
                    </View>
                  </View>

                  {/* Subtitle / Specialization */}
                  <Text style={styles.serviceDesc} numberOfLines={1}>
                    {language === 'vi'
                      ? `Dịch vụ tạo kiểu tóc & màu cao cấp`
                      : `Premium hair styling & color`}
                  </Text>

                  {/* Distance & Location */}
                  <View style={styles.locationRow}>
                    <AppIcon name="pin" size={13} color="#687572" style={styles.locationIcon} />
                    <Text style={styles.locationText}>
                      {salon.distance} away • {areaName}
                    </Text>
                  </View>

                  {/* Hairstyle Match Tag (if applicable) */}
                  {selectedHairstyle && (
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
                        {isSupported ? '✓ Nhận làm chuẩn mẫu tóc này' : '• Tham vấn thợ trước khi làm'}
                      </Text>
                    </View>
                  )}

                  {/* Actions Row (Book Button + Info Button) */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.bookBtn}
                      activeOpacity={0.85}
                      onPress={() => handleSelectSalon(salon)}
                    >
                      <Text style={styles.bookBtnText}>Book</Text>
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
                      <AppIcon name="info" size={18} color="#005C55" />
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
    backgroundColor: '#F7F5F1'
  },
  topAppBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#F7F5F1'
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center'
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
    fontSize: 18,
    fontWeight: '700',
    color: '#005C55',
    letterSpacing: -0.3
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20
  },
  screenHeading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#182C2A',
    marginBottom: 16
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3EFEB',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E6E1'
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
    color: '#005C55',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  contextName: {
    color: '#182C2A',
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 2
  },
  contextSub: {
    color: '#687572',
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
    borderColor: '#E2E6E1',
    marginBottom: 12,
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
    color: '#182C2A'
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
    borderColor: '#E2E6E1',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  activeChip: {
    backgroundColor: '#005C55',
    borderColor: '#005C55'
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#687572'
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  salonList: {
    gap: 16
  },
  salonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E6E1',
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
    backgroundColor: '#E3EFEB'
  },
  salonImg: {
    width: '100%',
    height: '100%'
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
    color: '#182C2A',
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
    color: '#D97706'
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#182C2A'
  },
  serviceDesc: {
    fontSize: 13,
    color: '#687572',
    marginBottom: 4
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14
  },
  locationIcon: {
    marginRight: 2
  },
  locationText: {
    fontSize: 12,
    color: '#687572'
  },
  matchBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start'
  },
  matchSupported: {
    backgroundColor: '#E3EFEB'
  },
  matchWarning: {
    backgroundColor: 'rgba(230, 57, 70, 0.08)'
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '600'
  },
  matchSupportedText: {
    color: '#005C55'
  },
  matchWarningText: {
    color: '#E63946'
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  bookBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#005C55',
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
    borderColor: '#E2E6E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  }
});

