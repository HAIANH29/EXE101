import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  PanResponder,
  Modal
} from 'react-native';
import { LocalizedText as Text, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { Hairstyle } from '../types';
import { AppIcon } from '../components/AppIcon';
import { BottomNavBar } from '../components/BottomNavBar';
import { NotificationBellButton } from '../components/NotificationBellButton';
import { resolveHairOverlaySource } from '../services/hairAssetMap';
import { backendApi } from '../services/backendApi';
import { applyTransformToImage } from '../utils/imageTransform';
import { describeTryOnError } from '../utils/tryOnError';
import { FALLBACK_30_HAIRSTYLES } from '../components/explore/ExploreTypes';

interface CameraUploadScreenProps {
  navigation: any;
  route?: any;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PHOTO_CANVAS_WIDTH = Math.min(SCREEN_WIDTH - 32, 360);
const PHOTO_CANVAS_HEIGHT = Math.min(Math.round(PHOTO_CANVAS_WIDTH * 1.18), Math.round(SCREEN_HEIGHT * 0.44));

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600';

const MAX_FILTER_STYLES = 15;

// Placeholder khi catalog chưa tải xong; không có apiId nên không thể gửi lên AI.
const LOADING_HAIRSTYLE: Hairstyle = {
  id: 'loading',
  name: 'Đang tải kiểu tóc...',
  category: '',
  gender: 'unisex',
  imageUrl: '',
  description: '',
  suitableFace: ''
};

const HAIR_COLOR_PALETTE = [
  { id: 'natural', name: 'Đen Tự Nhiên', hex: '#1C1917', sampleImg: null },
  { id: 'chestnut', name: 'Nâu Hạt Dẻ', hex: '#633B2B', sampleImg: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1024' },
  { id: 'ash_brown', name: 'Nâu Khói', hex: '#7D6A5F', sampleImg: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1024' },
  { id: 'platinum', name: 'Bạch Kim', hex: '#D6D3D1', sampleImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1024' },
  { id: 'burgundy', name: 'Đỏ Rượu', hex: '#581C87', sampleImg: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1024' }
] as const;

// HairFastGAN cần ảnh mẫu đủ nét để encode vào latent space -> nâng độ phân giải ảnh Unsplash.
const toHighResReference = (url?: string) =>
  url && /^https?:\/\//.test(url) ? url.replace(/([?&])w=\d+/, '$1w=1024') : undefined;

// Backend giới hạn 5MB/ảnh -> quality 0.7 đủ nét cho model mà vẫn nhẹ.
const CAPTURE_QUALITY = 0.7;

export const CameraUploadScreen: React.FC<CameraUploadScreenProps> = ({ navigation, route }) => {
  const preselectedHair: Hairstyle | undefined = route?.params?.preselectedHair;
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('front');
  const [activeFilterIdx, setActiveFilterIdx] = useState<number>(0);
  const [selectedColorIdx, setSelectedColorIdx] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // User Portrait Photo Transform States (phóng to, thu nhỏ, xoay ảnh, kéo ảnh)
  const [photoScale, setPhotoScale] = useState<number>(1.0);
  const [photoRotation, setPhotoRotation] = useState<number>(0);
  const [photoOffsetX, setPhotoOffsetX] = useState<number>(0);
  const [photoOffsetY, setPhotoOffsetY] = useState<number>(0);
  const [isPhotoFlipped, setIsPhotoFlipped] = useState<boolean>(false);
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(true);
  const [showAdjustPanel, setShowAdjustPanel] = useState<boolean>(false);

  // HairFastGAN Latent Space Try-On State
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiProgressStep, setAiProgressStep] = useState<string>('');
  const [aiResultImageUrl, setAiResultImageUrl] = useState<string | null>(null);
  const [showOriginalComparison, setShowOriginalComparison] = useState<boolean>(false);

  const resetPhotoTransform = () => {
    setPhotoScale(1.0);
    setPhotoRotation(0);
    setPhotoOffsetX(0);
    setPhotoOffsetY(0);
    setIsPhotoFlipped(false);
  };

  // Live state reference to prevent stale closure in PanResponder
  const livePhotoStateRef = useRef({
    photoScale,
    photoRotation,
    photoOffsetX,
    photoOffsetY
  });
  livePhotoStateRef.current = {
    photoScale,
    photoRotation,
    photoOffsetX,
    photoOffsetY
  };

  const photoDragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const photoPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3,
      onPanResponderGrant: () => {
        photoDragStartRef.current = {
          x: livePhotoStateRef.current.photoOffsetX,
          y: livePhotoStateRef.current.photoOffsetY
        };
      },
      onPanResponderMove: (_, gestureState) => {
        setPhotoOffsetX(Math.round(photoDragStartRef.current.x + gestureState.dx));
        setPhotoOffsetY(Math.round(photoDragStartRef.current.y + gestureState.dy));
      }
    })
  ).current;

  const handlePhotoWheel = (e: any) => {
    if (e) {
      if (typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      if (e.deltaY) {
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        const cur = livePhotoStateRef.current;
        const next = Math.max(0.5, Math.min(3.0, Number((cur.photoScale + delta).toFixed(2))));
        setPhotoScale(next);
      }
    }
  };

  // Danh sách kiểu tóc khởi tạo ngay bằng FALLBACK_30_HAIRSTYLES để không bị treo 'Đang tải...'
  const [catalogHairstyles, setCatalogHairstyles] = useState<Hairstyle[]>(FALLBACK_30_HAIRSTYLES);
  const [catalogError, setCatalogError] = useState<string | undefined>();

  useEffect(() => {
    let isMounted = true;
    backendApi
      .getHairstyles()
      .then((items) => {
        if (isMounted && items && items.length > 0) setCatalogHairstyles(items);
      })
      .catch((error) => {
        if (isMounted) {
          setCatalogHairstyles(FALLBACK_30_HAIRSTYLES);
          setCatalogError(error instanceof Error ? error.message : undefined);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filterHairstyles = catalogHairstyles.slice(0, MAX_FILTER_STYLES).map((hairstyle) => ({
    id: hairstyle.id,
    label: hairstyle.name,
    apiId: hairstyle.apiId,
    hairstyle
  }));

  const activeHairstyle: Hairstyle =
    preselectedHair ||
    filterHairstyles[activeFilterIdx]?.hairstyle ||
    catalogHairstyles[0] ||
    LOADING_HAIRSTYLE;
  const activeColor = HAIR_COLOR_PALETTE[selectedColorIdx];

  const handleOpenTryOn = (photoUri?: string, hair?: Hairstyle) => {
    const rawPhoto = photoUri || selectedPhoto;
    if (!rawPhoto) return;
    const targetHair = hair || activeHairstyle;

    navigation.navigate('TryOnEditor', {
      userPhotoUri: rawPhoto,
      hairstyle: targetHair,
      initialHairColor: activeColor.hex
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
        quality: CAPTURE_QUALITY
      });

      if (!result.canceled && result.assets[0]?.uri) {
        handleOpenTryOn(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Pick image error', e);
    }
  };

  const handleTakePhoto = () => {
    setCameraFacing((current) => (current === 'front' ? 'back' : 'front'));
  };

  const handleCapture = async () => {
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
        quality: CAPTURE_QUALITY,
        skipProcessing: false
      });

      if (photo?.uri) {
        handleOpenTryOn(photo.uri);
      }
    } catch (e) {
      console.log('Camera capture error', e);
      Alert.alert('Không chụp được ảnh', 'Thiết bị hoặc trình duyệt chưa cho phép mở camera.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Real HairFastGAN Pipeline: StyleGAN2 Latent Blending
  const handleGenerateAiTryOn = async () => {
    if (!selectedPhoto) return;

    const targetHair = activeHairstyle;
    const hairstyleId = targetHair.apiId;
    if (!hairstyleId) {
      Alert.alert('Chưa có kiểu tóc', catalogError || 'Danh sách kiểu tóc đang tải, vui lòng thử lại sau giây lát.');
      return;
    }

    setIsAiGenerating(true);
    setAiProgressStep('1/5: Mã hóa khuôn mặt vào StyleGAN2 Latent Space...');

    const stepTimer1 = setTimeout(() => {
      setAiProgressStep('2/5: Tách Shape Latent (Mẫu tóc) & Color Latent (Màu sắc)...');
    }, 1600);

    const stepTimer2 = setTimeout(() => {
      setAiProgressStep('3/5: Inpainting dọn sạch nền tóc cũ trên da đầu...');
    }, 3200);

    const stepTimer3 = setTimeout(() => {
      setAiProgressStep('4/5: Pose Alignment & Latent Space Blending...');
    }, 4800);

    const stepTimer4 = setTimeout(() => {
      setAiProgressStep('5/5: StyleGAN2 Generator kết xuất ảnh tóc mới siêu thực...');
    }, 6400);

    try {
      // Tự động bake ảnh đã xoay/zoom/căn chỉnh khuôn mặt để gửi cho Model AI
      const alignedPhoto = await applyTransformToImage(selectedPhoto, {
        scale: photoScale,
        rotation: photoRotation,
        offsetX: photoOffsetX,
        offsetY: photoOffsetY,
        isFlipped: isPhotoFlipped,
        outputSize: 1024
      });

      const response = await backendApi.generateTryOn({
        imageUri: alignedPhoto,
        hairstyleId: hairstyleId,
        // Shape latent: lấy từ ảnh của kiểu tóc đang chọn
        hairImageUrl: toHighResReference(targetHair.imageUrl),
        // Color latent: ảnh mẫu màu (null = giữ màu theo ảnh mẫu tóc)
        colorImageUrl: activeColor.sampleImg ?? undefined
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);

      if (response && response.resultImageUrl) {
        setAiResultImageUrl(response.resultImageUrl);
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
        describeTryOnError(error),
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
        <View
          style={styles.cameraFeed}
          {...photoPanResponder.panHandlers}
          // @ts-ignore Web wheel zoom
          onWheel={handlePhotoWheel}
        >
          {/* Base photo with smooth transform container */}
          <View style={styles.photoViewport}>
            <View
              style={[
                styles.photoTransformBox,
                {
                  transform: [
                    { translateX: photoOffsetX },
                    { translateY: photoOffsetY },
                    { scale: photoScale },
                    { scaleX: isPhotoFlipped ? -1 : 1 },
                    { rotate: `${photoRotation}deg` }
                  ]
                }
              ]}
            >
              <Image
                source={{ uri: currentDisplayImageUri || selectedPhoto }}
                style={styles.photoContentImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Semi-transparent Face Guide Mask Overlay */}
          {showFaceGuide && !aiResultImageUrl && (
            <View style={styles.cameraFaceGuideOverlay} pointerEvents="none">
              <View style={styles.cameraFaceGuideOval} />
              <View style={styles.cameraFaceGuideCenterLine} />
              <View style={styles.cameraFaceGuideEyeLine} />
            </View>
          )}

          {/* Floating Quick Action Toolbar directly on the Photo */}
          {!aiResultImageUrl && (
            <View style={styles.floatingAdjustToolbar}>
              <TouchableOpacity
                style={[styles.floatingActionBtn, styles.floatingRotateBtn]}
                onPress={() => setPhotoRotation((r) => (r + 90) % 360)}
                activeOpacity={0.8}
              >
                <AppIcon name="refresh" size={13} color="#FFFFFF" />
                <Text style={styles.floatingActionBtnLabel}>90°</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.floatingActionBtn}
                onPress={() => setPhotoScale((s) => Math.max(0.5, Number((s - 0.15).toFixed(2))))}
                activeOpacity={0.8}
              >
                <AppIcon name="zoomOut" size={13} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.floatingActionBtn}
                onPress={() => setPhotoScale((s) => Math.min(3.0, Number((s + 0.15).toFixed(2))))}
                activeOpacity={0.8}
              >
                <AppIcon name="zoomIn" size={13} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.floatingActionBtn, isPhotoFlipped && styles.floatingActionBtnActive]}
                onPress={() => setIsPhotoFlipped((f) => !f)}
                activeOpacity={0.8}
              >
                <AppIcon name="rotateLeft" size={13} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.floatingActionBtn, showFaceGuide && styles.floatingActionBtnActive]}
                onPress={() => setShowFaceGuide((g) => !g)}
                activeOpacity={0.8}
              >
                <AppIcon name="user" size={13} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.floatingActionBtn, styles.floatingResetBtn]}
                onPress={resetPhotoTransform}
                activeOpacity={0.8}
              >
                <Text style={styles.floatingResetBtnText}>Căn giữa</Text>
              </TouchableOpacity>
            </View>
          )}

          {aiResultImageUrl && (
            <View style={styles.aiBadgeFloatContainer}>
              <TouchableOpacity
                style={styles.toggleCompareBtn}
                onPress={() => setShowOriginalComparison(!showOriginalComparison)}
                activeOpacity={0.8}
              >
                <AppIcon name={showOriginalComparison ? 'sparkle' : 'camera'} size={14} color="#B8895A" />
                <Text style={styles.toggleCompareText}>
                  {showOriginalComparison ? 'Xem ảnh AI' : 'Xem ảnh gốc'}
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
        </View>
      );
    }

    if (!cameraPermission) {
      return (
        <View style={styles.permissionSurface}>
          <ActivityIndicator size="large" color="#B8895A" />
          <Text style={styles.permissionTitle}>Đang kiểm tra camera...</Text>
        </View>
      );
    }

    if (!cameraPermission.granted) {
      return (
        <View style={styles.permissionSurface}>
          <View style={styles.permissionIconCircle}>
            <AppIcon name="camera" size={38} color="#B8895A" />
          </View>
          <Text style={styles.permissionTitle}>StyleLock cần quyền camera</Text>
          <Text style={styles.permissionBody}>
            Cho phép camera để xem preview trực tiếp và chụp ảnh khuôn mặt.
          </Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={requestCameraPermission}
            activeOpacity={0.8}
          >
            <AppIcon name="camera" size={18} color="#FFFFFF" />
            <Text style={styles.permissionBtnText}>Cho phép Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.permissionGalleryBtn}
            onPress={handlePickFromGallery}
            activeOpacity={0.8}
          >
            <AppIcon name="upload" size={16} color="#B8895A" />
            <Text style={styles.permissionGalleryBtnText}>Tải ảnh từ thư viện</Text>
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

  // NẾU ĐÃ CÓ ẢNH (CHỤP HOẶC TẢI LÊN) -> CHUYỂN NGAY SANG TRYONEDITOR ĐỂ ĐỒNG BỘ 100% GIAO DIỆN VỚI CHỌN TÓC
  if (selectedPhoto) {
    handleOpenTryOn(selectedPhoto);
    return null;
  }

  // KHI CHƯA CÓ ẢNH -> GIAO DIỆN LIVE CAMERA TOÀN MÀN HÌNH
  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
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

        {cameraPermission?.granted && (
          <>
            {/* Vignette Gradient Overlay */}
            <View style={styles.vignetteTop} pointerEvents="none" />
            <View style={styles.vignetteBottom} pointerEvents="none" />

            {/* Face Tracking Mesh Overlay */}
            <View style={styles.faceMeshOverlay} pointerEvents="none">
              <View style={styles.ganGuideBanner}>
                <Text style={styles.ganGuideBannerText}>
                  💡 Đặt mặt thẳng, cắt khung gần để AI căn chỉnh chuẩn nhất
                </Text>
              </View>
              <View style={styles.faceMeshOval}>
                <View style={styles.meshLine1} />
                <View style={styles.meshLine2} />
                <View style={styles.faceAlignmentCrosshair} />
              </View>
            </View>

            {/* Top Controls Overlay */}
            <View style={styles.topControlsOverlay}>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>LIVE FACE CAMERA</Text>
              </View>

              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.quickActionBtn} onPress={handleTakePhoto}>
                  <AppIcon name="refresh" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.quickActionBtn} onPress={handlePickFromGallery}>
                  <AppIcon name="upload" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Camera Capture UI */}
            <View style={styles.bottomCameraCaptureArea}>
              {/* Live Camera Hairstyle Picker Carousel */}
              <View style={styles.liveHairSelectorContainer}>
                <View style={styles.liveHairSelectorHeader}>
                  <View style={styles.liveHairSelectedPill}>
                    <Image
                      source={{ uri: activeHairstyle.imageUrl || FALLBACK_IMAGE }}
                      style={styles.liveHairSelectedThumb}
                    />
                    <View style={{ flex: 1, paddingRight: 4 }}>
                      <Text style={styles.liveHairSelectedTag}>MẪU TÓC THỬ NGHIỆM</Text>
                      <Text style={styles.liveHairSelectedText} numberOfLines={1}>
                        {activeHairstyle.name}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.liveHairSeeAllBtn}
                    onPress={() => navigation.navigate('HairstyleSelect')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.liveHairSeeAllText}>Tất cả mẫu</Text>
                    <AppIcon name="arrowRight" size={11} color="#B8895A" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.liveHairScrollContent}
                >
                  {filterHairstyles.map((item, idx) => {
                    const isCurrent =
                      (!preselectedHair && activeFilterIdx === idx) ||
                      activeHairstyle.id === item.id;
                    const imgUri = item.hairstyle.imageUrl || FALLBACK_IMAGE;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.liveHairChip, isCurrent && styles.liveHairChipActive]}
                        onPress={() => setActiveFilterIdx(idx)}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: imgUri }} style={styles.liveHairChipImg} />
                        <Text
                          style={[styles.liveHairChipText, isCurrent && styles.liveHairChipTextActive]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

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
            </View>
          </>
        )}
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
  previewContainer: {
    flex: 1,
    backgroundColor: '#FAF6F0'
  },
  previewTopBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE3D3',
    zIndex: 30
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2C2219'
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF6F0'
  },
  previewScrollView: {
    flex: 1,
    backgroundColor: '#FAF6F0'
  },
  previewScrollContent: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  studioCanvasWrapper: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    marginBottom: 16
  },
  studioCanvas: {
    width: PHOTO_CANVAS_WIDTH,
    height: PHOTO_CANVAS_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1E1A17',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#B8895A',
    shadowColor: '#B8895A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4
  },
  compactCaptionPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(28, 22, 17, 0.88)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(184, 137, 90, 0.4)',
    zIndex: 10,
    maxWidth: '65%'
  },
  captionColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  compactCaptionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  adjustTriggerBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(28, 22, 17, 0.92)',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B8895A',
    zIndex: 15,
    elevation: 4
  },
  adjustTriggerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  aiBadgeFloatContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 15
  },
  toggleCompareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 253, 249, 0.95)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE3D3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  selectorSectionBlock: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 16
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C2219'
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B8895A'
  },
  filterCarouselContent: {
    gap: 10,
    paddingHorizontal: 2,
    paddingVertical: 4
  },
  hairCard: {
    width: 76,
    height: 96,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFE3D3',
    position: 'relative'
  },
  hairCardActive: {
    borderColor: '#B8895A',
    borderWidth: 2,
    backgroundColor: '#FFF8F0',
    shadowColor: '#B8895A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3
  },
  hairCardImage: {
    width: '100%',
    height: 68,
    backgroundColor: '#F5ECE1'
  },
  hairCardLabelBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    backgroundColor: '#FFFFFF'
  },
  hairCardLabelBoxActive: {
    backgroundColor: '#FFF8F0'
  },
  hairCardLabelText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#8D7B68',
    textAlign: 'center'
  },
  hairCardLabelTextActive: {
    color: '#B8895A',
    fontWeight: '700'
  },
  colorPaletteScroll: {
    paddingVertical: 4,
    gap: 14,
    paddingHorizontal: 4
  },
  colorSwatchItem: {
    alignItems: 'center',
    gap: 6
  },
  colorCircleOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  colorCircleOuterActive: {
    borderColor: '#B8895A'
  },
  colorCircleInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)'
  },
  colorSwatchLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8D7B68'
  },
  colorSwatchLabelActive: {
    color: '#2C2219',
    fontWeight: '700'
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: '#EFE3D3',
    zIndex: 40
  },
  primaryCtaBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#B8895A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#B8895A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  primaryCtaBtnDisabled: {
    opacity: 0.7
  },
  primaryCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  resultCtaGroup: {
    gap: 8
  },
  secondaryCtaBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FAF6F0',
    borderWidth: 1,
    borderColor: '#EFE3D3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  secondaryCtaBtnText: {
    color: '#B8895A',
    fontSize: 14,
    fontWeight: '700'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end'
  },
  adjustPanelSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: '#EFE3D3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10
  },
  panelHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0D2C1',
    alignSelf: 'center',
    marginBottom: 14
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C2219'
  },
  panelMetricsText: {
    fontSize: 12,
    color: '#8D7B68',
    marginTop: 2
  },
  panelMetricVal: {
    fontWeight: '700',
    color: '#B8895A'
  },
  panelCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF6F0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  panelToolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 20
  },
  panelToolItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#FAF6F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE3D3'
  },
  panelToolIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#EFE3D3'
  },
  panelToolIconBoxActive: {
    backgroundColor: '#B8895A',
    borderColor: '#B8895A'
  },
  panelToolLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38271C',
    textAlign: 'center'
  },
  panelDoneBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#B8895A',
    justifyContent: 'center',
    alignItems: 'center'
  },
  panelDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  bottomCameraCaptureArea: {
    position: 'absolute',
    bottom: 75,
    left: 0,
    right: 0,
    zIndex: 20
  },
  liveHairSelectorContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center'
  },
  liveHairSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'rgba(28, 22, 17, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(184, 137, 90, 0.45)',
    marginBottom: 8
  },
  liveHairSelectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  liveHairSelectedThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3E342B'
  },
  liveHairSelectedTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.5
  },
  liveHairSelectedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  liveHairSeeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(184, 137, 90, 0.25)'
  },
  liveHairSeeAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E8D2BA'
  },
  liveHairScrollContent: {
    gap: 8,
    paddingHorizontal: 4
  },
  liveHairChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(36, 31, 26, 0.88)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)'
  },
  liveHairChipActive: {
    backgroundColor: '#B8895A',
    borderColor: '#E8D2BA'
  },
  liveHairChipImg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4B3E32'
  },
  liveHairChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)'
  },
  liveHairChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
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
    backgroundColor: '#241F1A',
    zIndex: 20
  },
  permissionIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(184, 137, 90, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(184, 137, 90, 0.35)'
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
    marginBottom: 20
  },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#B8895A',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: '#B8895A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  permissionGalleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  permissionGalleryBtnText: {
    color: '#D8B98E',
    fontSize: 14,
    fontWeight: '600'
  },
  selectedHairCanvasBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20, 18, 16, 0.92)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    paddingRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#B8895A',
    zIndex: 15,
    elevation: 5
  },
  selectedHairBadgeThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#352C23'
  },
  selectedHairBadgeTextBox: {
    maxWidth: 150
  },
  selectedHairBadgeSubtitle: {
    color: '#B8895A',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  selectedHairBadgeTitle: {
    color: '#FFFFFF',
    fontSize: 11,
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
  hairOverlayWrapper: {
    position: 'absolute',
    top: '8%',
    left: '12%',
    width: '76%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 8,
    pointerEvents: 'none'
  },
  hairOverlayImage: {
    width: '100%',
    height: '100%'
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

  photoViewport: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0E0D'
  },
  photoTransformBox: {
    width: PHOTO_CANVAS_WIDTH,
    height: PHOTO_CANVAS_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center'
  },
  photoContentImage: {
    width: PHOTO_CANVAS_WIDTH,
    height: PHOTO_CANVAS_HEIGHT
  },
  cameraFaceGuideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none'
  },
  cameraFaceGuideOval: {
    width: '62%',
    height: '66%',
    borderRadius: 150,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(72, 209, 183, 0.75)'
  },
  cameraFaceGuideCenterLine: {
    position: 'absolute',
    top: '18%',
    bottom: '18%',
    width: 1,
    backgroundColor: 'rgba(72, 209, 183, 0.35)'
  },
  cameraFaceGuideEyeLine: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    top: '46%',
    height: 1,
    backgroundColor: 'rgba(72, 209, 183, 0.35)'
  },
  floatingAdjustToolbar: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 30
  },
  floatingActionBtn: {
    height: 34,
    minWidth: 34,
    paddingHorizontal: 8,
    borderRadius: 17,
    backgroundColor: 'rgba(20, 18, 16, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4
  },
  floatingActionBtnActive: {
    backgroundColor: '#B8895A',
    borderColor: '#D8B98E'
  },
  floatingRotateBtn: {
    backgroundColor: 'rgba(184, 137, 90, 0.9)',
    borderColor: '#D8B98E'
  },
  floatingActionBtnLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  floatingResetBtn: {
    backgroundColor: 'rgba(20, 18, 16, 0.85)'
  },
  floatingResetBtnText: {
    color: '#E0D2C1',
    fontSize: 11,
    fontWeight: '600'
  }
});

