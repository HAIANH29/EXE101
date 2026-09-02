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
  Alert
} from 'react-native';
import { bookingService } from '../services/bookingService';
import { Salon, ServiceItem, Hairstyle } from '../types';

interface QuickBookingScreenProps {
  navigation: any;
  route: any;
}

export const QuickBookingScreen: React.FC<QuickBookingScreenProps> = ({ navigation, route }) => {
  const salon: Salon = route.params.salon;
  const selectedService: ServiceItem = route.params.selectedService;
  const selectedDate: string = route.params.selectedDate;
  const selectedTimeSlot: string = route.params.selectedTimeSlot;
  const selectedHairstyle: Hairstyle | undefined = route.params?.selectedHairstyle;
  const userPhotoUri: string | undefined = route.params?.userPhotoUri;

  const [customerName, setCustomerName] = useState<string>('Nguyễn Văn Minh');
  const [customerPhone, setCustomerPhone] = useState<string>('0988123456');

  const handleConfirmBooking = () => {
    if (!customerName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên người đặt!');
      return;
    }

    if (!customerPhone.trim() || customerPhone.length < 9) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại hợp lệ để Salon liên hệ!');
      return;
    }

    // Create Booking in Service
    const createdBooking = bookingService.createBooking({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      salonId: salon.id,
      salonName: salon.name,
      salonAddress: salon.address,
      hairstyleId: selectedHairstyle?.id,
      hairstyleName: selectedHairstyle?.name,
      tryOnImageUrl: userPhotoUri || selectedHairstyle?.imageUrl,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      totalPrice: selectedService.price
    });

    // Navigate to status screen with new booking
    navigation.replace('BookingStatus', {
      bookingId: createdBooking.id
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>◀ Chọn lại giờ</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Xác nhận Đặt lịch</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* SUMMARY CARD */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📋 Thông tin phiếu đặt lịch</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Salon:</Text>
            <Text style={styles.summaryValBold}>{salon.name}</Text>
          </View>
          <Text style={styles.summaryAddress}>📍 {salon.address}</Text>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dịch vụ:</Text>
            <Text style={styles.summaryVal}>{selectedService.name}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thời gian:</Text>
            <Text style={styles.summaryHighlight}>
              🕒 {selectedTimeSlot} - {selectedDate}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính thanh toán:</Text>
            <Text style={styles.summaryPrice}>
              {selectedService.price.toLocaleString('vi-VN')} đ
            </Text>
          </View>
        </View>

        {/* HAIRSTYLE TRY-ON ATTACHMENT CARD */}
        {selectedHairstyle && (
          <View style={styles.tryOnAttachmentCard}>
            <Text style={styles.attachmentTitle}>✂️ Mẫu tóc thử kèm theo:</Text>
            <View style={styles.attachmentRow}>
              <Image
                source={{ uri: userPhotoUri || selectedHairstyle.imageUrl }}
                style={styles.attachmentImg}
              />
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentHairName}>{selectedHairstyle.name}</Text>
                <Text style={styles.attachmentSub}>
                  Salon sẽ xem ảnh ghép try-on này để tư vấn & cắt đúng mong muốn của bạn.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* CUSTOMER CONTACT FORM */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>👤 Thông tin liên hệ của bạn</Text>

          <Text style={styles.inputLabel}>Họ và tên *</Text>
          <TextInput
            style={styles.input}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Nhập họ và tên"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.inputLabel}>Số điện thoại nhận xác nhận *</Text>
          <TextInput
            style={styles.input}
            value={customerPhone}
            onChangeText={setCustomerPhone}
            placeholder="Nhập số điện thoại (vd: 0988123456)"
            keyboardType="phone-pad"
            placeholderTextColor="#64748B"
          />

          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              🔒 Lịch hẹn sẽ khởi tạo ở trạng thái <Text style={{ fontWeight: '800', color: '#F59E0B' }}>PENDING</Text>. Salon sẽ xác nhận giữ chỗ trong vòng 5 phút để tránh trùng lịch.
            </Text>
          </View>
        </View>

        {/* CONFIRM BOOKING BUTTON */}
        <TouchableOpacity
          style={styles.confirmBtn}
          activeOpacity={0.85}
          onPress={handleConfirmBooking}
        >
          <Text style={styles.confirmBtnText}>XÁC NHẬN ĐẶT LỊCH GIỮ CHỖ ➔</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  scrollContent: {
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  backBtn: {
    paddingVertical: 4
  },
  backBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC'
  },
  summaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  summaryTitle: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  summaryLabel: {
    color: '#94A3B8',
    fontSize: 13
  },
  summaryVal: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600'
  },
  summaryValBold: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800'
  },
  summaryAddress: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 8
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 10
  },
  summaryHighlight: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '700'
  },
  summaryPrice: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '800'
  },
  tryOnAttachmentCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0EA5E9'
  },
  attachmentTitle: {
    color: '#0EA5E9',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  attachmentImg: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#334155'
  },
  attachmentInfo: {
    flex: 1
  },
  attachmentHairName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2
  },
  attachmentSub: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15
  },
  formCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155'
  },
  formTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155'
  },
  noticeBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  noticeText: {
    color: '#FCD34D',
    fontSize: 11,
    lineHeight: 16
  },
  confirmBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 24
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  }
});
