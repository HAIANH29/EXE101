import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  Linking
} from 'react-native';
import {
  LocalizedText as Text,
  LocalizedTextInput as TextInput,
  LocalizedAlert as Alert
} from '../i18n/LocalizedComponents';
import { backendApi, ExternalSalon } from '../services/backendApi';
import { DataState } from '../components/DataState';
import { Booking, Salon } from '../types';
import { AppIcon, IconBadge } from '../components/AppIcon';

interface SalonDashboardScreenProps {
  navigation: any;
}

export const SalonDashboardScreen: React.FC<SalonDashboardScreenProps> = ({ navigation }) => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [selectedSalonId, setSelectedSalonId] = useState<number | undefined>();
  const [salonBookings, setSalonBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [geoModalVisible, setGeoModalVisible] = useState<boolean>(false);
  const [geoQuery, setGeoQuery] = useState<string>('');
  const [geoResults, setGeoResults] = useState<ExternalSalon[]>([]);
  const [geoLoading, setGeoLoading] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | undefined>();
  const [registeringPlaceId, setRegisteringPlaceId] = useState<string | undefined>();

  const canManage =
    backendApi.isAuthenticated() && backendApi.hasRole('SALON_OWNER');

  // Danh sách salon của chủ salon đang đăng nhập
  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setLoadError(undefined);

    backendApi
      .getMySalons()
      .then((items) => {
        if (!isMounted) return;
        setSalons(items);
        setSelectedSalonId((current) => current ?? items[0]?.apiId);
        if (items.length === 0) setLoading(false);
      })
      .catch((error) => {
        if (!isMounted) return;
        setLoadError(error instanceof Error ? error.message : 'Không tải được danh sách salon.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [canManage, reloadKey]);

  // Lịch hẹn của salon đang chọn
  const loadBookings = useCallback(async () => {
    if (!selectedSalonId) return;
    setLoading(true);
    setLoadError(undefined);
    try {
      setSalonBookings(await backendApi.getSalonBookings(selectedSalonId));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Không tải được lịch hẹn.');
    } finally {
      setLoading(false);
    }
  }, [selectedSalonId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings, reloadKey]);

  const filteredBookings = salonBookings.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });
  const selectedSalon = salons.find((salon) => salon.apiId === selectedSalonId);

  const handleGeoSearch = async () => {
    setGeoLoading(true);
    setGeoError(undefined);
    try {
      setGeoResults(await backendApi.searchGeoapifySalons(geoQuery));
    } catch (error) {
      setGeoResults([]);
      setGeoError(error instanceof Error ? error.message : 'Không tìm được địa điểm salon.');
    } finally {
      setGeoLoading(false);
    }
  };

  const handleRegisterGeoSalon = async (place: ExternalSalon) => {
    setRegisteringPlaceId(place.placeId);
    try {
      await backendApi.registerOwnerSalonFromGeoapify(place);
      setGeoModalVisible(false);
      setGeoQuery('');
      setGeoResults([]);
      setReloadKey((value) => value + 1);
      Alert.alert(
        'Đã gửi đăng ký chi nhánh',
        `${place.name} đã được liên kết với địa điểm Geoapify. Hãy bổ sung dịch vụ, stylist và giờ làm việc trên Salon Dashboard web trước khi đề nghị Admin phê duyệt.`
      );
    } catch (error) {
      Alert.alert(
        'Không thể đăng ký chi nhánh',
        error instanceof Error ? error.message : 'Vui lòng thử lại sau.'
      );
    } finally {
      setRegisteringPlaceId(undefined);
    }
  };

  const handleOpenSalonMap = async () => {
    if (!selectedSalon?.mapUrl) {
      Alert.alert('Chưa có tọa độ', 'Chi nhánh này chưa liên kết vị trí bản đồ.');
      return;
    }
    try {
      await Linking.openURL(selectedSalon.mapUrl);
    } catch {
      Alert.alert('Không mở được bản đồ', 'Vui lòng thử lại sau.');
    }
  };

  const handleUpdateStatus = async (bookingId: string, action: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
    try {
      const updated =
        action === 'CONFIRMED'
          ? await backendApi.confirmBooking(bookingId)
          : action === 'COMPLETED'
            ? await backendApi.completeBooking(bookingId)
            : await backendApi.cancelBooking(bookingId, 'Salon hủy lịch hẹn');
      setSalonBookings((current) => current.map((item) => (item.id === bookingId ? { ...item, ...updated } : item)));
      Alert.alert('Cập nhật thành công', `Lịch hẹn #${bookingId} đã chuyển sang trạng thái [${updated.status}]`);
      setStatusFilter(updated.status);
    } catch (error) {
      Alert.alert('Cập nhật thất bại', error instanceof Error ? error.message : 'Không thể cập nhật lịch hẹn.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <View style={styles.backRow}><AppIcon name="arrowLeft" size={15} color="#B8895A" /><Text style={styles.backBtnText}>Về App Khách</Text></View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Salon Merchant Dashboard</Text>
          <View style={{ width: 60 }} />
        </View>

        {!canManage && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Khu vực này dành cho chủ salon. Vui lòng đăng nhập bằng tài khoản chủ salon để quản lý lịch hẹn.
            </Text>
            {!backendApi.isAuthenticated() && (
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.backBtnText}>Đăng nhập</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {canManage && (
          <DataState
            loading={loading}
            error={loadError}
            empty={!loading && !loadError && salons.length === 0}
            emptyText="Tài khoản này chưa có salon nào."
            onRetry={() => setReloadKey((k) => k + 1)}
          />
        )}

        {/* Salon Selector Pill */}
        <Text style={styles.sectionLabel}>Chi nhánh StyleLock đang quản lý:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.salonSelectorScroll}>
          {salons.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.salonPill, selectedSalonId === s.apiId && styles.activeSalonPill]}
              onPress={() => setSelectedSalonId(s.apiId)}
            >
              <Text style={[styles.salonPillText, selectedSalonId === s.apiId && styles.activeSalonPillText]}>
                {s.name}{s.status === 'PENDING_APPROVAL' ? ' · Chờ duyệt' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {canManage && selectedSalon && (
          <View style={styles.locationCard}>
            <View style={styles.locationCardHeader}>
              <AppIcon name="pin" size={18} color="#B8895A" />
              <View style={styles.locationCardText}>
                <Text style={styles.locationCardTitle}>Địa điểm chi nhánh</Text>
                <Text style={styles.locationCardAddress}>{selectedSalon.address}</Text>
                {selectedSalon.latitude !== undefined && selectedSalon.longitude !== undefined && (
                  <Text style={styles.locationCoordinates}>
                    {selectedSalon.latitude.toFixed(6)}, {selectedSalon.longitude.toFixed(6)}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.mapBtn, !selectedSalon.mapUrl && styles.disabledBtn]}
              onPress={() => void handleOpenSalonMap()}
              activeOpacity={selectedSalon.mapUrl ? 0.8 : 1}
            >
              <Text style={styles.mapBtnText}>
                {selectedSalon.mapUrl ? 'Mở bản đồ' : 'Chưa liên kết bản đồ'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {backendApi.hasRole('SALON_OWNER') && (
          <TouchableOpacity
            style={styles.registerBranchBtn}
            onPress={() => setGeoModalVisible(true)}
            activeOpacity={0.85}
          >
            <AppIcon name="pin" size={16} color="#FFFFFF" />
            <Text style={styles.registerBranchBtnText}>Đăng ký chi nhánh từ Geoapify</Text>
          </TouchableOpacity>
        )}

        {/* DOUBLE BOOKING PROTECTION BANNER */}
        <View style={styles.protectionCard}>
          <View style={styles.protectionTitleRow}><IconBadge name="shield" size={17} containerStyle={styles.protectionIconBadge} /><Text style={styles.protectionTitle}>Cơ chế Double-Booking Protection:</Text></View>
          <Text style={styles.protectionText}>
            Vui lòng kiểm tra thợ & ghế trống tại Salon trước khi bấm <Text style={{ fontWeight: '800', color: '#8A7748' }}>[CONFIRM]</Text>. Khách hàng đang chờ phản hồi xác nhận.
          </Text>
        </View>

        {/* STATUS FILTER TABS */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterTab, statusFilter === 'PENDING' && styles.activePendingTab]}
            onPress={() => setStatusFilter('PENDING')}
          >
            <Text style={[styles.filterTabText, statusFilter === 'PENDING' && styles.activeTabText]}>
              Chờ duyệt ({salonBookings.filter((b) => b.status === 'PENDING').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, statusFilter === 'CONFIRMED' && styles.activeConfirmedTab]}
            onPress={() => setStatusFilter('CONFIRMED')}
          >
            <Text style={[styles.filterTabText, statusFilter === 'CONFIRMED' && styles.activeTabText]}>
              Đã duyệt ({salonBookings.filter((b) => b.status === 'CONFIRMED').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, statusFilter === 'COMPLETED' && styles.activeCompletedTab]}
            onPress={() => setStatusFilter('COMPLETED')}
          >
            <Text style={[styles.filterTabText, statusFilter === 'COMPLETED' && styles.activeTabText]}>
              Hoàn tất ({salonBookings.filter((b) => b.status === 'COMPLETED').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* BOOKING REQUEST CARDS */}
        {!canManage || loading || loadError ? null : filteredBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <IconBadge name="calendar" size={24} containerStyle={styles.emptyIconBadge} />
            <Text style={styles.emptyText}>Không có lịch hẹn nào ở mục [{statusFilter}]</Text>
          </View>
        ) : (
          filteredBookings.map((b) => (
            <View key={b.id} style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <View style={styles.badgePending}>
                  <Text style={styles.badgePendingText}>Mã phiếu: #{b.id}</Text>
                </View>
                <Text style={styles.cardTime}>Tạo lúc: {b.createdAt}</Text>
              </View>

              {/* Customer & Appointment Info */}
              <View style={styles.cardMain}>
                <View style={styles.customerBox}>
                  <Text style={styles.custName}>Khách hàng: {b.customerName}</Text>
                  <Text style={styles.custPhone}>SĐT: {b.customerPhone}</Text>
                  <Text style={styles.appointmentTime}>
                    Khung giờ hẹn: <Text style={styles.timeHighlight}>{b.timeSlot} ngày {b.date}</Text>
                  </Text>
                  <Text style={styles.serviceText}>Dịch vụ chọn: {b.serviceName || 'Cắt tạo kiểu'}</Text>
                  {b.totalPrice && (
                    <Text style={styles.priceText}>
                      Tổng thu: {b.totalPrice.toLocaleString('vi-VN')} đ
                    </Text>
                  )}
                </View>

                {/* Try-on Thumbnail */}
                {b.tryOnImageUrl && (
                  <View style={styles.tryOnBox}>
                    <Image source={{ uri: b.tryOnImageUrl }} style={styles.tryOnImg} />
                    <Text style={styles.tryOnTag} numberOfLines={1}>
                      {b.hairstyleName || 'Try-on Photo'}
                    </Text>
                  </View>
                )}
              </View>

              {/* MERCHANT ACTIONS */}
              <View style={styles.actionRow}>
                {b.status === 'PENDING' && (
                  <>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleUpdateStatus(b.id, 'CANCELLED')}
                    >
                      <Text style={styles.cancelBtnText}>HỦY LỊCH</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.confirmBtn}
                      onPress={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                    >
                      <Text style={styles.confirmBtnText}>DUYỆT GIỮ CHỖ</Text>
                    </TouchableOpacity>
                  </>
                )}

                {b.status === 'CONFIRMED' && (
                  <>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleUpdateStatus(b.id, 'CANCELLED')}
                    >
                      <Text style={styles.cancelBtnText}>Khách No-show</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.completeBtn}
                      onPress={() => handleUpdateStatus(b.id, 'COMPLETED')}
                    >
                      <Text style={styles.completeBtnText}>HOÀN TẤT DỊCH VỤ</Text>
                    </TouchableOpacity>
                  </>
                )}

                {b.status === 'COMPLETED' && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>Đã hoàn tất dịch vụ</Text>
                  </View>
                )}

                {b.status === 'CANCELLED' && (
                  <View style={styles.cancelledBadge}>
                    <Text style={styles.cancelledBadgeText}>Đã hủy yêu cầu đặt lịch này</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={geoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGeoModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.geoModalCard}>
            <View style={styles.geoModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.geoModalTitle}>Liên kết salon thật</Text>
                <Text style={styles.geoModalSubtitle}>
                  Tìm theo tên salon, đường, phường, quận hoặc thành phố tại Việt Nam.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setGeoModalVisible(false)} style={styles.closeModalBtn}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.geoSearchRow}>
              <TextInput
                style={styles.geoSearchInput}
                value={geoQuery}
                onChangeText={setGeoQuery}
                placeholder="Ví dụ: Traky Hair Salon, Thủ Đức"
                returnKeyType="search"
                onSubmitEditing={() => void handleGeoSearch()}
              />
              <TouchableOpacity
                style={styles.geoSearchBtn}
                onPress={() => void handleGeoSearch()}
                disabled={geoLoading}
              >
                {geoLoading
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <Text style={styles.geoSearchBtnText}>Tìm</Text>}
              </TouchableOpacity>
            </View>

            {geoError && <Text style={styles.geoErrorText}>{geoError}</Text>}
            {!geoLoading && !geoError && geoResults.length === 0 && (
              <Text style={styles.geoEmptyText}>Nhập địa điểm để tìm dữ liệu Geoapify.</Text>
            )}

            <ScrollView style={styles.geoResultsList} keyboardShouldPersistTaps="handled">
              {geoResults.map((place) => (
                <View key={place.placeId} style={styles.geoResultCard}>
                  <View style={styles.geoResultInfo}>
                    <Text style={styles.geoResultName}>{place.name}</Text>
                    <Text style={styles.geoResultAddress}>{place.address || 'Chưa có địa chỉ'}</Text>
                    <Text style={styles.locationCoordinates}>
                      {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.selectGeoBtn}
                    onPress={() => void handleRegisterGeoSalon(place)}
                    disabled={registeringPlaceId !== undefined}
                  >
                    {registeringPlaceId === place.placeId
                      ? <ActivityIndicator color="#FFFFFF" size="small" />
                      : <Text style={styles.selectGeoBtnText}>Tạo yêu cầu</Text>}
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.geoNoticeText}>
              Chi nhánh mới ở trạng thái chờ duyệt và chưa thể nhận booking. Owner cần bổ sung dịch vụ,
              stylist và giờ làm việc trên Salon Dashboard web; Admin không tự tạo salon.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFE6D8'
  },
  scrollContent: {
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  backBtn: {
    paddingVertical: 4
  },
  backBtnText: {
    color: '#B8895A',
    fontSize: 13,
    fontWeight: '600'
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#241F1A'
  },
  sectionLabel: {
    color: '#9B8B7A',
    fontSize: 12,
    marginBottom: 6
  },
  salonSelectorScroll: {
    marginBottom: 14
  },
  salonPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DDCBB5'
  },
  activeSalonPill: {
    backgroundColor: '#B8895A',
    borderColor: '#D8B98E'
  },
  salonPillText: {
    color: '#9B8B7A',
    fontSize: 12,
    fontWeight: '600'
  },
  activeSalonPillText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  protectionCard: {
    backgroundColor: '#F7EFE4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#B98D5C'
  },
  protectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4
  },
  protectionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17
  },
  protectionTitle: {
    color: '#B8895A',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2
  },
  protectionText: {
    color: '#6B4227',
    fontSize: 11,
    lineHeight: 16
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14
  },
  filterTab: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDCBB5'
  },
  activePendingTab: {
    backgroundColor: '#B8895A',
    borderColor: '#D8B98E'
  },
  activeConfirmedTab: {
    backgroundColor: '#B8895A',
    borderColor: '#D8C49D'
  },
  activeCompletedTab: {
    backgroundColor: '#B8895A',
    borderColor: '#B98D5C'
  },
  filterTabText: {
    color: '#9B8B7A',
    fontSize: 11,
    fontWeight: '700'
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDCBB5'
  },
  emptyIconBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginBottom: 10
  },
  emptyText: {
    color: '#9B8B7A',
    fontSize: 13
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DDCBB5'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  badgePending: {
    backgroundColor: '#F3E7D8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgePendingText: {
    color: '#B8895A',
    fontSize: 11,
    fontWeight: '700'
  },
  cardTime: {
    color: '#9B8B7A',
    fontSize: 11
  },
  cardMain: {
    flexDirection: 'row',
    marginBottom: 12
  },
  customerBox: {
    flex: 1
  },
  custName: {
    color: '#241F1A',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2
  },
  custPhone: {
    color: '#B8895A',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4
  },
  appointmentTime: {
    color: '#6F6255',
    fontSize: 12,
    marginBottom: 2
  },
  timeHighlight: {
    color: '#B8895A',
    fontWeight: '800'
  },
  serviceText: {
    color: '#9B8B7A',
    fontSize: 12,
    marginBottom: 2
  },
  priceText: {
    color: '#8A7748',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2
  },
  tryOnBox: {
    width: 70,
    alignItems: 'center',
    marginLeft: 10
  },
  tryOnImg: {
    width: 65,
    height: 65,
    borderRadius: 10,
    backgroundColor: '#F3E7D8',
    marginBottom: 4
  },
  tryOnTag: {
    color: '#B8895A',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center'
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#6F6255',
    paddingTop: 10
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(182, 90, 75, 0.18)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9A195'
  },
  cancelBtnText: {
    color: '#B65A4B',
    fontSize: 12,
    fontWeight: '800'
  },
  confirmBtn: {
    flex: 1.5,
    backgroundColor: '#B8895A',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  completeBtn: {
    flex: 1.5,
    backgroundColor: '#B8895A',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  completedBadge: {
    flex: 1,
    backgroundColor: 'rgba(169, 120, 69, 0.14)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  completedBadgeText: {
    color: '#B8895A',
    fontSize: 12,
    fontWeight: '700'
  },
  cancelledBadge: {
    flex: 1,
    backgroundColor: 'rgba(182, 90, 75, 0.14)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelledBadgeText: {
    color: '#B65A4B',
    fontSize: 12,
    fontWeight: '700'
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDCBB5',
    padding: 12,
    marginBottom: 10
  },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9
  },
  locationCardText: {
    flex: 1
  },
  locationCardTitle: {
    color: '#241F1A',
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 3
  },
  locationCardAddress: {
    color: '#6F6255',
    fontSize: 12,
    lineHeight: 17
  },
  locationCoordinates: {
    color: '#9B8B7A',
    fontSize: 10,
    marginTop: 3
  },
  mapBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3E7D8',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 10
  },
  disabledBtn: {
    opacity: 0.55
  },
  mapBtnText: {
    color: '#8A5B34',
    fontSize: 12,
    fontWeight: '700'
  },
  registerBranchBtn: {
    backgroundColor: '#B8895A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 14
  },
  registerBranchBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(36,31,26,0.48)',
    justifyContent: 'flex-end'
  },
  geoModalCard: {
    maxHeight: '88%',
    backgroundColor: '#FFFDF9',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18
  },
  geoModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14
  },
  geoModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#241F1A'
  },
  geoModalSubtitle: {
    fontSize: 12,
    color: '#6F6255',
    lineHeight: 17,
    marginTop: 3,
    paddingRight: 8
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E7D8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeModalText: {
    color: '#6B4227',
    fontWeight: '800'
  },
  geoSearchRow: {
    flexDirection: 'row',
    gap: 8
  },
  geoSearchInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#DDCBB5',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    color: '#241F1A'
  },
  geoSearchBtn: {
    minWidth: 62,
    minHeight: 44,
    borderRadius: 11,
    backgroundColor: '#B8895A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  geoSearchBtnText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  geoErrorText: {
    color: '#B65A4B',
    fontSize: 12,
    marginTop: 10
  },
  geoEmptyText: {
    color: '#9B8B7A',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 24
  },
  geoResultsList: {
    marginTop: 10
  },
  geoResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5D9CA',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 11,
    marginBottom: 8,
    gap: 8
  },
  geoResultInfo: {
    flex: 1
  },
  geoResultName: {
    color: '#241F1A',
    fontSize: 13,
    fontWeight: '800'
  },
  geoResultAddress: {
    color: '#6F6255',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2
  },
  selectGeoBtn: {
    backgroundColor: '#B8895A',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 72,
    alignItems: 'center'
  },
  selectGeoBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  geoNoticeText: {
    color: '#6F6255',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8
  }
});

