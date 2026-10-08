import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ImageBackground,
  ActivityIndicator
} from 'react-native';
import { LocalizedText as Text, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { MOCK_HAIRSTYLES } from '../services/mockData';
import { Hairstyle } from '../types';
import { AppIcon } from '../components/AppIcon';
import { BottomNavBar } from '../components/BottomNavBar';
import { NotificationBellButton } from '../components/NotificationBellButton';
import { resolveHairOverlaySource } from '../services/hairAssetMap';
import { backendApi } from '../services/backendApi';

interface CameraUploadScreenProps {
  navigation: any;
  route?: any;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FILTER_STYLES = [
  { id: 'twoblock', label: 'Two Block', recommended: true, hairIndex: 1, apiId: 1 },
  { id: 'undercut', label: 'Undercut', recommended: true, hairIndex: 2, apiId: 2 },
  { id: 'sidepart', label: 'Side Part', recommended: false, hairIndex: 3, apiId: 3 },
  { id: 'bob', label: 'Bob Nữ', recommended: false, hairIndex: 7, apiId: 1 },
  { id: 'curly', label: 'Curly Xoăn', recommended: true, hairIndex: 5, apiId: 2 },
];

const HAIR_COLOR_PALETTE = [
  { id: 'natural', name: 'Đen Tự Nhiên', hex: '#1C1917', sampleImg: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300' },
  { id: 'chestnut', name: 'Nâu Hạt Dẻ', hex: '#633B2B', sampleImg: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300' },
  { id: 'ash_brown', name: 'Nâu Khói', hex: '#7D6A5F', sampleImg: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300' },
  { id: 'platinum', name: 'Bạch Kim', hex: '#D6D3D1', sampleImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300' },
  { id: 'burgundy', name: 'Đỏ Rượu', hex: '#581C87', sampleImg: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300' }
];

export const CameraUploadScreen: React.FC<CameraUploadScreenProps> = ({ navigation, route }) => {
  const preselectedHair: Hairstyle | undefined = route?.params?.preselectedHair;
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('front');
  const [activeFilterIdx, setActiveFilterIdx] = useState<number>(0);
  const [selectedColorIdx, setSelectedColorIdx] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [analysisComplete, setAnalysisComplete] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // HairFastGAN Latent Space Try-On State
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiProgressStep, setAiProgressStep] = useState<string>('');
  const [aiStepIndex, setAiStepIndex] = useState<number>(1);
  const [aiResultImageUrl, setAiResultImageUrl] = useState<string | null>(null);
  const [aiRequestId, setAiRequestId] = useState<number | null>(null);
  const [showOriginalComparison, setShowOriginalComparison] = useState<boolean>(false);

  // Map filter styles to actual hairstyles from mock data
  const filterHairstyles = FILTER_STYLES.map((f) => ({
    ...f,
    hairstyle: {
      ...(MOCK_HAIRSTYLES[f.hairIndex] || MOCK_HAIRSTYLES[0]),
      apiId: f.apiId
    }
  }));

  const activeHairstyle = preselectedHair || filterHairstyles[activeFilterIdx]?.hairstyle || MOCK_HAIRSTYLES[1];
  const activeColor = HAIR_COLOR_PALETTE[selectedColorIdx];

  const handleOpenTryOn = (hair?: Hairstyle) => {
    if (!selectedPhoto) return;
    const targetHair = hair || activeHairstyle;
    navigation.navigate('TryOnEditor', {
      userPhotoUri: aiResultImageUrl || selectedPhoto,
      hairstyle: targetHair
    });
  };

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền thư viện ảnh để chọn ảnh khuôn mặt!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.95
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setSelectedPhoto(result.assets[0].uri);
        setAiResultImageUrl(null);
        setAiRequestId(null);
        setShowOriginalComparison(false);
        simulateAnalysis();
      }
    } catch (e) {
      console.log('Pick image error', e);
    }
  };

  const handleTakePhoto = () => {
    if (selectedPhoto) {
      setSelectedPhoto(null);
      setAiResultImageUrl(null);
      setAiRequestId(null);
      setShowOriginalComparison(false);
      setAnalysisComplete(false);
      return;
    }

    setCameraFacing((current) => (current === 'front' ? 'back' : 'front'));
  };

  const simulateAnalysis = () => {
    setIsProcessing(true);
    setAnalysisComplete(false);
    setTimeout(() => {
      setIsProcessing(false);
      setAnalysisComplete(true);
    }, 1000);
  };

  const handleCapture = async () => {
    if (selectedPhoto) {
      handleOpenTryOn();
    } else {
      try {
        if (!cameraPermission?.granted) {
          const permission = await requestCameraPermission();
          if (!permission.granted) {
            Alert.alert('Quyền camera', 'Vui lòng cấp quyền Camera để chụp ảnh khuôn mặt!');
            return;
          }
        }

        if (!cameraRef.current) {
          Alert.alert('Camera chưa sẵn sàng', 'Vui lòng đợi camera mở xong rồi thử lại.');
          return;
        }

        setIsCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.95,
          skipProcessing: false
        });

        if (photo?.uri) {
          setSelectedPhoto(photo.uri);
          setAiResultImageUrl(null);
          setAiRequestId(null);
          setShowOriginalComparison(false);
          simulateAnalysis();
        }
      } catch (e) {
        console.log('Camera capture error', e);
        Alert.alert('Không chụp được ảnh', 'Thiết bị hoặc trình duyệt chưa cho phép mở camera.');
      } finally {
        setIsCapturing(false);
      }
    }
  };

  // Real HairFastGAN Pipeline: StyleGAN2 Latent Blending
  const handleGenerateAiTryOn = async () => {
    if (!selectedPhoto) return;

    const targetHair = activeHairstyle;
    const hairstyleId = targetHair.apiId || (filterHairstyles[activeFilterIdx]?.apiId ?? 1);

    setIsAiGenerating(true);
    setAiStepIndex(1);
    setAiProgressStep('1/5: Mã hóa khuôn mặt vào StyleGAN2 Latent Space...');

    const stepTimer1 = setTimeout(() => {
      setAiStepIndex(2);
      setAiProgressStep('2/5: Tách Shape Latent (Mẫu tóc) & Color Latent (Màu sắc)...');
    }, 1600);

    const stepTimer2 = setTimeout(() => {
      setAiStepIndex(3);
      setAiProgressStep('3/5: Inpainting dọn sạch nền tóc cũ trên da đầu...');
    }, 3200);

    const stepTimer3 = setTimeout(() => {
      setAiStepIndex(4);
      setAiProgressStep('4/5: Pose Alignment & Latent Space Blending...');
    }, 4800);

    const stepTimer4 = setTimeout(() => {
      setAiStepIndex(5);
      setAiProgressStep('5/5: StyleGAN2 Generator kết xuất ảnh tóc mới siêu thực...');
    }, 6400);

    try {
      const response = await backendApi.generateTryOn({
        imageUri: selectedPhoto,
        hairstyleId: hairstyleId
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);

      if (response && response.resultImageUrl) {
        setAiResultImageUrl(response.resultImageUrl);
        setAiRequestId(response.requestId);
        setShowOriginalComparison(false);
        Alert.alert(
          '✨ Hoàn tất HairFastGAN',
          `Đã tái tạo kiểu tóc "${targetHair.name}" - ${activeColor.name} bằng mạng GAN StyleGAN2!`
        );
      } else {
        throw new Error('Không nhận được ảnh kết quả từ HairFastGAN');
      }
    } catch (error: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);
      console.log('HairFastGAN Error:', error);

      Alert.alert(
        'Thử tóc với HairFastGAN',
        error?.message || 'Không thể kết nối dịch vụ AI Model lúc này. Bạn có thể thử ghép tóc thủ công ngay.',
        [
          { text: 'Thử thủ công', onPress: () => handleOpenTryOn() },
          { text: 'Đóng', style: 'cancel' }
        ]
      );
    } finally {
      setIsAiGenerating(false);
      setAiProgressStep('');
    }
  };


  const handleBookThisHairstyle = () => {
    const hairToUse = activeHairstyle;
    navigation.navigate('SalonList', {
      selectedHairstyle: hairToUse,
      userPhotoUri: aiResultImageUrl || selectedPhoto
    });
  };

  const currentDisplayImageUri =
    aiResultImageUrl && !showOriginalComparison ? aiResultImageUrl : selectedPhoto;

  const renderCameraSurface = () => {
    if (selectedPhoto) {
      return (
        <View style={styles.cameraFeed}>
          <ImageBackground
            source={{ uri: currentDisplayImageUri || selectedPhoto }}
            style={styles.cameraFeed}
            resizeMode="cover"
          >
            {aiResultImageUrl && (
              <View style={styles.aiBadgeTopContainer}>
                <View style={styles.aiResultPill}>
                  <AppIcon name="sparkle" size={14} color="#FFD700" />
                  <Text style={styles.aiResultPillText}>AI MODEL MỚI ĐÃ TẠO</Text>
                </View>
                <TouchableOpacity
                  style={styles.toggleCompareBtn}
                  onPress={() => setShowOriginalComparison(!showOriginalComparison)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.toggleCompareText}>
                    {showOriginalComparison ? '👁️ Xem kết quả AI' : '📷 Xem ảnh gốc'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!aiResultImageUrl && (
              <View style={styles.tapToTryContainer}>
                <TouchableOpacity
                  style={styles.tapToTryPill}
                  onPress={handleGenerateAiTryOn}
                  activeOpacity={0.85}
                >
                  <AppIcon name="sparkle" size={16} color="#FFFFFF" />
                  <Text style={styles.tapToTryText}>Bấm để tạo tóc bằng Model AI mới</Text>
                  <AppIcon name="arrowRight" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </ImageBackground>
        </View>
      );
    }

    if (!cameraPermission) {
      return (
        <View style={styles.permissionSurface}>
          <Text style={styles.permissionTitle}>Đang kiểm tra camera...</Text>
        </View>
      );
    }

    if (!cameraPermission.granted) {
      return (
        <View style={styles.permissionSurface}>
          <Text style={styles.permissionTitle}>StyleLock cần quyền camera</Text>
          <Text style={styles.permissionBody}>Cho phép camera để xem preview trực tiếp và chụp ảnh khuôn mặt.</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestCameraPermission}>
            <Text style={styles.permissionBtnText}>Cho phép Camera</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <CameraView
        ref={cameraRef}
        style={styles.cameraFeed}
        facing={cameraFacing}
        mode="picture"
        mute={true}
        mirror={cameraFacing === 'front'}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          style={styles.topBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }}
        >
          <AppIcon name="menu" size={22} color="#B8895A" />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>StyleLock AI</Text>

        <View style={styles.headerRightActions}>
          <NotificationBellButton navigation={navigation} style={styles.headerIconBtn} />
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <AppIcon name="user" size={20} color="#B8895A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Full-Screen Camera Canvas */}
      <View style={styles.cameraCanvas}>
        {renderCameraSurface()}
        
        {/* Vignette Gradient Overlay */}
        <View style={styles.vignetteTop} />
        <View style={styles.vignetteBottom} />

        {/* Face Tracking Mesh Overlay (Dashed Oval with StyleGAN2 Alignment Guides) */}
        {!selectedPhoto && (
          <View style={styles.faceMeshOverlay}>
            <View style={styles.ganGuideBanner}>
              <Text style={styles.ganGuideBannerText}>
                💡 Đặt mặt thẳng, cắt khung gần để StyleGAN2 căn chỉnh chuẩn nhất
              </Text>
            </View>
            <View style={styles.faceMeshOval}>
              <View style={styles.meshLine1} />
              <View style={styles.meshLine2} />
              <View style={styles.faceAlignmentCrosshair} />
            </View>
          </View>
        )}

        {/* Top Controls Overlay */}
        <View style={styles.topControlsOverlay}>
          {/* Status Badge */}
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, aiResultImageUrl && { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.statusText}>
              {aiResultImageUrl ? 'HAIRFASTGAN RESULT' : 'LIVE FACE TRACKING'}
            </Text>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={handleTakePhoto}>
              <AppIcon name="refresh" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionBtn} onPress={handlePickFromGallery}>
              <AppIcon name="upload" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Analysis Results Overlay */}
        <View style={styles.analysisOverlay}>
          <View style={styles.analysisCard}>
            <View style={styles.analysisLabelRow}>
              <AppIcon name="user" size={14} color="#B8895A" />
              <Text style={styles.analysisLabelText}>DÁNG MẶT PHÂN TÍCH</Text>
            </View>
            <Text style={styles.analysisValue}>Oval</Text>
          </View>

          <View style={styles.analysisCard}>
            <View style={styles.analysisLabelRow}>
              <AppIcon name="barChart" size={14} color="#B8895A" />
              <Text style={styles.analysisLabelText}>LATENT CONFIDENCE</Text>
            </View>
            <View style={styles.confidenceRow}>
              <Text style={styles.confidenceValue}>98%</Text>
              <View style={styles.confidenceBarBg}>
                <View style={styles.confidenceBarFill} />
              </View>
            </View>
          </View>
        </View>

        {/* HairFastGAN Multi-Step Pipeline Loading Overlay */}
        {isAiGenerating && (
          <View style={styles.aiLoadingOverlay}>
            <View style={styles.aiLoadingCard}>
              <ActivityIndicator size="large" color="#B8895A" />
              <Text style={styles.aiLoadingTitle}>HairFastGAN Pipeline Đang Xử Lý</Text>
              <Text style={styles.aiLoadingSubtitle}>{aiProgressStep}</Text>

              {/* 5-Step Visualizer */}
              <View style={styles.pipelineStepsBox}>
                {[
                  { step: 1, title: 'Latent Encode' },
                  { step: 2, title: 'Shape & Color' },
                  { step: 3, title: 'Inpainting' },
                  { step: 4, title: 'Pose Align' },
                  { step: 5, title: 'StyleGAN2 Gen' }
                ].map((s) => {
                  const isPastOrActive = s.step <= aiStepIndex;
                  const isCurrent = s.step === aiStepIndex;
                  return (
                    <View key={s.step} style={styles.pipelineStepItem}>
                      <View
                        style={[
                          styles.stepIndicatorDot,
                          isPastOrActive && styles.stepIndicatorDotActive,
                          isCurrent && styles.stepIndicatorDotCurrent
                        ]}
                      >
                        <Text
                          style={[
                            styles.stepIndicatorNumber,
                            isPastOrActive && styles.stepIndicatorNumberActive
                          ]}
                        >
                          {s.step}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.stepLabelText,
                          isPastOrActive && styles.stepLabelTextActive
                        ]}
                      >
                        {s.title}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Bottom UI Area */}
        <View style={styles.bottomUIArea}>
          {/* Section 1: Hairstyle (Shape Latent) Carousel */}
          <View style={styles.selectorLabelRow}>
            <Text style={styles.selectorSectionTitle}>1. CHỌN DÁNG TÓC (SHAPE)</Text>
            <Text style={styles.selectedHairNameText}>{activeHairstyle.name}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterCarouselContent}
          >
            {filterHairstyles.map((item, idx) => {
              const isActive = activeFilterIdx === idx;
              const hairOverlay = resolveHairOverlaySource(item.hairstyle);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.filterThumb, isActive && styles.filterThumbActive]}
                  onPress={() => {
                    setActiveFilterIdx(idx);
                    if (aiResultImageUrl) {
                      setAiResultImageUrl(null);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.filterThumbHairBg}>
                    <Image
                      source={hairOverlay}
                      style={[styles.filterThumbImg, !isActive && styles.filterThumbImgInactive]}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Active Overlay */}
                  {isActive && <View style={styles.filterActiveOverlay} />}
                  {!isActive && <View style={styles.filterInactiveOverlay} />}

                  {/* Label */}
                  <View style={[styles.filterLabel, isActive ? styles.filterLabelActive : styles.filterLabelInactive]}>
                    <Text style={[styles.filterLabelText, isActive ? styles.filterLabelTextActive : styles.filterLabelTextInactive]}>
                      {item.label}
                    </Text>
                  </View>

                  {/* Recommended Star Badge */}
                  {item.recommended && (
                    <View style={styles.starBadge}>
                      <AppIcon name="star" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Section 2: Hair Color (Color Latent) Swatches */}
          <View style={styles.colorSelectorContainer}>
            <Text style={styles.selectorSectionTitle}>2. MÀU SẮC (COLOR LATENT):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorSwatchesScroll}>
              {HAIR_COLOR_PALETTE.map((colorItem, cIdx) => {
                const isColorActive = selectedColorIdx === cIdx;
                return (
                  <TouchableOpacity
                    key={colorItem.id}
                    style={[styles.colorChip, isColorActive && styles.colorChipActive]}
                    onPress={() => setSelectedColorIdx(cIdx)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.colorCircle, { backgroundColor: colorItem.hex }]} />
                    <Text style={[styles.colorChipText, isColorActive && styles.colorChipTextActive]}>
                      {colorItem.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Action / Capture Controls */}
          {selectedPhoto ? (
            <View style={styles.postCaptureActionsRow}>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <AppIcon name="refresh" size={16} color="#FFFFFF" />
                <Text style={styles.retakeBtnText}>Chụp lại</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryAiBtn}
                onPress={handleGenerateAiTryOn}
                activeOpacity={0.85}
                disabled={isAiGenerating}
              >
                <AppIcon name="sparkle" size={18} color="#FFFFFF" />
                <Text style={styles.primaryAiBtnText}>
                  {aiResultImageUrl ? 'Tạo lại HairFastGAN' : '✨ Sinh ảnh HairFastGAN'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.manualTryOnBtn}
                onPress={() => handleOpenTryOn()}
                activeOpacity={0.8}
              >
                <AppIcon name="scissors" size={16} color="#B8895A" />
                <Text style={styles.manualTryOnBtnText}>Chỉnh sửa</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.captureArea}>
              <View style={styles.captureLine} />
              <TouchableOpacity
                style={[styles.captureBtn, isCapturing && styles.captureBtnDisabled]}
                onPress={handleCapture}
                activeOpacity={0.85}
                disabled={isCapturing}
              >
                <View style={styles.captureRing}>
                  <View style={styles.captureInner}>
                    <AppIcon name="camera" size={28} color="#FFFFFF" />
                  </View>
                </View>
              </TouchableOpacity>
              <View style={styles.captureLine} />
            </View>
          )}


          {/* Book This Hairstyle CTA */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={styles.bookCtaBtn}
              activeOpacity={0.85}
              onPress={handleBookThisHairstyle}
            >
              <Text style={styles.bookCtaText}>
                {aiResultImageUrl ? 'Đặt lịch với kiểu tóc AI này' : 'Đặt lịch làm kiểu tóc này'}
              </Text>
              <AppIcon name="arrowRight" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <BottomNavBar active="AICamera" navigation={navigation} />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#241F1A'
  },
  topAppBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 253, 249, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: '#E5D9CA',
    zIndex: 30
  },
  topBtn: {
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
    backgroundColor: '#F7EFE4'
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#B8895A',
    letterSpacing: -0.5
  },
  cameraCanvas: {
    flex: 1,
    width: '100%',
    backgroundColor: '#241F1A'
  },
  cameraFeed: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  tapToTryContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 10
  },
  tapToTryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(107, 66, 39, 0.88)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  tapToTryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2
  },
  permissionSurface: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#241F1A'
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8
  },
  permissionBody: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16
  },
  permissionBtn: {
    backgroundColor: '#B8895A',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  vignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.2)'
  },
  vignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.55)'
  },
  faceMeshOverlay: {
    position: 'absolute',
    top: '22%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5
  },
  faceMeshOval: {
    width: 200,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16
  },
  meshLine1: {
    width: 64,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8
  },
  meshLine2: {
    width: 48,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)'
  },
  topControlsOverlay: {
    position: 'absolute',
    top: 75,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 15
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 249, 0.24)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D8B98E'
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5
  },
  quickActions: {
    gap: 12
  },
  quickActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 253, 249, 0.24)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  quickActionIcon: {
    fontSize: 18,
    color: '#FFFFFF'
  },
  analysisOverlay: {
    position: 'absolute',
    top: 130,
    left: 20,
    zIndex: 15,
    gap: 8
  },
  analysisCard: {
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(221, 203, 181, 0.45)',
    maxWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4
  },
  analysisLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2
  },
  analysisLabelIcon: {
    fontSize: 14,
    color: '#B8895A'
  },
  analysisLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6F6255',
    letterSpacing: 0.8
  },
  analysisValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#241F1A'
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  confidenceValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#B8895A'
  },
  confidenceBarBg: {
    width: 60,
    height: 8,
    backgroundColor: '#F3E7D8',
    borderRadius: 4,
    overflow: 'hidden'
  },
  confidenceBarFill: {
    width: '98%',
    height: '100%',
    backgroundColor: '#B8895A',
    borderRadius: 4
  },
  bottomUIArea: {
    position: 'absolute',
    bottom: 75,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingBottom: 16
  },
  filterCarouselContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 12,
    paddingTop: 8
  },
  filterThumb: {
    width: 76,
    height: 92,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative'
  },
  filterThumbHairBg: {
    width: '100%',
    height: '100%',
    backgroundColor: '#241F1A',
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterThumbActive: {
    borderWidth: 2,
    borderColor: '#B8895A'
  },
  filterThumbImg: {
    width: '100%',
    height: '100%',
    position: 'absolute'
  },
  filterThumbImgInactive: {
    opacity: 0.75
  },
  filterActiveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(169, 120, 69, 0.16)',
    zIndex: 1
  },
  filterInactiveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    zIndex: 1
  },
  filterLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    alignItems: 'center',
    zIndex: 2
  },
  filterLabelActive: {
    backgroundColor: 'rgba(255, 253, 249, 0.94)'
  },
  filterLabelInactive: {
    backgroundColor: 'rgba(255, 253, 249, 0.42)'
  },
  filterLabelText: {
    fontSize: 11,
    fontWeight: '700'
  },
  filterLabelTextActive: {
    color: '#241F1A'
  },
  filterLabelTextInactive: {
    color: '#FFFFFF'
  },
  starBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#B8895A',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3
  },
  starBadgeText: {
    fontSize: 8
  },
  postCaptureActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)'
  },
  retakeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600'
  },
  primaryAiBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#B8895A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    elevation: 5,
    shadowColor: '#B8895A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8
  },
  primaryAiBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  manualTryOnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F7EFE4',
    borderWidth: 1,
    borderColor: '#DDCBB5'
  },
  manualTryOnBtnText: {
    color: '#B8895A',
    fontSize: 13,
    fontWeight: '700'
  },
  aiBadgeTopContainer: {
    position: 'absolute',
    top: 130,
    right: 20,
    alignItems: 'flex-end',
    gap: 8,
    zIndex: 20
  },
  aiResultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(36, 31, 26, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700'
  },
  aiResultPillText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  toggleCompareBtn: {
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  toggleCompareText: {
    color: '#241F1A',
    fontSize: 12,
    fontWeight: '700'
  },
  aiLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 16, 12, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    paddingHorizontal: 28
  },
  aiLoadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8
  },
  aiLoadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#241F1A',
    marginTop: 14,
    marginBottom: 4,
    textAlign: 'center'
  },
  aiLoadingSubtitle: {
    fontSize: 13,
    color: '#B8895A',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14
  },
  pipelineStepsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5D9CA'
  },
  pipelineStepItem: {
    alignItems: 'center',
    flex: 1
  },
  stepIndicatorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5D9CA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  stepIndicatorDotActive: {
    backgroundColor: '#B8895A'
  },
  stepIndicatorDotCurrent: {
    backgroundColor: '#B8895A',
    borderWidth: 2,
    borderColor: '#FFD700',
    transform: [{ scale: 1.15 }]
  },
  stepIndicatorNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6F6255'
  },
  stepIndicatorNumberActive: {
    color: '#FFFFFF'
  },
  stepLabelText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#8C7E72',
    textAlign: 'center'
  },
  stepLabelTextActive: {
    color: '#241F1A',
    fontWeight: '700'
  },
  ganGuideBanner: {
    backgroundColor: 'rgba(36, 31, 26, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  ganGuideBannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center'
  },
  faceAlignmentCrosshair: {
    position: 'absolute',
    top: '45%',
    width: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)'
  },
  selectorLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 6
  },
  selectorSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DDCBB5',
    letterSpacing: 0.8
  },
  selectedHairNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700'
  },
  colorSelectorContainer: {
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 8
  },
  colorSwatchesScroll: {
    gap: 8,
    paddingVertical: 4
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 253, 249, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  colorChipActive: {
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    borderColor: '#B8895A'
  },
  colorCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)'
  },
  colorChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  colorChipTextActive: {
    color: '#241F1A',
    fontWeight: '800'
  },


  captureArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12
  },
  captureLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20
  },
  captureBtn: {
    width: 76,
    height: 76,
    justifyContent: 'center',
    alignItems: 'center'
  },
  captureBtnDisabled: {
    opacity: 0.6
  },
  captureRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#B8895A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#B8895A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  captureIcon: {
    fontSize: 28,
    color: '#FFFFFF'
  },
  ctaContainer: {
    paddingHorizontal: 20,
    marginTop: 16
  },
  bookCtaBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#B8895A',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 6,
    shadowColor: 'rgba(107, 66, 39, 0.30)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12
  },
  bookCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  bookCtaArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '400'
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(221, 203, 181, 0.55)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    zIndex: 40
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20
  },
  navItemActive: {
    backgroundColor: 'rgba(169, 120, 69, 0.16)'
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2
  },
  navIconActive: {
    transform: [{ scale: 1.1 }]
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6F6255'
  },
  navLabelActive: {
    color: '#B8895A',
    fontWeight: '700'
  }
});

