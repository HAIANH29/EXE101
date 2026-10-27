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
import { backendApi, BackendAvailability } from '../services/backendApi';
import { Salon, Hairstyle, ServiceItem, StylistItem } from '../types';
import { AppIcon } from '../components/AppIcon';
import { favoritesStore } from '../services/favoritesStore';
import { bookingService } from '../services/bookingService';

interface SalonDetailScreenProps {
  navigation: any;
  route: any;
}

const SLOT_STEP_MINUTES = 30;
const DEFAULT_DURATION_MINUTES = 30;

type TimeSlot = { value: string; disabled: boolean };

const pad = (n: number) => String(n).padStart(2, '0');

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Sinh khung giờ từ giờ mở/đóng cửa của salon, khóa các giờ đã qua hoặc trùng lịch của stylist.
function buildTimeSlots(date: string, availability: BackendAvailability | undefined, durationMinutes: number): TimeSlot[] {
  if (!availability || availability.closed || !availability.openTime || !availability.closeTime) return [];

  const open = toMinutes(availability.openTime);
  const close = toMinutes(availability.closeTime);
  const booked = availability.bookedIntervals.map((interval) => ({
    start: new Date(interval.startAt).getTime(),
    end: new Date(interval.endAt).getTime()
  }));

  const slots: TimeSlot[] = [];
  for (let minute = open; minute + durationMinutes <= close; minute += SLOT_STEP_MINUTES) {
    const value = `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`;
    const start = new Date(`${date}T${value}:00+07:00`).getTime();
    const end = start + durationMinutes * 60000;
    const isPast = start <= Date.now();
    const overlaps = booked.some((interval) => interval.start < end && interval.end > start);
    slots.push({ value, disabled: isPast || overlaps });
  }
  return slots;
}

