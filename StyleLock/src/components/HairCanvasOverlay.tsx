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
import { CompactSlider } from './CompactSlider';
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
  onOpacityChange
}) => {
  const [activeTab, setActiveTab] = useState<'align' | 'color' | 'blend'>('align');
  const [alignTarget, setAlignTarget] = useState<'hair' | 'photo'>('hair');
  const [isComparingOriginal, setIsComparingOriginal] = useState<boolean>(false);
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(true);
  const [showNudgeControls, setShowNudgeControls] = useState<boolean>(false);

  const handleResetActiveTarget = () => {
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
  };

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
            {/* Target Selector Switcher: Hair vs Photo + Reset */}
            <View style={styles.targetHeaderRow}>
              <View style={styles.segmentedControl} accessibilityRole="tablist">
                <TouchableOpacity
                  style={[styles.segmentBtn, alignTarget === 'hair' && styles.segmentBtnActive]}
                  onPress={() => setAlignTarget('hair')}
                  activeOpacity={0.8}
                  accessibilityRole="tab"
                  accessibilityLabel="Chỉnh mẫu tóc"
                >
                  <AppIcon
                    name="scissors"
                    size={13}
                    color={alignTarget === 'hair' ? '#FFFFFF' : '#8D7B68'}
                  />
                  <Text style={[styles.segmentBtnText, alignTarget === 'hair' && styles.segmentBtnTextActive]}>
                    Mẫu tóc
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.segmentBtn, alignTarget === 'photo' && styles.segmentBtnActive]}
                  onPress={() => setAlignTarget('photo')}
                  activeOpacity={0.8}
                  accessibilityRole="tab"
                  accessibilityLabel="Chỉnh ảnh mặt"
                >
                  <AppIcon
                    name="user"
                    size={13}
                    color={alignTarget === 'photo' ? '#FFFFFF' : '#8D7B68'}
                  />
                  <Text style={[styles.segmentBtnText, alignTarget === 'photo' && styles.segmentBtnTextActive]}>
                    Ảnh mặt
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.compactResetBtn}
                onPress={handleResetActiveTarget}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Đặt lại"
              >
                <AppIcon name="refresh" size={13} color="#8D7B68" />
                <Text style={styles.compactResetText}>Đặt lại</Text>
              </TouchableOpacity>
            </View>

            {/* Scale Range Slider (50% - 150%) */}
            <CompactSlider
              label="Kích thước"
              icon="zoomIn"
              min={50}
              max={150}
              step={1}
              unit="%"
              value={Math.round((alignTarget === 'hair' ? scale : photoScale) * 100)}
              onValueChange={(pct) => {
                const nextScale = Number((pct / 100).toFixed(2));
                if (alignTarget === 'hair') {
                  onScaleChange(nextScale);
                } else if (onPhotoScaleChange) {
                  onPhotoScaleChange(nextScale);
                }
              }}
              accessibilityLabel={`Kích thước ${alignTarget === 'hair' ? 'mẫu tóc' : 'ảnh mặt'}`}
            />

            {/* Rotation Range Slider (-45° to +45°) */}
            <CompactSlider
              label="Góc xoay"
              icon="rotateLeft"
              min={-45}
              max={45}
              step={1}
              value={alignTarget === 'hair' ? rotation : photoRotation}
              formatValue={(deg) => (deg > 0 ? `+${deg}°` : `${deg}°`)}
              onValueChange={(deg) => {
                if (alignTarget === 'hair') {
                  onRotationChange(deg);
                } else if (onPhotoRotationChange) {
                  onPhotoRotationChange(deg);
                }
              }}
              accessibilityLabel={`Góc xoay ${alignTarget === 'hair' ? 'mẫu tóc' : 'ảnh mặt'}`}
            />

            {/* Quick 90-degree Rotation Button if modifying Photo */}
            {alignTarget === 'photo' && onPhotoRotationChange && (
              <TouchableOpacity
                style={styles.compactRotate90Btn}
                onPress={() => onPhotoRotationChange((photoRotation + 90) % 360)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Xoay ảnh 90 độ"
              >
                <AppIcon name="refresh" size={12} color="#B8895A" />
                <Text style={styles.compactRotate90Text}>Xoay ảnh 90° (đổi chiều chụp)</Text>
              </TouchableOpacity>
            )}

            {/* Simplified Subtle Caption */}
            <Text style={styles.dragCaption}>Kéo trực tiếp trên ảnh để căn chỉnh vị trí.</Text>

            {/* Collapsible fine position adjustment fallback */}
            <TouchableOpacity
              style={styles.nudgeToggleRow}
              onPress={() => setShowNudgeControls(!showNudgeControls)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={showNudgeControls ? 'Ẩn tinh chỉnh pixel' : 'Hiện tinh chỉnh pixel'}
            >
              <Text style={styles.nudgeToggleText}>
                {showNudgeControls ? 'Ẩn tinh chỉnh pixel' : 'Tinh chỉnh pixel (X, Y)'}
              </Text>
              <AppIcon name={showNudgeControls ? 'close' : 'settings'} size={11} color="#9B8B7A" />
            </TouchableOpacity>

            {showNudgeControls && (
              <View style={styles.nudgePadRow}>
                <Text style={styles.nudgeCoordText}>
                  X={alignTarget === 'hair' ? offsetX : photoOffsetX}px • Y={alignTarget === 'hair' ? offsetY : photoOffsetY}px
                </Text>
                <View style={styles.nudgeBtnGroup}>
                  <TouchableOpacity
                    style={styles.nudgeMiniBtn}
                    onPress={() => {
                      if (alignTarget === 'hair') onOffsetXChange(offsetX - 2);
                      else onPhotoOffsetXChange?.(photoOffsetX - 2);
                    }}
                    accessibilityLabel="Dời sang trái 2px"
                  >
                    <Text style={styles.nudgeMiniBtnText}>←</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.nudgeMiniBtn}
                    onPress={() => {
                      if (alignTarget === 'hair') onOffsetXChange(offsetX + 2);
                      else onPhotoOffsetXChange?.(photoOffsetX + 2);
                    }}
                    accessibilityLabel="Dời sang phải 2px"
                  >
                    <Text style={styles.nudgeMiniBtnText}>→</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.nudgeMiniBtn}
                    onPress={() => {
                      if (alignTarget === 'hair') onOffsetYChange(offsetY - 2);
                      else onPhotoOffsetYChange?.(photoOffsetY - 2);
                    }}
                    accessibilityLabel="Dời lên 2px"
                  >
                    <Text style={styles.nudgeMiniBtnText}>↑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.nudgeMiniBtn}
                    onPress={() => {
                      if (alignTarget === 'hair') onOffsetYChange(offsetY + 2);
                      else onPhotoOffsetYChange?.(photoOffsetY + 2);
                    }}
                    accessibilityLabel="Dời xuống 2px"
                  >
                    <Text style={styles.nudgeMiniBtnText}>↓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  targetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  segmentedControl: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FAF5EE',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E8D8C4',
    marginRight: 8
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 9
  },
  segmentBtnActive: {
    backgroundColor: '#B8895A'
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8D7B68'
  },
  segmentBtnTextActive: {
    color: '#FFFFFF'
  },
  compactResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF5EE',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8D8C4'
  },
  compactResetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8D7B68'
  },
  compactRotate90Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FAF5EE',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8D8C4',
    marginBottom: 8,
    alignSelf: 'center'
  },
  compactRotate90Text: {
    color: '#B8895A',
    fontSize: 11,
    fontWeight: '600'
  },
  dragCaption: {
    fontSize: 12,
    color: '#8D7B68',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 4
  },
  nudgeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 4
  },
  nudgeToggleText: {
    fontSize: 11,
    color: '#9B8B7A',
    fontWeight: '500'
  },
  nudgePadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF5EE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#EFE5D8'
  },
  nudgeCoordText: {
    fontSize: 11,
    color: '#8D7B68',
    fontWeight: '500'
  },
  nudgeBtnGroup: {
    flexDirection: 'row',
    gap: 4
  },
  nudgeMiniBtn: {
    width: 26,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D8C4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  nudgeMiniBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F6255'
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
