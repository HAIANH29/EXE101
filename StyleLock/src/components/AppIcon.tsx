import { StyleProp, StyleSheet, TextStyle, View, ViewStyle, Platform } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Font from 'expo-font';

if (Platform.OS === 'web') {
  Font.loadAsync({
    ...Feather.font,
    ...Ionicons.font,
    Feather: Feather.font.feather,
    Ionicons: Ionicons.font.ionicons
  }).catch(() => {});

  if (typeof document !== 'undefined') {
    const styleId = 'expo-vector-icons-web-fallback';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.type = 'text/css';
      style.appendChild(
        document.createTextNode(`
          @font-face {
            font-family: 'feather';
            src: url('https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.woff') format('woff'),
                 url('https://cdnjs.cloudflare.com/ajax/libs/feather-icons/4.29.0/feather.woff') format('woff');
          }
          @font-face {
            font-family: 'Feather';
            src: url('https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.woff') format('woff');
          }
          @font-face {
            font-family: 'ionicons';
            src: url('https://cdnjs.cloudflare.com/ajax/libs/ionicons/2.0.1/fonts/ionicons.woff') format('woff');
          }
          @font-face {
            font-family: 'Ionicons';
            src: url('https://cdnjs.cloudflare.com/ajax/libs/ionicons/2.0.1/fonts/ionicons.woff') format('woff');
          }
        `)
      );
      document.head.appendChild(style);
    }
  }
}

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
  | 'trendingUp'
  | 'arrowUp'
  | 'download'
  | 'wifi'
  | 'plus'
  | 'minus'
  | 'trash';

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
  download: 'download',
  refresh: 'refresh-cw',
  barChart: 'bar-chart-2',
  shield: 'shield',
  card: 'credit-card',
  arrowRight: 'arrow-right',
  arrowUp: 'arrow-up',
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
  trendingUp: 'trending-up',
  wifi: 'wifi',
  plus: 'plus',
  minus: 'minus',
  trash: 'trash-2'
};

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: TextStyle;
};

export const AppIcon = ({ name, size = 20, color = '#B8895A', style }: AppIconProps) => {
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
  containerStyle?: StyleProp<ViewStyle>;
};

export const IconBadge = ({
  name,
  size = 18,
  color = '#B8895A',
  backgroundColor = '#F3E7D8',
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

