import React, { useState } from 'react';
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
import { resolveHairOverlaySource, HAIR_COLORS, HairColorOption } from '../services/hairAssetMap';

export interface HairCanvasOverlayProps {
  userPhotoUri: string;
  hairstyle: Hairstyle;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  isFlipped?: boolean;
  hairColor?: string;
  opacity?: number;
  onScaleChange: (scale: number) => void;
  onRotationChange: (rotation: number) => void;
  onOffsetXChange: (x: number) => void;
  onOffsetYChange: (y: number) => void;
  onToggleFlip?: () => void;
  onHairColorChange?: (colorHex: string) => void;
  onOpacityChange?: (opacity: number) => void;
  onReset: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(SCREEN_WIDTH - 24, 380);

export const HairCanvasOverlay: React.FC<HairCanvasOverlayProps> = ({
  userPhotoUri,
  hairstyle,
  scale,
  rotation,
  offsetX,
  offsetY,
  isFlipped = false,
  hairColor = '#1E2322',
  opacity = 1.0,
  onScaleChange,
  onRotationChange,
  onOffsetXChange,
  onOffsetYChange,
  onToggleFlip,
  onHairColorChange,
  onOpacityChange,
  onReset
}) => {
  const [activeTab, setActiveTab] = useState<'align' | 'color' | 'blend'>('align');
  const [isComparingOriginal, setIsComparingOriginal] = useState<boolean>(false);
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(false);

  // Resolve the dedicated transparent hair model (mẫu tóc trong suốt)
  const hairSource = resolveHairOverlaySource(hairstyle);

  return (
    <View style={styles.container}>
      {/* Canvas Viewport */}
      <View style={styles.canvasContainer}>
        <View style={styles.canvas}>
          {/* Base User Portrait Photo */}
          <Image source={{ uri: userPhotoUri }} style={styles.userPhoto} resizeMode="cover" />

          {/* Semi-transparent Face Guide Mask Overlay */}
          {showFaceGuide && (
            <View style={styles.faceGuideOverlay}>
              <View style={styles.faceGuideOval} />
              <View style={styles.faceGuideCenterLine} />
              <View style={styles.faceGuideEyeLine} />
            </View>
          )}

          {/* DEDICATED ISOLATED HAIRSTYLE OVERLAY (KHÔNG CÒN CẢ NGƯỜI MẪU) */}
          {!isComparingOriginal && (
            <View
              style={[
                styles.hairOverlayWrapper,
                {
                  transform: [
                    { translateX: offsetX },
                    { translateY: offsetY },
                    { scale: scale },
                    { scaleX: isFlipped ? -1 : 1 },
                    { rotate: `${rotation}deg` }
                  ],
                  opacity: opacity
                }
              ]}
            >
              <Image
                source={hairSource}
                style={[
                  styles.hairImage,
                  hairColor && hairColor !== '#1E2322' ? { tintColor: hairColor } : undefined
                ]}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Top Quick Actions Floating Bar */}
          <View style={styles.canvasTopBar}>
            {/* Before / After Comparison Pill */}
            <TouchableOpacity
              style={[styles.floatingPill, isComparingOriginal && styles.floatingPillActive]}
              activeOpacity={0.8}
              onPressIn={() => setIsComparingOriginal(true)}
              onPressOut={() => setIsComparingOriginal(false)}
            >
              <AppIcon name="eye" size={13} color={isComparingOriginal ? '#005C55' : '#FFFFFF'} />
              <Text style={[styles.floatingPillText, isComparingOriginal && styles.floatingPillTextActive]}>
                {isComparingOriginal ? 'Ảnh gốc' : 'Giữ xem gốc'}
              </Text>
            </TouchableOpacity>

            <View style={styles.topRightTools}>
              {/* Flip Horizontal Toggle */}
              {onToggleFlip && (
                <TouchableOpacity
                  style={[styles.miniCircleBtn, isFlipped && styles.miniCircleBtnActive]}
                  onPress={onToggleFlip}
                  activeOpacity={0.8}
                >
                  <AppIcon name="rotateLeft" size={13} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              {/* Face Guide Toggle */}
              <TouchableOpacity
                style={[styles.miniCircleBtn, showFaceGuide && styles.miniCircleBtnActive]}
                onPress={() => setShowFaceGuide(!showFaceGuide)}
                activeOpacity={0.8}
              >
                <AppIcon name="user" size={13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Live Hint Badge */}
          <View style={styles.bottomGuideBadge}>
            <AppIcon name="sparkle" size={12} color="#48D1B7" />
            <Text style={styles.bottomGuideText}>Mẫu tóc AI • Dùng công cụ bên dưới để căn chỉnh vừa vặn</Text>
          </View>
        </View>
      </View>

      {/* Control Studio Tabs Panel */}
      <View style={styles.controlPanel}>
        {/* Navigation Tabs Header */}
        <View style={styles.tabHeaderRow}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'align' && styles.tabItemActive]}
            onPress={() => setActiveTab('align')}
          >
            <AppIcon name="tool" size={14} color={activeTab === 'align' ? '#005C55' : '#8A9894'} />
            <Text style={[styles.tabLabel, activeTab === 'align' && styles.tabLabelActive]}>Căn chỉnh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'color' && styles.tabItemActive]}
            onPress={() => setActiveTab('color')}
          >
            <AppIcon name="bottle" size={14} color={activeTab === 'color' ? '#005C55' : '#8A9894'} />
            <Text style={[styles.tabLabel, activeTab === 'color' && styles.tabLabelActive]}>Màu tóc</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'blend' && styles.tabItemActive]}
            onPress={() => setActiveTab('blend')}
          >
            <AppIcon name="sparkle" size={14} color={activeTab === 'blend' ? '#005C55' : '#8A9894'} />
            <Text style={[styles.tabLabel, activeTab === 'blend' && styles.tabLabelActive]}>Hòa trộn</Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Align & Size Controls */}
        {activeTab === 'align' && (
          <View style={styles.tabContent}>
            {/* Zoom & Rotation Quick Row */}
            <View style={styles.toolRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onScaleChange(Math.max(0.4, Number((scale - 0.08).toFixed(2))))}
              >
                <AppIcon name="zoomOut" size={14} color="#005C55" />
                <Text style={styles.actionBtnText}>Thu nhỏ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onScaleChange(Math.min(2.5, Number((scale + 0.08).toFixed(2))))}
              >
                <AppIcon name="zoomIn" size={14} color="#005C55" />
                <Text style={styles.actionBtnText}>Phóng to</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onRotationChange(rotation - 4)}
              >
                <AppIcon name="rotateLeft" size={14} color="#005C55" />
                <Text style={styles.actionBtnText}>Nghiêng trái</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onRotationChange(rotation + 4)}
              >
                <AppIcon name="refresh" size={14} color="#005C55" />
                <Text style={styles.actionBtnText}>Nghiêng phải</Text>
              </TouchableOpacity>
            </View>

            {/* Position Directional Pad Row */}
            <View style={styles.toolRow}>
              <TouchableOpacity
                style={styles.directionalBtn}
                onPress={() => onOffsetYChange(offsetY - 8)}
              >
                <AppIcon name="arrowLeft" size={13} color="#FFFFFF" style={{ transform: [{ rotate: '90deg' }] }} />
                <Text style={styles.directionalBtnText}>Lên</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.directionalBtn}
                onPress={() => onOffsetYChange(offsetY + 8)}
              >
                <AppIcon name="arrowLeft" size={13} color="#FFFFFF" style={{ transform: [{ rotate: '-90deg' }] }} />
                <Text style={styles.directionalBtnText}>Xuống</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.directionalBtn}
                onPress={() => onOffsetXChange(offsetX - 8)}
              >
                <AppIcon name="arrowLeft" size={13} color="#FFFFFF" />
                <Text style={styles.directionalBtnText}>Trái</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.directionalBtn}
                onPress={() => onOffsetXChange(offsetX + 8)}
              >
                <AppIcon name="arrowRight" size={13} color="#FFFFFF" />
                <Text style={styles.directionalBtnText}>Phải</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.directionalBtn, styles.resetBtn]}
                onPress={onReset}
              >
                <AppIcon name="refresh" size={13} color="#FFFFFF" />
                <Text style={styles.directionalBtnText}>Đặt lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tab 2: Hair Dye Palette */}
        {activeTab === 'color' && (
          <View style={styles.tabContent}>
            <View style={styles.colorPaletteRow}>
              {HAIR_COLORS.map((c: HairColorOption) => {
                const isSelected = (hairColor === c.colorHex) || (!hairColor && c.id === 'natural');
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.colorItem, isSelected && styles.colorItemActive]}
                    onPress={() => onHairColorChange && onHairColorChange(c.colorHex)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.colorCircle, { backgroundColor: c.colorHex }]} />
                    <Text
                      numberOfLines={1}
                      style={[styles.colorNameText, isSelected && styles.colorNameTextActive]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Tab 3: Blend / Opacity Presets */}
        {activeTab === 'blend' && (
          <View style={styles.tabContent}>
            <Text style={styles.blendSubText}>Điều chỉnh độ trong suốt để hòa vào đường chân tóc tự nhiên hơn:</Text>
            <View style={styles.blendPresetsRow}>
              {[0.7, 0.85, 0.95, 1.0].map((val) => {
                const isSelected = Math.abs(opacity - val) < 0.05;
                const pct = Math.round(val * 100);
                return (
                  <TouchableOpacity
                    key={val}
                    style={[styles.blendPill, isSelected && styles.blendPillActive]}
                    onPress={() => onOpacityChange && onOpacityChange(val)}
                  >
                    <Text style={[styles.blendPillText, isSelected && styles.blendPillTextActive]}>
                      {pct}%
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%'
  },
  canvasContainer: {
    width: CANVAS_SIZE,
    alignItems: 'center',
    shadowColor: '#005C55',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE * 1.25,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0F1A19',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#4A8C82'
  },
  userPhoto: {
    width: '100%',
    height: '100%'
  },
  faceGuideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none'
  },
  faceGuideOval: {
    width: '58%',
    height: '68%',
    borderRadius: 140,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(72, 209, 183, 0.7)'
  },
  faceGuideCenterLine: {
    position: 'absolute',
    top: '16%',
    bottom: '16%',
    width: 1,
    backgroundColor: 'rgba(72, 209, 183, 0.3)'
  },
  faceGuideEyeLine: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    top: '46%',
    height: 1,
    backgroundColor: 'rgba(72, 209, 183, 0.3)'
  },
  hairOverlayWrapper: {
    position: 'absolute',
    top: '8%',
    left: '12%',
    width: '76%',
    height: '58%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  hairImage: {
    width: '100%',
    height: '100%'
  },
  canvasTopBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 26, 25, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  floatingPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF'
  },
  floatingPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  floatingPillTextActive: {
    color: '#005C55'
  },
  topRightTools: {
    flexDirection: 'row',
    gap: 8
  },
  miniCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 26, 25, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  miniCircleBtnActive: {
    backgroundColor: '#005C55',
    borderColor: '#48D1B7'
  },
  bottomGuideBadge: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 26, 25, 0.82)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(72, 209, 183, 0.2)'
  },
  bottomGuideText: {
    color: '#D8E8E4',
    fontSize: 11,
    fontWeight: '500'
  },
  controlPanel: {
    width: '100%',
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6ECE9',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  tabHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F4F7F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECE9'
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#005C55'
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A9894'
  },
  tabLabelActive: {
    color: '#005C55'
  },
  tabContent: {
    padding: 12
  },
  toolRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EDF5F3',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4E5E1'
  },
  actionBtnText: {
    color: '#005C55',
    fontSize: 11,
    fontWeight: '700'
  },
  directionalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#005C55',
    paddingVertical: 9,
    borderRadius: 10
  },
  directionalBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  resetBtn: {
    backgroundColor: '#B65A4B'
  },
  colorPaletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  colorItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1
  },
  colorItemActive: {
    transform: [{ scale: 1.05 }]
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  colorNameText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#687572',
    textAlign: 'center'
  },
  colorNameTextActive: {
    color: '#005C55',
    fontWeight: '700'
  },
  blendSubText: {
    fontSize: 12,
    color: '#687572',
    marginBottom: 10,
    textAlign: 'center'
  },
  blendPresetsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center'
  },
  blendPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EDF5F3',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4E5E1'
  },
  blendPillActive: {
    backgroundColor: '#005C55',
    borderColor: '#005C55'
  },
  blendPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#005C55'
  },
  blendPillTextActive: {
    color: '#FFFFFF'
  }
});
