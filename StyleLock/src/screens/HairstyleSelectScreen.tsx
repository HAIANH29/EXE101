import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  Dimensions
} from 'react-native';
import { MOCK_HAIRSTYLES } from '../services/mockData';
import { backendApi } from '../services/backendApi';
import { Hairstyle } from '../types';
import { AppIcon } from '../components/AppIcon';
import { BottomNavBar } from '../components/BottomNavBar';

interface HairstyleSelectScreenProps {
  navigation: any;
  route?: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HairstyleSelectScreen: React.FC<HairstyleSelectScreenProps> = ({ navigation, route }) => {
  const userPhotoUri = route?.params?.userPhotoUri;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [selectedLength, setSelectedLength] = useState<string>('All');
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<string>('All');
  const [favorites, setFavorites] = useState<{ [id: string]: boolean }>({});
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>(MOCK_HAIRSTYLES);

  useEffect(() => {
    let isMounted = true;

    const loadHairstyles = async () => {
      try {
        const apiHairstyles = await backendApi.getHairstyles();
        if (isMounted && apiHairstyles.length > 0) {
          setHairstyles(apiHairstyles);
        }
      } catch {
        // Keep mock hairstyles when backend catalog is unavailable.
      }
    };

    loadHairstyles();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredHairstyles = hairstyles.filter((hair) => {
    // Search query filter
    const matchesSearch =
      hair.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hair.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hair.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Gender filter
    const matchesGender =
      selectedGender === 'All'
        ? true
        : selectedGender === 'Women'
        ? hair.gender === 'nu'
        : hair.gender === 'nam';

    // Length filter (mapped from category / description)
    const matchesLength =
      selectedLength === 'All'
        ? true
        : hair.category.toLowerCase().includes(selectedLength.toLowerCase()) ||
          hair.description.toLowerCase().includes(selectedLength.toLowerCase());

    // Style filter
    const matchesStyle =
      selectedStyleFilter === 'All'
        ? true
        : hair.category.toLowerCase().includes(selectedStyleFilter.toLowerCase()) ||
          hair.description.toLowerCase().includes(selectedStyleFilter.toLowerCase());

    return matchesSearch && matchesGender && matchesLength && matchesStyle;
  });

  const handleSelectHair = (hair: Hairstyle) => {
    if (userPhotoUri) {
      navigation.navigate('TryOnEditor', {
        userPhotoUri,
        hairstyle: hair
      });
    } else {
      navigation.navigate('CameraUpload', {
        preselectedHair: hair
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Search & Filter Header */}
      <View style={styles.stickyHeader}>
        <View style={styles.searchContainer}>
          <AppIcon name="search" size={17} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hairstyles, colors, trends..."
            placeholderTextColor="#3E4947"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilterModal(true)}
        >
          <AppIcon name="settings" size={20} color="#005C55" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Subtitle Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Explore Styles</Text>
          <Text style={styles.subTitle}>Trending Now</Text>
        </View>

        {/* Editorial Bento Grid Layout */}
        <View style={styles.grid}>
          {filteredHairstyles.map((hair) => {
            const isFav = favorites[hair.id];
            return (
              <View key={hair.id} style={styles.articleCard}>
                {/* Large Image Aspect 4:5 - Click opens HairstyleDetail */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.imgWrapper}
                  onPress={() => navigation.navigate('HairstyleDetail', { hairstyle: hair })}
                >
                  <Image source={{ uri: hair.imageUrl }} style={styles.hairImg} />

                  {/* Favorite Heart Button */}
                  <TouchableOpacity
                    style={styles.favBtn}
                    onPress={() => toggleFavorite(hair.id)}
                  >
                    <AppIcon name="heart" size={19} color={isFav ? "#BA1A1A" : "#005C55"} />
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Card Content & Details */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.cardContent}
                  onPress={() => navigation.navigate('HairstyleDetail', { hairstyle: hair })}
                >
                  <Text style={styles.cardTitle}>{hair.name}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {hair.description}
                  </Text>

                  {/* Primary CTA Button: Try Now */}
                  <TouchableOpacity
                    style={styles.tryNowBtn}
                    activeOpacity={0.85}
                    onPress={() => handleSelectHair(hair)}
                  >
                    <Text style={styles.tryNowText}>Try Now</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      <BottomNavBar active="Explore" navigation={navigation} />

      {/* FILTER BOTTOM SHEET MODAL */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            {/* Modal Handle */}
            <View style={styles.modalHandleRow}>
              <View style={styles.modalHandle} />
            </View>

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <AppIcon name="close" size={22} color="#3E4947" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Filter 1: Gender */}
              <Text style={styles.filterCategoryLabel}>GENDER</Text>
              <View style={styles.pillRow}>
                {['All', 'Women', 'Men'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.pill, selectedGender === g && styles.activePill]}
                    onPress={() => setSelectedGender(g)}
                  >
                    <Text style={[styles.pillText, selectedGender === g && styles.activePillText]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filter 2: Length */}
              <Text style={styles.filterCategoryLabel}>LENGTH</Text>
              <View style={styles.pillRow}>
                {['All', 'Short', 'Medium', 'Long'].map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.pill, selectedLength === l && styles.activePill]}
                    onPress={() => setSelectedLength(l)}
                  >
                    <Text style={[styles.pillText, selectedLength === l && styles.activePillText]}>
                      {l}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filter 3: Style */}
              <Text style={styles.filterCategoryLabel}>STYLE</Text>
              <View style={styles.pillRow}>
                {['All', 'Straight', 'Wavy', 'Curly', 'Layer', 'Bob'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.pill, selectedStyleFilter === s && styles.activePill]}
                    onPress={() => setSelectedStyleFilter(s)}
                  >
                    <Text style={[styles.pillText, selectedStyleFilter === s && styles.activePillText]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Modal Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  setSelectedGender('All');
                  setSelectedLength('All');
                  setSelectedStyleFilter('All');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA'
  },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(250, 250, 250, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EEFF',
    gap: 12,
    zIndex: 10
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#BDC9C6'
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#121C2A'
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BDC9C6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterIcon: {
    fontSize: 20
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16
  },
  titleSection: {
    marginBottom: 20
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#121C2A',
    letterSpacing: -0.5,
    marginBottom: 4
  },
  subTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#121C2A'
  },
  grid: {
    gap: 20
  },
  articleCard: {
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
  imgWrapper: {
    width: '100%',
    aspectRatio: 4 / 5,
    position: 'relative',
    backgroundColor: '#E6EEFF'
  },
  hairImg: {
    width: '100%',
    height: '100%'
  },
  favBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  favIcon: {
    fontSize: 18
  },
  cardContent: {
    padding: 16
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#121C2A',
    marginBottom: 4
  },
  cardDesc: {
    fontSize: 14,
    color: '#3E4947',
    lineHeight: 20,
    marginBottom: 16
  },
  tryNowBtn: {
    height: 52,
    backgroundColor: '#005C55',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tryNowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 28, 42, 0.4)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '80%'
  },
  modalHandleRow: {
    alignItems: 'center',
    paddingVertical: 10
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#BDC9C6'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#121C2A'
  },
  closeBtnText: {
    fontSize: 20,
    color: '#3E4947',
    padding: 4
  },
  modalBody: {
    marginBottom: 20
  },
  filterCategoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3E4947',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 8
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BDC9C6',
    backgroundColor: '#FFFFFF'
  },
  activePill: {
    backgroundColor: 'rgba(0, 92, 85, 0.1)',
    borderColor: '#005C55'
  },
  pillText: {
    fontSize: 13,
    color: '#121C2A',
    fontWeight: '500'
  },
  activePillText: {
    color: '#005C55',
    fontWeight: '700'
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12
  },
  clearBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#E6E2DC',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  clearBtnText: {
    color: '#666460',
    fontSize: 14,
    fontWeight: '600'
  },
  applyBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#005C55',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  }
});
