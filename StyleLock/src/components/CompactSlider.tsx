import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState
} from 'react-native';
import { LocalizedText as Text } from '../i18n/LocalizedComponents';
import { AppIcon, AppIconName } from './AppIcon';

export interface CompactSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  icon?: AppIconName;
  formatValue?: (val: number) => string;
  onValueChange: (val: number) => void;
  accessibilityLabel?: string;
}

const THUMB_SIZE = 18;

export const CompactSlider: React.FC<CompactSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  icon,
  formatValue,
  onValueChange,
  accessibilityLabel
}) => {
  const [trackWidth, setTrackWidth] = useState<number>(0);
  const trackWidthRef = useRef<number>(0);
  trackWidthRef.current = trackWidth;

  const dragStartRef = useRef<{ value: number; touchX: number }>({ value, touchX: 0 });

  const clampValue = (val: number): number => {
    const stepped = Math.round((val - min) / step) * step + min;
    return Math.max(min, Math.min(max, stepped));
  };

  const updateFromPosition = (relativeX: number) => {
    const w = trackWidthRef.current;
    if (w <= 0) return;
    const boundedX = Math.max(0, Math.min(w, relativeX));
    const ratio = boundedX / w;
    const rawVal = min + ratio * (max - min);
    onValueChange(clampValue(rawVal));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const touchX = evt.nativeEvent.locationX;
        dragStartRef.current = { value, touchX };
        updateFromPosition(touchX);
      },
      onPanResponderMove: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const w = trackWidthRef.current;
        if (w <= 0) return;
        const currentX = dragStartRef.current.touchX + gestureState.dx;
        updateFromPosition(currentX);
      }
    })
  ).current;

  // Percentage for thumb position
  const safeRange = max - min || 1;
  const ratio = Math.max(0, Math.min(1, (value - min) / safeRange));
  const displayVal = formatValue ? formatValue(value) : `${value}${unit}`;

  const handleStepDown = () => {
    onValueChange(clampValue(value - step));
  };

  const handleStepUp = () => {
    onValueChange(clampValue(value + step));
  };

  // Usable track travel distance
  const usableWidth = Math.max(0, trackWidth - THUMB_SIZE);
  const thumbLeft = trackWidth > 0 ? ratio * usableWidth : 0;
  const activeWidth = trackWidth > 0 ? ratio * usableWidth + THUMB_SIZE / 2 : 0;

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityValue={{ min, max, now: value }}
    >
      <View style={styles.headerRow}>
        <View style={styles.labelGroup}>
          {icon && <AppIcon name={icon} size={14} color="#8D7B68" style={styles.labelIcon} />}
          <Text style={styles.labelText}>{label}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayVal}</Text>
        </View>
      </View>

      <View style={styles.controlRow}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={handleStepDown}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
          accessibilityLabel={`Giảm ${label}`}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>

        <View
          style={styles.trackWrapper}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          {...panResponder.panHandlers}
        >
          <View style={styles.trackBg} />
          <View style={[styles.trackActive, { width: activeWidth }]} />
          <View style={[styles.thumb, { left: thumbLeft }]} />
        </View>

        <TouchableOpacity
          style={styles.stepBtn}
          onPress={handleStepUp}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          accessibilityLabel={`Tăng ${label}`}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  labelIcon: {
    marginRight: 2
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6F6255'
  },
  badge: {
    backgroundColor: '#FAF5EE',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFE5D8',
    minWidth: 46,
    alignItems: 'center'
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B8895A'
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E8D8C4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8D7B68',
    lineHeight: 18,
    textAlign: 'center'
  },
  trackWrapper: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    position: 'relative'
  },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#EAE0D3'
  },
  trackActive: {
    position: 'absolute',
    left: 0,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#B8895A'
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#B8895A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.18,
    shadowRadius: 2.5,
    elevation: 3
  }
});
