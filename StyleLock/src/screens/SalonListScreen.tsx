import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { LocalizedText as Text, LocalizedTextInput as TextInput, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import { MOCK_SALONS } from '../services/mockData';
import { backendApi } from '../services/backendApi';
import { Hairstyle, Salon } from '../types';
import { AppIcon } from '../components/AppIcon';
import { BottomNavBar } from '../components/BottomNavBar';
import { NotificationBellButton } from '../components/NotificationBellButton';
import { useLanguage } from '../i18n/LanguageContext';

interface SalonListScreenProps {
  navigation: any;
  route?: any;
}

export const SalonListScreen: React.FC<SalonListScreenProps> = ({ navigation, route }) => {
  const { language } = useLanguage();
  const selectedHairstyle: Hairstyle | undefined = route?.params?.selectedHairstyle;
  const userPhotoUri: string | undefined = route?.params?.userPhotoUri;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [favorites, setFavorites] = useState<{ [id: string]: boolean }>({});
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

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const salonsToDisplay = salons.filter((salon) => {
    const matchesSearch =
      salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.address.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'Rating') return matchesSearch && salon.rating >= 4.8;
    if (activeFilter === 'Open Now') return matchesSearch;
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
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="arrowLeft" size={22} color="#A97845" />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>StyleLock</Text>

        <NotificationBellButton navigation={navigation} style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Selected Hairstyle Context Banner (if coming from Try-On) */}
        {selectedHairstyle && (
          <View style={styles.contextBanner}>
            <Image source={{ uri: selectedHairstyle.imageUrl }} style={styles.contextImg} />
            <View style={styles.contextText}>
              <Text style={styles.contextTitle}>SELECTED HAIRSTYLE:</Text>
              <Text style={styles.contextName}>{selectedHairstyle.name}</Text>
              <Text style={styles.contextSub}>Showing partner salons that craft this style</Text>
            </View>
          </View>
        )}

        {/* Search & Filter Area */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <AppIcon name="search" size={18} color="#9A8A7A" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search salons near you..."
              placeholderTextColor="#9A8A7A"
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
            >
              <AppIcon name="pin" size={14} color={activeFilter === "Distance" ? "#FFFFFF" : "#6F6256"} style={styles.chipIcon} />
              <Text style={[styles.chipText, activeFilter === 'Distance' && styles.activeChipText]}>
                Distance
              </Text>
            </TouchableOpacity>

            {/* Rating */}
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'Rating' && styles.activeChip]}
              onPress={() => setActiveFilter(activeFilter === 'Rating' ? 'All' : 'Rating')}
            >
              <AppIcon name="star" size={14} color={activeFilter === "Rating" ? "#FFFFFF" : "#6F6256"} style={styles.chipIcon} />
              <Text style={[styles.chipText, activeFilter === 'Rating' && styles.activeChipText]}>
                Rating
              </Text>
            </TouchableOpacity>

            {/* Price */}
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'Price' && styles.activeChip]}
              onPress={() => setActiveFilter(activeFilter === 'Price' ? 'All' : 'Price')}
            >
              <AppIcon name="money" size={14} color={activeFilter === "Price" ? "#FFFFFF" : "#6F6256"} style={styles.chipIcon} />
              <Text style={[styles.chipText, activeFilter === 'Price' && styles.activeChipText]}>
                Price
              </Text>
            </TouchableOpacity>

            {/* Open Now */}
            <TouchableOpacity
              style={[styles.filterChip, styles.openNowChip, activeFilter === 'Open Now' && styles.activeChip]}
              onPress={() => setActiveFilter(activeFilter === 'Open Now' ? 'All' : 'Open Now')}
            >
              <AppIcon name="clock" size={14} color={activeFilter === "Open Now" ? "#FFFFFF" : "#A97845"} style={styles.chipIcon} />
              <Text style={[styles.chipText, { color: '#A97845', fontWeight: '700' }]}>Open Now</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Salon List */}
        <View style={styles.salonList}>
          {salonsToDisplay.map((salon) => {
            const isFav = favorites[salon.id];
            const isSupported = selectedHairstyle
              ? salon.supportedHairstyles.includes(selectedHairstyle.id)
              : true;

            return (
              <View key={salon.id} style={styles.salonCard}>
                {/* Salon Image + Favorite Heart Button */}
                <View style={styles.imageContainer}>
                  <Image source={{ uri: salon.imageUrl }} style={styles.salonImg} />
                  <TouchableOpacity
                    style={styles.favBtn}
                    onPress={() => toggleFavorite(salon.id)}
                  >
                    <AppIcon name="heart" size={17} color={isFav ? "#B65A4B" : "#A97845"} />
                  </TouchableOpacity>
                </View>

                {/* Salon Info Content */}
                <View style={styles.cardContent}>
                  {/* Title & Rating */}
                  <View style={styles.titleRow}>
                    <Text style={styles.salonName}>{salon.name}</Text>
                    <View style={styles.ratingBadge}>
                      <AppIcon name="star" size={13} color="#A97845" style={styles.starIcon} />
                      <Text style={styles.ratingScore}>{salon.rating}</Text>
                    </View>
                  </View>

                  <Text style={styles.serviceDesc}>
                    {language === 'vi'
                      ? `Dịch vụ tạo kiểu tóc & màu cao cấp (${salon.priceRange})`
                      : `Premium hair styling & color (${salon.priceRange})`}
                  </Text>

                  {/* Distance & Location */}
                  <View style={styles.locationRow}>
                    <AppIcon name="pin" size={14} color="#9A8A7A" style={styles.locationIcon} />
                    <Text style={styles.locationText}>
                      {language === 'vi' ? `Cách ${salon.distance}` : `${salon.distance} away`} • {salon.address.split(',')[1] || 'Center'}
                    </Text>
                  </View>

                  {/* Hairstyle Match Badge */}
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
                        {isSupported ? 'Nhận làm chuẩn mẫu tóc này' : 'Tham vấn thợ trước khi làm'}
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
                      onPress={() =>
                        Alert.alert(
                          salon.name,
                          `Địa chỉ: ${salon.address}\nSĐT: ${salon.phone}\nGiờ làm việc: ${salon.openingHours}`
                        )
                      }
                    >
                      <AppIcon name="info" size={19} color="#A97845" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      <BottomNavBar active="Bookings" navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6EFE6'
  },
  topAppBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(250, 250, 250, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE2D2',
    zIndex: 10
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  topIcon: {
    fontSize: 18,
    color: '#A97845'
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#A97845',
    letterSpacing: -0.5
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A97845',
    elevation: 2
  },
  contextImg: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#EFE2D2'
  },
  contextText: {
    flex: 1
  },
  contextTitle: {
    color: '#A97845',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  contextName: {
    color: '#2A211C',
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 2
  },
  contextSub: {
    color: '#6F6256',
    fontSize: 11
  },
  searchSection: {
    marginBottom: 20
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#B89062',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2A211C'
  },
  chipScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#B89062',
    marginRight: 8
  },
  openNowChip: {
    borderColor: '#A97845',
    backgroundColor: 'rgba(169, 120, 69, 0.10)'
  },
  activeChip: {
    backgroundColor: '#A97845',
    borderColor: '#A97845'
  },
  chipIcon: {
    fontSize: 14,
    marginRight: 6
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2A211C'
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  salonList: {
    gap: 20
  },
  salonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(189, 201, 198, 0.3)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16
  },
  imageContainer: {
    width: '100%',
    height: 195,
    position: 'relative',
    backgroundColor: '#EFE2D2'
  },
  salonImg: {
    width: '100%',
    height: '100%'
  },
  favBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  favIcon: {
    fontSize: 16
  },
  cardContent: {
    padding: 16
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  salonName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A211C',
    flex: 1
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFE2D2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  starIcon: {
    fontSize: 12,
    marginRight: 4
  },
  ratingScore: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A211C'
  },
  serviceDesc: {
    fontSize: 13,
    color: '#6F6256',
    marginBottom: 8
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 6
  },
  locationText: {
    fontSize: 13,
    color: '#6F6256'
  },
  matchBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12
  },
  matchSupported: {
    backgroundColor: 'rgba(124, 138, 85, 0.12)'
  },
  matchWarning: {
    backgroundColor: 'rgba(169, 120, 69, 0.12)'
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  matchSupportedText: {
    color: '#7C8A55'
  },
  matchWarningText: {
    color: '#A97845'
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  bookBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#A97845',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  infoBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#B89062',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  infoBtnIcon: {
    fontSize: 18
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#DDCDB9',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20
  },
  navItemActive: {
    backgroundColor: 'rgba(169, 120, 69, 0.16)'
  },
  navIcon: {
    fontSize: 18,
    marginBottom: 2
  },
  navIconActive: {
    transform: [{ scale: 1.1 }]
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6F6256'
  },
  navLabelActive: {
    color: '#A97845',
    fontWeight: '700'
  }
});
