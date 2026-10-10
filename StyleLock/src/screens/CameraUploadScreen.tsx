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
  ActivityIndicator,
  PanResponder
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
import { applyTransformToImage } from '../utils/imageTransform';

interface CameraUploadScreenProps {
  navigation: any;
  route?: any;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PHOTO_CANVAS_WIDTH = Math.min(SCREEN_WIDTH - 32, 380);
const PHOTO_CANVAS_HEIGHT = Math.round(PHOTO_CANVAS_WIDTH * 1.25);

const FILTER_STYLES = [
  { id: 'twoblock', label: 'Two Block', recommended: true, hairIndex: 1, apiId: 1 },
  { id: 'undercut', label: 'Undercut', recommended: true, hairIndex: 2, apiId: 2 },
  { id: 'sidepart', label: 'Side Part', recommended: false, hairIndex: 3, apiId: 3 },
  { id: 'bob', label: 'Bob Nữ', recommended: false, hairIndex: 7, apiId: 1 },
  { id: 'curly', label: 'Curly Xoăn', recommended: true, hairIndex: 5, apiId: 2 },
];

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
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [analysisComplete, setAnalysisComplete] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // User Portrait Photo Transform States (phóng to, thu nhỏ, xoay ảnh, kéo ảnh)
  const [photoScale, setPhotoScale] = useState<number>(1.0);
  const [photoRotation, setPhotoRotation] = useState<number>(0);
  const [photoOffsetX, setPhotoOffsetX] = useState<number>(0);
  const [photoOffsetY, setPhotoOffsetY] = useState<number>(0);
  const [isPhotoFlipped, setIsPhotoFlipped] = useState<boolean>(false);
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(true);

