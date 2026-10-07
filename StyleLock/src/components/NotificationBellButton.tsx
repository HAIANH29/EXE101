import React, { useCallback, useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { LocalizedText as Text } from '../i18n/LocalizedComponents';
import { useLanguage } from '../i18n/LanguageContext';
import { translateText } from '../i18n/translations';
import { useFocusEffect } from '@react-navigation/native';
import { AppIcon } from './AppIcon';
import { backendApi } from '../services/backendApi';

type NotificationBellButtonProps = {
  navigation: any;
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
};

export const NotificationBellButton = ({
  navigation,
  style,
  iconColor = '#B8895A'
}: NotificationBellButtonProps) => {
  const { language } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(() => {
    let active = true;

    const run = async () => {
      if (!backendApi.isAuthenticated()) {
        if (active) setUnreadCount(0);
        return;
      }

      try {
        const count = await backendApi.getUnreadNotificationCount();
        if (active) setUnreadCount(count);
      } catch {
        if (active) setUnreadCount(0);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(loadUnreadCount);

  return (
    <TouchableOpacity
      accessibilityLabel={translateText(language, 'Thông báo')}
      style={[styles.button, style]}
      onPress={() => navigation.navigate('Notifications')}
    >
      <View>
        <AppIcon name="bell" size={21} color={iconColor} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B65A4B',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12
  }
});

