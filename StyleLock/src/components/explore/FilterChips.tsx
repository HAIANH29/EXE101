import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { LocalizedText as Text } from '../../i18n/LocalizedComponents';
import { AppIcon } from '../AppIcon';
import { EXPLORE_THEME, ExploreFilterState } from './ExploreTypes';

interface FilterChipsProps {
  filters: ExploreFilterState;
  onOpenFilterModal: () => void;
  onClearFilters: () => void;
  onSelectLength: (length: ExploreFilterState['length']) => void;
  onSelectTexture: (texture: ExploreFilterState['texture']) => void;
  onSelectSort: (sort: ExploreFilterState['sort']) => void;
  activeFilterCount: number;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  onOpenFilterModal,
  onClearFilters,
  onSelectLength,
  onSelectTexture,
  onSelectSort,
  activeFilterCount
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Reset filter button if any active */}
        {activeFilterCount > 0 && (
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={onClearFilters}
            activeOpacity={0.7}
            accessibilityLabel="Xóa tất cả bộ lọc"
          >
            <AppIcon name="close" size={13} color="#C44D3F" />
            <Text style={styles.resetBtnText}>Xóa bộ lọc ({activeFilterCount})</Text>
          </TouchableOpacity>
        )}

        {/* Length Quick Chips */}
        <TouchableOpacity
          style={[styles.chip, filters.length === 'Short' && styles.chipActive]}
          onPress={() => onSelectLength(filters.length === 'Short' ? 'All' : 'Short')}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, filters.length === 'Short' && styles.chipTextActive]}>
            Tóc ngắn
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filters.length === 'Medium' && styles.chipActive]}
          onPress={() => onSelectLength(filters.length === 'Medium' ? 'All' : 'Medium')}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, filters.length === 'Medium' && styles.chipTextActive]}>
            Trung bình
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filters.length === 'Long' && styles.chipActive]}
          onPress={() => onSelectLength(filters.length === 'Long' ? 'All' : 'Long')}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, filters.length === 'Long' && styles.chipTextActive]}>
            Tóc dài
          </Text>
        </TouchableOpacity>

        {/* Texture Quick Chips */}
        <TouchableOpacity
          style={[styles.chip, filters.texture === 'Wavy' && styles.chipActive]}
          onPress={() => onSelectTexture(filters.texture === 'Wavy' ? 'All' : 'Wavy')}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, filters.texture === 'Wavy' && styles.chipTextActive]}>
            Uốn sóng
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filters.texture === 'Curly' && styles.chipActive]}
          onPress={() => onSelectTexture(filters.texture === 'Curly' ? 'All' : 'Curly')}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, filters.texture === 'Curly' && styles.chipTextActive]}>
            Xoăn bồng
          </Text>
        </TouchableOpacity>

        {/* Sort Chip */}
        <TouchableOpacity
          style={[styles.chip, filters.sort === 'name_asc' && styles.chipActive]}
          onPress={() => onSelectSort(filters.sort === 'name_asc' ? 'featured' : 'name_asc')}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, filters.sort === 'name_asc' && styles.chipTextActive]}>
            {filters.sort === 'name_asc' ? 'Tên: A-Z' : 'Sắp xếp A-Z'}
          </Text>
        </TouchableOpacity>

        {/* All Filters Button */}
        <TouchableOpacity
          style={styles.moreFilterBtn}
          onPress={onOpenFilterModal}
          activeOpacity={0.7}
        >
          <Text style={styles.moreFilterBtnText}>+ Thêm bộ lọc</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    backgroundColor: EXPLORE_THEME.background
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center'
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBEBE8',
    borderColor: '#E8B9B3',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C44D3F'
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderColor: EXPLORE_THEME.border,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20
  },
  chipActive: {
    backgroundColor: EXPLORE_THEME.primary,
    borderColor: EXPLORE_THEME.primary
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: EXPLORE_THEME.textSecondary
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  moreFilterBtn: {
    backgroundColor: EXPLORE_THEME.tagBg,
    borderColor: EXPLORE_THEME.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20
  },
  moreFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: EXPLORE_THEME.primaryDark
  }
});
