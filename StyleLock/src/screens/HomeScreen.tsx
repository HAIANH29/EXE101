import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  ImageBackground
} from 'react-native';
import { LocalizedText as Text, LocalizedTextInput as TextInput } from '../i18n/LocalizedComponents';
import { useFocusEffect } from '@react-navigation/native';
import { MOCK_HAIRSTYLES, MOCK_SALONS } from '../services/mockData';
import { backendApi } from '../services/backendApi';
import { AppIcon, IconBadge } from '../components/AppIcon';
import { Booking, Hairstyle, Salon } from '../types';
import { BottomNavBar } from '../components/BottomNavBar';
import { NotificationBellButton } from '../components/NotificationBellButton';
import { useLanguage } from '../i18n/LanguageContext';
import { favoritesStore } from '../services/favoritesStore';

interface HomeScreenProps {
  navigation: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DisplayUser = {
  fullName?: string;
  email?: string;
};

function getUserDisplayName(user?: DisplayUser) {
  const fullName = user?.fullName?.trim();
  if (fullName) return fullName;

  const emailName = user?.email?.split('@')[0]?.trim();
  return emailName || '';
}

function getStoredDisplayName() {
  return getUserDisplayName(backendApi.getCurrentUser()?.user);
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('Home');
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>(MOCK_HAIRSTYLES);
  const [salons, setSalons] = useState<Salon[]>(MOCK_SALONS);
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | undefined>();
  const [displayName, setDisplayName] = useState<string>(getStoredDisplayName);
  const [, setFavVersion] = useState<number>(0);

  useFocusEffect(useCallback(() => {
    let isMounted = true;

    const unsubscribe = favoritesStore.subscribe(() => {
      if (isMounted) setFavVersion((v) => v + 1);
    });

    const loadBackendData = async () => {
      setDisplayName(getStoredDisplayName());

      try {
        const [apiHairstyles, apiSalons] = await Promise.all([
          backendApi.getHairstyles(),
          backendApi.getSalons()
        ]);

        if (!isMounted) return;
        if (apiHairstyles.length > 0) setHairstyles(apiHairstyles);
        if (apiSalons.length > 0) setSalons(apiSalons);

        if (backendApi.isAuthenticated()) {
          const [user, bookings] = await Promise.all([
            backendApi.getMe().catch(() => backendApi.getCurrentUser()?.user),
            backendApi.getMyBookings().catch(() => [])
          ]);
          if (isMounted) setDisplayName(getUserDisplayName(user));

          const upcoming = bookings.find(
            (booking) => booking.status === 'PENDING' || booking.status === 'CONFIRMED'
          );
          if (isMounted) setUpcomingBooking(upcoming);
        }
      } catch {
        // Keep mock data when backend is unavailable or auth/CORS is not ready.
      }
    };

    loadBackendData();

    return () => {
      isMounted = false;
    };
  }, []));

  const greetingTitle = displayName
    ? language === 'vi'
      ? `Xin chào, ${displayName}`
      : `Hello, ${displayName}`
    : language === 'vi'
      ? 'Xin chào'
      : 'Hello';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate('AdminDashboard')}
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting & Search Section */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>{greetingTitle}</Text>
          <Text style={styles.greetingSub}>Find your next signature look.</Text>

