import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalizedText as Text, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import { HairCanvasOverlay } from '../components/HairCanvasOverlay';
import { Hairstyle } from '../types';
import { AppIcon } from '../components/AppIcon';
import { backendApi } from '../services/backendApi';
import { HAIR_COLORS } from '../services/hairAssetMap';
import { applyTransformToImage } from '../utils/imageTransform';
import { describeTryOnError } from '../utils/tryOnError';
import { FALLBACK_30_HAIRSTYLES } from '../components/explore/ExploreTypes';

interface TryOnEditorScreenProps {
  navigation: any;
  route: any;
}

export const TryOnEditorScreen: React.FC<TryOnEditorScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 0)
    : insets.top;

  if (!route.params?.userPhotoUri || !route.params?.hairstyle) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
          <Text style={styles.hairName}>Chưa có ảnh hoặc kiểu tóc để thử.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CameraUpload')}>
            <Text style={styles.seeAllText}>Quay lại chọn ảnh ➔</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <TryOnEditorContent navigation={navigation} route={route} />
    </View>
  );
};

const TryOnEditorContent: React.FC<TryOnEditorScreenProps> = ({ navigation, route }) => {
  const { userPhotoUri, hairstyle: initialHairstyle, initialHairColor } = route.params;

  const [currentHairstyle, setCurrentHairstyle] = useState<Hairstyle>(initialHairstyle);
  const [catalogHairstyles, setCatalogHairstyles] = useState<Hairstyle[]>(FALLBACK_30_HAIRSTYLES);

  // Sync currentHairstyle whenever route.params.hairstyle changes (e.g. from HairstyleSelect)
  useEffect(() => {
    if (route.params?.hairstyle && route.params.hairstyle.id !== currentHairstyle?.id) {
      setCurrentHairstyle(route.params.hairstyle);
      setScale(1.0);
      setRotation(0);
      setOffsetX(0);
      setOffsetY(0);
      setAiResultImageUrl(null);
      setMode('canvas');
    }
  }, [route.params?.hairstyle]);

  useEffect(() => {
    let isMounted = true;
    backendApi
      .getHairstyles()
      .then((items) => {
        if (isMounted && items && items.length > 0) setCatalogHairstyles(items);
      })
      .catch(() => {
        // Fallback already active
      });
    return () => {
      isMounted = false;
    };
  }, []);
  // Hairstyle overlay transform state
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [hairColor, setHairColor] = useState<string>(initialHairColor || '#1E2322');
  const [opacity, setOpacity] = useState<number>(1.0);

  // User portrait photo transform state (phóng to, thu nhỏ, xoay ảnh khuôn mặt)
  const [photoScale, setPhotoScale] = useState<number>(1.0);
  const [photoRotation, setPhotoRotation] = useState<number>(0);
  const [photoOffsetX, setPhotoOffsetX] = useState<number>(0);
  const [photoOffsetY, setPhotoOffsetY] = useState<number>(0);

  // AI Model Generation State
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiResultImageUrl, setAiResultImageUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<'canvas' | 'aiResult'>('canvas');

  const handleSelectHairstyle = (hs: Hairstyle) => {
    setCurrentHairstyle(hs);
    setScale(1.0);
    setRotation(0);
    setOffsetX(0);
    setOffsetY(0);
    setAiResultImageUrl(null);
    setMode('canvas');
  };

  const handleGenerateAi = async () => {
    if (!userPhotoUri) return;

    setIsAiGenerating(true);
    try {
      const hairId = currentHairstyle.apiId;
      if (!hairId) {
        throw new Error('Kiểu tóc này chưa có trong catalog backend.');
      }
      const highResHair = currentHairstyle.imageUrl && /^https?:\/\//.test(currentHairstyle.imageUrl)
        ? currentHairstyle.imageUrl.replace(/([?&])w=\d+/, '$1w=1024')
        : currentHairstyle.imageUrl;

      // Map mã màu HEX sang ảnh mẫu màu cho HairFastGAN (StyleGAN2 latent space)
      const matchedColor = HAIR_COLORS.find(
        (c) => c.colorHex.toLowerCase() === hairColor.toLowerCase()
      );
      const colorImageUrl = matchedColor?.sampleImg;
      // Tự động bake ảnh đã xoay/zoom/căn chỉnh khuôn mặt để AI Model nhận ảnh chuẩn xác nhất
      const alignedPhotoUri = await applyTransformToImage(userPhotoUri, {
        scale: photoScale,
        rotation: photoRotation,
        offsetX: photoOffsetX,
        offsetY: photoOffsetY,
        outputSize: 1024
      });

      const response = await backendApi.generateTryOn({
        imageUri: alignedPhotoUri,
        hairstyleId: hairId,
        hairImageUrl: highResHair,
        colorImageUrl: colorImageUrl
      });

      if (response && response.resultImageUrl) {
        setAiResultImageUrl(response.resultImageUrl);
        setMode('aiResult');
        Alert.alert(
          '✨ Thành công',
          `Đã sinh ảnh thật bằng Model AI mới cho mẫu "${currentHairstyle.name}" với tông màu ${matchedColor?.name || 'Tự nhiên'}!`
        );
      } else {
        throw new Error('Không nhận được ảnh kết quả từ AI');
      }
    } catch (err: any) {
      Alert.alert(
        'Thử tóc bằng AI',
        describeTryOnError(err),
        [{ text: 'Đóng', style: 'cancel' }]
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleProceedToFindSalon = () => {
    navigation.navigate('SalonList', {
      selectedHairstyle: currentHairstyle,
      userPhotoUri: mode === 'aiResult' && aiResultImageUrl ? aiResultImageUrl : userPhotoUri
    });
  };


  return (
    <View style={styles.contentWrapper}>
      {/* Top App Bar Header */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Đổi ảnh khác"
        >
          <AppIcon name="arrowLeft" size={20} color="#B8895A" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>Thử Kiểu Tóc AI</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>Mẫu tóc trong suốt chân thực</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('HairstyleSelect', { userPhotoUri })}
          style={styles.headerActionBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Chọn mẫu tóc khác"
        >
          <AppIcon name="scissors" size={14} color="#B8895A" />
          <Text style={styles.headerActionText}>Đổi mẫu</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Selected Hairstyle Info Banner */}
        <View style={styles.hairstyleInfoCard}>
          <Image source={{ uri: currentHairstyle.imageUrl }} style={styles.thumbImage} />
          <View style={styles.infoTextContainer}>
            <View style={styles.badgeRow}>
              <Text style={styles.categoryBadge}>{currentHairstyle.category}</Text>
                          </View>
            <Text style={styles.hairName}>{currentHairstyle.name}</Text>
            <Text style={styles.hairCategory}>Gợi ý: {currentHairstyle.suitableFace || 'Phù hợp nhiều dáng mặt'}</Text>
          </View>
        </View>

        {/* AI Model Generation Bar */}
        <View style={styles.aiActionBar}>
          {aiResultImageUrl ? (
            <View style={styles.modeToggleContainer}>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'canvas' && styles.modeTabActive]}
                onPress={() => setMode('canvas')}
                activeOpacity={0.8}
              >
                <AppIcon name="scissors" size={14} color={mode === 'canvas' ? '#FFFFFF' : '#6F6255'} />
                <Text style={[styles.modeTabText, mode === 'canvas' && styles.modeTabTextActive]}>
                  Ghép thủ công
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTab, mode === 'aiResult' && styles.modeTabActive]}
                onPress={() => setMode('aiResult')}
                activeOpacity={0.8}
              >
                <AppIcon name="sparkle" size={14} color={mode === 'aiResult' ? '#FFFFFF' : '#6F6255'} />
                <Text style={[styles.modeTabText, mode === 'aiResult' && styles.modeTabTextActive]}>
                  Kết quả AI Model
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.generateAiBtn}
              onPress={handleGenerateAi}
              disabled={isAiGenerating}
              activeOpacity={0.85}
            >
              {isAiGenerating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <AppIcon name="sparkle" size={16} color="#FFFFFF" />
              )}
              <Text style={styles.generateAiBtnText}>
                {isAiGenerating ? 'Model AI đang biến đổi tóc...' : 'Tạo ảnh thực tế bằng Model AI mới'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* INTERACTIVE CANVAS OVERLAY OR AI RESULT PREVIEW */}
        {mode === 'aiResult' && aiResultImageUrl ? (
          <View style={styles.aiResultPreviewContainer}>
            <Image
              source={{ uri: aiResultImageUrl }}
              style={styles.aiResultImage}
              resizeMode="contain"
            />
            <View style={styles.aiResultOverlayBadge}>
              <AppIcon name="sparkle" size={14} color="#FFD700" />
              <Text style={styles.aiResultOverlayText}>AI Model Generated</Text>
            </View>
            <TouchableOpacity
              style={styles.reGenerateSmallBtn}
              onPress={handleGenerateAi}
              disabled={isAiGenerating}
              activeOpacity={0.8}
            >
              <AppIcon name="refresh" size={14} color="#B8895A" />
              <Text style={styles.reGenerateSmallText}>Tạo lại AI</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <HairCanvasOverlay
            userPhotoUri={userPhotoUri}
            hairstyle={currentHairstyle}
            scale={scale}
            rotation={rotation}
            offsetX={offsetX}
            offsetY={offsetY}
            isFlipped={isFlipped}
            hairColor={hairColor}
            opacity={opacity}
            photoScale={photoScale}
            photoRotation={photoRotation}
            photoOffsetX={photoOffsetX}
            photoOffsetY={photoOffsetY}
            onScaleChange={setScale}
            onRotationChange={setRotation}
            onOffsetXChange={setOffsetX}
            onOffsetYChange={setOffsetY}
            onPhotoScaleChange={setPhotoScale}
            onPhotoRotationChange={setPhotoRotation}
            onPhotoOffsetXChange={setPhotoOffsetX}
            onPhotoOffsetYChange={setPhotoOffsetY}
            onToggleFlip={() => setIsFlipped(!isFlipped)}
            onHairColorChange={setHairColor}
            onOpacityChange={setOpacity}
          />
        )}


        {/* QUICK HAIRSTYLE SWITCHER CAROUSEL */}
        <View style={styles.quickSelectorSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <AppIcon name="sparkle" size={16} color="#B8895A" />
              <Text style={styles.sectionTitle}>Chọn mẫu tóc thử nhanh</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('HairstyleSelect', { userPhotoUri })}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Xem thêm tất cả mẫu tóc"
            >
              <View style={styles.seeAllRow}>
                <Text style={styles.seeAllText}>Xem thêm</Text>
                <AppIcon name="arrowRight" size={12} color="#B8895A" />
              </View>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickHairScroll}
          >
            {catalogHairstyles.slice(0, 20).map((hs) => {
              const isSelected = currentHairstyle.id === hs.id;
              return (
                <TouchableOpacity
                  key={hs.id}
                  style={[styles.quickHairCard, isSelected && styles.quickHairCardActive]}
                  onPress={() => handleSelectHairstyle(hs)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.quickThumbContainer, isSelected && styles.quickThumbContainerActive]}>
                    <Image source={{ uri: hs.imageUrl }} style={styles.quickThumbImg} />
                    {isSelected && (
                      <View style={styles.selectedCheckBadge}>
                        <AppIcon name="check" size={10} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[styles.quickHairName, isSelected && styles.quickHairNameActive]}
                  >
                    {hs.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* COMPACT INFORMATIONAL NOTE */}
        <View style={styles.compactNoticeRow}>
          <AppIcon name="info" size={13} color="#8D7B68" style={styles.compactNoticeIcon} />
          <Text style={styles.compactNoticeText}>
            Kết quả thử tóc mang tính tham khảo. Hãy tư vấn thợ salon để chọn kiểu phù hợp.
          </Text>
        </View>

        {/* MAIN CONVERSION CTA BUTTON */}
        <TouchableOpacity
          style={styles.findSalonBtn}
          activeOpacity={0.85}
          onPress={handleProceedToFindSalon}
          accessibilityRole="button"
          accessibilityLabel="Đặt lịch làm kiểu tóc này"
        >
          <View style={styles.ctaContentRow}>
            <AppIcon name="scissors" size={18} color="#FFFFFF" />
            <Text style={styles.findSalonBtnText}>ĐẶT LỊCH LÀM KIỂU TÓC NÀY</Text>
            <AppIcon name="arrowRight" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFE6D8'
  },
  contentWrapper: {
    flex: 1
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
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E8D8C4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  headerTitleBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B8895A',
    letterSpacing: 0.2
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6F6255',
    fontWeight: '500',
    marginTop: 1
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 38,
    paddingHorizontal: 11,
    borderRadius: 19,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E8D8C4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B8895A'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24
  },
  hairstyleInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5D9CA',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  thumbImage: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#F7EFE4'
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 3
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B8895A',
    backgroundColor: '#F3E7D8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  hairName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#241F1A',
    marginBottom: 2
  },
  hairCategory: {
    fontSize: 11,
    color: '#6F6255'
  },
  quickSelectorSection: {
    marginTop: 18,
    marginBottom: 14
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#241F1A'
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B8895A'
  },
  quickHairScroll: {
    gap: 10,
    paddingVertical: 4
  },
  quickHairCard: {
    alignItems: 'center',
    width: 68
  },
  quickHairCardActive: {
    transform: [{ scale: 1.05 }]
  },
  quickThumbContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  quickThumbContainerActive: {
    borderColor: '#B8895A'
  },
  quickThumbImg: {
    width: '100%',
    height: '100%',
    borderRadius: 26
  },
  selectedCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#B8895A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  quickHairName: {
    marginTop: 5,
    fontSize: 11,
    color: '#6F6255',
    textAlign: 'center',
    fontWeight: '500'
  },
  quickHairNameActive: {
    color: '#B8895A',
    fontWeight: '700'
  },
  compactNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5EE',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginTop: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFE5D8',
    gap: 6
  },
  compactNoticeIcon: {
    marginTop: 1
  },
  compactNoticeText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#7D6D5D',
    fontWeight: '500'
  },
  findSalonBtn: {
    backgroundColor: '#B8895A',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B8895A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6
  },
  ctaContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  findSalonBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  aiActionBar: {
    marginBottom: 12
  },
  generateAiBtn: {
    backgroundColor: '#B8895A',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#B8895A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  generateAiBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5D9CA',
    borderRadius: 12,
    padding: 3,
    gap: 4
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9
  },
  modeTabActive: {
    backgroundColor: '#B8895A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6F6255'
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  aiResultPreviewContainer: {
    width: '100%',
    height: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5D9CA',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  aiResultImage: {
    width: '100%',
    height: '100%'
  },
  aiResultOverlayBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(36, 31, 26, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700'
  },
  aiResultOverlayText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800'
  },
  reGenerateSmallBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 253, 249, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  reGenerateSmallText: {
    color: '#B8895A',
    fontSize: 11,
    fontWeight: '700'
  }
});


