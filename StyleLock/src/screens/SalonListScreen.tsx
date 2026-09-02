import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { MOCK_SALONS } from '../services/mockData';
import { Hairstyle, Salon } from '../types';

interface SalonListScreenProps {
  navigation: any;
  route?: any;
}

export const SalonListScreen: React.FC<SalonListScreenProps> = ({ navigation, route }) => {
  const selectedHairstyle: Hairstyle | undefined = route?.params?.selectedHairstyle;
  const userPhotoUri: string | undefined = route?.params?.userPhotoUri;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [favorites, setFavorites] = useState<{ [id: string]: boolean }>({});

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const salonsToDisplay = MOCK_SALONS.filter((salon) => {
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
          <Text style={styles.topIcon}>◀</Text>
        </TouchableOpacity>

        <Text style={styles.brandTitle}>StyleLock</Text>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate('BookingHistory')}
        >
          <Text style={styles.topIcon}>🔔</Text>
        </TouchableOpacity>
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
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search salons near you..."
              placeholderTextColor="#6E7977"
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
              <Text style={styles.chipIcon}>📍</Text>
              <Text style={[styles.chipText, activeFilter === 'Distance' && styles.activeChipText]}>
                Distance
              </Text>
            </TouchableOpacity>

            {/* Rating */}
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'Rating' && styles.activeChip]}
              onPress={() => setActiveFilter(activeFilter === 'Rating' ? 'All' : 'Rating')}
            >
              <Text style={styles.chipIcon}>⭐</Text>
              <Text style={[styles.chipText, activeFilter === 'Rating' && styles.activeChipText]}>
                Rating
              </Text>
            </TouchableOpacity>

            {/* Price */}
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'Price' && styles.activeChip]}
              onPress={() => setActiveFilter(activeFilter === 'Price' ? 'All' : 'Price')}
            >
              <Text style={styles.chipIcon}>💵</Text>
              <Text style={[styles.chipText, activeFilter === 'Price' && styles.activeChipText]}>
                Price
              </Text>
            </TouchableOpacity>

            {/* Open Now */}
            <TouchableOpacity
              style={[styles.filterChip, styles.openNowChip, activeFilter === 'Open Now' && styles.activeChip]}
              onPress={() => setActiveFilter(activeFilter === 'Open Now' ? 'All' : 'Open Now')}
            >
              <Text style={[styles.chipIcon, { color: '#005C55' }]}>🕒</Text>
              <Text style={[styles.chipText, { color: '#005C55', fontWeight: '700' }]}>Open Now</Text>
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
                    <Text style={styles.favIcon}>{isFav ? '❤️' : '🤍'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Salon Info Content */}
                <View style={styles.cardContent}>
                  {/* Title & Rating */}
                  <View style={styles.titleRow}>
                    <Text style={styles.salonName}>{salon.name}</Text>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.starIcon}>⭐</Text>
                      <Text style={styles.ratingScore}>{salon.rating}</Text>
                    </View>
                  </View>

                  <Text style={styles.serviceDesc}>
                    Premium hair styling & color ({salon.priceRange})
                  </Text>

                  {/* Distance & Location */}
                  <View style={styles.locationRow}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.locationText}>
                      {salon.distance} away • {salon.address.split(',')[1] || 'Center'}
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
                        {isSupported ? '✅ Nhận làm chuẩn mẫu tóc này' : '⚠️ Tham vấn thợ trước khi làm'}
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
                          `📍 Địa chỉ: ${salon.address}\n📞 SĐT: ${salon.phone}\n🕒 Giờ làm việc: ${salon.openingHours}`
                        )
                      }
                    >
                      <Text style={styles.infoBtnIcon}>ℹ️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HairstyleSelect')}>
          <Text style={styles.navIcon}>🔍</Text>
          <Text style={styles.navLabel}>Explore</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CameraUpload')}>
          <Text style={styles.navIcon}>✨</Text>
          <Text style={styles.navLabel}>AI Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Text style={[styles.navIcon, styles.navIconActive]}>📅</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA'
  },
  topAppBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(250, 250, 250, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EEFF',
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
    color: '#005C55'
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#005C55',
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
    borderColor: '#005C55',
    elevation: 2
  },
  contextImg: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#E6EEFF'
  },
  contextText: {
    flex: 1
  },
  contextTitle: {
    color: '#005C55',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  contextName: {
    color: '#121C2A',
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 2
  },
  contextSub: {
    color: '#3E4947',
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
    borderColor: '#BDC9C6',
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
    color: '#121C2A'
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
    borderColor: '#BDC9C6',
    marginRight: 8
  },
  openNowChip: {
    borderColor: '#005C55',
    backgroundColor: 'rgba(0, 92, 85, 0.05)'
  },
  activeChip: {
    backgroundColor: '#005C55',
    borderColor: '#005C55'
  },
  chipIcon: {
    fontSize: 14,
    marginRight: 6
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#121C2A'
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
    backgroundColor: '#E6EEFF'
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
    color: '#121C2A',
    flex: 1
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6EEFF',
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
    color: '#121C2A'
  },
  serviceDesc: {
    fontSize: 13,
    color: '#3E4947',
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
    color: '#3E4947'
  },
  matchBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12
  },
  matchSupported: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)'
  },
  matchWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)'
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  matchSupportedText: {
    color: '#10B981'
  },
  matchWarningText: {
    color: '#F59E0B'
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  bookBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#005C55',
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
    borderColor: '#BDC9C6',
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
    borderTopColor: '#E2E8F0',
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
    backgroundColor: 'rgba(15, 118, 110, 0.15)'
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
    color: '#3E4947'
  },
  navLabelActive: {
    color: '#005C55',
    fontWeight: '700'
  }
});
