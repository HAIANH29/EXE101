import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ImageBackground
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

interface CameraUploadScreenProps {
  navigation: any;
  route?: any;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FILTER_STYLES = [
  { id: 'twoblock', label: 'Two Block', recommended: true, hairIndex: 1 },
  { id: 'undercut', label: 'Undercut', recommended: true, hairIndex: 2 },
  { id: 'sidepart', label: 'Side Part', recommended: false, hairIndex: 3 },
  { id: 'bob', label: 'Bob Nữ', recommended: false, hairIndex: 7 },
  { id: 'curly', label: 'Curly Xoăn', recommended: true, hairIndex: 5 },
];

export const CameraUploadScreen: React.FC<CameraUploadScreenProps> = ({ navigation, route }) => {
  const preselectedHair: Hairstyle | undefined = route?.params?.preselectedHair;
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('front');
  const [activeFilterIdx, setActiveFilterIdx] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [analysisComplete, setAnalysisComplete] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Map filter styles to actual hairstyles from mock data
  const filterHairstyles = FILTER_STYLES.map((f) => ({
    ...f,
    hairstyle: MOCK_HAIRSTYLES[f.hairIndex] || MOCK_HAIRSTYLES[0]
  }));

  const handleOpenTryOn = (hair?: Hairstyle) => {
    if (!selectedPhoto) return;
    const targetHair = hair || preselectedHair || filterHairstyles[activeFilterIdx]?.hairstyle || MOCK_HAIRSTYLES[1];
    navigation.navigate('TryOnEditor', {
      userPhotoUri: selectedPhoto,
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
        aspect: [3, 4],
        quality: 0.9
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setSelectedPhoto(result.assets[0].uri);
        simulateAnalysis();
      }
    } catch (e) {
      console.log('Pick image error', e);
    }
  };

  const handleTakePhoto = () => {
    if (selectedPhoto) {
      setSelectedPhoto(null);
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
    }, 1500);
  };

  const handleCapture = async () => {
    if (selectedPhoto) {
      // Already have a photo, proceed to try-on
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
          quality: 0.9,
          skipProcessing: false
        });