  // HairFastGAN Latent Space Try-On State
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiProgressStep, setAiProgressStep] = useState<string>('');
  const [aiStepIndex, setAiStepIndex] = useState<number>(1);
  const [aiResultImageUrl, setAiResultImageUrl] = useState<string | null>(null);
  const [aiRequestId, setAiRequestId] = useState<number | null>(null);
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
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
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

  const handleOpenTryOn = async (hair?: Hairstyle) => {
    if (!selectedPhoto) return;
    const targetHair = hair || activeHairstyle;

    // Nếu ảnh có biến đổi (xoay, zoom, dời vị trí), bake ảnh chuẩn trước khi mở màn hình chỉnh sửa
    let photoToSend = selectedPhoto;
    if (photoScale !== 1.0 || photoRotation !== 0 || photoOffsetX !== 0 || photoOffsetY !== 0 || isPhotoFlipped) {
      photoToSend = await applyTransformToImage(selectedPhoto, {
        scale: photoScale,
        rotation: photoRotation,
        offsetX: photoOffsetX,
        offsetY: photoOffsetY,
        isFlipped: isPhotoFlipped,
        outputSize: 1024
      });
    }

    navigation.navigate('TryOnEditor', {
      userPhotoUri: aiResultImageUrl || photoToSend,
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
        setSelectedPhoto(result.assets[0].uri);
        resetPhotoTransform();
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
      resetPhotoTransform();
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
          quality: CAPTURE_QUALITY,
          skipProcessing: false
        });

        if (photo?.uri) {
          setSelectedPhoto(photo.uri);
          resetPhotoTransform();
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

  // NẾU ĐÃ CÓ ẢNH (CHỤP HOẶC TẢI LÊN) -> RENDER GIAO DIỆN STUDIO DẠNG CUỘN (SCROLLABLE STUDIO), KHÔNG BỊ ĐÈ CHỒNG
  if (selectedPhoto) {
    return (
      <SafeAreaView style={styles.previewContainer}>
        {/* Top App Bar */}
        <View style={styles.previewTopBar}>
          <TouchableOpacity
            style={styles.topBtn}
            onPress={() => {
              setSelectedPhoto(null);
              resetPhotoTransform();
              setAiResultImageUrl(null);
            }}
          >
            <AppIcon name="arrowLeft" size={20} color="#B8895A" />
          </TouchableOpacity>

          <View style={styles.previewHeaderTitleBox}>
            <Text style={styles.previewBrandTitle}>
              {aiResultImageUrl ? 'Kết Quả Thử Tóc AI' : 'Căn Chỉnh & Chọn Kiểu Tóc'}
            </Text>
            <Text style={styles.previewSubTitle}>
              {aiResultImageUrl ? `Mẫu: ${activeHairstyle.name} • ${activeColor.name}` : 'Model AI: google/nano-banana-2'}
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={handleTakePhoto}
              title="Đổi ảnh khác"
            >
              <AppIcon name="refresh" size={18} color="#B8895A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Content Body */}
        <ScrollView
          style={styles.previewScrollView}
          contentContainerStyle={styles.previewScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. KHUNG ẢNH VIEWPORT (CANVAS ĐỘC LẬP - RÕ RÀNG 100%, KHÔNG BỊ ĐÈ CHỒNG) */}
          <View style={styles.studioCanvasCard}>
            <View
              style={styles.studioCanvas}
              {...photoPanResponder.panHandlers}
              // @ts-ignore Web wheel zoom
              onWheel={handlePhotoWheel}
            >
              {/* Photo Content with transform */}
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

              {/* Face Guide Oval (chỉ hiện khi chưa sinh AI và bật guide) */}
              {showFaceGuide && !aiResultImageUrl && (
                <View style={styles.cameraFaceGuideOverlay} pointerEvents="none">
                  <View style={styles.cameraFaceGuideOval} />
                  <View style={styles.cameraFaceGuideCenterLine} />
                  <View style={styles.cameraFaceGuideEyeLine} />
                </View>
              )}

              {/* Floating Quick Action Toolbar (Nút xoay 90° & zoom) */}
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

              {/* Badge & Toggle khi có AI Result */}
              {aiResultImageUrl && (
                <View style={styles.aiBadgeTopContainer}>
                  <View style={styles.aiResultPill}>
                    <AppIcon name="sparkle" size={14} color="#FFD700" />
                    <Text style={styles.aiResultPillText}>AI MODEL ĐÃ TẠO</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.toggleCompareBtn}
                    onPress={() => setShowOriginalComparison(!showOriginalComparison)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.toggleCompareText}>
                      {showOriginalComparison ? '👁️ Xem ảnh AI' : '📷 Xem ảnh gốc'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Bottom Live Hint Banner */}
              <View style={styles.studioCanvasBottomBadge}>
                <Text style={styles.studioCanvasBottomBadgeText}>
                  {aiResultImageUrl
                    ? (showOriginalComparison ? '📷 Đang xem ảnh gốc' : `✨ ${activeHairstyle.name} • ${activeColor.name}`)
                    : '💡 Kéo thả chuột để dời mặt, lăn chuột để zoom'}
                </Text>
              </View>
            </View>
          </View>

          {/* 2. THẺ THÔNG TIN PHÂN TÍCH (GỌN GÀNG, KHÔNG ĐÈ LÊN ẢNH) */}
          <View style={styles.infoMetaCard}>
            <View style={styles.infoMetaItem}>
              <AppIcon name="user" size={15} color="#B8895A" />
              <View>
                <Text style={styles.infoMetaLabel}>DÁNG MẶT PHÂN TÍCH</Text>
                <Text style={styles.infoMetaVal}>Oval • 98% Độ tin cậy</Text>
              </View>
            </View>
            <View style={styles.infoMetaDivider} />
            <View style={styles.infoMetaItem}>
              <AppIcon name="sparkle" size={15} color="#B8895A" />
              <View>
                <Text style={styles.infoMetaLabel}>AI ENGINE</Text>
                <Text style={styles.infoMetaVal}>google/nano-banana-2</Text>
              </View>
            </View>
          </View>

          {/* 3. BỘ CĂN CHỈNH ẢNH MẶT CHI TIẾT (Nếu chưa có kết quả AI) */}
          {!aiResultImageUrl && (
            <View style={styles.photoAlignControlCard}>
              <View style={styles.photoAlignHeaderRow}>
                <View style={styles.photoAlignTitleRow}>
                  <AppIcon name="tool" size={14} color="#B8895A" />
                  <Text style={styles.photoAlignTitleText}>Căn chỉnh ảnh khuôn mặt</Text>
                </View>
                <Text style={styles.photoAlignMetricsText}>
                  Zoom: <Text style={styles.metricBold}>{Math.round(photoScale * 100)}%</Text> • Xoay: <Text style={styles.metricBold}>{photoRotation}°</Text>
                </Text>
              </View>

              <View style={styles.photoAlignButtonsRow}>
                <TouchableOpacity
                  style={[styles.alignToolBtn, styles.alignToolBtnPrimary]}
                  onPress={() => setPhotoRotation((r) => (r + 90) % 360)}
                  activeOpacity={0.8}
                >
                  <AppIcon name="refresh" size={14} color="#FFFFFF" />
                  <Text style={styles.alignToolBtnPrimaryText}>Xoay 90°</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alignToolBtn}
                  onPress={() => setPhotoRotation((r) => r - 5)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.alignToolBtnText}>-5°</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alignToolBtn}
                  onPress={() => setPhotoRotation((r) => r + 5)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.alignToolBtnText}>+5°</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alignToolBtn}
                  onPress={() => setPhotoScale((s) => Math.max(0.5, Number((s - 0.15).toFixed(2))))}
                  activeOpacity={0.8}
                >
                  <AppIcon name="zoomOut" size={14} color="#B8895A" />
                  <Text style={styles.alignToolBtnText}>-15%</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alignToolBtn}
                  onPress={() => setPhotoScale((s) => Math.min(3.0, Number((s + 0.15).toFixed(2))))}
                  activeOpacity={0.8}
                >
                  <AppIcon name="zoomIn" size={14} color="#B8895A" />
                  <Text style={styles.alignToolBtnText}>+15%</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.alignToolBtn, styles.alignResetBtn]}
                  onPress={resetPhotoTransform}
                  activeOpacity={0.8}
                >
                  <Text style={styles.alignResetBtnText}>Căn giữa</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 4. CHỌN DÁNG TÓC (SHAPE LATENT) */}
          <View style={styles.selectorSectionBlock}>
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
                    {isActive && <View style={styles.filterActiveOverlay} />}
                    {!isActive && <View style={styles.filterInactiveOverlay} />}
                    <View style={[styles.filterLabel, isActive ? styles.filterLabelActive : styles.filterLabelInactive]}>
                      <Text style={[styles.filterLabelText, isActive ? styles.filterLabelTextActive : styles.filterLabelTextInactive]}>
                        {item.label}
                      </Text>
                    </View>
                    {item.recommended && (
                      <View style={styles.starBadge}>
                        <AppIcon name="star" size={10} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 5. MÀU SẮC (COLOR LATENT) */}
          <View style={styles.colorSelectorContainer}>
            <Text style={styles.selectorSectionTitle}>2. MÀU SẮC (COLOR LATENT)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorSwatchesScroll}>
              {HAIR_COLOR_PALETTE.map((colorItem, cIdx) => {
                const isColorActive = selectedColorIdx === cIdx;
                return (
                  <TouchableOpacity
                    key={colorItem.id}
                    style={[styles.colorChip, isColorActive && styles.colorChipActive]}
                    onPress={() => {
                      setSelectedColorIdx(cIdx);
                      if (aiResultImageUrl) {
                        setAiResultImageUrl(null);
                      }
                    }}
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

          {/* 6. HÀNG NÚT HÀNH ĐỘNG */}
          <View style={styles.postCaptureActionsRow}>
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={handleTakePhoto}
              activeOpacity={0.8}
            >
              <AppIcon name="refresh" size={15} color="#5C4431" />
              <Text style={styles.retakeBtnText}>Đổi ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryAiBtn}
              onPress={handleGenerateAiTryOn}
              activeOpacity={0.85}
              disabled={isAiGenerating}
            >
              {isAiGenerating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <AppIcon name="sparkle" size={18} color="#FFFFFF" />
              )}
              <Text style={styles.primaryAiBtnText}>
                {isAiGenerating
                  ? 'Đang tạo tóc...'
                  : aiResultImageUrl
                  ? 'Tạo lại với AI'
                  : 'Tạo ảnh AI Model'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manualTryOnBtn}
              onPress={() => handleOpenTryOn()}
              activeOpacity={0.8}
            >
              <AppIcon name="scissors" size={15} color="#B8895A" />
              <Text style={styles.manualTryOnBtnText}>Chỉnh tay</Text>
            </TouchableOpacity>
          </View>

          {/* 7. NÚT ĐẶT LỊCH SALON */}
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

          {/* Đệm đáy để BottomNavBar không che */}
          <View style={{ height: 95 }} />
        </ScrollView>

        {/* Loading Overlay nếu đang sinh AI */}
        {isAiGenerating && (
          <View style={styles.aiLoadingOverlay}>
            <View style={styles.aiLoadingCard}>
              <ActivityIndicator size="large" color="#B8895A" />
              <Text style={styles.aiLoadingTitle}>Model AI Đang Xử Lý Kiểu Tóc</Text>
              <Text style={styles.aiLoadingSubtitle}>{aiProgressStep}</Text>
            </View>
          </View>
        )}

        <BottomNavBar active="AICamera" navigation={navigation} />
      </SafeAreaView>
    );
  }

  // KHI CHƯA CÓ ẢNH -> GIAO DIỆN LIVE CAMERA TOÀN MÀN HÌNH
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

        {/* Face Tracking Mesh Overlay */}
        <View style={styles.faceMeshOverlay}>
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
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5D9CA',
    zIndex: 30
  },
  previewHeaderTitleBox: {
    alignItems: 'center'
  },
  previewBrandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C2219'
  },
  previewSubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B8895A',
    marginTop: 1
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
  studioCanvasCard: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    marginBottom: 14
  },
  studioCanvas: {
    width: PHOTO_CANVAS_WIDTH,
    height: PHOTO_CANVAS_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1E1A17',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#B8895A',
    cursor: 'grab' as any,
    shadowColor: '#B8895A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6
  },
  studioCanvasBottomBadge: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(20, 18, 16, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  studioCanvasBottomBadgeText: {
    color: '#F0E6D8',
    fontSize: 11,
    fontWeight: '600'
  },
  infoMetaCard: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#EFE3D3',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1
  },
  infoMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  infoMetaLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#8D7B68',
    letterSpacing: 0.6
  },
  infoMetaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C2219'
  },
  infoMetaDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#EFE3D3'
  },
  selectorSectionBlock: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 12
  },
  bottomCameraCaptureArea: {
    position: 'absolute',
    bottom: 75,
    left: 0,
    right: 0,
    zIndex: 20
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
    width: 80,
    height: 98,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#E8DCD0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  filterThumbHairBg: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5ECE1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterThumbActive: {
    borderWidth: 2.5,
    borderColor: '#B8895A',
    shadowColor: '#B8895A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  filterThumbImg: {
    width: '100%',
    height: '100%',
    position: 'absolute'
  },
  filterThumbImgInactive: {
    opacity: 0.85
  },
  filterActiveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(169, 120, 69, 0.12)',
    zIndex: 1
  },
  filterInactiveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1
  },
  filterLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    alignItems: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(255, 253, 249, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 217, 202, 0.6)'
  },
  filterLabelActive: {
    backgroundColor: '#FFF8F0'
  },
  filterLabelInactive: {
    backgroundColor: 'rgba(255, 253, 249, 0.92)'
  },
  filterLabelText: {
    fontSize: 11,
    fontWeight: '700'
  },
  filterLabelTextActive: {
    color: '#B8895A',
    fontWeight: '800'
  },
  filterLabelTextInactive: {
    color: '#4A3B2C'
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
  selectorSectionBlock: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 16
  },
  selectorLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8
  },
  selectorSectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#5C4431',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  selectedHairNameText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#B8895A'
  },
  colorSelectorContainer: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 16
  },
  colorSwatchesScroll: {
    paddingVertical: 4,
    gap: 10,
    paddingHorizontal: 2
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2D5C5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  colorChipActive: {
    borderColor: '#B8895A',
    borderWidth: 2,
    backgroundColor: '#FFF7EF',
    shadowColor: '#B8895A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4
  },
  colorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.15)'
  },
  colorChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#3E3125'
  },
  colorChipTextActive: {
    color: '#8E5828',
    fontWeight: '800'
  },
  postCaptureActionsRow: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 12
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D8C7B5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  retakeBtnText: {
    color: '#5C4431',
    fontSize: 13.5,
    fontWeight: '700'
  },
  primaryAiBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#B8895A',
    borderWidth: 1,
    borderColor: '#CFA87D',
    shadowColor: '#B8895A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4
  },
  primaryAiBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  manualTryOnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D8C7B5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2
  },
  manualTryOnBtnText: {
    color: '#B8895A',
    fontSize: 13.5,
    fontWeight: '700'
  },
  ctaContainer: {
    width: '100%',
    maxWidth: 420,
    marginTop: 4,
    marginBottom: 8
  },
  bookCtaBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#A06E3E',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    elevation: 5,
    shadowColor: '#A06E3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10
  },
  bookCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3
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
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  photoContentImage: {
    width: '100%',
    height: '100%'
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
  },
  photoAlignControlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#EFE3D3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  photoAlignHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  photoAlignTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  photoAlignTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C2219'
  },
  photoAlignMetricsText: {
    fontSize: 11,
    color: '#8D7B68'
  },
  metricBold: {
    fontWeight: '700',
    color: '#B8895A'
  },
  photoAlignButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center'
  },
  alignToolBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F9F4EE',
    borderWidth: 1,
    borderColor: '#E7D7C3',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  alignToolBtnPrimary: {
    backgroundColor: '#B8895A',
    borderColor: '#A07446'
  },
  alignToolBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  alignToolBtnText: {
    color: '#4A3B2C',
    fontSize: 12,
    fontWeight: '600'
  },
  alignResetBtn: {
    backgroundColor: '#EFE8DE'
  },
  alignResetBtnText: {
    color: '#6F6255',
    fontSize: 11,
    fontWeight: '600'
  },
  photoAlignHelpText: {
    fontSize: 10.5,
    color: '#9E8873',
    marginTop: 8,
    lineHeight: 14
  }
});

