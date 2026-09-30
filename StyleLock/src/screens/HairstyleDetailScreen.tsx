import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Dimensions
} from 'react-native';
import { LocalizedText as Text, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import { Hairstyle } from '../types';
import { MOCK_HAIRSTYLES } from '../services/mockData';
import { AppIcon } from '../components/AppIcon';

interface HairstyleDetailScreenProps {
  navigation: any;
  route: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HairstyleDetailScreen: React.FC<HairstyleDetailScreenProps> = ({ navigation, route }) => {
  const hairstyleParam: Hairstyle | undefined = route?.params?.hairstyle;
  const hair: Hairstyle = hairstyleParam || MOCK_HAIRSTYLES[0];

  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState<number>(0);

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
      {/* Top Floating Navigation Header */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="arrowLeft" size={18} color="#2A211C" />
        </TouchableOpacity>

        <View style={styles.rightHeaderGroup}>
          <TouchableOpacity style={styles.circleBtn} onPress={() => Alert.alert('Share', `Sharing ${hair.name}...`)}>
            <AppIcon name="share" size={18} color="#2A211C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn} onPress={() => setIsFavorite(!isFavorite)}>
            <AppIcon name="heart" size={18} color={isFavorite ? "#B65A4B" : "#2A211C"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Image Gallery */}
        <View style={styles.heroGalleryWrapper}>
          <Image source={{ uri: galleryImages[selectedGalleryIdx] }} style={styles.heroImage} />

          {/* Gallery Thumbnails Overlay */}
          <View style={styles.thumbnailsOverlay}>
            {galleryImages.map((imgUri, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.thumbWrapper,
                  selectedGalleryIdx === idx && styles.thumbWrapperActive
                ]}
                onPress={() => setSelectedGalleryIdx(idx)}
              >
                <Image source={{ uri: imgUri }} style={styles.thumbImage} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content Card Area */}
        <View style={styles.contentCard}>
          {/* Header Info */}
          <View style={styles.headerInfoRow}>
            <View style={styles.titleCol}>
              <View style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{hair.tag || 'TRENDING'}</Text>
              </View>
              <Text style={styles.hairTitle}>{hair.name}</Text>
            </View>

            <View style={styles.priceCol}>
              <Text style={styles.priceText}>$120</Text>
              <Text style={styles.priceLabel}>EST. PRICE</Text>
            </View>
          </View>

          <Text style={styles.hairDescription}>{hair.description}</Text>

          {/* Specs Grid (2x2) */}
          <View style={styles.specsGrid}>
            <View style={styles.specCard}>
              <AppIcon name="user" size={22} color="#A97845" />
              <View style={styles.specTextGroup}>
                <Text style={styles.specLabel}>Face Shapes</Text>
                <Text style={styles.specValue}>{hair.suitableFace}</Text>
              </View>
            </View>

            <View style={styles.specCard}>
              <AppIcon name="tool" size={22} color="#A97845" />
              <View style={styles.specTextGroup}>
                <Text style={styles.specLabel}>Maintenance</Text>
                <Text style={styles.specValue}>Low</Text>
              </View>
            </View>

            <View style={styles.specCard}>
              <AppIcon name="scissors" size={22} color="#A97845" />
              <View style={styles.specTextGroup}>
                <Text style={styles.specLabel}>Hair Type</Text>
                <Text style={styles.specValue}>Straight, Wavy</Text>
              </View>
            </View>

            <View style={styles.specCard}>
              <AppIcon name="clock" size={22} color="#A97845" />
              <View style={styles.specTextGroup}>
                <Text style={styles.specLabel}>Styling Time</Text>
                <Text style={styles.specValue}>15 mins</Text>
              </View>
            </View>
          </View>

          {/* Stylist Notes Section */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeaderTitle}>Stylist Notes</Text>
            <View style={styles.stylistQuoteCard}>
              <Text style={styles.quoteMark}>“</Text>
              <Text style={styles.quoteBody}>
                This cut is incredible for adding illusion of density to finer hair. Ask for blunt ends with internal point-cutting to get that signature 'lived-in' texture without sacrificing weight at the bottom.
              </Text>
              <View style={styles.stylistProfileRow}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
                  style={styles.stylistAvatar}
                />
                <View>
                  <Text style={styles.stylistName}>Sarah J.</Text>
                  <Text style={styles.stylistRole}>MASTER STYLIST</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Recommended Products Section */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeaderTitle}>Recommended Products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => Alert.alert('Texture Spray', 'Sản phẩm gợi ý chăm sóc kiểu tóc này ($28)')}
              >
                <View style={styles.productImgBox}>
                  <AppIcon name="bottle" size={40} color="#A97845" />
                </View>
                <Text style={styles.productName} numberOfLines={1}>Texture Spray</Text>
                <Text style={styles.productPrice}>$28</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.productCard}
                onPress={() => Alert.alert('Matte Pomade', 'Sản phẩm gợi ý giữ nếp kiểu tóc này ($32)')}
              >
                <View style={styles.productImgBox}>
                  <AppIcon name="scissors" size={40} color="#A97845" />
                </View>
                <Text style={styles.productName} numberOfLines={1}>Matte Pomade</Text>
                <Text style={styles.productPrice}>$32</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.productCard}
                onPress={() => Alert.alert('Hydrating Serum', 'Tinh chất dưỡng tóc mềm mượt ($35)')}
              >
                <View style={styles.productImgBox}>
                  <AppIcon name="sparkle" size={40} color="#A97845" />
                </View>
                <Text style={styles.productName} numberOfLines={1}>Hydrating Serum</Text>
                <Text style={styles.productPrice}>$35</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.fixedBottomBar}>
        <TouchableOpacity
          style={styles.tryOnBtn}
          activeOpacity={0.85}
          onPress={handleTryOn}
        >
          <AppIcon name="camera" size={18} color="#1C1C18" />
          <Text style={styles.tryOnText}>TRY ON</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bookStyleBtn}
          activeOpacity={0.85}
          onPress={handleBookThisStyle}
        >
          <Text style={styles.bookStyleText}>BOOK THIS STYLE</Text>
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
  floatingHeader: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 20
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  headerIcon: {
    fontSize: 16,
    color: '#2A211C'
  },
  rightHeaderGroup: {
    flexDirection: 'row',
    gap: 8
  },
  scrollContent: {
    paddingBottom: 20
  },
  heroGalleryWrapper: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: '#EAD7BF',
    position: 'relative'
  },
  heroImage: {
    width: '100%',
    height: '100%'
  },
  thumbnailsOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 10
  },
  thumbWrapper: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#B89062',
    opacity: 0.8,
    backgroundColor: '#FFFFFF'
  },
  thumbWrapperActive: {
    borderWidth: 2,
    borderColor: '#A97845',
    opacity: 1
  },
  thumbImage: {
    width: '100%',
    height: '100%'
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20
  },
  headerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  titleCol: {
    flex: 1,
    marginRight: 10
  },
  tagBadge: {
    backgroundColor: '#EFE2D2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6
  },
  tagBadgeText: {
    color: '#2A211C',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8
  },
  hairTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2A211C',
    letterSpacing: -0.5
  },
  priceCol: {
    alignItems: 'flex-end'
  },
  priceText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#A97845'
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6F6256',
    letterSpacing: 0.8,
    marginTop: 2
  },
  hairDescription: {
    fontSize: 15,
    color: '#6F6256',
    lineHeight: 22,
    marginBottom: 20
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24
  },
  specCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: '#EFE2D2',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  specIcon: {
    fontSize: 22
  },
  specTextGroup: {
    flex: 1
  },
  specLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A211C',
    marginBottom: 2
  },
  specValue: {
    fontSize: 13,
    color: '#6F6256'
  },
  sectionBlock: {
    marginBottom: 24
  },
  sectionHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A211C',
    marginBottom: 12
  },
  stylistQuoteCard: {
    backgroundColor: 'rgba(217, 227, 246, 0.4)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DEE9FC',
    position: 'relative'
  },
  quoteMark: {
    position: 'absolute',
    top: -10,
    right: 14,
    fontSize: 70,
    color: '#B89062',
    opacity: 0.4
  },
  quoteBody: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#6F6256',
    lineHeight: 22,
    marginBottom: 14
  },
  stylistProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  stylistAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFE2D2'
  },
  stylistName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A211C'
  },
  stylistRole: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6F6256',
    letterSpacing: 0.8
  },
  productsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20
  },
  productCard: {
    width: 128,
    marginRight: 12
  },
  productImgBox: {
    width: 128,
    height: 128,
    backgroundColor: '#EFE2D2',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6
  },
  productEmoji: {
    fontSize: 40
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A211C'
  },
  productPrice: {
    fontSize: 13,
    color: '#6F6256',
    marginTop: 2
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#EFE2D2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    zIndex: 30,
    elevation: 10
  },
  tryOnBtn: {
    flex: 1,
    height: 54,
    backgroundColor: '#E6E2DC',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6
  },
  tryOnIcon: {
    fontSize: 18
  },
  tryOnText: {
    color: '#1C1C18',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8
  },
  bookStyleBtn: {
    flex: 1.5,
    height: 54,
    backgroundColor: '#A97845',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#A97845',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8
  },
  bookStyleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8
  }
});
