import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image
} from 'react-native';
import { LocalizedText as Text } from '../i18n/LocalizedComponents';
import { HairCanvasOverlay } from '../components/HairCanvasOverlay';
import { Hairstyle } from '../types';
import { AppIcon } from '../components/AppIcon';
import { MOCK_HAIRSTYLES } from '../services/mockData';

interface TryOnEditorScreenProps {
  navigation: any;
  route: any;
}

export const TryOnEditorScreen: React.FC<TryOnEditorScreenProps> = ({ navigation, route }) => {
  const { userPhotoUri, hairstyle: initialHairstyle } = route.params;

  const [currentHairstyle, setCurrentHairstyle] = useState<Hairstyle>(initialHairstyle || MOCK_HAIRSTYLES[0]);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [hairColor, setHairColor] = useState<string>('#1E2322');
  const [opacity, setOpacity] = useState<number>(1.0);

  const handleReset = () => {
    setScale(1.0);
    setRotation(0);
    setOffsetX(0);
    setOffsetY(0);
    setIsFlipped(false);
    setHairColor('#1E2322');
    setOpacity(1.0);
  };

  const handleSelectHairstyle = (hs: Hairstyle) => {
    setCurrentHairstyle(hs);
    // Keep scale and position centered for the new hairstyle
    setScale(1.0);
    setRotation(0);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleProceedToFindSalon = () => {
    navigation.navigate('SalonList', {
      selectedHairstyle: currentHairstyle,
      userPhotoUri: userPhotoUri
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

        {/* INTERACTIVE CANVAS OVERLAY WITH DEDICATED TRANSPARENT HAIR */}
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
          onScaleChange={setScale}
          onRotationChange={setRotation}
          onOffsetXChange={setOffsetX}
          onOffsetYChange={setOffsetY}
          onToggleFlip={() => setIsFlipped(!isFlipped)}
          onHairColorChange={setHairColor}
          onOpacityChange={setOpacity}
          onReset={handleReset}
        />

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
  }
});

