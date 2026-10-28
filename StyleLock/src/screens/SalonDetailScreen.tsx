import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking
} from 'react-native';
import { LocalizedText as Text, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import {
  backendApi,
  BackendAvailability,
  BackendSalonDetail,
  BackendReview,
  BackendReviewSummary,
  BackendBusinessHour
} from '../services/backendApi';
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
type TabType = 'Services' | 'Portfolio' | 'Reviews' | 'About';

const TABS: { key: TabType; label: string }[] = [
  { key: 'Services', label: 'Dịch vụ' },
  { key: 'Portfolio', label: 'Bộ sưu tập' },
  { key: 'Reviews', label: 'Đánh giá' },
  { key: 'About', label: 'Giới thiệu' }
];

const AMENITIES = [
  { icon: 'wifi' as const, label: 'Wi-Fi tốc độ cao', desc: 'Miễn phí cho khách hàng' },
  { icon: 'sparkle' as const, label: 'Điều hòa nhiệt độ', desc: 'Không gian mát mẻ 24/7' },
  { icon: 'pin' as const, label: 'Chỗ gửi xe tiện lợi', desc: 'Có bảo vệ trông xe ô tô & xe máy' },
  { icon: 'qr' as const, label: 'Thanh toán linh hoạt', desc: 'Tiền mặt, QR, Chuyển khoản, Thẻ' },
  { icon: 'bottle' as const, label: 'Nước uống & Trà miễn phí', desc: 'Phục vụ chu đáo tại quầy' }
];

const SALON_SPACES = [
  {
    title: 'Khu vực tạo kiểu & Ghế cắt cao cấp',
    desc: 'Trang thiết bị hiện đại, gương đèn LED chuẩn studio',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'
  },
  {
    title: 'Khu gội đầu dưỡng sinh & Thư giãn',
    desc: 'Ghế nằm êm ái cùng liệu trình massage chăm sóc da đầu',
    image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800'
  },
  {
    title: 'Lounge tiếp đón & Trà đàm đạo',
    desc: 'Không gian ấm cúng, thư thái với trà hoa và tạp chí thời trang',
    image: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=800'
  }
];

const pad = (n: number) => String(n).padStart(2, '0');

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function buildTimeSlots(
  date: string,
  availability: BackendAvailability | undefined,
  durationMinutes: number
): TimeSlot[] {
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

function getBusinessHoursDisplay(hours?: BackendBusinessHour[]) {
  const jsDay = new Date().getDay(); // 0 = Sunday, 1 = Monday...
  const currentBackendDay = jsDay === 0 ? 7 : jsDay;

  const dayLabels: Record<number, string> = {
    1: 'Thứ Hai',
    2: 'Thứ Ba',
    3: 'Thứ Tư',
    4: 'Thứ Năm',
    5: 'Thứ Sáu',
    6: 'Thứ Bảy',
    7: 'Chủ Nhật'
  };

  if (!hours || hours.length === 0) {
    return [1, 2, 3, 4, 5, 6, 7].map((dayNum) => ({
      dayName: dayLabels[dayNum],
      time: dayNum >= 6 ? '08:30 - 21:00' : '08:30 - 20:30',
      isToday: dayNum === currentBackendDay,
      isClosed: false
    }));
  }

  return [1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
    const found = hours.find((h) => h.dayOfWeek === dayNum);
    const isToday = dayNum === currentBackendDay;
    if (!found || found.closed) {
      return {
        dayName: dayLabels[dayNum],
        time: 'Nghỉ',
        isToday,
        isClosed: true
      };
    }
    const open = found.openTime?.slice(0, 5) || '08:30';
    const close = found.closeTime?.slice(0, 5) || '20:30';
    return {
      dayName: dayLabels[dayNum],
      time: `${open} - ${close}`,
      isToday,
      isClosed: false
    };
  });
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
    name: rawSalon.name || 'StyleLock Salon',
    address: rawSalon.address || 'Địa chỉ đang cập nhật',
    rating: rawSalon.rating ?? 5.0,
    reviewCount: rawSalon.reviewCount || 0,
    imageUrl: rawSalon.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600',
    services: rawSalon.services || [],
    stylists: rawSalon.stylists || []
  };

  const userPhotoUri: string | undefined = route.params?.userPhotoUri;

  const [activeTab, setActiveTab] = useState<TabType>('Services');
  const [chosenHairstyle, setChosenHairstyle] = useState<Hairstyle | undefined>(route.params?.selectedHairstyle);
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
    const dayName = offset === 0 ? 'Hôm nay' : offset === 1 ? 'Ngày mai' : `Ngày ${dd}/${mm}`;
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

  // Portfolio tab state
  const [portfolioHairstyles, setPortfolioHairstyles] = useState<Hairstyle[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState<boolean>(false);
  const [portfolioError, setPortfolioError] = useState<string | undefined>();
  const [portfolioCategory, setPortfolioCategory] = useState<string>('all');
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<Hairstyle | null>(null);

  // Reviews tab state
  const [reviewsList, setReviewsList] = useState<BackendReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<BackendReviewSummary | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  const [reviewsError, setReviewsError] = useState<string | undefined>();
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState<boolean>(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [eligibleBooking, setEligibleBooking] = useState<any | null>(null);

  // About tab state
  const [salonDetail, setSalonDetail] = useState<BackendSalonDetail | null>(null);
  const [aboutLoading, setAboutLoading] = useState<boolean>(false);

  const timeSlots = buildTimeSlots(
    selectedDate,
    availability,
    selectedService?.durationMinutes || DEFAULT_DURATION_MINUTES
  );

  // Availability loader
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

  // Load Services, Stylists, Hairstyles, Reviews, and Details from Backend
  useEffect(() => {
    let isMounted = true;

    if (!salon.apiId) return;

    // Load services & stylists
    backendApi
      .getServicesBySalon(salon.apiId)
      .then((apiServices) => {
        if (isMounted && apiServices.length > 0) {
          setSalonServices(apiServices);
          setSelectedService((prev) => prev || apiServices[0]);
        }
      })
      .catch(() => {});

    backendApi
      .getStylistsBySalon(salon.apiId)
      .then((apiStylists) => {
        if (isMounted && apiStylists.length > 0) {
          setSalonStylists(apiStylists);
          setSelectedStylist((prev) => prev || apiStylists[0]);
        }
      })
      .catch(() => {});

    // Load portfolio hairstyles
    setPortfolioLoading(true);
    backendApi
      .getHairstylesBySalon(salon.apiId)
      .then((items) => {
        if (isMounted) {
          setPortfolioHairstyles(items);
          setPortfolioError(undefined);
        }
      })
      .catch((err) => {
        if (isMounted) setPortfolioError(err instanceof Error ? err.message : 'Không tải được bộ sưu tập.');
      })
      .finally(() => {
        if (isMounted) setPortfolioLoading(false);
      });

    // Load reviews & summary
    setReviewsLoading(true);
    Promise.all([
      backendApi.getSalonReviews(salon.apiId).catch(() => ({ items: [], total: 0 })),
      backendApi.getSalonReviewSummary(salon.apiId).catch(() => null)
    ])
      .then(([revs, summary]) => {
        if (isMounted) {
          setReviewsList(revs.items || []);
          if (summary) setReviewSummary(summary);
          setReviewsError(undefined);
        }
      })
      .catch((err) => {
        if (isMounted) setReviewsError(err instanceof Error ? err.message : 'Không tải được đánh giá.');
      })
      .finally(() => {
        if (isMounted) setReviewsLoading(false);
      });

    // Load detailed salon profile (business hours, phone, description)
    setAboutLoading(true);
    backendApi
      .getSalonDetail(salon.apiId)
      .then((detail) => {
        if (isMounted) setSalonDetail(detail);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setAboutLoading(false);
      });

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
        hairstyle: chosenHairstyle,
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

  // Review modal check and open
  const handleOpenReviewModal = async () => {
    if (!backendApi.isAuthenticated()) {
      Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập để gửi đánh giá dịch vụ.', [
        { text: 'Đóng', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    try {
      const myBookings = await backendApi.getMyBookings();
      const completedForSalon = myBookings.find(
        (b) =>
          (b.salonId === salon.id ||
            b.salonId === `api-sal-${salon.apiId}` ||
            b.salonId === String(salon.apiId)) &&
          b.status === 'COMPLETED'
      );

      if (!completedForSalon) {
        Alert.alert(
          'Chưa đủ điều kiện đánh giá',
          'Để đảm bảo đánh giá minh bạch và khách quan, chỉ khách hàng đã hoàn thành lịch hẹn tại salon này mới có thể gửi đánh giá thực tế.'
        );
        return;
      }

      setEligibleBooking(completedForSalon);
      setNewRating(5);
      setNewComment('');
      setIsReviewModalVisible(true);
    } catch {
      Alert.alert(
        'Lỗi kiểm tra lịch hẹn',
        'Không thể xác thực lịch hẹn của bạn lúc này. Vui lòng thử lại sau.'
      );
    }
  };

  const handleSubmitReview = async () => {
    if (!eligibleBooking?.id) return;
    if (newRating < 1 || newRating > 5) {
      Alert.alert('Chưa chọn số sao', 'Vui lòng chọn số sao từ 1 đến 5 sao.');
      return;
    }

    const numericBookingId =
      typeof eligibleBooking.id === 'number'
        ? eligibleBooking.id
        : Number(String(eligibleBooking.id).replace('api-bk-', ''));

    if (isNaN(numericBookingId)) {
      Alert.alert('Lỗi', 'Không xác định được mã lịch hẹn hợp lệ.');
      return;
    }

    setSubmittingReview(true);
    try {
      const newRev = await backendApi.createReview({
        bookingId: numericBookingId,
        rating: newRating,
        comment: newComment.trim() || undefined
      });

      setReviewsList((prev) => [newRev, ...prev]);
      setIsReviewModalVisible(false);
      Alert.alert('Đánh giá thành công', 'Cảm ơn bạn đã chia sẻ trải nghiệm thực tế tại salon!');

      if (salon.apiId) {
        backendApi
          .getSalonReviewSummary(salon.apiId)
          .then((res) => setReviewSummary(res))
          .catch(() => {});
      }
    } catch (err: any) {
      Alert.alert('Không thể gửi đánh giá', err instanceof Error ? err.message : 'Vui lòng thử lại sau.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Review calculations
  const totalReviewsCount = reviewSummary?.totalReviews ?? reviewsList.length;
  const currentAverageRating =
    reviewSummary?.averageRating != null && Number(reviewSummary.averageRating) > 0
      ? Number(reviewSummary.averageRating)
      : reviewsList.length > 0
      ? reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length
      : salon.rating ?? 5.0;

  const starDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviewsList.filter((r) => Math.round(r.rating) === star).length;
    const percentage = reviewsList.length > 0 ? (count / reviewsList.length) * 100 : 0;
    return { star, count, percentage };
  });

  const filteredReviews = reviewsList.filter((r) => {
    if (selectedStarFilter === null) return true;
    return Math.round(r.rating) === selectedStarFilter;
  });

  // Portfolio calculations
  const portfolioCategories = [
    { id: 'all', label: 'Tất cả' },
    { id: 'nam', label: 'Tóc nam' },
    { id: 'nu', label: 'Tóc nữ' },
    { id: 'Uốn / Tạo kiểu', label: 'Uốn / Tạo kiểu' },
    { id: 'Nhuộm / Màu', label: 'Nhuộm / Màu' }
  ];

  const filteredHairstyles = portfolioHairstyles.filter((h) => {
    if (portfolioCategory === 'all') return true;
    if (portfolioCategory === 'nam') return h.gender === 'nam';
    if (portfolioCategory === 'nu') return h.gender === 'nu';
    return (
      (h.category && h.category.toLowerCase().includes(portfolioCategory.toLowerCase())) ||
      (h.gender && h.gender.toLowerCase() === portfolioCategory.toLowerCase())
    );
  });

  // Business hours
  const businessHoursSchedule = getBusinessHoursDisplay(salonDetail?.businessHours);

  // =========================================================================
  // RENDER TAB: SERVICES (DỊCH VỤ)
  // =========================================================================
  const renderServicesTab = () => (
    <View>
      {/* Attached Hairstyle Context (if chosen) */}
      {chosenHairstyle && (
        <View style={styles.attachedTryOnCard}>
          <Image source={{ uri: chosenHairstyle.imageUrl }} style={styles.attachedImg} />
          <View style={styles.attachedText}>
            <Text style={styles.attachedLabel}>KIỂU TÓC ĐÃ CHỌN</Text>
            <Text style={styles.attachedTitle}>{chosenHairstyle.name}</Text>
            <Text style={styles.attachedSub}>Kiểu tóc sẽ được đính kèm vào yêu cầu đặt lịch hẹn của bạn</Text>
          </View>
          <TouchableOpacity onPress={() => setChosenHairstyle(undefined)} style={styles.attachedRemoveBtn}>
            <AppIcon name="close" size={16} color="#8A7748" />
          </TouchableOpacity>
        </View>
      )}

      {/* Top Stylists Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Chuyên viên tạo mẫu tóc</Text>
          <Text style={styles.sectionSubCount}>({salonStylists.length} thợ)</Text>
        </View>
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
                  <Text style={styles.stylistNameText} numberOfLines={1}>
                    {st.name}
                  </Text>
                  <Text style={styles.stylistRoleText} numberOfLines={1}>
                    {st.role || 'Senior Stylist'}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.stylistCheckedDot}>
                    <AppIcon name="check" size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Services List Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Dịch vụ làm tóc</Text>
          <Text style={styles.sectionSubCount}>({salonServices.length} dịch vụ)</Text>
        </View>
        {salonServices.length === 0 ? (
          <View style={styles.emptyCard}>
            <AppIcon name="scissors" size={32} color="#B8895A" />
            <Text style={styles.emptyCardTitle}>Chưa có danh sách dịch vụ chi tiết</Text>
            <Text style={styles.emptyCardSubtitle}>Vui lòng liên hệ trực tiếp salon để được tư vấn giá và dịch vụ.</Text>
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
                      Quy trình chuẩn salon cao cấp với sản phẩm dưỡng tóc chuyên sâu.
                    </Text>
                    <View style={styles.durationRow}>
                      <AppIcon name="clock" size={13} color="#6F6255" style={styles.durIcon} />
                      <Text style={styles.durationText}>{srv.durationMinutes} phút</Text>
                    </View>
                  </View>

                  <View style={styles.servicePriceCol}>
                    <Text style={styles.priceValueText}>{srv.price.toLocaleString('vi-VN')} đ</Text>
                    <View style={[styles.selectBadge, isSelected && styles.selectBadgeActive]}>
                      <Text style={[styles.selectBadgeText, isSelected && styles.selectBadgeTextActive]}>
                        {isSelected ? 'Đã chọn' : 'Chọn dịch vụ'}
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
        <Text style={styles.sectionHeading}>Chọn ngày hẹn</Text>
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
        <Text style={styles.sectionHeading}>Chọn khung giờ</Text>
        {slotsLoading ? (
          <View style={styles.inlineLoadingBox}>
            <ActivityIndicator size="small" color="#B8895A" />
            <Text style={styles.inlineLoadingText}>Đang kiểm tra lịch trống của thợ...</Text>
          </View>
        ) : slotsError ? (
          <Text style={styles.inlineErrorText}>{slotsError}</Text>
        ) : timeSlots.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardTitle}>
              {availability?.closed ? 'Salon nghỉ vào ngày này' : 'Chưa có khung giờ trống cho thợ này'}
            </Text>
            <Text style={styles.emptyCardSubtitle}>Vui lòng chọn ngày khác hoặc chọn thợ khác để tiếp tục đặt lịch.</Text>
          </View>
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
        <Text style={styles.sectionHeading}>Vị trí & Đường đi</Text>
        <View style={styles.locationMapCard}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800'
            }}
            style={styles.locationMapImg}
            resizeMode="cover"
          />
          <View style={styles.mapPinCenterOverlay}>
            <View style={styles.pinCircleHolder}>
              <AppIcon name="pin" size={26} color="#B65A4B" />
            </View>
          </View>
        </View>
        <Text style={styles.locationFullAddress}>{salon.address}</Text>
        <Text style={styles.locationDistanceText}>
          {salon.distance ? `${salon.distance} từ vị trí của bạn` : 'Gần bạn · Dễ tìm đỗ xe'}
        </Text>
      </View>
    </View>
  );

  // =========================================================================
  // RENDER TAB: PORTFOLIO (BỘ SƯU TẬP KIỂU TÓC)
  // =========================================================================
  const renderPortfolioTab = () => (
    <View style={styles.sectionContainer}>
      {/* Portfolio Header Description */}
      <View style={styles.portfolioBanner}>
        <Text style={styles.portfolioBannerTitle}>Tác phẩm thực tế từ Salon</Text>
        <Text style={styles.portfolioBannerDesc}>
          Khám phá những mẫu tóc thịnh hành do đội ngũ thợ StyleLock thực hiện. Bạn có thể nhấn để xem ảnh lớn, thử tóc trực tiếp bằng AI hoặc chọn mẫu để đặt lịch!
        </Text>
      </View>

      {/* Category Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollRow}>
        {portfolioCategories.map((cat) => {
          const isActive = portfolioCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setPortfolioCategory(cat.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Portfolio Content */}
      {portfolioLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B8895A" />
          <Text style={styles.loadingLabel}>Đang tải bộ sưu tập kiểu tóc...</Text>
        </View>
      ) : portfolioError ? (
        <View style={styles.emptyCard}>
          <AppIcon name="warning" size={32} color="#B65A4B" />
          <Text style={styles.emptyCardTitle}>Không thể tải bộ sưu tập</Text>
          <Text style={styles.emptyCardSubtitle}>{portfolioError}</Text>
        </View>
      ) : filteredHairstyles.length === 0 ? (
        <View style={styles.emptyCard}>
          <AppIcon name="scissors" size={40} color="#B8895A" />
          <Text style={styles.emptyCardTitle}>Salon chưa cập nhật bộ sưu tập kiểu tóc</Text>
          <Text style={styles.emptyCardSubtitle}>
            Đội ngũ thợ đang hoàn thiện những hình ảnh mới nhất. Bạn có thể tham khảo bảng dịch vụ hoặc liên hệ salon để được tư vấn kiểu tóc phù hợp nhất với khuôn mặt của bạn!
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => setActiveTab('Services')}
            activeOpacity={0.85}
          >
            <AppIcon name="scissors" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.emptyActionBtnText}>Xem danh sách dịch vụ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.portfolioGrid}>
          {filteredHairstyles.map((hair) => (
            <TouchableOpacity
              key={hair.id}
              style={styles.portfolioCard}
              onPress={() => setSelectedPortfolioItem(hair)}
              activeOpacity={0.9}
            >
              <View style={styles.portfolioImageWrapper}>
                <Image source={{ uri: hair.imageUrl }} style={styles.portfolioImage} resizeMode="cover" />
                <View style={styles.portfolioTagBadge}>
                  <Text style={styles.portfolioTagText}>
                    {hair.gender === 'nam' ? 'Tóc nam' : hair.gender === 'nu' ? 'Tóc nữ' : 'Unisex'}
                  </Text>
                </View>
                <View style={styles.zoomIconBadge}>
                  <AppIcon name="zoomIn" size={14} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.portfolioInfo}>
                <Text style={styles.portfolioName} numberOfLines={1}>
                  {hair.name}
                </Text>
                <Text style={styles.portfolioCategory} numberOfLines={1}>
                  {hair.category || 'Tạo kiểu Salon'}
                </Text>

                <View style={styles.portfolioActionsRow}>
                  <TouchableOpacity
                    style={styles.portfolioTryOnBtn}
                    onPress={() => navigation.navigate('TryOnEditor', { hairstyle: hair })}
                    activeOpacity={0.8}
                  >
                    <AppIcon name="sparkle" size={12} color="#B8895A" style={{ marginRight: 4 }} />
                    <Text style={styles.portfolioTryOnText}>Thử AI</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.portfolioSelectBtn}
                    onPress={() => {
                      setChosenHairstyle(hair);
                      setActiveTab('Services');
                      Alert.alert(
                        'Đã chọn kiểu tóc',
                        `Đã đính kèm mẫu tóc "${hair.name}". Mời bạn chọn thợ và khung giờ để hoàn tất lịch hẹn!`
                      );
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.portfolioSelectText}>Đặt mẫu này</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Hairstyle Lightbox Modal */}
      <Modal
        visible={!!selectedPortfolioItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPortfolioItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectedPortfolioItem(null)}
            >
              <AppIcon name="close" size={20} color="#241F1A" />
            </TouchableOpacity>

            {selectedPortfolioItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image
                  source={{ uri: selectedPortfolioItem.imageUrl }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />

                <View style={styles.modalContent}>
                  <View style={styles.modalTagRow}>
                    <View style={styles.modalBadge}>
                      <Text style={styles.modalBadgeText}>
                        {selectedPortfolioItem.gender === 'nam'
                          ? 'Tóc Nam'
                          : selectedPortfolioItem.gender === 'nu'
                          ? 'Tóc Nữ'
                          : 'Unisex'}
                      </Text>
                    </View>
                    <View style={[styles.modalBadge, { backgroundColor: '#F3E7D8' }]}>
                      <Text style={[styles.modalBadgeText, { color: '#B8895A' }]}>
                        {selectedPortfolioItem.category || 'StyleLock Studio'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.modalTitle}>{selectedPortfolioItem.name}</Text>
                  <Text style={styles.modalDesc}>
                    {selectedPortfolioItem.description ||
                      'Mẫu tóc được tạo kiểu tỉ mỉ, phù hợp với xu hướng thời thượng và định hình đường nét khuôn mặt tự nhiên.'}
                  </Text>

                  {selectedPortfolioItem.suitableFace && (
                    <View style={styles.modalFaceRow}>
                      <AppIcon name="sparkle" size={14} color="#B8895A" style={{ marginRight: 6 }} />
                      <Text style={styles.modalFaceText}>
                        Gợi ý khuôn mặt: {selectedPortfolioItem.suitableFace}
                      </Text>
                    </View>
                  )}

                  <View style={styles.modalBtnRow}>
                    <TouchableOpacity
                      style={styles.modalTryOnBtn}
                      onPress={() => {
                        const hair = selectedPortfolioItem;
                        setSelectedPortfolioItem(null);
                        navigation.navigate('TryOnEditor', { hairstyle: hair });
                      }}
                      activeOpacity={0.85}
                    >
                      <AppIcon name="sparkle" size={16} color="#B8895A" style={{ marginRight: 6 }} />
                      <Text style={styles.modalTryOnBtnText}>Thử tóc bằng AI</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalBookBtn}
                      onPress={() => {
                        const hair = selectedPortfolioItem;
                        setChosenHairstyle(hair);
                        setSelectedPortfolioItem(null);
                        setActiveTab('Services');
                        Alert.alert(
                          'Đã chọn mẫu tóc',
                          `Đã đính kèm mẫu tóc "${hair.name}". Mời bạn chọn thợ và khung giờ để hoàn tất lịch hẹn!`
                        );
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.modalBookBtnText}>Chọn kiểu này để đặt lịch</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );

  // =========================================================================
  // RENDER TAB: REVIEWS (ĐÁNH GIÁ TỪ KHÁCH HÀNG)
  // =========================================================================
  const renderReviewsTab = () => (
    <View style={styles.sectionContainer}>
      {/* Overview Card */}
      <View style={styles.reviewOverviewCard}>
        <View style={styles.reviewScoreCol}>
          <Text style={styles.reviewBigScore}>
            {totalReviewsCount > 0 ? currentAverageRating.toFixed(1) : '5.0'}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Text key={s} style={styles.goldStar}>
                ★
              </Text>
            ))}
          </View>
          <Text style={styles.totalReviewsLabel}>
            {totalReviewsCount > 0 ? `${totalReviewsCount} đánh giá thực tế` : 'Chưa có đánh giá'}
          </Text>
        </View>

        <View style={styles.reviewDistributionCol}>
          {starDistribution.map(({ star, count, percentage }) => (
            <View key={star} style={styles.distRow}>
              <Text style={styles.distStarLabel}>{star} ★</Text>
              <View style={styles.distTrack}>
                <View style={[styles.distFill, { width: `${percentage}%` }]} />
              </View>
              <Text style={styles.distCountLabel}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Review Actions & Filters */}
      <View style={styles.reviewActionHeader}>
        <View style={styles.reviewFiltersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollRow}>
            <TouchableOpacity
              style={[styles.filterChip, selectedStarFilter === null && styles.filterChipActive]}
              onPress={() => setSelectedStarFilter(null)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, selectedStarFilter === null && styles.filterChipTextActive]}>
                Tất cả ({totalReviewsCount})
              </Text>
            </TouchableOpacity>

            {[5, 4, 3, 2, 1].map((s) => {
              const isActive = selectedStarFilter === s;
              const count = reviewsList.filter((r) => Math.round(r.rating) === s).length;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedStarFilter(isActive ? null : s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {s} ★ ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.writeReviewBtn}
          onPress={handleOpenReviewModal}
          activeOpacity={0.85}
        >
          <AppIcon name="edit" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.writeReviewBtnText}>Viết đánh giá</Text>
        </TouchableOpacity>
      </View>

      {/* Reviews List */}
      {reviewsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B8895A" />
          <Text style={styles.loadingLabel}>Đang tải đánh giá từ khách hàng...</Text>
        </View>
      ) : reviewsError ? (
        <View style={styles.emptyCard}>
          <AppIcon name="warning" size={32} color="#B65A4B" />
          <Text style={styles.emptyCardTitle}>Không thể tải danh sách đánh giá</Text>
          <Text style={styles.emptyCardSubtitle}>{reviewsError}</Text>
        </View>
      ) : filteredReviews.length === 0 ? (
        <View style={styles.emptyCard}>
          <AppIcon name="star" size={36} color="#B8895A" />
          <Text style={styles.emptyCardTitle}>
            {selectedStarFilter !== null
              ? `Chưa có đánh giá ${selectedStarFilter} sao nào`
              : 'Salon chưa có đánh giá'}
          </Text>
          <Text style={styles.emptyCardSubtitle}>
            Hãy là người đầu tiên chia sẻ cảm nhận thực tế sau khi sử dụng dịch vụ tại salon!
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => setActiveTab('Services')}
            activeOpacity={0.85}
          >
            <AppIcon name="calendar" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.emptyActionBtnText}>Đặt lịch trải nghiệm ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.reviewsListContainer}>
          {filteredReviews.map((rev) => {
            const dateStr = rev.createdAt
              ? new Date(rev.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })
              : 'Gần đây';

            return (
              <View key={rev.id} style={styles.reviewItemCard}>
                <View style={styles.reviewUserRow}>
                  <View style={styles.userAvatarCircle}>
                    <Text style={styles.userAvatarLetter}>
                      {rev.customerId ? `KH` : `U`}
                    </Text>
                  </View>

                  <View style={styles.userNameCol}>
                    <Text style={styles.reviewUserName}>
                      Khách hàng StyleLock #{rev.customerId}
                    </Text>
                    <View style={styles.verifiedRow}>
                      <AppIcon name="check" size={11} color="#34A853" style={{ marginRight: 3 }} />
                      <Text style={styles.verifiedText}>Đã hoàn thành dịch vụ</Text>
                    </View>
                  </View>

                  <Text style={styles.reviewDateText}>{dateStr}</Text>
                </View>

                <View style={styles.reviewRatingStarsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Text
                      key={s}
                      style={[
                        styles.starSmall,
                        s <= rev.rating ? styles.starSmallFilled : styles.starSmallEmpty
                      ]}
                    >
                      ★
                    </Text>
                  ))}
                  <Text style={styles.starNumberText}>{rev.rating}.0</Text>
                </View>

                {rev.comment ? (
                  <Text style={styles.reviewCommentText}>{rev.comment}</Text>
                ) : (
                  <Text style={styles.reviewCommentPlaceholder}>Khách hàng đã đánh giá dịch vụ {rev.rating} sao.</Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Review Submission Modal */}
      <Modal
        visible={isReviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsReviewModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.writeReviewModalCard}>
            <View style={styles.writeReviewModalHeader}>
              <Text style={styles.writeReviewModalTitle}>Đánh giá trải nghiệm dịch vụ</Text>
              <TouchableOpacity onPress={() => setIsReviewModalVisible(false)}>
                <AppIcon name="close" size={20} color="#241F1A" />
              </TouchableOpacity>
            </View>

            <Text style={styles.writeReviewSubtitle}>
              Tại {salon.name} · Đánh giá minh bạch giúp cộng đồng lựa chọn địa điểm làm tóc chất lượng
            </Text>

            {/* Star Selector */}
            <View style={styles.starPickerRow}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.starPickerBtn}
                  onPress={() => setNewRating(num)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.starPickerIcon, num <= newRating && styles.starPickerIconActive]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.starPickerRatingLabel}>
              {newRating === 5
                ? 'Tuyệt vời, rất hài lòng!'
                : newRating === 4
                ? 'Hài lòng với dịch vụ'
                : newRating === 3
                ? 'Bình thường, tạm ổn'
                : newRating === 2
                ? 'Chưa thực sự ưng ý'
                : 'Trải nghiệm chưa tốt'}
            </Text>

            {/* Comment Input */}
            <TextInput
              style={styles.reviewTextInput}
              placeholder="Chia sẻ cảm nhận về tay nghề stylist, không gian salon, mức độ hài lòng về kiểu tóc..."
              placeholderTextColor="#A39482"
              multiline
              numberOfLines={4}
              value={newComment}
              onChangeText={setNewComment}
            />

            {/* Actions */}
            <View style={styles.writeReviewActions}>
              <TouchableOpacity
                style={styles.cancelReviewBtn}
                onPress={() => setIsReviewModalVisible(false)}
                disabled={submittingReview}
              >
                <Text style={styles.cancelReviewBtnText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitReviewBtn}
                onPress={handleSubmitReview}
                disabled={submittingReview}
                activeOpacity={0.85}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitReviewBtnText}>Gửi đánh giá</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  // =========================================================================
  // RENDER TAB: ABOUT (GIỚI THIỆU SALON)
  // =========================================================================
  const renderAboutTab = () => (
    <View style={styles.sectionContainer}>
      {/* A. Giới thiệu tổng quan & Định hướng */}
      <View style={styles.aboutCard}>
        <View style={styles.aboutHeaderBadgeRow}>
          <View style={styles.salonVerifiedBadge}>
            <AppIcon name="shield" size={13} color="#B8895A" style={{ marginRight: 4 }} />
            <Text style={styles.salonVerifiedBadgeText}>Salon Đối Tác Chính Thức StyleLock</Text>
          </View>
        </View>

        <Text style={styles.aboutSalonName}>{salon.name}</Text>
        <Text style={styles.aboutSalonDesc}>
          {salonDetail?.description ||
            salon.description ||
            `${salon.name} mang đến trải nghiệm làm tóc và chăm sóc sắc đẹp hiện đại, chuyên nghiệp. Không gian được thiết kế theo phong cách thư thái, thanh lịch cùng đội ngũ chuyên gia giàu kinh nghiệm sẵn sàng lắng nghe và tư vấn phong cách tóc chuẩn đường nét khuôn mặt cho từng khách hàng.`}
        </Text>

        {/* Commitment Badges */}
        <View style={styles.commitmentsGrid}>
          <View style={styles.commitBadgeItem}>
            <View style={styles.commitIconCircle}>
              <AppIcon name="scissors" size={16} color="#B8895A" />
            </View>
            <View style={styles.commitTextCol}>
              <Text style={styles.commitTitle}>Tay nghề chuyên môn cao</Text>
              <Text style={styles.commitSubtitle}>Được đào tạo bài bản và định kỳ cập nhật xu hướng tóc quốc tế</Text>
            </View>
          </View>

          <View style={styles.commitBadgeItem}>
            <View style={styles.commitIconCircle}>
              <AppIcon name="shield" size={16} color="#B8895A" />
            </View>
            <View style={styles.commitTextCol}>
              <Text style={styles.commitTitle}>Mỹ phẩm tóc chính hãng</Text>
              <Text style={styles.commitSubtitle}>100% dòng sản phẩm hữu cơ, an toàn tuyệt đối cho da đầu và sợi tóc</Text>
            </View>
          </View>

          <View style={styles.commitBadgeItem}>
            <View style={styles.commitIconCircle}>
              <AppIcon name="sparkle" size={16} color="#B8895A" />
            </View>
            <View style={styles.commitTextCol}>
              <Text style={styles.commitTitle}>Tư vấn AI thông minh</Text>
              <Text style={styles.commitSubtitle}>Ứng dụng công nghệ thử tóc AI trực quan trước khi thực hiện cắt</Text>
            </View>
          </View>
        </View>
      </View>

      {/* B. Dịch vụ nổi bật */}
      <View style={styles.aboutCard}>
        <View style={styles.aboutSectionTitleRow}>
          <Text style={styles.aboutSectionHeading}>Dịch vụ nổi bật</Text>
          <TouchableOpacity onPress={() => setActiveTab('Services')} activeOpacity={0.8}>
            <Text style={styles.aboutLinkText}>Xem tất cả ({salonServices.length}) →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuredServicesList}>
          {salonServices.slice(0, 4).map((srv) => (
            <View key={srv.id} style={styles.featuredServiceItem}>
              <View style={styles.featuredServiceInfo}>
                <Text style={styles.featuredServiceName}>{srv.name}</Text>
                <Text style={styles.featuredServiceDur}>{srv.durationMinutes} phút · Tư vấn tận tâm</Text>
              </View>
              <Text style={styles.featuredServicePrice}>{srv.price.toLocaleString('vi-VN')} đ</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.viewAllServicesBtn}
          onPress={() => setActiveTab('Services')}
          activeOpacity={0.85}
        >
          <Text style={styles.viewAllServicesBtnText}>Xem bảng giá & Đặt lịch dịch vụ</Text>
        </TouchableOpacity>
      </View>

      {/* C. Không gian salon thực tế */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutSectionHeading}>Không gian & Cơ sở vật chất</Text>
        <Text style={styles.aboutSectionSubtitle}>
          Được thiết kế tối ưu với ánh sáng chuẩn studio, không gian thoáng đãng mang lại sự thư thái tối đa trong suốt thời gian làm đẹp.
        </Text>

        <View style={styles.spacesGallery}>
          {SALON_SPACES.map((space, idx) => (
            <View key={idx} style={styles.spaceCard}>
              <Image source={{ uri: space.image }} style={styles.spaceImg} resizeMode="cover" />
              <View style={styles.spaceTextOverlay}>
                <Text style={styles.spaceTitle}>{space.title}</Text>
                <Text style={styles.spaceDesc}>{space.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* D. Đội ngũ thợ làm tóc */}
      <View style={styles.aboutCard}>
        <View style={styles.aboutSectionTitleRow}>
          <Text style={styles.aboutSectionHeading}>Đội ngũ thợ làm tóc</Text>
          <Text style={styles.aboutSectionCount}>{salonStylists.length} chuyên viên</Text>
        </View>
        <Text style={styles.aboutSectionSubtitle}>
          Mỗi thợ tại {salon.name} đều có thế mạnh riêng về kỹ thuật cắt tỉa, uốn sóng hoặc nhuộm balayage thời thượng.
        </Text>

        <View style={styles.stylistTeamGrid}>
          {salonStylists.map((st) => (
            <View key={st.id} style={styles.stylistTeamCard}>
              <Image source={{ uri: st.avatar || salon.imageUrl }} style={styles.stylistTeamAvatar} />
              <Text style={styles.stylistTeamName} numberOfLines={1}>{st.name}</Text>
              <Text style={styles.stylistTeamRole} numberOfLines={1}>{st.role || 'Senior Stylist'}</Text>
              <View style={styles.stylistExpBadge}>
                <Text style={styles.stylistExpText}>Tay nghề chuyên nghiệp</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* E. Giờ hoạt động & Tiện ích */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutSectionHeading}>Giờ mở cửa & Tiện ích</Text>

        {/* Schedule */}
        <View style={styles.scheduleBox}>
          <View style={styles.scheduleHeaderRow}>
            <AppIcon name="clock" size={15} color="#B8895A" style={{ marginRight: 6 }} />
            <Text style={styles.scheduleHeaderTitle}>Thời gian phục vụ</Text>
            <View style={styles.openNowBadge}>
              <Text style={styles.openNowText}>Đang mở cửa</Text>
            </View>
          </View>

          {businessHoursSchedule.map((item, idx) => (
            <View key={idx} style={[styles.scheduleRow, item.isToday && styles.scheduleRowToday]}>
              <View style={styles.scheduleDayCol}>
                <Text style={[styles.scheduleDayName, item.isToday && styles.scheduleDayNameToday]}>
                  {item.dayName}
                </Text>
                {item.isToday && <Text style={styles.todayLabel}>(Hôm nay)</Text>}
              </View>
              <Text
                style={[
                  styles.scheduleTime,
                  item.isToday && styles.scheduleTimeToday,
                  item.isClosed && styles.scheduleTimeClosed
                ]}
              >
                {item.time}
              </Text>
            </View>
          ))}
        </View>

        {/* Contact details */}
        <View style={styles.contactDetailsBox}>
          <View style={styles.contactItemRow}>
            <AppIcon name="pin" size={16} color="#B8895A" style={{ marginRight: 10, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.contactItemLabel}>Địa chỉ salon</Text>
              <Text style={styles.contactItemValue}>{salon.address}</Text>
            </View>
          </View>

          {(salonDetail?.phone || salon.phone) && (
            <View style={[styles.contactItemRow, { marginTop: 12 }]}>
              <AppIcon name="phone" size={16} color="#B8895A" style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.contactItemLabel}>Hotline đặt hẹn</Text>
                <Text style={styles.contactItemValue}>{salonDetail?.phone || salon.phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.callNowBtn}
                onPress={() => Linking.openURL(`tel:${salonDetail?.phone || salon.phone}`)}
              >
                <AppIcon name="phone" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.callNowBtnText}>Gọi ngay</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Amenities List */}
        <Text style={[styles.aboutSectionHeading, { marginTop: 20, marginBottom: 10 }]}>
          Tiện ích dành cho khách hàng
        </Text>
        <View style={styles.amenitiesList}>
          {AMENITIES.map((am, idx) => (
            <View key={idx} style={styles.amenityRow}>
              <View style={styles.amenityIconCircle}>
                <AppIcon name={am.icon} size={15} color="#B8895A" />
              </View>
              <View style={styles.amenityTextCol}>
                <Text style={styles.amenityName}>{am.label}</Text>
                <Text style={styles.amenityDesc}>{am.desc}</Text>
              </View>
              <AppIcon name="check" size={14} color="#34A853" />
            </View>
          ))}
        </View>
      </View>

      {/* F. CTA Banner */}
      <View style={styles.ctaBannerCard}>
        <Text style={styles.ctaBannerTitle}>Sẵn sàng thay đổi phong cách của bạn?</Text>
        <Text style={styles.ctaBannerDesc}>
          Đặt lịch ngay để được đội ngũ chuyên viên tạo mẫu tóc tại {salon.name} chăm sóc chu đáo nhất.
        </Text>
        <TouchableOpacity
          style={styles.ctaBookBtn}
          onPress={() => setActiveTab('Services')}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaBookBtnText}>Đặt lịch hẹn ngay hôm nay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
            onPress={() => Alert.alert('Chia sẻ', `Chia sẻ liên kết đến ${salon.name}...`)}
          >
            <AppIcon name="share" size={20} color="#B8895A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Rounded Hero Image Section */}
        <View style={styles.heroWrapper}>
          <Image source={{ uri: salon.imageUrl }} style={styles.heroImage} resizeMode="cover" />
        </View>

        {/* Salon Title & Main Overview */}
        <View style={styles.salonInfoSection}>
          <Text style={styles.salonTitleText}>{salon.name}</Text>

          {/* Address row */}
          <View style={styles.addressRow}>
            <AppIcon name="pin" size={15} color="#6F6255" style={styles.pinIcon} />
            <Text style={styles.addressText} numberOfLines={1}>
              {salon.address}
            </Text>
          </View>

          {/* Rating row */}
          <View style={styles.ratingRow}>
            <Text style={styles.starText}>★</Text>
            <Text style={styles.ratingText}>
              {totalReviewsCount > 0 ? currentAverageRating.toFixed(1) : '5.0'}{' '}
              ({totalReviewsCount > 0 ? `${totalReviewsCount} đánh giá` : 'Đang cập nhật đánh giá'})
            </Text>
          </View>
        </View>

        {/* Category Pill Tabs Row */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Active Tab View */}
        {activeTab === 'Services' && renderServicesTab()}
        {activeTab === 'Portfolio' && renderPortfolioTab()}
        {activeTab === 'Reviews' && renderReviewsTab()}
        {activeTab === 'About' && renderAboutTab()}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.fixedBottomBar}>
        <TouchableOpacity
          style={styles.msgBtn}
          activeOpacity={0.8}
          onPress={() =>
            Alert.alert('Nhắn tin Salon', `Đang mở kênh liên hệ trực tiếp với ${salon.name}...`)
          }
        >
          <AppIcon name="message" size={18} color="#B8895A" />
          <Text style={styles.msgBtnText}>Nhắn tin</Text>
        </TouchableOpacity>

        {activeTab === 'Services' ? (
          <TouchableOpacity
            style={styles.bookAppointmentBtn}
            activeOpacity={0.85}
            onPress={handleBookAppointment}
          >
            <Text style={styles.bookAppointmentBtnText}>Đặt lịch ngay</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.bookAppointmentBtn}
            activeOpacity={0.85}
            onPress={() => setActiveTab('Services')}
          >
            <Text style={styles.bookAppointmentBtnText}>Xem dịch vụ & Đặt lịch</Text>
          </TouchableOpacity>
        )}
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
    color: '#D9943B'
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
    width: 48,
    height: 48,
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
  attachedRemoveBtn: {
    padding: 6
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 20
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#241F1A'
  },
  sectionSubCount: {
    fontSize: 13,
    color: '#6F6255',
    fontWeight: '500'
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
    position: 'relative',
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
  stylistCheckedDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#B8895A',
    justifyContent: 'center',
    alignItems: 'center'
  },
  servicesList: {
    gap: 12
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
  inlineLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8
  },
  inlineLoadingText: {
    fontSize: 13,
    color: '#6F6255'
  },
  inlineErrorText: {
    fontSize: 13,
    color: '#B65A4B'
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
  },

  // Portfolio Styles
  portfolioBanner: {
    backgroundColor: '#FAF5EE',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    marginBottom: 14
  },
  portfolioBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#241F1A',
    marginBottom: 4
  },
  portfolioBannerDesc: {
    fontSize: 13,
    color: '#6F6255',
    lineHeight: 18
  },
  filterScrollRow: {
    marginBottom: 16
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    marginRight: 8
  },
  filterChipActive: {
    backgroundColor: '#B8895A',
    borderColor: '#B8895A'
  },
  filterChipText: {
    fontSize: 13,
    color: '#6F6255',
    fontWeight: '500'
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  portfolioCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5D9CA',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }
    })
  },
  portfolioImageWrapper: {
    width: '100%',
    height: 165,
    backgroundColor: '#F3E7D8',
    position: 'relative'
  },
  portfolioImage: {
    width: '100%',
    height: '100%'
  },
  portfolioTagBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(36, 31, 26, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  portfolioTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600'
  },
  zoomIconBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  portfolioInfo: {
    padding: 10
  },
  portfolioName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#241F1A',
    marginBottom: 2
  },
  portfolioCategory: {
    fontSize: 12,
    color: '#8A7748',
    marginBottom: 8
  },
  portfolioActionsRow: {
    flexDirection: 'row',
    gap: 6
  },
  portfolioTryOnBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E7D8',
    borderRadius: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5D9CA'
  },
  portfolioTryOnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B8895A'
  },
  portfolioSelectBtn: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B8895A',
    borderRadius: 8,
    paddingVertical: 6
  },
  portfolioSelectText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF'
  },

  // Reviews Styles
  reviewOverviewCard: {
    flexDirection: 'row',
    backgroundColor: '#FAF5EE',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    marginBottom: 16
  },
  reviewScoreCol: {
    width: '38%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5D9CA',
    paddingRight: 12
  },
  reviewBigScore: {
    fontSize: 38,
    fontWeight: '800',
    color: '#241F1A',
    lineHeight: 44
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 4
  },
  goldStar: {
    color: '#D9943B',
    fontSize: 16
  },
  totalReviewsLabel: {
    fontSize: 12,
    color: '#6F6255',
    textAlign: 'center'
  },
  reviewDistributionCol: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'center',
    gap: 4
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  distStarLabel: {
    width: 28,
    fontSize: 11,
    fontWeight: '600',
    color: '#6F6255'
  },
  distTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E8DEC8',
    borderRadius: 3,
    overflow: 'hidden'
  },
  distFill: {
    height: '100%',
    backgroundColor: '#D9943B',
    borderRadius: 3
  },
  distCountLabel: {
    width: 22,
    fontSize: 11,
    color: '#6F6255',
    textAlign: 'right'
  },
  reviewActionHeader: {
    marginBottom: 14
  },
  reviewFiltersWrapper: {
    marginBottom: 8
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B8895A',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4
  },
  writeReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  reviewsListContainer: {
    gap: 12
  },
  reviewItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }
    })
  },
  reviewUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  userAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3E7D8',
    borderWidth: 1,
    borderColor: '#E5D9CA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  userAvatarLetter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B8895A'
  },
  userNameCol: {
    flex: 1
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#241F1A'
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  verifiedText: {
    fontSize: 11,
    color: '#34A853',
    fontWeight: '500'
  },
  reviewDateText: {
    fontSize: 12,
    color: '#A39482'
  },
  reviewRatingStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 8
  },
  starSmall: {
    fontSize: 13
  },
  starSmallFilled: {
    color: '#D9943B'
  },
  starSmallEmpty: {
    color: '#E0D6C8'
  },
  starNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A7748',
    marginLeft: 6
  },
  reviewCommentText: {
    fontSize: 13,
    color: '#3A322C',
    lineHeight: 19
  },
  reviewCommentPlaceholder: {
    fontSize: 13,
    color: '#8A7748',
    fontStyle: 'italic'
  },

  // About Styles
  aboutCard: {
    backgroundColor: '#FAF5EE',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    marginBottom: 16
  },
  aboutHeaderBadgeRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  salonVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E7D8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(184, 137, 90, 0.25)'
  },
  salonVerifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B8895A'
  },
  aboutSalonName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#241F1A',
    marginBottom: 8
  },
  aboutSalonDesc: {
    fontSize: 14,
    color: '#6F6255',
    lineHeight: 22,
    marginBottom: 14
  },
  commitmentsGrid: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5D9CA',
    paddingTop: 14
  },
  commitBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  commitIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D9CA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  commitTextCol: {
    flex: 1
  },
  commitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#241F1A'
  },
  commitSubtitle: {
    fontSize: 12,
    color: '#6F6255',
    marginTop: 1
  },
  aboutSectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  aboutSectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#241F1A'
  },
  aboutSectionSubtitle: {
    fontSize: 13,
    color: '#6F6255',
    lineHeight: 18,
    marginBottom: 12
  },
  aboutSectionCount: {
    fontSize: 12,
    color: '#8A7748',
    fontWeight: '600'
  },
  aboutLinkText: {
    fontSize: 13,
    color: '#B8895A',
    fontWeight: '700'
  },
  featuredServicesList: {
    gap: 8,
    marginVertical: 8
  },
  featuredServiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5D9CA'
  },
  featuredServiceInfo: {
    flex: 1
  },
  featuredServiceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#241F1A'
  },
  featuredServiceDur: {
    fontSize: 12,
    color: '#6F6255',
    marginTop: 2
  },
  featuredServicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B8895A',
    marginLeft: 10
  },
  viewAllServicesBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B8895A',
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8
  },
  viewAllServicesBtnText: {
    color: '#B8895A',
    fontSize: 13,
    fontWeight: '700'
  },
  spacesGallery: {
    gap: 12
  },
  spaceCard: {
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative'
  },
  spaceImg: {
    width: '100%',
    height: '100%'
  },
  spaceTextOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 22, 18, 0.72)',
    padding: 12
  },
  spaceTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  spaceDesc: {
    color: '#EFE6D8',
    fontSize: 12,
    marginTop: 2
  },
  stylistTeamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  stylistTeamCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5D9CA'
  },
  stylistTeamAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3E7D8',
    marginBottom: 8
  },
  stylistTeamName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#241F1A',
    textAlign: 'center'
  },
  stylistTeamRole: {
    fontSize: 12,
    color: '#6F6255',
    marginTop: 2,
    textAlign: 'center'
  },
  stylistExpBadge: {
    backgroundColor: '#F3E7D8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6
  },
  stylistExpText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B8895A'
  },
  scheduleBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    marginTop: 8
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE6D8'
  },
  scheduleHeaderTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#241F1A'
  },
  openNowBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  openNowText: {
    fontSize: 11,
    color: '#137333',
    fontWeight: '700'
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  scheduleRowToday: {
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 8,
    borderRadius: 6
  },
  scheduleDayCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  scheduleDayName: {
    fontSize: 13,
    color: '#6F6255'
  },
  scheduleDayNameToday: {
    fontWeight: '700',
    color: '#241F1A'
  },
  todayLabel: {
    fontSize: 11,
    color: '#B8895A',
    fontWeight: '700'
  },
  scheduleTime: {
    fontSize: 13,
    color: '#241F1A',
    fontWeight: '500'
  },
  scheduleTimeToday: {
    fontWeight: '700',
    color: '#B8895A'
  },
  scheduleTimeClosed: {
    color: '#A39482'
  },
  contactDetailsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    marginTop: 10
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  contactItemLabel: {
    fontSize: 11,
    color: '#8A7748',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  contactItemValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#241F1A',
    marginTop: 2
  },
  callNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B8895A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'center'
  },
  callNowBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  amenitiesList: {
    gap: 8
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5D9CA'
  },
  amenityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E7D8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  amenityTextCol: {
    flex: 1
  },
  amenityName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#241F1A'
  },
  amenityDesc: {
    fontSize: 11,
    color: '#6F6255',
    marginTop: 1
  },
  ctaBannerCard: {
    backgroundColor: '#B8895A',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16
  },
  ctaBannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6
  },
  ctaBannerDesc: {
    color: '#F8EFE4',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16
  },
  ctaBookBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12
  },
  ctaBookBtnText: {
    color: '#B8895A',
    fontSize: 14,
    fontWeight: '800'
  },

  // Modal & Lightbox Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FAF5EE',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative'
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }
    })
  },
  modalImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#F3E7D8'
  },
  modalContent: {
    padding: 18
  },
  modalTagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  modalBadge: {
    backgroundColor: '#241F1A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  modalBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#241F1A',
    marginBottom: 8
  },
  modalDesc: {
    fontSize: 13,
    color: '#6F6255',
    lineHeight: 20,
    marginBottom: 12
  },
  modalFaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E7D8',
    padding: 10,
    borderRadius: 10,
    marginBottom: 18
  },
  modalFaceText: {
    fontSize: 12,
    color: '#8A7748',
    fontWeight: '600'
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10
  },
  modalTryOnBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#B8895A',
    borderRadius: 12,
    paddingVertical: 12
  },
  modalTryOnBtnText: {
    color: '#B8895A',
    fontSize: 13,
    fontWeight: '700'
  },
  modalBookBtn: {
    flex: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B8895A',
    borderRadius: 12,
    paddingVertical: 12
  },
  modalBookBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },

  // Review Write Modal
  writeReviewModalCard: {
    width: '100%',
    backgroundColor: '#FAF5EE',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5D9CA'
  },
  writeReviewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  writeReviewModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#241F1A'
  },
  writeReviewSubtitle: {
    fontSize: 12,
    color: '#6F6255',
    lineHeight: 16,
    marginBottom: 16
  },
  starPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 6
  },
  starPickerBtn: {
    padding: 4
  },
  starPickerIcon: {
    fontSize: 34,
    color: '#E0D6C8'
  },
  starPickerIconActive: {
    color: '#D9943B'
  },
  starPickerRatingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A7748',
    textAlign: 'center',
    marginBottom: 14
  },
  reviewTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D9CA',
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    color: '#241F1A',
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 16
  },
  writeReviewActions: {
    flexDirection: 'row',
    gap: 10
  },
  cancelReviewBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D9CA',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  cancelReviewBtnText: {
    color: '#6F6255',
    fontSize: 13,
    fontWeight: '700'
  },
  submitReviewBtn: {
    flex: 2,
    backgroundColor: '#B8895A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  submitReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },

  // General Loading & Empty State
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10
  },
  loadingLabel: {
    fontSize: 13,
    color: '#6F6255'
  },
  emptyCard: {
    backgroundColor: '#FAF5EE',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    alignItems: 'center',
    textAlign: 'center'
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#241F1A',
    marginTop: 10,
    marginBottom: 6,
    textAlign: 'center'
  },
  emptyCardSubtitle: {
    fontSize: 13,
    color: '#6F6255',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B8895A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },

  // Fixed Bottom Bar
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
  }
});
