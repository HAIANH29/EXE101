import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  Dimensions
} from 'react-native';
import { backendApi } from '../services/backendApi';
import { bookingService } from '../services/bookingService';
import { Salon, ServiceItem, Hairstyle, StylistItem, Booking } from '../types';

interface QuickBookingScreenProps {
  navigation: any;
  route: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STYLISTS: StylistItem[] = [
  {
    id: 'st-elena',
    name: 'Elena',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
  },
  {
    id: 'st-marcus',
    name: 'Marcus',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
  },
  {
    id: 'st-sarah',
    name: 'Sarah',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'
  }
];

const TIME_SLOTS_DISPLAY = [
  { label: '09:00 AM', value: '09:00', disabled: false },
  { label: '10:30 AM', value: '10:30', disabled: false },
  { label: '01:00 PM', value: '13:00', disabled: false },
  { label: '02:30 PM', value: '14:30', disabled: true },
  { label: '04:00 PM', value: '16:00', disabled: false }
];

// Build current month calendar
function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Fill leading empty slots with prev month days
  const prevMonthDays = new Date(year, month, 0).getDate();
  const days: { day: number; currentMonth: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, currentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, currentMonth: true });
  }
  return days;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export const QuickBookingScreen: React.FC<QuickBookingScreenProps> = ({ navigation, route }) => {
  const salon: Salon = route.params.salon;
  const selectedServiceParam: ServiceItem | undefined = route.params.selectedService;
  const selectedDateParam: string | undefined = route.params.selectedDate;
  const selectedTimeSlotParam: string | undefined = route.params.selectedTimeSlot;
  const selectedStylistParam: StylistItem | undefined = route.params?.selectedStylist;
  const selectedHairstyle: Hairstyle | undefined = route.params?.selectedHairstyle;
  const userPhotoUri: string | undefined = route.params?.userPhotoUri;
  const serviceOptions = salon.services.length > 0
    ? salon.services
    : selectedServiceParam
    ? [selectedServiceParam]
    : [];
  const stylistsToDisplay = salon.stylists && salon.stylists.length > 0 ? salon.stylists : STYLISTS;
  const initialDate = selectedDateParam ? new Date(`${selectedDateParam}T00:00:00`) : new Date();

  // Service selection
  const [activeServiceId, setActiveServiceId] = useState<string>(
    selectedServiceParam?.id || serviceOptions[0]?.id || ''
  );

  // Stylist selection
  const [activeStylistId, setActiveStylistId] = useState<string>(
    selectedStylistParam?.id || stylistsToDisplay[0]?.id || 'anyone'
  );

  // Calendar state
  const [calYear, setCalYear] = useState<number>(initialDate.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(initialDate.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(initialDate.getDate());

  // Time slot
  const [selectedTime, setSelectedTime] = useState<string>(selectedTimeSlotParam || '10:30');

  // Contact
  const [customerName, setCustomerName] = useState<string>('Nguyễn Văn Minh');
  const [customerPhone, setCustomerPhone] = useState<string>('0988123456');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<boolean>(false);

  const calDays = buildCalendarDays(calYear, calMonth);
  const activeService = serviceOptions.find((service) => service.id === activeServiceId) || serviceOptions[0];
  const activeStylist = stylistsToDisplay.find((s) => s.id === activeStylistId) || stylistsToDisplay[0];

  const formattedDate = `${MONTH_NAMES[calMonth].slice(0, 3)} ${selectedDay}`;
  const formattedTime = TIME_SLOTS_DISPLAY.find((t) => t.value === selectedTime)?.label || selectedTime;

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const buildBookingDate = () => {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    return `${calYear}-${mm}-${dd}`;
  };

  const createLocalBooking = (): Booking => {
    return bookingService.createBooking({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      salonId: salon.id,
      salonName: salon.name,
      salonAddress: salon.address,
      hairstyleId: selectedHairstyle?.id,
      hairstyleName: selectedHairstyle?.name,
      tryOnImageUrl: userPhotoUri || selectedHairstyle?.imageUrl,
      serviceId: activeService?.id,
      serviceName: activeService?.name,
      date: buildBookingDate(),
      timeSlot: selectedTime,
      totalPrice: activeService?.price || 120000
    });
  };

  const goToCreatedBooking = (createdBooking: Booking) => {
    setConfirmed(true);

    setTimeout(() => {
      navigation.replace('BookingStatus', { bookingId: createdBooking.id });
    }, 1200);
  };

  const handleConfirmBooking = async () => {
    if (!customerName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên người đặt!');
      return;
    }
    if (customerPhone.trim().length < 9) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại hợp lệ!');
      return;
    }
    if (!activeService || !activeStylist) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn dịch vụ và stylist.');
      return;
    }

    setIsConfirming(true);

    try {
      if (
        salon.apiId &&
        activeService.apiId &&
        activeStylist?.apiId &&
        backendApi.isAuthenticated()
      ) {
        const backendBooking = await backendApi.createBooking({
          salon,
          service: activeService,
          stylist: activeStylist,
          selectedDate: buildBookingDate(),
          selectedTimeSlot: selectedTime,
          hairstyle: selectedHairstyle,
          userPhotoUri,
          note: `Khách đặt từ StyleLock app. SĐT: ${customerPhone.trim()}`
        });
        bookingService.upsertBooking(backendBooking);
        goToCreatedBooking(backendBooking);
        return;
      }

      if (salon.apiId && activeService.apiId && activeStylist?.apiId && !backendApi.isAuthenticated()) {
        setIsConfirming(false);
        Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập để đặt lịch với dữ liệu backend.', [
          { text: 'Đóng', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') }
        ]);
        return;
      }

      const createdBooking = createLocalBooking();
      goToCreatedBooking(createdBooking);
    } catch (error) {
      setIsConfirming(false);
      const message = error instanceof Error ? error.message : 'Backend không tạo được booking.';
      Alert.alert('Không tạo được booking backend', message);
      return;
    }

    setIsConfirming(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Top App Bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Success Toast */}
      {confirmed && (
        <View style={styles.successToast}>
          <Text style={styles.toastIcon}>✅</Text>
          <Text style={styles.toastText}>Booking Confirmed!</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Step 1: Select Service ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Service</Text>
          <View style={styles.serviceChipsWrap}>
            {serviceOptions.map((svc) => {
              const isActive = activeService?.id === svc.id;
              return (
                <TouchableOpacity
                  key={svc.id}
                  style={[styles.serviceChip, isActive && styles.serviceChipActive]}
                  onPress={() => setActiveServiceId(svc.id)}
                >
                  <Text style={[styles.serviceChipText, isActive && styles.serviceChipTextActive]}>
                    {svc.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Step 2: Choose Stylist ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Stylist</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stylistScroll}>
            {stylistsToDisplay.map((st) => {
              const isActive = activeStylistId === st.id;
              return (
                <TouchableOpacity
                  key={st.id}
                  style={styles.stylistItem}
                  onPress={() => setActiveStylistId(st.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.stylistAvatarWrap, isActive && styles.stylistAvatarActive]}>
                    <Image source={{ uri: st.avatar || salon.imageUrl }} style={styles.stylistAvatar} />
                    {isActive && (
                      <View style={styles.checkBadge}>
                        <Text style={styles.checkBadgeIcon}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.stylistName, isActive && styles.stylistNameActive]}>
                    {st.name}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Anyone option */}
            <TouchableOpacity
              style={styles.stylistItem}
              onPress={() => setActiveStylistId('anyone')}
              activeOpacity={0.8}
            >
              <View style={[
                styles.stylistAvatarWrap,
                styles.anyoneAvatarWrap,
                activeStylistId === 'anyone' && styles.stylistAvatarActive
              ]}>
                <Text style={styles.anyoneIcon}>🔍</Text>
              </View>
              <Text style={[
                styles.stylistName,
                activeStylistId === 'anyone' && styles.stylistNameActive
              ]}>
                Anyone
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ─── Step 3: Date & Time ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time</Text>

          {/* Calendar Widget */}
          <View style={styles.calendarCard}>
            {/* Month Navigation Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.calNavBtn}>
                <Text style={styles.calNavIcon}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.calMonthTitle}>
                {MONTH_NAMES[calMonth]} {calYear}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.calNavBtn}>
                <Text style={styles.calNavIcon}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Day Labels */}
            <View style={styles.calDayLabels}>
              {DAY_LABELS.map((d, idx) => (
                <Text key={idx} style={styles.calDayLabel}>{d}</Text>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.calGrid}>
              {calDays.map((item, idx) => {
                const isSelected = item.currentMonth && item.day === selectedDay;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.calDay,
                      isSelected && styles.calDaySelected,
                      !item.currentMonth && styles.calDayOtherMonth
                    ]}
                    onPress={() => item.currentMonth && setSelectedDay(item.day)}
                    disabled={!item.currentMonth}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.calDayText,
                      isSelected && styles.calDayTextSelected,
                      !item.currentMonth && styles.calDayTextOther
                    ]}>
                      {item.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Time Slots */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.timeSlotsScroll}
            contentContainerStyle={styles.timeSlotsContent}
          >
            {TIME_SLOTS_DISPLAY.map((slot) => {
              const isActive = selectedTime === slot.value;
              return (
                <TouchableOpacity
                  key={slot.value}
                  style={[
                    styles.timeSlot,
                    isActive && styles.timeSlotActive,
                    slot.disabled && styles.timeSlotDisabled
                  ]}
                  onPress={() => !slot.disabled && setSelectedTime(slot.value)}
                  disabled={slot.disabled}
                >
                  <Text style={[
                    styles.timeSlotText,
                    isActive && styles.timeSlotTextActive,
                    slot.disabled && styles.timeSlotTextDisabled
                  ]}>
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── Hairstyle Attachment ─── */}
        {selectedHairstyle && (
          <View style={styles.section}>
            <View style={styles.tryOnCard}>
              <Image
                source={{ uri: userPhotoUri || selectedHairstyle.imageUrl }}
                style={styles.tryOnImg}
              />
              <View style={styles.tryOnInfo}>
                <Text style={styles.tryOnLabel}>ATTACHED HAIRSTYLE</Text>
                <Text style={styles.tryOnName}>{selectedHairstyle.name}</Text>
                <Text style={styles.tryOnSub}>Salon sẽ xem ảnh thử tóc này</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── Contact Info ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Details</Text>
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Enter your name"
              placeholderTextColor="#6E7977"
            />

            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="e.g. 0988 123 456"
              keyboardType="phone-pad"
              placeholderTextColor="#6E7977"
            />
          </View>
        </View>

        {/* Bottom spacer for fixed bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ─── Fixed Bottom Action Bar ─── */}
      <View style={styles.bottomBar}>
        {/* Summary Row */}
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalPrice}>
              {(activeService?.price || 120000).toLocaleString('vi-VN')} đ
            </Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.summaryDateTime}>{formattedDate}, {formattedTime}</Text>
            <Text style={styles.summaryWith}>
              with {activeStylistId === 'anyone' ? 'Anyone' : activeStylist.name}
            </Text>
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmBtn, isConfirming && styles.confirmBtnLoading]}
          onPress={handleConfirmBooking}
          activeOpacity={0.88}
          disabled={isConfirming || confirmed}
        >
          <Text style={styles.confirmBtnText}>
            {isConfirming ? 'Confirming...' : confirmed ? 'Booking Confirmed! ✓' : 'Confirm Booking'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF'
  },
  topAppBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(248, 249, 255, 0.9)',
    zIndex: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 227, 246, 0.5)'
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backIcon: {
    fontSize: 18,
    color: '#3E4947'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#005C55',
    letterSpacing: -0.3
  },
  successToast: {
    position: 'absolute',
    top: 72,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 50,
    borderWidth: 1,
    borderColor: 'rgba(0, 92, 85, 0.2)',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  toastIcon: {
    fontSize: 18
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#121C2A'
  },
  scrollContent: {
    paddingTop: 76,
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  section: {
    marginBottom: 28
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#121C2A',
    marginBottom: 14,
    letterSpacing: -0.3
  },
  // Services
  serviceChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  serviceChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BDC9C6',
    backgroundColor: '#FFFFFF'
  },
  serviceChipActive: {
    backgroundColor: '#005C55',
    borderColor: '#005C55'
  },
  serviceChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3E4947'
  },
  serviceChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  // Stylists
  stylistScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20
  },
  stylistItem: {
    alignItems: 'center',
    marginRight: 16,
    gap: 6
  },
  stylistAvatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: '#BDC9C6',
    overflow: 'hidden',
    position: 'relative'
  },
  stylistAvatarActive: {
    borderWidth: 2,
    borderColor: '#005C55',
    padding: 2
  },
  stylistAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 34
  },
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#005C55',
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkBadgeIcon: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  anyoneAvatarWrap: {
    backgroundColor: '#E6EEFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  anyoneIcon: {
    fontSize: 22
  },
  stylistName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3E4947'
  },
  stylistNameActive: {
    color: '#005C55',
    fontWeight: '700'
  },
  // Calendar
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D9E3F6',
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  calNavBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center'
  },
  calNavIcon: {
    fontSize: 22,
    color: '#3E4947',
    fontWeight: '300'
  },
  calMonthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#121C2A'
  },
  calDayLabels: {
    flexDirection: 'row',
    marginBottom: 6
  },
  calDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#3E4947',
    letterSpacing: 0.5
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  calDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999
  },
  calDaySelected: {
    backgroundColor: '#005C55'
  },
  calDayOtherMonth: {
    opacity: 0.35
  },
  calDayText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#121C2A'
  },
  calDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  calDayTextOther: {
    color: '#6E7977'
  },
  // Time Slots
  timeSlotsScroll: {
    marginHorizontal: -20
  },
  timeSlotsContent: {
    paddingHorizontal: 20,
    gap: 10
  },
  timeSlot: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BDC9C6',
    backgroundColor: '#FFFFFF'
  },
  timeSlotActive: {
    backgroundColor: '#005C55',
    borderColor: '#005C55',
    elevation: 2,
    shadowColor: '#005C55',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4
  },
  timeSlotDisabled: {
    opacity: 0.4
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3E4947'
  },
  timeSlotTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  timeSlotTextDisabled: {
    color: '#6E7977'
  },
  // Try-On Card
  tryOnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#005C55',
    gap: 12
  },
  tryOnImg: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#E6EEFF'
  },
  tryOnInfo: { flex: 1 },
  tryOnLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#005C55',
    letterSpacing: 0.8,
    marginBottom: 2
  },
  tryOnName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121C2A'
  },
  tryOnSub: {
    fontSize: 11,
    color: '#3E4947'
  },
  // Contact form
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D9E3F6',
    elevation: 1
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3E4947',
    marginBottom: 6
  },
  input: {
    backgroundColor: '#F8F9FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#121C2A',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BDC9C6'
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderTopWidth: 1,
    borderTopColor: '#D9E3F6',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.05,
    shadowRadius: 20
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3E4947',
    letterSpacing: 0.8,
    marginBottom: 2
  },
  totalPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#005C55',
    letterSpacing: -0.5
  },
  summaryRight: {
    alignItems: 'flex-end'
  },
  summaryDateTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#121C2A'
  },
  summaryWith: {
    fontSize: 12,
    color: '#3E4947'
  },
  confirmBtn: {
    width: '100%',
    height: 58,
    backgroundColor: '#005C55',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#005C55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10
  },
  confirmBtnLoading: {
    opacity: 0.75
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2
  }
});
