import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Platform
} from 'react-native';
import { LocalizedText as Text } from '../i18n/LocalizedComponents';
import { AppIcon, AppIconName } from './AppIcon';

export interface CompactSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  buttonStep?: number;
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
  buttonStep,
  unit = '',
  icon,
  formatValue,
  onValueChange,
  accessibilityLabel
}) => {
  const [trackWidth, setTrackWidth] = useState<number>(0);
  const trackWidthRef = useRef<number>(0);
  trackWidthRef.current = trackWidth;

  const trackRef = useRef<View>(null);

  // Keep latest value in ref to prevent stale closures in event handlers
  const currentValueRef = useRef<number>(value);
  currentValueRef.current = value;

  const dragStartRef = useRef<{ value: number; touchX: number }>({ value, touchX: 0 });
  const repeatTimerRef = useRef<any>(null);

  // Clean up any hold-timer on unmount
  useEffect(() => {
    return () => {
      if (repeatTimerRef.current) {
        clearTimeout(repeatTimerRef.current);
        clearInterval(repeatTimerRef.current);
      }
    };
  }, []);

  const clampValue = (val: number): number => {
    const stepped = Math.round((val - min) / step) * step + min;
    return Math.max(min, Math.min(max, stepped));
  };

  const updateFromPosition = (relativeX: number, customWidth?: number) => {
    const w = customWidth ?? trackWidthRef.current;
    if (w <= 0) return;
    const boundedX = Math.max(0, Math.min(w, relativeX));
    const ratio = boundedX / w;
    const rawVal = min + ratio * (max - min);
    onValueChange(clampValue(rawVal));
  };

  // PanResponder for Mobile touch gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const touchX = evt.nativeEvent.locationX;
        dragStartRef.current = { value: currentValueRef.current, touchX };
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

  // Web-specific drag handler via mouse events for rock-solid tracking
  const handleWebMouseDown = (e: any) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const el = trackRef.current as any;
    if (!el?.getBoundingClientRect) return;

    const rect = el.getBoundingClientRect();
    const update = (clientX: number) => {
      const relativeX = clientX - rect.left;
      updateFromPosition(relativeX, rect.width);
    };

    update(e.clientX);

    const onMouseMove = (moveEvt: MouseEvent) => {
      moveEvt.preventDefault();
      update(moveEvt.clientX);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Step button delta: default 5 units for immediate noticeable change
  const stepDelta = buttonStep ?? (step >= 5 ? step : 5);

  const handleStepDown = () => {
    const next = clampValue(currentValueRef.current - stepDelta);
    onValueChange(next);
  };

  const handleStepUp = () => {
    const next = clampValue(currentValueRef.current + stepDelta);
    onValueChange(next);
  };

  // Auto-repeat when button is held down
  const startRepeating = (action: () => void) => {
    action();
    if (repeatTimerRef.current) {
      clearTimeout(repeatTimerRef.current);
      clearInterval(repeatTimerRef.current);
    }
    repeatTimerRef.current = setTimeout(() => {
      repeatTimerRef.current = setInterval(action, 80);
    }, 280);
  };

  const stopRepeating = () => {
    if (repeatTimerRef.current) {
      clearTimeout(repeatTimerRef.current);
      clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
  };

  // Usable track travel distance
  const safeRange = max - min || 1;
  const ratio = Math.max(0, Math.min(1, (value - min) / safeRange));
  const displayVal = formatValue ? formatValue(value) : `${value}${unit}`;

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
        {/* Decrease Button */}
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={handleStepDown}
          onPressIn={() => startRepeating(handleStepDown)}
          onPressOut={stopRepeating}
          activeOpacity={0.65}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel={`Giảm ${label}`}
        >
          <AppIcon name="minus" size={13} color="#8D7B68" />
        </TouchableOpacity>

        {/* Track and Thumb */}
        <View
          ref={trackRef}
          style={styles.trackWrapper}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          {...panResponder.panHandlers}
          // @ts-ignore Web mouse handler
          onMouseDown={handleWebMouseDown}
        >
          {/* pointerEvents="none" prevents children from stealing click coordinates */}
          <View style={styles.trackBg} pointerEvents="none" />
          <View style={[styles.trackActive, { width: activeWidth }]} pointerEvents="none" />
          <View style={[styles.thumb, { left: thumbLeft }]} pointerEvents="none" />
        </View>

        {/* Increase Button */}
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={handleStepUp}
          onPressIn={() => startRepeating(handleStepUp)}
          onPressOut={stopRepeating}
          activeOpacity={0.65}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={`Tăng ${label}`}
        >
          <AppIcon name="plus" size={13} color="#8D7B68" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
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
    fontSize: 13,
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
    minWidth: 48,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E8D8C4',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer', userSelect: 'none' }
    })
  },
  trackWrapper: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      web: { cursor: 'pointer', userSelect: 'none' }
    })
  },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EAE0D3'
  },
  trackActive: {
    position: 'absolute',
    left: 0,
    height: 6,
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
