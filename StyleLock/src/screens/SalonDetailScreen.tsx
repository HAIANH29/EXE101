import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  Alert
} from 'react-native';
import { Salon, Hairstyle, ServiceItem } from '../types';

interface SalonDetailScreenProps {
  navigation: any;
  route: any;
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00',
  '14:00', '14:30', '15:00', '15:30', '16:00',
  '17:00', '17:30', '18:00', '18:30', '19:00'
];

const STYLISTS = [
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
  const salon: Salon = route.params.salon;
  const selectedHairstyle: Hairstyle | undefined = route.params?.selectedHairstyle;
  const userPhotoUri: string | undefined = route.params?.userPhotoUri;

  const [activeTab, setActiveTab] = useState<string>('Services');

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
  const [selectedService, setSelectedService] = useState<ServiceItem>(salon.services[0]);

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedTimeSlot || !selectedService) {
      Alert.alert('Selection Missing', 'Please select a service, date and time slot!');
      return;
    }

    navigation.navigate('QuickBooking', {
      salon,
      selectedService,
      selectedDate,
      selectedTimeSlot,
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

        <Text style={styles.brandTitle}>Salon Detail</Text>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => Alert.alert('Share', `Sharing ${salon.name}...`)}
        >
          <Text style={styles.topIcon}>🔗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          <ImageBackground source={{ uri: salon.imageUrl }} style={styles.heroImg}>
            <View style={styles.heroOverlay}>
              <Text style={styles.salonTitle}>{salon.name}</Text>

              <View style={styles.locationRow}>
                <Text style={styles.locIcon}>📍</Text>
                <Text style={styles.locText}>{salon.address}</Text>
              </View>

              <View style={styles.ratingPill}>
                <Text style={styles.starIcon}>⭐</Text>
                <Text style={styles.ratingText}>
                  {salon.rating} ({salon.reviewCount} reviews)
                </Text>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Category Navigation Tabs */}
        <View style={styles.tabsRow}>
          {['Services', 'Portfolio', 'Reviews', 'About'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected Hairstyle Attachment (if any) */}
        {selectedHairstyle && (
          <View style={styles.attachedTryOnCard}>
            <Image source={{ uri: selectedHairstyle.imageUrl }} style={styles.attachedImg} />
            <View style={styles.attachedText}>
              <Text style={styles.attachedLabel}>ATTACHED HAIRSTYLE:</Text>
              <Text style={styles.attachedTitle}>{selectedHairstyle.name}</Text>
              <Text style={styles.attachedSub}>Photo will be attached to booking request</Text>
            </View>
          </View>
        )}

        {/* Top Stylists Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Top Stylists</Text>
          <View style={styles.stylistGrid}>
            {STYLISTS.map((st) => (
              <View key={st.id} style={styles.stylistCard}>
                <Image source={{ uri: st.avatar }} style={styles.stylistAvatar} />
                <View>
                  <Text style={styles.stylistName}>{st.name}</Text>
                  <Text style={styles.stylistRole}>{st.role}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Services List Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.serviceList}>
            {salon.services.map((srv) => {
              const isSelected = selectedService.id === srv.id;
              return (
                <TouchableOpacity
                  key={srv.id}
                  style={[styles.serviceCard, isSelected && styles.selectedServiceCard]}
                  onPress={() => setSelectedService(srv)}
                >
                  <View style={styles.serviceMain}>
                    <Text style={styles.serviceName}>{srv.name}</Text>
                    <Text style={styles.serviceSub}>
                      Full dimensional service with custom conditioning & signature styling.
                    </Text>
                    <View style={styles.durationRow}>
                      <Text style={styles.durIcon}>⏱️</Text>
                      <Text style={styles.durText}>{srv.durationMinutes} min</Text>
                    </View>
                  </View>

                  <View style={styles.serviceRight}>
                    <Text style={styles.priceText}>{srv.price.toLocaleString('vi-VN')} đ</Text>
                    <Text style={[styles.selectBtnText, isSelected && styles.selectedBtnText]}>
                      {isSelected ? '✓ Selected' : 'Select'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {dateOptions.map((opt) => (
              <TouchableOpacity
                key={opt.fullDate}
                style={[styles.datePill, selectedDate === opt.fullDate && styles.selectedDatePill]}
                onPress={() => setSelectedDate(opt.fullDate)}
              >
                <Text style={[styles.dateText, selectedDate === opt.fullDate && styles.selectedDateText]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Slot Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[styles.timeSlot, selectedTimeSlot === slot && styles.selectedTimeSlot]}
                onPress={() => setSelectedTimeSlot(slot)}
              >
                <Text style={[styles.timeSlotText, selectedTimeSlot === slot && styles.selectedTimeText]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location Map Preview */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.mapCard}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600'
              }}
              style={styles.mapImg}
            />
            <View style={styles.mapPinOverlay}>
              <Text style={styles.mapPinIcon}>📍</Text>
            </View>
          </View>
          <Text style={styles.mapAddress}>{salon.address}</Text>
          <Text style={styles.mapDistance}>{salon.distance} away</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.fixedBottomBar}>
        <TouchableOpacity
          style={styles.msgBtn}
          onPress={() =>
            Alert.alert('Message Salon', `Sending direct message to ${salon.name}...`)
          }
        >
          <Text style={styles.msgIcon}>💬</Text>
          <Text style={styles.msgText}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bookActionBtn}
          activeOpacity={0.85}
          onPress={handleBookAppointment}
        >
          <Text style={styles.bookActionText}>Book Appointment</Text>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#005C55',
    letterSpacing: -0.5
  },
  scrollContent: {
    paddingBottom: 20
  },
  heroContainer: {
    width: '100%',
    height: 320,
    backgroundColor: '#121C2A'
  },
  heroImg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end'
  },
  heroOverlay: {
    padding: 20,
    backgroundColor: 'rgba(18, 28, 42, 0.65)'
  },
  salonTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  locIcon: {
    fontSize: 14,
    marginRight: 6
  },
  locText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  starIcon: {
    fontSize: 12,
    marginRight: 4
  },
  ratingText: {
    color: '#FFE08E',
    fontSize: 12,
    fontWeight: '700'
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EEFF',
    paddingHorizontal: 20
  },
  tabBtn: {
    paddingVertical: 14,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  activeTabBtn: {
    borderBottomColor: '#005C55'
  },
  tabText: {
    fontSize: 14,
    color: '#3E4947',
    fontWeight: '500'
  },
  activeTabText: {
    color: '#005C55',
    fontWeight: '700'
  },
  attachedTryOnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#005C55'
  },
  attachedImg: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#E6EEFF'
  },
  attachedText: {
    flex: 1
  },
  attachedLabel: {
    color: '#005C55',
    fontSize: 10,
    fontWeight: '800'
  },
  attachedTitle: {
    color: '#121C2A',
    fontSize: 14,
    fontWeight: '700'
  },
  attachedSub: {
    color: '#3E4947',
    fontSize: 11
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#121C2A',
    marginBottom: 12
  },
  stylistGrid: {
    flexDirection: 'row',
    gap: 12
  },
  stylistCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6EEFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8
  },
  stylistAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 10,
    backgroundColor: '#E6EEFF'
  },
  stylistName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#121C2A'
  },
  stylistRole: {
    fontSize: 11,
    color: '#3E4947'
  },
  serviceList: {
    gap: 12
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6EEFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  selectedServiceCard: {
    borderColor: '#005C55',
    backgroundColor: 'rgba(0, 92, 85, 0.04)'
  },
  serviceMain: {
    flex: 1,
    marginRight: 12
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#121C2A',
    marginBottom: 4
  },
  serviceSub: {
    fontSize: 12,
    color: '#3E4947',
    lineHeight: 16,
    marginBottom: 6
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  durIcon: {
    fontSize: 12,
    marginRight: 4
  },
  durText: {
    fontSize: 12,
    color: '#3E4947'
  },
  serviceRight: {
    alignItems: 'flex-end'
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#005C55',
    marginBottom: 4
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#005C55'
  },
  selectedBtnText: {
    fontWeight: '800',
    color: '#005C55'
  },
  dateScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20
  },
  datePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BDC9C6',
    marginRight: 10
  },
  selectedDatePill: {
    backgroundColor: '#005C55',
    borderColor: '#005C55'
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#121C2A'
  },
  selectedDateText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  timeSlot: {
    width: '18%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDC9C6'
  },
  selectedTimeSlot: {
    backgroundColor: '#005C55',
    borderColor: '#005C55'
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#121C2A'
  },
  selectedTimeText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  mapCard: {
    width: '100%',
    height: 160,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E6EEFF',
    marginBottom: 8
  },
  mapImg: {
    width: '100%',
    height: '100%'
  },
  mapPinOverlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  mapPinIcon: {
    fontSize: 36
  },
  mapAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#121C2A'
  },
  mapDistance: {
    fontSize: 12,
    color: '#3E4947'
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E6EEFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    zIndex: 20,
    elevation: 10
  },
  msgBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#E6E2DC',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6
  },
  msgIcon: {
    fontSize: 16
  },
  msgText: {
    color: '#1C1C18',
    fontSize: 14,
    fontWeight: '600'
  },
  bookActionBtn: {
    flex: 2,
    height: 52,
    backgroundColor: '#005C55',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#005C55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8
  },
  bookActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  }
});
