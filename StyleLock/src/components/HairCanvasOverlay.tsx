import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { LocalizedText as Text } from '../i18n/LocalizedComponents';
import { Hairstyle } from '../types';
import { AppIcon } from './AppIcon';

interface HairCanvasOverlayProps {
  userPhotoUri: string;
  hairstyle: Hairstyle;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  onScaleChange: (scale: number) => void;
  onRotationChange: (rotation: number) => void;
  onOffsetXChange: (x: number) => void;
  onOffsetYChange: (y: number) => void;
  onReset: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(SCREEN_WIDTH - 32, 380);

export const HairCanvasOverlay: React.FC<HairCanvasOverlayProps> = ({
  userPhotoUri,
  hairstyle,
  scale,
  rotation,
  offsetX,
  offsetY,
  onScaleChange,
  onRotationChange,
  onOffsetXChange,
  onOffsetYChange,
  onReset
}) => {
  return (
    <View style={styles.container}>
      {/* Canvas Container */}
      <View style={styles.canvas}>
        {/* User Base Photo */}
        <Image source={{ uri: userPhotoUri }} style={styles.userPhoto} resizeMode="cover" />

        {/* Hairstyle Overlay */}
        <View
          style={[
            styles.hairOverlayWrapper,
            {
              transform: [
                { translateX: offsetX },
                { translateY: offsetY },
                { scale: scale },
                { rotate: `${rotation}deg` }
              ]
            }
          ]}
        >
          <Image source={{ uri: hairstyle.imageUrl }} style={styles.hairImage} resizeMode="contain" />
        </View>

        {/* Face Guide Frame indicator */}
        <View style={styles.guideBadge}>
          <View style={styles.guideBadgeRow}><AppIcon name="lightbulb" size={14} color="#DDCDB9" /><Text style={styles.guideBadgeText}>Di chuyển & chỉnh tỉ lệ cho khớp với khuôn mặt</Text></View>
        </View>
      </View>

      {/* Control Buttons Panel */}
      <View style={styles.controlPanel}>
        <Text style={styles.controlTitle}>Công cụ căn chỉnh mẫu tóc</Text>

        <View style={styles.buttonRow}>
          {/* Zoom In / Out */}
          <TouchableOpacity style={styles.controlBtn} onPress={() => onScaleChange(Math.min(scale + 0.1, 2.5))}>
            <AppIcon name="zoomIn" size={14} color="#FFFFFF" /><Text style={styles.controlBtnText}>Phóng to</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={() => onScaleChange(Math.max(scale - 0.1, 0.4))}>
            <AppIcon name="zoomOut" size={14} color="#FFFFFF" /><Text style={styles.controlBtnText}>Thu nhỏ</Text>
          </TouchableOpacity>

          {/* Rotate Left / Right */}
          <TouchableOpacity style={styles.controlBtn} onPress={() => onRotationChange(rotation - 5)}>
            <AppIcon name="rotateLeft" size={14} color="#FFFFFF" /><Text style={styles.controlBtnText}>Xoay trái</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={() => onRotationChange(rotation + 5)}>
            <AppIcon name="refresh" size={14} color="#FFFFFF" /><Text style={styles.controlBtnText}>Xoay phải</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          {/* Move Up / Down / Left / Right */}
          <TouchableOpacity style={styles.controlBtnSmall} onPress={() => onOffsetYChange(offsetY - 10)}>
            <AppIcon name="arrowLeft" size={13} color="#FFFFFF" style={{ transform: [{ rotate: '90deg' }] }} /><Text style={styles.controlBtnText}>Lên</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtnSmall} onPress={() => onOffsetYChange(offsetY + 10)}>
            <AppIcon name="arrowLeft" size={13} color="#FFFFFF" style={{ transform: [{ rotate: '-90deg' }] }} /><Text style={styles.controlBtnText}>Xuống</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtnSmall} onPress={() => onOffsetXChange(offsetX - 10)}>
            <AppIcon name="arrowLeft" size={13} color="#FFFFFF" /><Text style={styles.controlBtnText}>Trái</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtnSmall} onPress={() => onOffsetXChange(offsetX + 10)}>
            <AppIcon name="arrowRight" size={13} color="#FFFFFF" /><Text style={styles.controlBtnText}>Phải</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.controlBtnSmall, styles.resetBtn]} onPress={onReset}>
            <AppIcon name="refresh" size={13} color="#FFFFFF" /><Text style={styles.resetBtnText}>Đặt lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%'
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE * 1.25,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#3A2E26',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#B89062',
    elevation: 8,
    shadowColor: '#6B4227',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  userPhoto: {
    width: '100%',
    height: '100%'
  },
  hairOverlayWrapper: {
    position: 'absolute',
    top: '10%',
    left: '15%',
    width: '70%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  hairImage: {
    width: '100%',
    height: '100%'
  },
  guideBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(42, 33, 28, 0.84)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  guideBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  guideBadgeText: {
    color: '#DDCDB9',
    fontSize: 12,
    fontWeight: '500'
  },
  controlPanel: {
    width: '100%',
    marginTop: 16,
    backgroundColor: '#FFFDF8',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDCDB9'
  },
  controlTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6F6256',
    marginBottom: 10,
    textAlign: 'center'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 6
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#A97845',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center'
  },
  controlBtnSmall: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#6B4227',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 8,
    alignItems: 'center'
  },
  controlBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  resetBtn: {
    backgroundColor: '#B65A4B'
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  }
});