export const SalonDetailScreen: React.FC<SalonDetailScreenProps> = ({ navigation, route }) => {
  const rawSalon = route.params?.salon || {};
  const salonApiId: number | undefined =
    rawSalon.apiId ||
    (rawSalon.id && !isNaN(Number(rawSalon.id))
      ? Number(rawSalon.id)
      : typeof rawSalon.id === 'string' && rawSalon.id.startsWith('api-sal-')
      ? Number(rawSalon.id.replace('api-sal-', ''))
      : undefined);

  const salon: Salon = {
    ...rawSalon,
    apiId: salonApiId,
    id: rawSalon.id || (salonApiId ? `api-sal-${salonApiId}` : 'salon-unknown'),
    name: rawSalon.name || 'Salon',
    address: rawSalon.address || 'Địa chỉ đang cập nhật',
    rating: rawSalon.rating ?? 5.0,
    reviewCount: rawSalon.reviewCount || 128,
    imageUrl: rawSalon.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600',
    services: rawSalon.services || [],
    stylists: rawSalon.stylists || []
  };

  const selectedHairstyle: Hairstyle | undefined = route.params?.selectedHairstyle;
  const userPhotoUri: string | undefined = route.params?.userPhotoUri;

  const [activeTab, setActiveTab] = useState<string>('Services');
  const [isFavorite, setIsFavorite] = useState<boolean>(favoritesStore.isFavorite(salon.id));
  const [salonServices, setSalonServices] = useState<ServiceItem[]>(salon.services);
  const [salonStylists, setSalonStylists] = useState<StylistItem[]>(salon.stylists || []);

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
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [availability, setAvailability] = useState<BackendAvailability | undefined>();
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [slotsError, setSlotsError] = useState<string | undefined>();
  const [selectedService, setSelectedService] = useState<ServiceItem | undefined>(salon.services[0]);
  const [selectedStylist, setSelectedStylist] = useState<StylistItem | undefined>(
    salon.stylists && salon.stylists.length > 0 ? salon.stylists[0] : undefined
  );

  const timeSlots = buildTimeSlots(
    selectedDate,
    availability,
    selectedService?.durationMinutes || DEFAULT_DURATION_MINUTES
  );

  // Lấy lịch trống thật của stylist theo ngày
  useEffect(() => {
    if (!salon.apiId || !selectedStylist?.apiId) {
      setAvailability(undefined);
      return;
    }

    let isMounted = true;
    setSlotsLoading(true);
    setSlotsError(undefined);
    setSelectedTimeSlot('');

    backendApi
      .getAvailability(salon.apiId, selectedStylist.apiId, selectedDate)
      .then((result) => {
        if (isMounted) setAvailability(result);
      })
      .catch((error) => {
        if (!isMounted) return;
        setAvailability(undefined);
        setSlotsError(error instanceof Error ? error.message : 'Không tải được lịch trống.');
      })
      .finally(() => {
        if (isMounted) setSlotsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [salon.apiId, selectedStylist?.apiId, selectedDate]);

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
          setSelectedService((prev) => prev || apiServices[0]);
        }

        if (apiStylists.length > 0) {
          setSalonStylists(apiStylists);
          setSelectedStylist((prev) => prev || apiStylists[0]);
        }
      } catch {
        // Giữ dữ liệu salon từ route nếu API chi tiết tạm lỗi.
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

    if (!backendApi.isAuthenticated()) {
      Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập để đặt lịch.', [
        { text: 'Đóng', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    if (!salon.apiId || !selectedService.apiId || !selectedStylist.apiId) {
      Alert.alert('Không thể đặt lịch', 'Salon, dịch vụ hoặc stylist này chưa có trên hệ thống.');
      return;
    }

    const currentUser = backendApi.getCurrentUser()?.user;
    const customerName = currentUser?.fullName || 'Khách hàng StyleLock';
    const customerPhone = currentUser?.phone;

    try {
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
        note: `Đặt lịch hẹn từ StyleLock app. Khách: ${customerName}${customerPhone ? ` (${customerPhone})` : ''}`
      });
      bookingService.upsertBooking(backendBooking);
      navigation.navigate('Payment', { bookingId: backendBooking.id });
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
          <AppIcon name="arrowLeft" size={20} color="#B8895A" />
        </TouchableOpacity>

        <Text style={styles.headerBrandTitle}>StyleLock</Text>

        <View style={styles.headerActionsRight}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={handleToggleFavorite}>
            <AppIcon
              name={isFavorite ? 'heartFilled' : 'heart'}
              size={20}
              color={isFavorite ? '#B65A4B' : '#B8895A'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => Alert.alert('Share', `Sharing ${salon.name}...`)}
          >
            <AppIcon name="share" size={20} color="#B8895A" />
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
            <AppIcon name="pin" size={15} color="#6F6255" style={styles.pinIcon} />
            <Text style={styles.addressText} numberOfLines={1}>{salon.address}</Text>
          </View>

          {/* Rating row */}
          <View style={styles.ratingRow}>
            <Text style={styles.starText}>★</Text>
            <Text style={styles.ratingText}>
              {(salon.rating ?? 5.0).toFixed(1)} ({salon.reviewCount || 128} reviews)
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
            {salonStylists.map((st) => {
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
                    <Text style={styles.stylistRoleText} numberOfLines={1}>{st.role || 'Stylist'}</Text>
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
                        <AppIcon name="clock" size={12} color="#6F6255" style={styles.durIcon} />
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
          {slotsLoading ? (
            <Text style={styles.emptyServiceText}>Đang tải lịch trống...</Text>
          ) : slotsError ? (
            <Text style={styles.emptyServiceText}>{slotsError}</Text>
          ) : timeSlots.length === 0 ? (
            <Text style={styles.emptyServiceText}>
              {availability?.closed ? 'Salon nghỉ vào ngày này.' : 'Chưa có khung giờ trống cho lựa chọn này.'}
            </Text>
          ) : (
            <View style={styles.timeSlotsGrid}>
              {timeSlots.map((slot) => {
                const isSelected = selectedTimeSlot === slot.value;
                return (
                  <TouchableOpacity
                    key={slot.value}
                    style={[
                      styles.timeSlotPill,
                      isSelected && styles.timeSlotPillActive,
                      slot.disabled && styles.timeSlotPillDisabled
                    ]}
                    onPress={() => setSelectedTimeSlot(slot.value)}
                    disabled={slot.disabled}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        isSelected && styles.timeSlotTextActive,
                        slot.disabled && styles.timeSlotTextDisabled
                      ]}
                    >
                      {slot.value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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
                <AppIcon name="pin" size={26} color="#B65A4B" />
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
          <AppIcon name="message" size={18} color="#B8895A" />
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
    backgroundColor: '#EFE6D8'
  },
  topAppBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#EFE6D8'
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerBrandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#B8895A',
    letterSpacing: -0.5
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
    backgroundColor: '#F3E7D8'
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
    color: '#241F1A',
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
    color: '#6F6255'
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2
  },
  starText: {
    fontSize: 15,
    color: '#8A7748'
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A7748'
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
    borderColor: '#E5D9CA',
    paddingHorizontal: 18,
    paddingVertical: 9,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tabPillActive: {
    backgroundColor: '#B8895A',
    borderColor: '#B8895A'
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6F6255'
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  attachedTryOnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E7D8',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D9CA'
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
    color: '#B8895A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  attachedTitle: {
    color: '#241F1A',
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 2
  },
  attachedSub: {
    color: '#6F6255',
    fontSize: 11
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 22
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#241F1A',
    marginBottom: 12
  },
  stylistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  stylistCard: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }
    })
  },
  stylistCardSelected: {
    borderColor: '#B8895A',
    backgroundColor: '#F3E7D8'
  },
  stylistAvatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 10,
    backgroundColor: '#F3E7D8'
  },
  stylistInfoCol: {
    flex: 1
  },
  stylistNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#241F1A',
    marginBottom: 2
  },
  stylistRoleText: {
    fontSize: 12,
    color: '#6F6255'
  },
  servicesList: {
    gap: 12
  },
  emptyServiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5D9CA'
  },
  emptyServiceText: {
    color: '#6F6255',
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
    borderColor: '#E5D9CA',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }
    })
  },
  serviceCardSelected: {
    borderColor: '#B8895A',
    backgroundColor: '#F3E7D8'
  },
  serviceMainCol: {
    flex: 1,
    marginRight: 12
  },
  serviceNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#241F1A',
    marginBottom: 4
  },
  serviceDescText: {
    fontSize: 12,
    color: '#6F6255',
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
    color: '#6F6255'
  },
  servicePriceCol: {
    alignItems: 'flex-end',
    gap: 6
  },
  priceValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B8895A'
  },
  selectBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EFE6D8',
    borderWidth: 1,
    borderColor: '#E5D9CA'
  },
  selectBadgeActive: {
    backgroundColor: '#B8895A',
    borderColor: '#B8895A'
  },
  selectBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6F6255'
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
    borderColor: '#E5D9CA',
    marginRight: 10
  },
  datePillActive: {
    backgroundColor: '#B8895A',
    borderColor: '#B8895A'
  },
  datePillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#241F1A'
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
    borderColor: '#E5D9CA'
  },
  timeSlotPillActive: {
    backgroundColor: '#B8895A',
    borderColor: '#B8895A'
  },
  timeSlotPillDisabled: {
    backgroundColor: '#F1EBE2',
    borderColor: '#E5D9CA',
    opacity: 0.55
  },
  timeSlotTextDisabled: {
    color: '#A39482',
    textDecorationLine: 'line-through'
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#241F1A'
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
    borderTopColor: '#E5D9CA',
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
    backgroundColor: '#F3E7D8',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6
  },
  msgBtnText: {
    color: '#B8895A',
    fontSize: 13,
    fontWeight: '700'
  },
  bookAppointmentBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#B8895A',
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
    backgroundColor: '#D8B98E',
    borderWidth: 1,
    borderColor: '#E5D9CA',
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
    backgroundColor: 'rgba(255, 253, 249, 0.94)',
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
    color: '#241F1A',
    marginTop: 10,
    marginBottom: 4
  },
  locationDistanceText: {
    fontSize: 13,
    color: '#6F6255'
  }
});



