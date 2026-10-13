import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  PanResponder
} from 'react-native';
import { LocalizedText as Text } from '../i18n/LocalizedComponents';
import { Hairstyle } from '../types';
import { AppIcon } from './AppIcon';
import { resolveHairOverlaySource, HAIR_COLORS, HairColorOption } from '../services/hairAssetMap';

export interface HairCanvasOverlayProps {
  userPhotoUri: string;
  hairstyle: Hairstyle;
  // Hair transform
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  isFlipped?: boolean;
  hairColor?: string;
  opacity?: number;
  // User photo transform
  photoScale?: number;
  photoRotation?: number;
  photoOffsetX?: number;
  photoOffsetY?: number;
  onScaleChange: (scale: number) => void;
  onRotationChange: (rotation: number) => void;
  onOffsetXChange: (x: number) => void;
  onOffsetYChange: (y: number) => void;
  onPhotoScaleChange?: (scale: number) => void;
  onPhotoRotationChange?: (rotation: number) => void;
  onPhotoOffsetXChange?: (x: number) => void;
  onPhotoOffsetYChange?: (y: number) => void;
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
  photoScale = 1.0,
  photoRotation = 0,
  photoOffsetX = 0,
  photoOffsetY = 0,
  onScaleChange,
  onRotationChange,
  onOffsetXChange,
  onOffsetYChange,
  onPhotoScaleChange,
  onPhotoRotationChange,
  onPhotoOffsetXChange,
  onPhotoOffsetYChange,
  onToggleFlip,
  onHairColorChange,
  onOpacityChange,
  onReset
}) => {
  const [activeTab, setActiveTab] = useState<'align' | 'color' | 'blend'>('align');
  const [alignTarget, setAlignTarget] = useState<'hair' | 'photo'>('hair');
  const [isComparingOriginal, setIsComparingOriginal] = useState<boolean>(false);
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(true);

  // Dynamic SVG hair overlay with accurate color rendering
  const hairSource = resolveHairOverlaySource(hairstyle, hairColor);

  // Live state reference to prevent stale closure in PanResponder
  const liveStateRef = useRef({
    alignTarget,
    offsetX,
    offsetY,
    photoOffsetX,
    photoOffsetY,
    scale,
    photoScale,
    rotation,
    photoRotation
  });
  liveStateRef.current = {
    alignTarget,
    offsetX,
    offsetY,
    photoOffsetX,
    photoOffsetY,
    scale,
    photoScale,
    rotation,
    photoRotation
  };

  // PanResponder to allow dragging on the canvas
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const cur = liveStateRef.current;
        if (cur.alignTarget === 'hair') {
          dragStartRef.current = { x: cur.offsetX, y: cur.offsetY };
        } else {
          dragStartRef.current = { x: cur.photoOffsetX, y: cur.photoOffsetY };
        }
      },
      onPanResponderMove: (_, gestureState) => {
        const cur = liveStateRef.current;
        if (cur.alignTarget === 'hair') {
          onOffsetXChange(Math.round(dragStartRef.current.x + gestureState.dx));
          onOffsetYChange(Math.round(dragStartRef.current.y + gestureState.dy));
        } else if (onPhotoOffsetXChange && onPhotoOffsetYChange) {
          onPhotoOffsetXChange(Math.round(dragStartRef.current.x + gestureState.dx));
          onPhotoOffsetYChange(Math.round(dragStartRef.current.y + gestureState.dy));
        }
      }
    })
  ).current;

  // Wheel zoom handler for Web
  const handleWheel = (e: any) => {
    if (e) {
      if (typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      if (e.deltaY) {
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        const cur = liveStateRef.current;
        if (cur.alignTarget === 'hair') {
          const next = Math.max(0.4, Math.min(2.5, Number((cur.scale + delta).toFixed(2))));
          onScaleChange(next);
        } else if (onPhotoScaleChange) {
          const next = Math.max(0.5, Math.min(3.0, Number((cur.photoScale + delta).toFixed(2))));
          onPhotoScaleChange(next);
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Canvas Viewport */}
      <View style={styles.canvasContainer}>
        <View
          style={[
            styles.canvas,
            alignTarget === 'photo' ? styles.canvasActivePhoto : styles.canvasActiveHair
          ]}
          {...panResponder.panHandlers}
          // @ts-ignore Web mouse wheel event support
          onWheel={handleWheel}
        >
          {/* Base User Portrait Photo with transform */}
          <View style={styles.userPhotoWrapper}>
            <View
              style={[
                styles.userPhotoTransformContainer,
                {
                  transform: [
                    { translateX: photoOffsetX },
                    { translateY: photoOffsetY },
                    { scale: photoScale },
                    { rotate: `${photoRotation}deg` }
                  ]
                }
              ]}
            >
              <Image
                source={{ uri: userPhotoUri }}
                style={styles.userPhoto}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Semi-transparent Face Guide Mask Overlay */}
          {showFaceGuide && (
            <View style={styles.faceGuideOverlay}>
              <View style={styles.faceGuideOval} />
              <View style={styles.faceGuideCenterLine} />
              <View style={styles.faceGuideEyeLine} />
            </View>
          )}

          {/* DEDICATED ISOLATED HAIRSTYLE OVERLAY */}
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
                style={styles.hairImage}
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
              <AppIcon name="eye" size={13} color={isComparingOriginal ? '#B8895A' : '#FFFFFF'} />
              <Text style={[styles.floatingPillText, isComparingOriginal && styles.floatingPillTextActive]}>
                {isComparingOriginal ? 'Ảnh gốc' : 'Giữ xem gốc'}
              </Text>
            </TouchableOpacity>

            <View style={styles.topRightTools}>
              {/* Rotate Photo 90deg quickly (Always available button) */}
              {onPhotoRotationChange && (
                <TouchableOpacity
                  style={[styles.miniCircleBtn, styles.miniRotateBtn]}
                  onPress={() => onPhotoRotationChange((photoRotation + 90) % 360)}
                  activeOpacity={0.8}
                >
                  <AppIcon name="refresh" size={13} color="#FFFFFF" />
                  <Text style={styles.miniBtnLabel}>90°</Text>
                </TouchableOpacity>
              )}

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
            <AppIcon name="sparkle" size={12} color="#D8B98E" />
            <Text style={styles.bottomGuideText}>
              {alignTarget === 'hair'
                ? `Đang chỉnh: 💇 MẪU TÓC (${Math.round(scale * 100)}%) • Kéo thả để dời vị trí`
                : `Đang chỉnh: 👤 ẢNH MẶT (${Math.round(photoScale * 100)}%) • Kéo thả hoặc bấm 90° để xoay`}
            </Text>
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
            <AppIcon name="tool" size={14} color={activeTab === 'align' ? '#B8895A' : '#9B8B7A'} />
            <Text style={[styles.tabLabel, activeTab === 'align' && styles.tabLabelActive]}>Căn chỉnh & Kích thước</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'color' && styles.tabItemActive]}
            onPress={() => setActiveTab('color')}
          >
            <AppIcon name="bottle" size={14} color={activeTab === 'color' ? '#B8895A' : '#9B8B7A'} />
            <Text style={[styles.tabLabel, activeTab === 'color' && styles.tabLabelActive]}>Màu tóc</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'blend' && styles.tabItemActive]}
            onPress={() => setActiveTab('blend')}
          >
            <AppIcon name="sparkle" size={14} color={activeTab === 'blend' ? '#B8895A' : '#9B8B7A'} />
            <Text style={[styles.tabLabel, activeTab === 'blend' && styles.tabLabelActive]}>Độ hòa trộn</Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Align & Size Controls */}
        {activeTab === 'align' && (
          <View style={styles.tabContent}>
            {/* Target Selector Switcher: Hair vs Photo */}
            <View style={styles.targetSelectorRow}>
              <TouchableOpacity
                style={[styles.targetBtn, alignTarget === 'hair' && styles.targetBtnActive]}
                onPress={() => setAlignTarget('hair')}
                activeOpacity={0.8}
              >
                <AppIcon name="scissors" size={14} color={alignTarget === 'hair' ? '#FFFFFF' : '#8D7B68'} />
                <Text style={[styles.targetBtnText, alignTarget === 'hair' && styles.targetBtnTextActive]}>
                  💇 Căn chỉnh Mẫu tóc
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.targetBtn, alignTarget === 'photo' && styles.targetBtnActive]}
                onPress={() => setAlignTarget('photo')}
                activeOpacity={0.8}
              >
                <AppIcon name="user" size={14} color={alignTarget === 'photo' ? '#FFFFFF' : '#8D7B68'} />
                <Text style={[styles.targetBtnText, alignTarget === 'photo' && styles.targetBtnTextActive]}>
                  👤 Căn chỉnh Ảnh mặt
                </Text>
              </TouchableOpacity>
            </View>

            {/* Live Size & Position Metric Indicator */}
            <View style={styles.metricRow}>
              <Text style={styles.metricText}>
                🔍 Tỉ lệ: <Text style={styles.metricHighlight}>{Math.round((alignTarget === 'hair' ? scale : photoScale) * 100)}%</Text>
              </Text>
              <Text style={styles.metricText}>
                📐 Vị trí: <Text style={styles.metricHighlight}>
                  X={alignTarget === 'hair' ? offsetX : photoOffsetX}px, Y={alignTarget === 'hair' ? offsetY : photoOffsetY}px
                </Text>
              </Text>
              <Text style={styles.metricText}>
                🔄 Xoay: <Text style={styles.metricHighlight}>{alignTarget === 'hair' ? rotation : photoRotation}°</Text>
              </Text>
            </View>

            {/* Quick Scale Presets */}
            <View style={styles.presetScaleRow}>
              {[
                { label: '85% Nhỏ', val: 0.85 },
                { label: '100% Vừa', val: 1.0 },
                { label: '120% Lớn', val: 1.2 },
                { label: '140% Rộng', val: 1.4 }
              ].map((p) => {
                const currentVal = alignTarget === 'hair' ? scale : photoScale;
                const isSelected = Math.abs(currentVal - p.val) < 0.05;
                return (
                  <TouchableOpacity
                    key={p.val}
                    style={[styles.presetScaleBtn, isSelected && styles.presetScaleBtnActive]}
                    onPress={() => {
                      if (alignTarget === 'hair') {
                        onScaleChange(p.val);
                      } else if (onPhotoScaleChange) {
                        onPhotoScaleChange(p.val);
                      }
                    }}
                  >
                    <Text style={[styles.presetScaleText, isSelected && styles.presetScaleTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Zoom & Rotation Quick Row */}
            <View style={styles.toolRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  if (alignTarget === 'hair') {
                    onScaleChange(Math.max(0.4, Number((scale - 0.15).toFixed(2))));
                  } else if (onPhotoScaleChange) {
                    onPhotoScaleChange(Math.max(0.5, Number((photoScale - 0.15).toFixed(2))));
                  }
                }}
              >
                <AppIcon name="zoomOut" size={14} color="#B8895A" />
                <Text style={styles.actionBtnText}>Thu nhỏ (-15%)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  if (alignTarget === 'hair') {
                    onScaleChange(Math.min(2.5, Number((scale + 0.15).toFixed(2))));
                  } else if (onPhotoScaleChange) {
                    onPhotoScaleChange(Math.min(3.0, Number((photoScale + 0.15).toFixed(2))));
                  }
                }}
              >
                <AppIcon name="zoomIn" size={14} color="#B8895A" />
                <Text style={styles.actionBtnText}>Phóng to (+15%)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  if (alignTarget === 'hair') {
                    onRotationChange(rotation - 5);
                  } else if (onPhotoRotationChange) {
                    onPhotoRotationChange(photoRotation - 5);
                  }
                }}
              >
                <AppIcon name="rotateLeft" size={14} color="#B8895A" />
                <Text style={styles.actionBtnText}>Xoay -5°</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  if (alignTarget === 'hair') {
                    onRotationChange(rotation + 5);
                  } else if (onPhotoRotationChange) {
                    onPhotoRotationChange(photoRotation + 5);
                  }
                }}
              >
                <AppIcon name="refresh" size={14} color="#B8895A" />
                <Text style={styles.actionBtnText}>Xoay +5°</Text>
              </TouchableOpacity>
            </View>

            {/* Position Directional Pad Row */}
            <View style={styles.toolRow}>
              <TouchableOpacity
                style={styles.directionalBtn}
                onPress={() => {
                  if (alignTarget === 'hair') {
                    onOffsetYChange(offsetY - 15);
                  } else if (onPhotoOffsetYChange) {
                    onPhotoOffsetYChange(photoOffsetY - 15);
                  }
                }}
              >
                <AppIcon name="arrowLeft" size={13} color="#FFFFFF" style={{ transform: [{ rotate: '90deg' }] }} />
                <Text style={styles.directionalBtnText}>Lên</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.directionalBtn}
                onPress={() => {
                  if (alignTarget === 'hair') {
                    onOffsetYChange(offsetY + 15);
                  } else if (onPhotoOffsetYChange) {
                    onPhotoOffsetYChange(photoOffsetY + 15);
                  }
                }}
              >
                <AppIcon name="arrowLeft" size={13} color="#FFFFFF" style={{ transform: [{ rotate: '-90deg' }] }} />
                <Text style={styles.directionalBtnText}>Xuống</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.directionalBtn}
                onPress={() => {
                  if (alignTarget === 'hair') {
                    onOffsetXChange(offsetX - 15);
                  } else if (onPhotoOffsetXChange) {
                    onPhotoOffsetXChange(photoOffsetX - 15);
                  }
                }}
              >
                <AppIcon name="arrowLeft" size={13} color="#FFFFFF" />
                <Text style={styles.directionalBtnText}>Trái</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.directionalBtn}
                onPress={() => {
                  if (alignTarget === 'hair') {
                    onOffsetXChange(offsetX + 15);
                  } else if (onPhotoOffsetXChange) {
                    onPhotoOffsetXChange(photoOffsetX + 15);
                  }
                }}
              >
                <AppIcon name="arrowRight" size={13} color="#FFFFFF" />
                <Text style={styles.directionalBtnText}>Phải</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.directionalBtn, styles.resetBtn]}
                onPress={() => {
                  if (alignTarget === 'hair') {
                    onScaleChange(1.0);
                    onRotationChange(0);
                    onOffsetXChange(0);
                    onOffsetYChange(0);
                  } else {
                    onPhotoScaleChange?.(1.0);
                    onPhotoRotationChange?.(0);
                    onPhotoOffsetXChange?.(0);
                    onPhotoOffsetYChange?.(0);
                  }
                }}
              >
                <AppIcon name="refresh" size={13} color="#FFFFFF" />
                <Text style={styles.directionalBtnText}>Về giữa</Text>
              </TouchableOpacity>
            </View>

            {/* Quick 90-degree Rotation Button if modifying Photo */}
            {alignTarget === 'photo' && onPhotoRotationChange && (
              <TouchableOpacity
                style={styles.rotate90Btn}
                onPress={() => onPhotoRotationChange((photoRotation + 90) % 360)}
                activeOpacity={0.8}
              >
                <AppIcon name="refresh" size={14} color="#B8895A" />
                <Text style={styles.rotate90Text}>🔄 Xoay ảnh 90° (chỉnh ảnh chụp ngang thành thẳng đứng)</Text>
              </TouchableOpacity>
            )}

            {/* Hint Note for User */}
            <Text style={styles.alignHintText}>
              💡 Mẹo: Bạn có thể nhấn giữ chuột/ngón tay để kéo thả trực tiếp trên ảnh, lăn chuột để phóng to/thu nhỏ nhanh.
            </Text>
          </View>
        )}

        {/* Tab 2: Hair Dye Palette */}
        {activeTab === 'color' && (
          <View style={styles.tabContent}>
            <Text style={styles.colorSubText}>
              Chọn màu nhuộm (màu sẽ cập nhật xem trước và truyền cho Model AI):
            </Text>
            <View style={styles.colorPaletteRow}>
              {HAIR_COLORS.map((c: HairColorOption) => {
                const isSelected = (hairColor.toLowerCase() === c.colorHex.toLowerCase()) || (!hairColor && c.id === 'natural');
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.colorItem, isSelected && styles.colorItemActive]}
                    onPress={() => onHairColorChange && onHairColorChange(c.colorHex)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c.colorHex },
                        isSelected && styles.colorCircleActive
                      ]}
                    />
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
    shadowColor: '#B8895A',
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
    backgroundColor: '#1E1A17',
    position: 'relative',
    borderWidth: 2.5,
    cursor: 'grab' as any
  },
  canvasActiveHair: {
    borderColor: '#B8895A',
  },
  canvasActivePhoto: {
    borderColor: '#48D1B7',
  },
  userPhotoWrapper: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F0E0D'
  },
  userPhotoTransformContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
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
    alignItems: 'center',
    pointerEvents: 'none'
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
    color: '#B8895A'
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
    backgroundColor: '#B8895A',
    borderColor: '#D8B98E'
  },
  miniRotateBtn: {
    flexDirection: 'row',
    width: 'auto',
    paddingHorizontal: 8,
    gap: 2,
    backgroundColor: 'rgba(46, 34, 24, 0.9)',
    borderColor: '#B8895A'
  },
  miniBtnLabel: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '700'
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
    color: '#DDCBB5',
    fontSize: 11,
    fontWeight: '500'
  },
  controlPanel: {
    width: '100%',
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3E7D8',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  tabHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F7EFE4',
    borderBottomWidth: 1,
    borderBottomColor: '#F3E7D8'
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
    borderBottomColor: '#B8895A'
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B8B7A'
  },
  tabLabelActive: {
    color: '#B8895A'
  },
  tabContent: {
    padding: 12
  },
  targetSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10
  },
  targetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F7EFE4',
    borderWidth: 1,
    borderColor: '#E8D8C4'
  },
  targetBtnActive: {
    backgroundColor: '#B8895A',
    borderColor: '#B8895A'
  },
  targetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8D7B68'
  },
  targetBtnTextActive: {
    color: '#FFFFFF'
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FAF5ED',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFE5D8'
  },
  metricText: {
    fontSize: 11,
    color: '#6F6255',
    fontWeight: '500'
  },
  metricHighlight: {
    color: '#B8895A',
    fontWeight: '700'
  },
  presetScaleRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8
  },
  presetScaleBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F7EFE4',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDCBB5'
  },
  presetScaleBtnActive: {
    backgroundColor: '#B8895A',
    borderColor: '#B8895A'
  },
  presetScaleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B8895A'
  },
  presetScaleTextActive: {
    color: '#FFFFFF'
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
    backgroundColor: '#F7EFE4',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDCBB5'
  },
  actionBtnText: {
    color: '#B8895A',
    fontSize: 11,
    fontWeight: '700'
  },
  directionalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#B8895A',
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
  rotate90Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F7EFE4',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDCBB5',
    marginBottom: 8
  },
  rotate90Text: {
    color: '#B8895A',
    fontSize: 11,
    fontWeight: '700'
  },
  alignHintText: {
    fontSize: 11,
    color: '#8D7B68',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16
  },
  colorSubText: {
    fontSize: 12,
    color: '#6F6255',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500'
  },
  colorPaletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6
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
    borderColor: '#EFE5D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  colorCircleActive: {
    borderColor: '#B8895A',
    borderWidth: 3,
    shadowColor: '#B8895A',
    shadowOpacity: 0.5,
    shadowRadius: 4
  },
  colorNameText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6F6255',
    textAlign: 'center'
  },
  colorNameTextActive: {
    color: '#B8895A',
    fontWeight: '700'
  },
  blendSubText: {
    fontSize: 12,
    color: '#6F6255',
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
    backgroundColor: '#F7EFE4',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDCBB5'
  },
  blendPillActive: {
    backgroundColor: '#B8895A',
    borderColor: '#B8895A'
  },
  blendPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B8895A'
  },
  blendPillTextActive: {
    color: '#FFFFFF'
  }
});
