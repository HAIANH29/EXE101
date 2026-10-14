import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { LocalizedText as Text } from '../../i18n/LocalizedComponents';
import { EXPLORE_THEME, GenderFilter } from './ExploreTypes';

interface GenderTabsProps {
  selectedGender: GenderFilter;
  onSelectGender: (gender: GenderFilter) => void;
  maleCount: number;
  femaleCount: number;
  totalCount: number;
}

export const GenderTabs: React.FC<GenderTabsProps> = ({
  selectedGender,
  onSelectGender,
  maleCount,
  femaleCount,
  totalCount
}) => {
  const tabs: { key: GenderFilter; label: string; count: number }[] = [
    { key: 'All', label: 'Tất cả', count: totalCount },
    { key: 'Men', label: 'Nam', count: maleCount },
    { key: 'Women', label: 'Nữ', count: femaleCount }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.segmentedControl}>
        {tabs.map((tab) => {
          const isActive = selectedGender === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => onSelectGender(tab.key)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} (${tab.count} kiểu)`}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              <View style={[styles.pillCount, isActive && styles.pillCountActive]}>
                <Text style={[styles.pillCountText, isActive && styles.pillCountTextActive]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: EXPLORE_THEME.background
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: EXPLORE_THEME.border
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6
  },
  tabBtnActive: {
    backgroundColor: EXPLORE_THEME.primary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: EXPLORE_THEME.textSecondary
  },
  tabTextActive: {
    color: '#FFFFFF'
  },
  pillCount: {
    backgroundColor: EXPLORE_THEME.tagBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10
  },
  pillCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)'
  },
  pillCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: EXPLORE_THEME.primaryDark
  },
  pillCountTextActive: {
    color: '#FFFFFF'
  }
});
