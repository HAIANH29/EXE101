import React from 'react';
import { StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';

type FeatherName = keyof typeof Feather.glyphMap;

export type AppIconName =
  | 'menu'
  | 'bell'
  | 'home'
  | 'search'
  | 'camera'
  | 'calendar'
  | 'user'
  | 'heart'
  | 'heartFilled'
  | 'salon'
  | 'sparkle'
  | 'bot'
  | 'share'
  | 'tool'
  | 'scissors'
  | 'bottle'
  | 'pin'
  | 'qr'
  | 'star'
  | 'phone'
  | 'clock'
  | 'money'
  | 'message'
  | 'close'
  | 'check'
  | 'upload'
  | 'refresh'
  | 'barChart'
  | 'shield'
  | 'card'
  | 'arrowRight'
  | 'edit'
  | 'moon'
  | 'logout'
  | 'info'
  | 'zoomIn'
  | 'zoomOut'
  | 'rotateLeft'
  | 'lightbulb'
  | 'arrowLeft'
  | 'warning'
  | 'eye'
  | 'eyeOff'
  | 'settings'
  | 'trendingUp';

const ICON_MAP: Record<AppIconName, FeatherName> = {
  menu: 'menu',
  bell: 'bell',
  home: 'home',
  search: 'search',
  camera: 'camera',
  calendar: 'calendar',
  user: 'user',
  heart: 'heart',
  heartFilled: 'heart',
  salon: 'briefcase',
  sparkle: 'aperture',
  bot: 'cpu',
  share: 'share-2',
  tool: 'tool',
  scissors: 'scissors',
  bottle: 'droplet',
  pin: 'map-pin',
  qr: 'grid',
  star: 'star',
  phone: 'phone',
  clock: 'clock',
  money: 'credit-card',
  message: 'message-circle',
  close: 'x',
  check: 'check',
  upload: 'upload',
  refresh: 'refresh-cw',
  barChart: 'bar-chart-2',
  shield: 'shield',
  card: 'credit-card',
  arrowRight: 'arrow-right',
  edit: 'edit-2',
  moon: 'moon',
  logout: 'log-out',
  info: 'info',
  zoomIn: 'zoom-in',
  zoomOut: 'zoom-out',
  rotateLeft: 'rotate-ccw',
  lightbulb: 'zap',
  arrowLeft: 'arrow-left',
  warning: 'alert-triangle',
  eye: 'eye',
  eyeOff: 'eye-off',
  settings: 'settings',
  trendingUp: 'trending-up'
};

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: TextStyle;
};

export const AppIcon = ({ name, size = 20, color = '#A97845', style }: AppIconProps) => {
  if (name === 'heartFilled') {
    return <Ionicons name="heart" size={size} color={color} style={style} />;
  }
  if (name === 'heart') {
    return <Ionicons name="heart-outline" size={size} color={color} style={style} />;
  }
  return <Feather name={ICON_MAP[name]} size={size} color={color} style={style} />;
};

type IconBadgeProps = AppIconProps & {
  backgroundColor?: string;
  borderColor?: string;
  containerStyle?: ViewStyle;
};

export const IconBadge = ({
  name,
  size = 18,
  color = '#A97845',
  backgroundColor = '#EAD7BF',
  borderColor = 'rgba(169, 120, 69, 0.16)',
  containerStyle,
  style
}: IconBadgeProps) => (
  <View style={[styles.badge, { backgroundColor, borderColor }, containerStyle]}>
    <AppIcon name={name} size={size} color={color} style={style} />
  </View>
);

const styles = StyleSheet.create({
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  }
});