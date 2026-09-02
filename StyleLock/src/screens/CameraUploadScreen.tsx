import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MOCK_HAIRSTYLES } from '../services/mockData';

interface CameraUploadScreenProps {
  navigation: any;
  route?: any;
}

const SAMPLE_FACES = [
  {
    id: 'face-nam-1',
    name: 'Khuôn mặt Nam 1',
    uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600'
  },
  {
    id: 'face-nam-2',
    name: 'Khuôn mặt Nam 2',
    uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600'
  },
  {
    id: 'face-nu-1',
    name: 'Khuôn mặt Nữ 1',
    uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600'
  },
  {
    id: 'face-nu-2',
    name: 'Khuôn mặt Nữ 2',
    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'
  }
];

export const CameraUploadScreen: React.FC<CameraUploadScreenProps> = ({ navigation, route }) => {
  const preselectedHair = route?.params?.preselectedHair;
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

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
      }
    } catch (e) {
      console.log('Pick image error', e);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Quyền camera', 'Vui lòng cấp quyền Camera để chụp ảnh khuôn mặt!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setSelectedPhoto(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Camera error', e);
    }
  };

  const handleProceedToTryOn = (photoUri: string) => {
    const hairToUse = preselectedHair || MOCK_HAIRSTYLES[0];
    navigation.navigate('TryOnEditor', {
      userPhotoUri: photoUri,
      hairstyle: hairToUse
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>◀ Bỏ qua</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chụp / Tải ảnh chân dung</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Instructions */}
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>💡 Mẹo để có kết quả ghép tóc chuẩn nhất:</Text>
          <Text style={styles.tipText}>• Chụp chính diện góc 90 độ</Text>
          <Text style={styles.tipText}>• Để lộ rõ phần trán và đường nét khuôn mặt</Text>
          <Text style={styles.tipText}>• Ánh sáng rõ ràng, không đeo kính râm hay khẩu trang</Text>
        </View>

        {/* Photo Preview / Placeholder with Face Guide */}
        <View style={styles.previewBox}>
          {selectedPhoto ? (
            <Image source={{ uri: selectedPhoto }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.guidePlaceholder}>
              <View style={styles.ovalFaceGuide}>
                <Text style={styles.guideIcon}>👤</Text>
                <Text style={styles.guideText}>Khung căn khuôn mặt</Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryActionBtn} onPress={handleTakePhoto}>
            <Text style={styles.actionBtnIcon}>📸</Text>
            <Text style={styles.actionBtnText}>Chụp ảnh bằng Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryActionBtn} onPress={handlePickFromGallery}>
            <Text style={styles.secondaryBtnIcon}>🖼️</Text>
            <Text style={styles.secondaryBtnText}>Tải từ thư viện ảnh</Text>
          </TouchableOpacity>
        </View>

        {/* Continue with current photo if selected */}
        {selectedPhoto && (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => handleProceedToTryOn(selectedPhoto)}
          >
            <Text style={styles.continueBtnText}>Tiếp tục thử tóc với ảnh này ➔</Text>
          </TouchableOpacity>
        )}

        {/* Sample Face Options for Quick Demo */}
        <View style={styles.sampleSection}>
          <Text style={styles.sampleTitle}>Hoặc chọn nhanh ảnh mẫu để demo:</Text>
          <View style={styles.sampleGrid}>
            {SAMPLE_FACES.map((sample) => (
              <TouchableOpacity
                key={sample.id}
                style={styles.sampleCard}
                onPress={() => handleProceedToTryOn(sample.uri)}
              >
                <Image source={{ uri: sample.uri }} style={styles.sampleImg} />
                <Text style={styles.sampleName}>{sample.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    marginBottom: 16
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  backBtnText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC'
  },
  tipBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9'
  },
  tipTitle: {
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 4
  },
  tipText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18
  },
  previewBox: {
    width: '100%',
    height: 320,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center'
  },
  previewImage: {
    width: '100%',
    height: '100%'
  },
  guidePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  ovalFaceGuide: {
    width: 170,
    height: 230,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#38BDF8',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.05)'
  },
  guideIcon: {
    fontSize: 40,
    marginBottom: 8
  },
  guideText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600'
  },
  actionRow: {
    gap: 10,
    marginBottom: 16
  },
  primaryActionBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionBtnIcon: {
    fontSize: 18,
    marginRight: 8
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15
  },
  secondaryActionBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  secondaryBtnIcon: {
    fontSize: 18,
    marginRight: 8
  },
  secondaryBtnText: {
    color: '#E2E8F0',
    fontWeight: '600',
    fontSize: 14
  },
  continueBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  sampleSection: {
    marginTop: 8
  },
  sampleTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12
  },
  sampleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10
  },
  sampleCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    paddingBottom: 8
  },
  sampleImg: {
    width: '100%',
    height: 100,
    backgroundColor: '#334155'
  },
  sampleName: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6
  }
});
