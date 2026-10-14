import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { LocalizedText as Text } from '../../i18n/LocalizedComponents';
import { AppIcon } from '../AppIcon';
import { NotificationBellButton } from '../NotificationBellButton';
import { EXPLORE_THEME } from './ExploreTypes';

interface ExploreHeaderProps {
  navigation: any;
  totalCount: number;
}

export const ExploreHeader: React.FC<ExploreHeaderProps> = ({ navigation, totalCount }) => {
  return (
    <View style={styles.headerContainer}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.7}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }}
          accessibilityLabel="Trang chủ"
        >
          <AppIcon name="menu" size={22} color={EXPLORE_THEME.primary} />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>StyleLock</Text>

        <View style={styles.topRightActions}>
          <NotificationBellButton navigation={navigation} style={styles.iconBtn} iconColor={EXPLORE_THEME.primary} />
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Profile')}
            accessibilityLabel="Hồ sơ cá nhân"
          >
            <AppIcon name="user" size={20} color={EXPLORE_THEME.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Title & Subtitle */}
      <View style={styles.titleSection}>
        <View style={styles.titleRow}>
          <Text style={styles.mainTitle}>Khám phá kiểu tóc</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{totalCount} kiểu</Text>
          </View>
        </View>
        <Text style={styles.subTitle}>Tìm phong cách phù hợp với bạn</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: EXPLORE_THEME.background,
    borderBottomWidth: 1,
    borderBottomColor: EXPLORE_THEME.border
  },
  topBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(250, 247, 242, 0.95)'
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: EXPLORE_THEME.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: EXPLORE_THEME.primary,
    letterSpacing: -0.5
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: EXPLORE_THEME.text,
    letterSpacing: -0.5
  },
  countBadge: {
    backgroundColor: EXPLORE_THEME.tagBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: EXPLORE_THEME.border
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: EXPLORE_THEME.primaryDark
  },
  subTitle: {
    fontSize: 14,
    color: EXPLORE_THEME.textSecondary,
    marginTop: 4
  }
});
