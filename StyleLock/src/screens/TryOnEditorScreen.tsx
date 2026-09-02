import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image
} from 'react-native';
import { HairCanvasOverlay } from '../components/HairCanvasOverlay';
import { Hairstyle } from '../types';

interface TryOnEditorScreenProps {
  navigation: any;
  route: any;
}

export const TryOnEditorScreen: React.FC<TryOnEditorScreenProps> = ({ navigation, route }) => {
  const { userPhotoUri, hairstyle: initialHairstyle } = route.params;

  const [currentHairstyle, setCurrentHairstyle] = useState<Hairstyle>(initialHairstyle);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);

  const handleReset = () => {
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Navigation */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>◀ Đổi ảnh khác</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh ghép kiểu tóc</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('HairstyleSelect', { userPhotoUri })}
            style={styles.changeHairBtn}
          >
            <Text style={styles.changeHairText}>Đổi mẫu tóc ✂️</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Hairstyle Info Banner */}
        <View style={styles.hairstyleInfoCard}>
          <Image source={{ uri: currentHairstyle.imageUrl }} style={styles.thumbImage} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.hairName}>{currentHairstyle.name}</Text>
            <Text style={styles.hairCategory}>Phong cách: {currentHairstyle.category} • {currentHairstyle.suitableFace}</Text>
          </View>
        </View>

        {/* INTERACTIVE CANVAS OVERLAY COMPONENT */}
        <HairCanvasOverlay
          userPhotoUri={userPhotoUri}
          hairstyle={currentHairstyle}
          scale={scale}
          rotation={rotation}
          offsetX={offsetX}
          offsetY={offsetY}
          onScaleChange={setScale}
          onRotationChange={setRotation}
          onOffsetXChange={setOffsetX}
          onOffsetYChange={setOffsetY}
          onReset={handleReset}
        />

        {/* TRY-ON DISCLAIMER - MANDATORY REQUIREMENT */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerIcon}>⚠️</Text>
          <View style={styles.disclaimerContent}>
            <Text style={styles.disclaimerTitle}>LƯU Ý TRẢI NGHIỆM THỬ TÓC:</Text>
            <Text style={styles.disclaimerBody}>
              “Kết quả thử mang tính tham khảo trực quan. Vui lòng tham vấn thợ salon dựa trên chất tóc và chất da đầu thực tế trước khi thực hiện dịch vụ.”
            </Text>
          </View>
        </View>

        {/* MAIN CONVERSION CTA BUTTON */}
        <TouchableOpacity
          style={styles.findSalonBtn}
          activeOpacity={0.85}
          onPress={handleProceedToFindSalon}
        >
          <Text style={styles.findSalonBtnIcon}>🏪</Text>
          <Text style={styles.findSalonBtnText}>TÌM TIỆM LÀM KIỂU NÀY</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  scrollContent: {
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  backBtn: {
    paddingVertical: 4
  },
  backBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC'
  },
  changeHairBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  changeHairText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700'
  },
  hairstyleInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155'
  },
  thumbImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#334155'
  },
  infoTextContainer: {
    flex: 1
  },
  hairName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700'
  },
  hairCategory: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  disclaimerIcon: {
    fontSize: 20,
    marginRight: 10
  },
  disclaimerContent: {
    flex: 1
  },
  disclaimerTitle: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2
  },
  disclaimerBody: {
    color: '#FCD34D',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic'
  },
  findSalonBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 24
  },
  findSalonBtnIcon: {
    fontSize: 20,
    marginRight: 10
  },
  findSalonBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8
  }
});
