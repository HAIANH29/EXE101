import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Modal,
  Dimensions
} from 'react-native';
import { LocalizedText as Text, LocalizedTextInput as TextInput } from '../i18n/LocalizedComponents';
import { MOCK_HAIRSTYLES } from '../services/mockData';
import { backendApi } from '../services/backendApi';
import { Hairstyle } from '../types';
import { AppIcon } from '../components/AppIcon';
import { BottomNavBar } from '../components/BottomNavBar';
import { NotificationBellButton } from '../components/NotificationBellButton';
import { favoritesStore } from '../services/favoritesStore';

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
  const [favVersion, setFavVersion] = useState<number>(0);
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

    const unsubscribe = favoritesStore.subscribe(() => {
      if (isMounted) setFavVersion((v) => v + 1);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const toggleFavorite = (id: string) => {
    favoritesStore.toggleFavorite(id);
    setFavVersion((v) => v + 1);
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
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }}
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

      {/* Sticky Search & Filter Header */}
      <View style={styles.stickyHeader}>
        <View style={styles.searchContainer}>
          <AppIcon name="search" size={17} color="#687572" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hairstyles, colors, trends..."
            placeholderTextColor="#A9A29A"
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
            const isFav = favoritesStore.isFavorite(hair.id);
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
                    <AppIcon
                      name={isFav ? "heartFilled" : "heart"}
                      size={19}
                      color={isFav ? "#E63946" : "#A97845"}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Card Content & Details */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.cardContent}
                  onPress={() => navigation.navigate('HairstyleDetail', { hairstyle: hair })}
                >
                  <Text style={styles.cardTitle} numberOfLines={1}>{hair.name}</Text>
                  <Text style={styles.cardDesc} numberOfLines={1}>
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
                <AppIcon name="close" size={22} color="#6F6256" />
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
    backgroundColor: '#F7F5F1'
  },
  topAppBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E6E1',
    zIndex: 10
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F5F3'
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#005C55',
    letterSpacing: -0.5
  },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E6E1',
    gap: 12,
    zIndex: 9
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
    borderColor: '#D0D8D4'
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#182C2A'
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D8D4',
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
    color: '#2A211C',
    letterSpacing: -0.5,
    marginBottom: 4
  },
  subTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2A211C'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  articleCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8DED1',
    elevation: 2,
    shadowColor: '#2A211C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginBottom: 4
  },
  imgWrapper: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: '#EFE2D2'
  },
  hairImg: {
    width: '100%',
    height: '100%'
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  favIcon: {
    fontSize: 16
  },
  cardContent: {
    padding: 10
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A211C',
    marginBottom: 2
  },
  cardDesc: {
    fontSize: 11,
    color: '#7E6F62',
    lineHeight: 14,
    marginBottom: 8
  },
  tryNowBtn: {
    height: 36,
    backgroundColor: '#005C55',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tryNowText: {
    color: '#FFFFFF',
    fontSize: 12,
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
    backgroundColor: '#D0D8D4'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E6E1',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#182C2A'
  },
  closeBtnText: {
    fontSize: 20,
    color: '#687572',
    padding: 4
  },
  modalBody: {
    marginBottom: 20
  },
  filterCategoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#687572',
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
    borderColor: '#D0D8D4',
    backgroundColor: '#FFFFFF'
  },
  activePill: {
    backgroundColor: '#E3EFEB',
    borderColor: '#005C55'
  },
  pillText: {
    fontSize: 13,
    color: '#182C2A',
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
    backgroundColor: '#F0F5F3',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  clearBtnText: {
    color: '#687572',
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
