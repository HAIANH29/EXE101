import React, { useState, useEffect } from 'react';
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
import { Hairstyle } from '../types';
import { AppIcon } from '../components/AppIcon';
import { favoritesStore } from '../services/favoritesStore';

interface HairstyleDetailScreenProps {
  navigation: any;
  route: any;
}

export const HairstyleDetailScreen: React.FC<HairstyleDetailScreenProps> = ({ navigation, route }) => {
  const hairstyleParam: Hairstyle | undefined = route?.params?.hairstyle;

  if (!hairstyleParam) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <Text>Không tìm thấy thông tin kiểu tóc.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('HairstyleSelect')}>
            <Text>Xem danh sách kiểu tóc</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return <HairstyleDetailContent navigation={navigation} hair={hairstyleParam} />;
};

const HairstyleDetailContent: React.FC<{ navigation: any; hair: Hairstyle }> = ({ navigation, hair }) => {

  const [isFavorite, setIsFavorite] = useState<boolean>(
    favoritesStore.isFavorite(hair.id)
  );
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState<number>(0);

  useEffect(() => {
    setIsFavorite(favoritesStore.isFavorite(hair.id));
    const unsubscribe = favoritesStore.subscribe(() => {
      setIsFavorite(favoritesStore.isFavorite(hair.id));
    });
    return unsubscribe;
  }, [hair.id]);

  const handleToggleFavorite = () => {
    const nextIsFav = favoritesStore.toggleFavorite(hair.id);
    setIsFavorite(nextIsFav);
    if (nextIsFav) {
      Alert.alert('Đã yêu thích', `Đã lưu "${hair.name}" vào danh sách yêu thích của bạn!`);
    } else {
      Alert.alert('Đã bỏ yêu thích', `Đã bỏ "${hair.name}" khỏi danh sách yêu thích.`);
    }
  };

  // Gallery thumbnails (main image + 2 alternate views)
  const galleryImages = [
    hair.imageUrl,
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600'
  ];

  const handleTryOn = () => {
    navigation.navigate('CameraUpload', { preselectedHair: hair });
  };

  const handleBookThisStyle = () => {
    navigation.navigate('SalonList', { selectedHairstyle: hair });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* App Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="arrowLeft" size={20} color="#B8895A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Hairstyle Detail</Text>

        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => Alert.alert('Share', `Sharing ${hair.name}...`)}
        >
          <AppIcon name="share" size={20} color="#B8895A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Style Gallery Card */}
        <View style={styles.heroGalleryWrapper}>
          <Image
            source={{ uri: galleryImages[selectedGalleryIdx] }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Save / Heart Button */}
          <TouchableOpacity
            style={styles.saveHeartBtn}
            onPress={handleToggleFavorite}
            activeOpacity={0.8}
          >
            <AppIcon
              name={isFavorite ? "heartFilled" : "heart"}
              size={22}
              color={isFavorite ? "#B65A4B" : "#B8895A"}
            />
          </TouchableOpacity>

          {/* Gallery Thumbnails Overlay */}
          <View style={styles.galleryViewsOverlay}>
            {galleryImages.map((imgUri, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.galleryThumbContainer,
                  selectedGalleryIdx === idx ? styles.galleryThumbActive : styles.galleryThumbInactive
                ]}
                onPress={() => setSelectedGalleryIdx(idx)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: imgUri }} style={styles.galleryThumbImg} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Style Overview */}
        <View style={styles.styleOverviewSection}>
          {/* Title and Price Header Row */}
          <View style={styles.styleTitlePriceRow}>
            <View style={styles.styleTitleCol}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{hair.category}</Text>
              </View>
              <Text style={styles.styleNameText}>{hair.name}</Text>
            </View>

            <View style={styles.priceCol}>
              <Text style={styles.priceValueText}>$120</Text>
              <Text style={styles.priceLabelText}>EST. PRICE</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.descriptionText}>
            {hair.description || 'A modern, versatile long bob that brushes the collarbone. Featuring soft, piecey layers and subtle waves for effortless volume and movement. Perfect for a chic, low-effort daily look.'}
          </Text>

          {/* Style Attributes Grid (2x2 Cards) */}
          <View style={styles.attributesContainer}>
            <View style={styles.attributeRow}>
              <View style={styles.attrCard}>
                <Text style={styles.attrLabel}>Face Shapes</Text>
                <Text style={styles.attrValue} numberOfLines={1}>{hair.suitableFace || 'Oval, Heart, Round'}</Text>
              </View>
              <View style={styles.attrCard}>
                <Text style={styles.attrLabel}>Maintenance</Text>
                <Text style={styles.attrValue}>Low</Text>
              </View>
            </View>

            <View style={styles.attributeRow}>
              <View style={styles.attrCard}>
                <Text style={styles.attrLabel}>Hair Type</Text>
                <Text style={styles.attrValue}>Straight, Wavy</Text>
              </View>
              <View style={styles.attrCard}>
                <Text style={styles.attrLabel}>Styling Time</Text>
                <Text style={styles.attrValue}>15 mins</Text>
              </View>
            </View>
          </View>

          {/* Stylist Notes Section */}
          <View style={styles.stylistAdviceSection}>
            <Text style={styles.sectionHeadingTitle}>Stylist Notes</Text>
            <View style={styles.stylistCard}>
              <Text style={styles.stylistQuoteBody}>
                This cut is incredible for adding illusion of density to finer hair. Ask for blunt ends with internal point-cutting to get that signature 'lived-in' texture without sacrificing weight at the bottom.
              </Text>
              <View style={styles.stylistAttributionRow}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
                  style={styles.stylistAvatarImg}
                />
                <View style={styles.stylistIdentityCol}>
                  <Text style={styles.stylistNameText}>Sarah J.</Text>
                  <Text style={styles.stylistRoleText}>MASTER STYLIST</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Recommended Products Section */}
          <View style={styles.productsSection}>
            <Text style={styles.sectionHeadingTitle}>Recommended Products</Text>
            <View style={styles.productsRow}>
              <TouchableOpacity
                style={styles.productItemCard}
                activeOpacity={0.85}
                onPress={() => Alert.alert('Texture Spray', 'Sản phẩm gợi ý chăm sóc kiểu tóc này ($28)')}
              >
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400' }}
                  style={styles.productImage}
                />
                <Text style={styles.productTitleText} numberOfLines={1}>Texture Spray</Text>
                <Text style={styles.productPriceText}>$28</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.productItemCard}
                activeOpacity={0.85}
                onPress={() => Alert.alert('Matte Pomade', 'Sản phẩm gợi ý giữ nếp kiểu tóc này ($32)')}
              >
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400' }}
                  style={styles.productImage}
                />
                <Text style={styles.productTitleText} numberOfLines={1}>Matte Pomade</Text>
                <Text style={styles.productPriceText}>$32</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.bottomActionsBar}>
        <View style={styles.styleActionsRow}>
          <TouchableOpacity
            style={styles.tryOnActionBtn}
            activeOpacity={0.85}
            onPress={handleTryOn}
          >
            <AppIcon name="sparkle" size={18} color="#B8895A" />
            <Text style={styles.tryOnActionText}>Try On</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookStyleActionBtn}
            activeOpacity={0.85}
            onPress={handleBookThisStyle}
          >
            <Text style={styles.bookStyleActionText}>Book This Style</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFE6D8'
  },
  appHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#EFE6D8'
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    fontSize: 17,
    fontWeight: '600',
    color: '#B8895A'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24
  },
  heroGalleryWrapper: {
    width: '100%',
    height: 320,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EFE6D8',
    marginBottom: 20
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18
  },
  saveHeartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }
    })
  },
  galleryViewsOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8
  },
  galleryThumbContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  galleryThumbActive: {
    backgroundColor: '#B8895A'
  },
  galleryThumbInactive: {
    backgroundColor: '#FFFFFF'
  },
  galleryThumbImg: {
    width: 46,
    height: 46,
    borderRadius: 8
  },
  styleOverviewSection: {
    gap: 20
  },
  styleTitlePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  styleTitleCol: {
    flex: 1,
    gap: 6
  },
  statusBadge: {
    backgroundColor: '#F3E7D8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  statusBadgeText: {
    color: '#B8895A',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5
  },
  styleNameText: {
    fontSize: 27,
    fontWeight: '600',
    color: '#241F1A',
    lineHeight: 34
  },
  priceCol: {
    alignItems: 'flex-end'
  },
  priceValueText: {
    fontSize: 23,
    fontWeight: '600',
    color: '#B8895A'
  },
  priceLabelText: {
    fontSize: 10,
    color: '#6F6255',
    letterSpacing: 0.5,
    marginTop: 2
  },
  descriptionText: {
    fontSize: 14,
    color: '#6F6255',
    lineHeight: 20
  },
  attributesContainer: {
    gap: 10
  },
  attributeRow: {
    flexDirection: 'row',
    gap: 10
  },
  attrCard: {
    flex: 1,
    height: 63,
    backgroundColor: '#F3E7D8',
    borderWidth: 1,
    borderColor: '#E5D9CA',
    borderRadius: 18,
    padding: 12,
    justifyContent: 'center',
    gap: 4
  },
  attrLabel: {
    fontSize: 11,
    color: '#6F6255'
  },
  attrValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#241F1A'
  },
  stylistAdviceSection: {
    gap: 12
  },
  sectionHeadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#241F1A'
  },
  stylistCard: {
    backgroundColor: '#F3E7D8',
    borderWidth: 1,
    borderColor: '#E5D9CA',
    borderRadius: 18,
    padding: 16,
    gap: 12
  },
  stylistQuoteBody: {
    fontSize: 14,
    color: '#6F6255',
    lineHeight: 20
  },
  stylistAttributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  stylistAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF'
  },
  stylistIdentityCol: {
    flex: 1
  },
  stylistNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#241F1A'
  },
  stylistRoleText: {
    fontSize: 10,
    color: '#6F6255'
  },
  productsSection: {
    gap: 12
  },
  productsRow: {
    flexDirection: 'row',
    gap: 12
  },
  productItemCard: {
    flex: 1,
    gap: 6
  },
  productImage: {
    width: '100%',
    height: 110,
    borderRadius: 18,
    backgroundColor: '#F3E7D8'
  },
  productTitleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#241F1A'
  },
  productPriceText: {
    fontSize: 13,
    color: '#B8895A'
  },
  bottomActionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5D9CA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 30,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 10 },
      web: { boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.04)' }
    })
  },
  styleActionsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 10
  },
  tryOnActionBtn: {
    width: 116,
    height: 48,
    backgroundColor: '#F3E7D8',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },
  tryOnActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B8895A'
  },
  bookStyleActionBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#B8895A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bookStyleActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF'
  }
});