          <View style={styles.searchBox}>
            <AppIcon name="search" size={18} color="#9A8A7A" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search styles, salons, or stylists..."
              placeholderTextColor="#9A8A7A"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => navigation.navigate('HairstyleSelect')}
            />
          </View>
        </View>

        {/* Promotional Banner Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.promoBannerCard}
          onPress={() => navigation.navigate('HairstyleSelect')}
        >
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'
            }}
            style={styles.promoBannerImg}
            imageStyle={{ borderRadius: 20 }}
          >
            <View style={styles.promoOverlay}>
              <Text style={styles.promoTag}>SEASONAL COLLECTION</Text>
              <Text style={styles.promoTitle}>New Summer Styles</Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigation.navigate('CameraUpload')}
              >
                <Text style={styles.exploreBtnText}>Explore Now</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* Quick Actions (3 Cards) */}
        <View style={styles.quickActionsRow}>
          {/* Card 1: Try Hairstyle */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('CameraUpload')}
          >
            <View style={styles.quickIconCircle}>
              <AppIcon name="sparkle" size={22} color="#A97845" />
            </View>
            <Text style={styles.quickActionText}>Try Hairstyle</Text>
          </TouchableOpacity>

          {/* Card 2: Book Salon */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('SalonList')}
          >
            <View style={styles.quickIconCircle}>
              <AppIcon name="salon" size={22} color="#A97845" />
            </View>
            <Text style={styles.quickActionText}>Book Salon</Text>
          </TouchableOpacity>

          {/* Card 3: AI Consult / Salon Dashboard */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('SalonDashboard')}
          >
            <View style={styles.quickIconCircle}>
              <AppIcon name="bot" size={22} color="#A97845" />
            </View>
            <Text style={styles.quickActionText}>AI Consult</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Appointment Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointment</Text>
        </View>

        <TouchableOpacity
          style={styles.appointmentCard}
          activeOpacity={0.9}
          onPress={() =>
            upcomingBooking
              ? navigation.navigate('BookingStatus', { bookingId: upcomingBooking.id })
              : navigation.navigate('SalonList')
          }
        >
          <Image
            source={{
              uri:
                upcomingBooking?.tryOnImageUrl ||
                'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=300'
            }}
            style={styles.appointmentImg}
          />
          <View style={styles.appointmentInfo}>
            <Text style={styles.appointmentTitle}>
              {upcomingBooking?.serviceName || upcomingBooking?.hairstyleName || 'Chưa có lịch hẹn sắp tới'}
            </Text>
            <Text style={styles.appointmentTime}>
              {upcomingBooking ? `${upcomingBooking.date}, ${upcomingBooking.timeSlot}` : 'Đặt lịch với salon gần bạn'}
            </Text>
            <Text style={styles.appointmentSub} numberOfLines={1}>
              {upcomingBooking ? `${upcomingBooking.salonName} • ${upcomingBooking.status}` : 'Chọn kiểu tóc, salon và khung giờ phù hợp'}
            </Text>
          </View>
          <View style={styles.arrowCircle}>
            <AppIcon name="arrowRight" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Recommended for You (Horizontal Scroll) */}
        <View style={styles.sectionHeaderBetween}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          <TouchableOpacity onPress={() => navigation.navigate('HairstyleSelect')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {hairstyles.slice(0, 6).map((hair, index) => {
            const matchPercent = 98 - index * 3;
            return (
              <TouchableOpacity
                key={hair.id}
                style={styles.recommendCard}
                onPress={() => navigation.navigate('HairstyleDetail', { hairstyle: hair })}
              >
                <View style={styles.recommendImgWrapper}>
                  <Image source={{ uri: hair.imageUrl }} style={styles.recommendImg} />
                  <TouchableOpacity
                    style={styles.favBadge}
                    onPress={(e) => {
                      e.stopPropagation();
                      favoritesStore.toggleFavorite(hair.id);
                    }}
                  >
                    <AppIcon
                      name={favoritesStore.isFavorite(hair.id) ? "heartFilled" : "heart"}
                      size={15}
                      color={favoritesStore.isFavorite(hair.id) ? "#E63946" : "#A97845"}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.recommendName} numberOfLines={1}>
                  {hair.name}
                </Text>
                <Text style={styles.recommendMatch}>{matchPercent}% Match</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={{ height: 90 }} />
      </ScrollView>

      <BottomNavBar active="Home" navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF'
  },
  topAppBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(248, 249, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#DDCDB9',
    zIndex: 10
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
    fontSize: 20,
    fontWeight: '700',
    color: '#005C55',
    letterSpacing: -0.3
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16
  },
  greetingSection: {
    marginBottom: 20
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2A211C',
    letterSpacing: -0.5,
    marginBottom: 2
  },
  greetingSub: {
    fontSize: 15,
    color: '#6F6256',
    marginBottom: 16
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: '#B89062',
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
    fontSize: 15,
    color: '#2A211C'
  },
  promoBannerCard: {
    width: '100%',
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12
  },
  promoBannerImg: {
    width: '100%',
    height: '100%'
  },
  promoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 28, 42, 0.55)',
    padding: 20,
    justifyContent: 'center'
  },
  promoTag: {
    color: '#EAD7BF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6
  },
  promoTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 14,
    maxWidth: '75%',
    lineHeight: 28
  },
  exploreBtn: {
    backgroundColor: '#A97845',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'flex-start'
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EFF4FF'
  },
  quickIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(169, 120, 69, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  actionEmoji: {
    fontSize: 22
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A211C',
    textAlign: 'center'
  },
  sectionHeader: {
    marginBottom: 12
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A211C'
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A97845'
  },
  appointmentCard: {
    backgroundColor: '#A97845',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#A97845',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6
  },
  appointmentImg: {
    width: 60,
    height: 60,
    borderRadius: 14,
    marginRight: 14,
    backgroundColor: '#A97845'
  },
  appointmentInfo: {
    flex: 1
  },
  appointmentTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2
  },
  appointmentTime: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2
  },
  appointmentSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 16
  },
  horizontalScroll: {
    marginBottom: 20,
    marginHorizontal: -20,
    paddingHorizontal: 20
  },
  recommendCard: {
    width: 170,
    marginRight: 14
  },
  recommendImgWrapper: {
    width: 170,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EFE2D2',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  recommendImg: {
    width: '100%',
    height: '100%'
  },
  favBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  favHeart: {
    fontSize: 14
  },
  recommendName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A211C'
  },
  recommendMatch: {
    fontSize: 12,
    color: '#6F6256',
    marginTop: 2
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