        if (photo?.uri) {
          setSelectedPhoto(photo.uri);
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

  const handleBookThisHairstyle = () => {
    const hairToUse = preselectedHair || filterHairstyles[activeFilterIdx].hairstyle;
    navigation.navigate('SalonList', { selectedHairstyle: hairToUse, userPhotoUri: selectedPhoto });
  };

  const renderCameraSurface = () => {
    if (selectedPhoto) {
      return (
        <TouchableOpacity
          activeOpacity={0.92}
          style={styles.cameraFeed}
          onPress={() => handleOpenTryOn()}
        >
          <ImageBackground
            source={{ uri: selectedPhoto }}
            style={styles.cameraFeed}
            resizeMode="cover"
          >
            <View style={styles.tapToTryContainer}>
              <View style={styles.tapToTryPill}>
                <AppIcon name="sparkle" size={16} color="#FFFFFF" />
                <Text style={styles.tapToTryText}>Chạm vào ảnh để thử mẫu tóc</Text>
                <AppIcon name="arrowRight" size={14} color="#FFFFFF" />
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>
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

      {/* Full-Screen Camera Canvas */}
      <View style={styles.cameraCanvas}>
        {renderCameraSurface()}
          {/* Vignette Gradient Overlay */}
          <View style={styles.vignetteTop} />
          <View style={styles.vignetteBottom} />

          {/* Face Tracking Mesh Overlay (Dashed Oval) */}
          {!selectedPhoto && (
            <View style={styles.faceMeshOverlay}>
              <View style={styles.faceMeshOval}>
                <View style={styles.meshLine1} />
                <View style={styles.meshLine2} />
              </View>
            </View>
          )}

          {/* Top Controls Overlay */}
          <View style={styles.topControlsOverlay}>
            {/* Status Badge */}
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>LIVE TRACKING</Text>
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
                <AppIcon name="user" size={14} color="#005C55" />
                <Text style={styles.analysisLabelText}>DETECTED SHAPE</Text>
              </View>
              <Text style={styles.analysisValue}>Oval</Text>
            </View>

            <View style={styles.analysisCard}>
              <View style={styles.analysisLabelRow}>
                <AppIcon name="barChart" size={14} color="#005C55" />
                <Text style={styles.analysisLabelText}>CONFIDENCE</Text>
              </View>
              <View style={styles.confidenceRow}>
                <Text style={styles.confidenceValue}>98%</Text>
                <View style={styles.confidenceBarBg}>
                  <View style={styles.confidenceBarFill} />
                </View>
              </View>
            </View>
          </View>

          {/* Bottom UI Area */}
          <View style={styles.bottomUIArea}>
            {/* Filter Carousel */}
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
                      if (selectedPhoto) {
                        handleOpenTryOn(item.hairstyle);
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
                  style={styles.primaryTryOnBtn}
                  onPress={() => handleOpenTryOn()}
                  activeOpacity={0.85}
                >
                  <AppIcon name="sparkle" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryTryOnText}>Thử mẫu tóc này ngay</Text>
                  <AppIcon name="arrowRight" size={16} color="#FFFFFF" />
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
                <Text style={styles.bookCtaText}>Đặt lịch làm kiểu tóc này</Text>
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
    backgroundColor: '#182C2A'
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E6E1',
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
    backgroundColor: '#F0F5F3'
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#005C55',
    letterSpacing: -0.5
  },
  cameraCanvas: {
    flex: 1,
    width: '100%',
    backgroundColor: '#182C2A'
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
    backgroundColor: 'rgba(0, 92, 85, 0.88)',
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
    backgroundColor: '#182C2A'
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
    backgroundColor: '#005C55',
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
    backgroundColor: 'rgba(243, 248, 244, 0.24)',
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
    backgroundColor: '#B7D3C6'
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
    backgroundColor: 'rgba(243, 248, 244, 0.24)',
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
    backgroundColor: 'rgba(243, 248, 244, 0.9)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(189, 201, 198, 0.3)',
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
    color: '#005C55'
  },
  analysisLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#687572',
    letterSpacing: 0.8
  },
  analysisValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#182C2A'
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  confidenceValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#005C55'
  },
  confidenceBarBg: {
    width: 60,
    height: 8,
    backgroundColor: '#DDEBE3',
    borderRadius: 4,
    overflow: 'hidden'
  },
  confidenceBarFill: {
    width: '98%',
    height: '100%',
    backgroundColor: '#005C55',
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
    backgroundColor: '#0F1A19',
    justifyContent: 'center',
    alignItems: 'center'
  },
  filterThumbActive: {
    borderWidth: 2,
    borderColor: '#005C55'
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
    backgroundColor: 'rgba(0, 92, 85, 0.16)',
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
    backgroundColor: 'rgba(251, 255, 254, 0.9)'
  },
  filterLabelInactive: {
    backgroundColor: 'rgba(251, 255, 254, 0.35)'
  },
  filterLabelText: {
    fontSize: 11,
    fontWeight: '700'
  },
  filterLabelTextActive: {
    color: '#182C2A'
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
    backgroundColor: '#005C55',
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
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 12
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)'
  },
  retakeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  primaryTryOnBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#005C55',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    elevation: 4,
    shadowColor: '#005C55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8
  },
  primaryTryOnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
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
    backgroundColor: '#005C55',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#005C55',
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
    backgroundColor: '#005C55',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 6,
    shadowColor: 'rgba(0, 92, 85, 0.30)',
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
    backgroundColor: 'rgba(243, 248, 244, 0.9)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(208, 216, 212, 0.5)',
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
    backgroundColor: 'rgba(0, 92, 85, 0.16)'
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
    color: '#687572'
  },
  navLabelActive: {
    color: '#005C55',
    fontWeight: '700'
  }
});
