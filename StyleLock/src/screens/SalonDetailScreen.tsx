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
import { LocalizedText as Text, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import { backendApi } from '../services/backendApi';
import { Salon, Hairstyle, ServiceItem, StylistItem, Booking } from '../types';
import { AppIcon } from '../components/AppIcon';
import { useLanguage } from '../i18n/LanguageContext';
import { favoritesStore } from '../services/favoritesStore';
import { bookingService } from '../services/bookingService';

interface SalonDetailScreenProps {
  navigation: any;
  route: any;
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00',
  '14:00', '14:30', '15:00', '15:30', '16:00',
  '17:00', '17:30', '18:00', '18:30', '19:00'
];

const DEFAULT_STYLISTS: StylistItem[] = [
  {
    id: 'st-1',
    name: 'Elena R.',
    role: 'Master Colorist',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
  },
  {
    id: 'st-2',
    name: 'Marcus T.',
    role: 'Precision Cuts',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300'
  }
];

export const SalonDetailScreen: React.FC<SalonDetailScreenProps> = ({ navigation, route }) => {
  const { language } = useLanguage();
  const salon: Salon = route.params.salon;
  const selectedHairstyle: Hairstyle | undefined = route.params?.selectedHairstyle;
  const userPhotoUri: string | undefined = route.params?.userPhotoUri;

  const [activeTab, setActiveTab] = useState<string>('Services');
  const [isFavorite, setIsFavorite] = useState<boolean>(favoritesStore.isFavorite(salon.id));
  const [salonServices, setSalonServices] = useState<ServiceItem[]>(salon.services);
  const [salonStylists, setSalonStylists] = useState<StylistItem[]>(
    salon.stylists && salon.stylists.length > 0 ? salon.stylists : DEFAULT_STYLISTS
  );

  // Dates
  const today = new Date();
  const dateOptions = [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date();
    d.setDate(today.getDate() + offset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dayName = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : `Day ${offset + 1}`;
    return {
      fullDate: `${yyyy}-${mm}-${dd}`,
      label: `${dayName} (${dd}/${mm})`
    };
  });

  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].fullDate);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('14:30');
  const [selectedService, setSelectedService] = useState<ServiceItem | undefined>(salon.services[0]);
  const [selectedStylist, setSelectedStylist] = useState<StylistItem | undefined>(
    salon.stylists && salon.stylists.length > 0 ? salon.stylists[0] : DEFAULT_STYLISTS[0]
  );

  useEffect(() => {
    let isMounted = true;

    const loadBackendSalonDetails = async () => {
      if (!salon.apiId) return;

      try {
        const [apiServices, apiStylists] = await Promise.all([
          backendApi.getServicesBySalon(salon.apiId),
          backendApi.getStylistsBySalon(salon.apiId)
        ]);

        if (!isMounted) return;

        if (apiServices.length > 0) {
          setSalonServices(apiServices);
          setSelectedService(apiServices[0]);
        }

        if (apiStylists.length > 0) {
          setSalonStylists(apiStylists);
          setSelectedStylist(apiStylists[0]);
        }
      } catch {
        // Keep route/mock salon details when backend detail APIs are unavailable.
      }
    };

    loadBackendSalonDetails();

    const unsubscribe = favoritesStore.subscribe(() => {
      if (isMounted) setIsFavorite(favoritesStore.isFavorite(salon.id));
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [salon.apiId, salon.id]);

  const handleToggleFavorite = () => {
    const next = favoritesStore.toggleFavorite(salon.id);
    setIsFavorite(next);
    if (next) {
      Alert.alert('Đã yêu thích', `Đã lưu "${salon.name}" vào danh sách yêu thích!`);
    } else {
      Alert.alert('Đã bỏ yêu thích', `Đã bỏ "${salon.name}" khỏi danh sách yêu thích.`);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedService) {
      Alert.alert('Chưa chọn dịch vụ', 'Vui lòng chọn dịch vụ làm tóc bạn muốn!');
      return;
    }
    if (!selectedStylist) {
      Alert.alert('Chưa chọn Stylist', 'Vui lòng chọn Stylist yêu thích!');
      return;
    }
    if (!selectedDate || !selectedTimeSlot) {
      Alert.alert('Chưa chọn ngày giờ', 'Vui lòng chọn ngày và khung giờ đặt lịch!');
      return;
    }

    const currentUser = backendApi.getCurrentUser()?.user;
    const customerName = currentUser?.fullName || 'Khách hàng StyleLock';
    const customerPhone = currentUser?.phone || '0901234567';

    try {
      if (salon.apiId && selectedService.apiId && selectedStylist?.apiId && backendApi.isAuthenticated()) {
        const backendBooking = await backendApi.createBooking({
          salon: {
            ...salon,
            services: salonServices,
            stylists: salonStylists
          },
          service: selectedService,
          stylist: selectedStylist,
          selectedDate,
          selectedTimeSlot,
          hairstyle: selectedHairstyle,
          userPhotoUri,
          note: `Đặt lịch hẹn trực tiếp từ StyleLock app. Khách: ${customerName} (${customerPhone})`
        });
        bookingService.upsertBooking(backendBooking);
        navigation.navigate('BookingStatus', { bookingId: backendBooking.id });
        return;
      }

      // Local mock booking fallback
      const mockBooking: Booking = {
        id: `book-${Date.now()}`,
        customerName,
        customerPhone,
        salonId: salon.id,
        salonName: salon.name,
        salonAddress: salon.address,
        hairstyleId: selectedHairstyle?.id,
        hairstyleName: selectedHairstyle?.name,
        tryOnImageUrl: userPhotoUri || selectedHairstyle?.imageUrl,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        stylistId: selectedStylist.id,
        stylistName: selectedStylist.name,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
        totalPrice: selectedService.price,
        qrCode: `STYLELOCK-${Date.now()}`
      };
      bookingService.upsertBooking(mockBooking);
      navigation.navigate('BookingStatus', { bookingId: mockBooking.id });
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Không tạo được lịch hẹn.';
      Alert.alert('Lỗi đặt lịch', message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="arrowLeft" size={20} color="#005C55" />
        </TouchableOpacity>

        <Text style={styles.headerBrandTitle}>StyleLock</Text>

        <View style={styles.headerActionsRight}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={handleToggleFavorite}>
            <AppIcon
              name={isFavorite ? 'heartFilled' : 'heart'}
              size={20}
              color={isFavorite ? '#E63946' : '#005C55'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => Alert.alert('Share', `Sharing ${salon.name}...`)}
          >
            <AppIcon name="share" size={20} color="#005C55" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Rounded Hero Image Section */}
        <View style={styles.heroWrapper}>
          <Image
            source={{ uri: salon.imageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Salon Title & Main Overview */}
        <View style={styles.salonInfoSection}>
          <Text style={styles.salonTitleText}>{salon.name}</Text>

          {/* Address row */}
          <View style={styles.addressRow}>
            <AppIcon name="pin" size={15} color="#687572" style={styles.pinIcon} />
            <Text style={styles.addressText} numberOfLines={1}>{salon.address}</Text>
          </View>

          {/* Rating row */}
          <View style={styles.ratingRow}>
            <Text style={styles.starText}>★</Text>
            <Text style={styles.ratingText}>
              {salon.rating.toFixed(1)} ({salon.reviewCount || 128} reviews)
            </Text>
          </View>
        </View>

        {/* Category Pill Tabs Row */}
        <View style={styles.tabsRow}>
          {['Services', 'Portfolio', 'Reviews', 'About'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Attached Hairstyle Context (if coming from Try-On) */}
        {selectedHairstyle && (
          <View style={styles.attachedTryOnCard}>
            <Image source={{ uri: selectedHairstyle.imageUrl }} style={styles.attachedImg} />
            <View style={styles.attachedText}>
              <Text style={styles.attachedLabel}>ATTACHED HAIRSTYLE</Text>
              <Text style={styles.attachedTitle}>{selectedHairstyle.name}</Text>
              <Text style={styles.attachedSub}>Photo will be attached to your appointment request</Text>
            </View>
          </View>
        )}

        {/* Top Stylists Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Top Stylists</Text>
          <View style={styles.stylistsGrid}>
            {salonStylists.slice(0, 2).map((st) => {
              const isSelected = selectedStylist?.id === st.id;
              return (
                <TouchableOpacity
                  key={st.id}
                  style={[styles.stylistCard, isSelected && styles.stylistCardSelected]}
                  onPress={() => setSelectedStylist(st)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: st.avatar || salon.imageUrl }} style={styles.stylistAvatarImg} />
                  <View style={styles.stylistInfoCol}>
                    <Text style={styles.stylistNameText} numberOfLines={1}>{st.name}</Text>
                    <Text style={styles.stylistRoleText} numberOfLines={1}>{st.role || 'Master Colorist'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Services List Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Services</Text>
          {salonServices.length === 0 ? (
            <View style={styles.emptyServiceCard}>
              <Text style={styles.emptyServiceText}>Chưa có danh sách dịch vụ chi tiết.</Text>
            </View>
          ) : (
            <View style={styles.servicesList}>
              {salonServices.map((srv) => {
                const isSelected = selectedService?.id === srv.id;
                return (
                  <TouchableOpacity
                    key={srv.id}
                    style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                    onPress={() => setSelectedService(srv)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.serviceMainCol}>
                      <Text style={styles.serviceNameText}>{srv.name}</Text>
                      <Text style={styles.serviceDescText}>
                        Full dimensional service with custom conditioning & signature styling.
                      </Text>
                      <View style={styles.durationRow}>
                        <AppIcon name="clock" size={12} color="#687572" style={styles.durIcon} />
                        <Text style={styles.durationText}>
                          {srv.durationMinutes} mins
                        </Text>
                      </View>
                    </View>

                    <View style={styles.servicePriceCol}>
                      <Text style={styles.priceValueText}>{srv.price.toLocaleString('vi-VN')} đ</Text>
                      <View style={[styles.selectBadge, isSelected && styles.selectBadgeActive]}>
                        <Text style={[styles.selectBadgeText, isSelected && styles.selectBadgeTextActive]}>
                          {isSelected ? 'Selected' : 'Select'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Date Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {dateOptions.map((opt) => {
              const isSelected = selectedDate === opt.fullDate;
              return (
                <TouchableOpacity
                  key={opt.fullDate}
                  style={[styles.datePill, isSelected && styles.datePillActive]}
                  onPress={() => setSelectedDate(opt.fullDate)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.datePillText, isSelected && styles.datePillTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time Slot Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Select Time</Text>
          <View style={styles.timeSlotsGrid}>
            {TIME_SLOTS.map((slot) => {
              const isSelected = selectedTimeSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.timeSlotPill, isSelected && styles.timeSlotPillActive]}
                  onPress={() => setSelectedTimeSlot(slot)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Location</Text>
          <View style={styles.locationMapCard}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800'
              }}
              style={styles.locationMapImg}
              resizeMode="cover"
            />
            {/* 3D Pin Marker Overlay */}
            <View style={styles.mapPinCenterOverlay}>
              <View style={styles.pinCircleHolder}>
                <AppIcon name="pin" size={26} color="#E63946" />
              </View>
            </View>
          </View>
          <Text style={styles.locationFullAddress}>
            {salon.address || '123 Market St, San Francisco, CA 94105'}
          </Text>
          <Text style={styles.locationDistanceText}>
            {salon.distance ? `${salon.distance} away` : '0.5 miles away'}
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.fixedBottomBar}>
        <TouchableOpacity
          style={styles.msgBtn}
          activeOpacity={0.8}
          onPress={() =>
            Alert.alert('Nhắn tin Salon', `Đang mở trò chuyện trực tiếp với ${salon.name}...`)
          }
        >
          <AppIcon name="message" size={18} color="#005C55" />
          <Text style={styles.msgBtnText}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bookAppointmentBtn}
          activeOpacity={0.85}
          onPress={handleBookAppointment}
        >
          <Text style={styles.bookAppointmentBtnText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    backgroundColor: '#F7F5F1'
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerBrandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#005C55',
    letterSpacing: -0.3
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  scrollContent: {
    paddingBottom: 24
  },
  heroWrapper: {
    marginHorizontal: 16,
    marginTop: 8,
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E3EFEB'
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24
  },
  salonInfoSection: {
    paddingHorizontal: 16,
    marginTop: 18
  },
  salonTitleText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#182C2A',
    marginBottom: 6,
    letterSpacing: -0.5
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4
  },
  pinIcon: {
    marginRight: 2
  },
  addressText: {
    fontSize: 14,
    color: '#687572'
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  starText: {
    fontSize: 15,
    color: '#D97706'
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A3743B'
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 18,
    marginBottom: 8
  },
  tabPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E6E1',
    paddingHorizontal: 18,
    paddingVertical: 9,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tabPillActive: {
    backgroundColor: '#005C55',
    borderColor: '#005C55'
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#687572'
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  attachedTryOnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3EFEB',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E6E1'
  },
  attachedImg: {
    width: 46,
    height: 46,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#FFFFFF'
  },
  attachedText: {
    flex: 1
  },
  attachedLabel: {
    color: '#005C55',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  attachedTitle: {
    color: '#182C2A',
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 2
  },
  attachedSub: {
    color: '#687572',
    fontSize: 11
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 22
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#182C2A',
    marginBottom: 12
  },
  stylistsGrid: {
    flexDirection: 'row',
    gap: 12
  },
  stylistCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E6E1',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }
    })
  },
  stylistCardSelected: {
    borderColor: '#005C55',
    backgroundColor: '#E3EFEB'
  },
  stylistAvatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 10,
    backgroundColor: '#E3EFEB'
  },
  stylistInfoCol: {
    flex: 1
  },
  stylistNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#182C2A',
    marginBottom: 2
  },
  stylistRoleText: {
    fontSize: 12,
    color: '#687572'
  },
  servicesList: {
    gap: 12
  },
  emptyServiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E6E1'
  },
  emptyServiceText: {
    color: '#687572',
    fontSize: 13
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E6E1',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }
    })
  },
  serviceCardSelected: {
    borderColor: '#005C55',
    backgroundColor: '#E3EFEB'
  },
  serviceMainCol: {
    flex: 1,
    marginRight: 12
  },
  serviceNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#182C2A',
    marginBottom: 4
  },
  serviceDescText: {
    fontSize: 12,
    color: '#687572',
    lineHeight: 16,
    marginBottom: 6
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  durIcon: {
    marginRight: 4
  },
  durationText: {
    fontSize: 12,
    color: '#687572'
  },
  servicePriceCol: {
    alignItems: 'flex-end',
    gap: 6
  },
  priceValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#005C55'
  },
  selectBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F7F5F1',
    borderWidth: 1,
    borderColor: '#E2E6E1'
  },
  selectBadgeActive: {
    backgroundColor: '#005C55',
    borderColor: '#005C55'
  },
  selectBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#687572'
  },
  selectBadgeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  dateScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16
  },
  datePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E6E1',
    marginRight: 10
  },
  datePillActive: {
    backgroundColor: '#005C55',
    borderColor: '#005C55'
  },
  datePillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#182C2A'
  },
  datePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  timeSlotPill: {
    width: '18%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E6E1'
  },
  timeSlotPillActive: {
    backgroundColor: '#005C55',
    borderColor: '#005C55'
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#182C2A'
  },
  timeSlotTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E6E1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 30,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 8 },
      web: { boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.04)' }
    })
  },
  msgBtn: {
    width: 110,
    height: 48,
    backgroundColor: '#EBE5DB',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6
  },
  msgBtnText: {
    color: '#005C55',
    fontSize: 13,
    fontWeight: '700'
  },
  bookAppointmentBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#005C55',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bookAppointmentBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  locationMapCard: {
    width: '100%',
    height: 155,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#95C5B5',
    borderWidth: 1,
    borderColor: '#E2E6E1',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }
    })
  },
  locationMapImg: {
    width: '100%',
    height: '100%'
  },
  mapPinCenterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pinCircleHolder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }
    })
  },
  locationFullAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#182C2A',
    marginTop: 10,
    marginBottom: 4
  },
  locationDistanceText: {
    fontSize: 13,
    color: '#687572'
  }
});


