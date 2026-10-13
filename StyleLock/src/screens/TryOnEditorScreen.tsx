import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import { LocalizedText as Text, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import { HairCanvasOverlay } from '../components/HairCanvasOverlay';
import { Hairstyle } from '../types';
import { AppIcon } from '../components/AppIcon';
import { MOCK_HAIRSTYLES } from '../services/mockData';
import { backendApi } from '../services/backendApi';
import { HAIR_COLORS } from '../services/hairAssetMap';
import { applyTransformToImage } from '../utils/imageTransform';

interface TryOnEditorScreenProps {
  navigation: any;
  route: any;
}

export const TryOnEditorScreen: React.FC<TryOnEditorScreenProps> = ({ navigation, route }) => {
  const { userPhotoUri, hairstyle: initialHairstyle, initialHairColor } = route.params;

  const [currentHairstyle, setCurrentHairstyle] = useState<Hairstyle>(initialHairstyle || MOCK_HAIRSTYLES[0]);
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

  const handleReset = () => {
    setScale(1.0);
    setRotation(0);
    setOffsetX(0);
    setOffsetY(0);
    setIsFlipped(false);
    setHairColor('#1E2322');
    setOpacity(1.0);
    setPhotoScale(1.0);
    setPhotoRotation(0);
    setPhotoOffsetX(0);
    setPhotoOffsetY(0);
  };

  const handleSelectHairstyle = (hs: Hairstyle) => {
    setCurrentHairstyle(hs);
    setScale(1.0);
    setRotation(0);
    setOffsetX(0);
    setOffsetY(0);
    if (aiResultImageUrl) {
      setMode('canvas');
    }
  };

  const handleGenerateAi = async () => {
    if (!userPhotoUri) return;

    setIsAiGenerating(true);
    try {
      const hairId = currentHairstyle.apiId || (Number(currentHairstyle.id.replace(/\D/g, '')) || 1);
      const highResHair = currentHairstyle.imageUrl && /^https?:\/\//.test(currentHairstyle.imageUrl)
        ? currentHairstyle.imageUrl.replace(/([?&])w=\d+/, '$1w=1024')
        : currentHairstyle.imageUrl;

      // Map mã màu HEX sang ảnh mẫu màu cho HairFastGAN (StyleGAN2 latent space)
      const matchedColor = HAIR_COLORS.find(
        (c) => c.colorHex.toLowerCase() === hairColor.toLowerCase()
      );
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
        err?.message || 'Không thể gọi dịch vụ AI lúc này. Bạn có thể tiếp tục chỉnh sửa bằng thanh công cụ thủ công.',
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Navigation Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
            <View style={styles.backRow}>
              <AppIcon name="arrowLeft" size={16} color="#B8895A" />
              <Text style={styles.backBtnText}>Đổi ảnh khác</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Thử Kiểu Tóc AI</Text>
            <Text style={styles.headerSubtitle}>Mẫu tóc trong suốt chân thực</Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('HairstyleSelect', { userPhotoUri })}
            style={styles.changeHairBtn}
            activeOpacity={0.8}
          >
            <View style={styles.changeHairRow}>
              <Text style={styles.changeHairText}>Tất cả mẫu</Text>
              <AppIcon name="scissors" size={14} color="#B8895A" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Selected Hairstyle Info Banner */}
        <View style={styles.hairstyleInfoCard}>
          <Image source={{ uri: currentHairstyle.imageUrl }} style={styles.thumbImage} />
          <View style={styles.infoTextContainer}>
            <View style={styles.badgeRow}>
              <Text style={styles.categoryBadge}>{currentHairstyle.category}</Text>
              {currentHairstyle.tag && <Text style={styles.trendBadge}>{currentHairstyle.tag}</Text>}
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
                {isAiGenerating ? 'Model AI đang biến đổi tóc...' : '✨ Tạo ảnh thực tế bằng Model AI mới'}
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
            onReset={handleReset}
          />
        )}


        {/* QUICK HAIRSTYLE SWITCHER CAROUSEL (ĐỔI MẪU TÓC NGAY DƯỚI ẢNH) */}
        <View style={styles.quickSelectorSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <AppIcon name="sparkle" size={16} color="#B8895A" />
              <Text style={styles.sectionTitle}>Chọn mẫu tóc thử nhanh</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('HairstyleSelect', { userPhotoUri })}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>Xem thêm ➔</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickHairScroll}
          >
            {MOCK_HAIRSTYLES.slice(0, 8).map((hs) => {
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

        {/* TRY-ON DISCLAIMER */}
        <View style={styles.disclaimerCard}>
          <AppIcon name="warning" size={18} color="#B8895A" style={styles.disclaimerIcon} />
          <View style={styles.disclaimerContent}>
            <Text style={styles.disclaimerTitle}>LƯU Ý TRẢI NGHIỆM THỬ TÓC:</Text>
            <Text style={styles.disclaimerBody}>
              Mẫu tóc ghép trực quan giúp bạn hình dung phong cách mới trước khi làm. Hãy tham vấn thợ salon để có kiểu tóc phù hợp nhất với chất tóc thực tế.
            </Text>
          </View>
        </View>

        {/* MAIN CONVERSION CTA BUTTON */}
        <TouchableOpacity
          style={styles.findSalonBtn}
          activeOpacity={0.85}
          onPress={handleProceedToFindSalon}
        >
          <View style={styles.ctaContentRow}>
            <AppIcon name="scissors" size={20} color="#FFFFFF" />
            <Text style={styles.findSalonBtnText}>ĐẶT LỊCH LÀM KIỂU TÓC NÀY</Text>
            <AppIcon name="arrowRight" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    marginBottom: 14
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F7EFE4'
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B8895A'
  },
  headerTitleBox: {
    alignItems: 'center'
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
    fontWeight: '500'
  },
  changeHairBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F7EFE4'
  },
  changeHairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  changeHairText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B8895A'
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
  trendBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B65A4B',
    backgroundColor: '#FBE7E1',
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
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: '#F7EFE4',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDCBB5',
    alignItems: 'flex-start'
  },
  disclaimerIcon: {
    marginRight: 8,
    marginTop: 2
  },
  disclaimerContent: {
    flex: 1
  },
  disclaimerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B8895A',
    marginBottom: 2
  },
  disclaimerBody: {
    fontSize: 11,
    lineHeight: 16,
    color: '#6F6255'
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


