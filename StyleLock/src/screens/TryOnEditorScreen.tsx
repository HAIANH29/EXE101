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
import { AppIcon } from '../components/AppIcon';

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
            <View style={styles.backRow}><AppIcon name="arrowLeft" size={15} color="#0F766E" /><Text style={styles.backBtnText}>Đổi ảnh khác</Text></View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh ghép kiểu tóc</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('HairstyleSelect', { userPhotoUri })}
            style={styles.changeHairBtn}
          >
            <View style={styles.changeHairRow}><Text style={styles.changeHairText}>Đổi mẫu tóc</Text><AppIcon name="scissors" size={14} color="#0F766E" /></View>
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
          <AppIcon name="warning" size={22} color="#B45309" style={styles.disclaimerIcon} />
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
          <AppIcon name="salon" size={20} color="#FFFFFF" style={styles.findSalonBtnIcon} />
          <Text style={styles.findSalonBtnText}>TÌM TIỆM LÀM KIỂU NÀY</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8F7'
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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  backBtnText: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '600'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A'
  },
  changeHairBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDE7E3'
  },
  changeHairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  changeHairText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700'
  },
  hairstyleInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DDE7E3'
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
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700'
  },
  hairCategory: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDBA74'
  },
  disclaimerIcon: {
    fontSize: 20,
    marginRight: 10
  },
  disclaimerContent: {
    flex: 1
  },
  disclaimerTitle: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2
  },
  disclaimerBody: {
    color: '#92400E',
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic'
  },
  findSalonBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F766E',
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
