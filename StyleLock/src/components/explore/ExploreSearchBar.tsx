import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { LocalizedTextInput as TextInput, LocalizedText as Text } from '../../i18n/LocalizedComponents';
import { AppIcon } from '../AppIcon';
import { EXPLORE_THEME } from './ExploreTypes';

interface ExploreSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onOpenFilter: () => void;
  activeFilterCount: number;
}

export const ExploreSearchBar: React.FC<ExploreSearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  onOpenFilter,
  activeFilterCount
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <AppIcon name="search" size={18} color={EXPLORE_THEME.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Tìm tên kiểu tóc, phong cách..."
          placeholderTextColor={EXPLORE_THEME.textMuted}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {value.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={onClear}
            activeOpacity={0.7}
            accessibilityLabel="Xóa nội dung tìm kiếm"
          >
            <AppIcon name="close" size={16} color={EXPLORE_THEME.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
        onPress={onOpenFilter}
        activeOpacity={0.8}
        accessibilityLabel="Mở bộ lọc nâng cao"
      >
        <AppIcon
          name="settings"
          size={18}
          color={activeFilterCount > 0 ? '#FFFFFF' : EXPLORE_THEME.primary}
        />
        {activeFilterCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: EXPLORE_THEME.background
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: EXPLORE_THEME.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46
  },
  searchIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: EXPLORE_THEME.text,
    paddingVertical: 0
  },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: EXPLORE_THEME.tagBg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: EXPLORE_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  filterBtnActive: {
    backgroundColor: EXPLORE_THEME.primary,
    borderColor: EXPLORE_THEME.primary
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#C44D3F',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF'
  }
});
