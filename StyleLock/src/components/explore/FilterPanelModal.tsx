import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView
} from 'react-native';
import { LocalizedText as Text } from '../../i18n/LocalizedComponents';
import { AppIcon } from '../AppIcon';
import {
  EXPLORE_THEME,
  ExploreFilterState,
  DEFAULT_FILTERS,
  GenderFilter,
  LengthFilter,
  StyleTypeFilter,
  TextureFilter,
  AestheticFilter,
  SortOption
} from './ExploreTypes';

interface FilterPanelModalProps {
  visible: boolean;
  onClose: () => void;
  filters: ExploreFilterState;
  onApplyFilters: (filters: ExploreFilterState) => void;
  matchingCount: number;
}

export const FilterPanelModal: React.FC<FilterPanelModalProps> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
  matchingCount
}) => {
  const [draft, setDraft] = useState<ExploreFilterState>(filters);

  useEffect(() => {
    if (visible) {
      setDraft(filters);
    }
  }, [visible, filters]);

  const handleReset = () => {
    setDraft(DEFAULT_FILTERS);
  };

  const handleApply = () => {
    onApplyFilters(draft);
    onClose();
  };

  const GENDER_OPTIONS: { key: GenderFilter; label: string }[] = [
    { key: 'All', label: 'Tất cả' },
    { key: 'Men', label: 'Nam' },
    { key: 'Women', label: 'Nữ' }
  ];

  const LENGTH_OPTIONS: { key: LengthFilter; label: string }[] = [
    { key: 'All', label: 'Tất cả' },
    { key: 'Short', label: 'Ngắn' },
    { key: 'Medium', label: 'Trung bình' },
    { key: 'Long', label: 'Dài' }
  ];

  const STYLE_OPTIONS: { key: StyleTypeFilter; label: string }[] = [
    { key: 'All', label: 'Tất cả' },
    { key: 'Layer', label: 'Layer' },
    { key: 'Two Block', label: 'Two Block' },
    { key: 'Bob', label: 'Bob' },
    { key: 'Mullet', label: 'Mullet' },
    { key: 'Ivy League', label: 'Ivy League' },
    { key: 'Buzz Cut', label: 'Buzz Cut' },
    { key: 'Pixie', label: 'Pixie' },
    { key: 'Crop', label: 'Crop' },
    { key: 'Quiff', label: 'Quiff' },
    { key: 'Wolf Cut', label: 'Wolf Cut' },
    { key: 'Sóng lơi', label: 'Sóng lơi' }
  ];

  const TEXTURE_OPTIONS: { key: TextureFilter; label: string }[] = [
    { key: 'All', label: 'Tất cả' },
    { key: 'Straight', label: 'Thẳng' },
    { key: 'Wavy', label: 'Uốn gợn' },
    { key: 'Curly', label: 'Xoăn' }
  ];

  const AESTHETIC_OPTIONS: { key: AestheticFilter; label: string }[] = [
    { key: 'All', label: 'Tất cả' },
    { key: 'Korean', label: 'Hàn Quốc' },
    { key: 'Elegant', label: 'Lịch lãm' },
    { key: 'Edgy', label: 'Cá tính' },
    { key: 'Natural', label: 'Tự nhiên' }
  ];

  const SORT_OPTIONS: { key: SortOption; label: string }[] = [
    { key: 'featured', label: 'Nổi bật' },
    { key: 'popular', label: 'Phổ biến' },
    { key: 'name_asc', label: 'Tên A–Z' }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <SafeAreaView style={styles.sheetContainer}>
          <TouchableOpacity
            style={styles.sheetContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Drag Handle */}
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Bộ lọc kiểu tóc</Text>
                <Text style={styles.modalSubtitle}>Tùy chỉnh tiêu chí tìm kiếm chi tiết</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <AppIcon name="close" size={20} color={EXPLORE_THEME.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Filter Options Scrollable Body */}
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.bodyContent}
            >
              {/* Filter 1: Gender */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>GIỚI TÍNH</Text>
                <View style={styles.chipRow}>
                  {GENDER_OPTIONS.map((item) => {
                    const isActive = draft.gender === item.key;
                    return (
                      <TouchableOpacity
                        key={`gender-${item.key}`}
                        style={[styles.pill, isActive && styles.pillActive]}
                        onPress={() => setDraft({ ...draft, gender: item.key })}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Filter 2: Length */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>ĐỘ DÀI TÓC</Text>
                <View style={styles.chipRow}>
                  {LENGTH_OPTIONS.map((item) => {
                    const isActive = draft.length === item.key;
                    return (
                      <TouchableOpacity
                        key={`length-${item.key}`}
                        style={[styles.pill, isActive && styles.pillActive]}
                        onPress={() => setDraft({ ...draft, length: item.key })}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Filter 3: Style Type */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>KIỂU TÓC</Text>
                <View style={styles.chipRow}>
                  {STYLE_OPTIONS.map((item) => {
                    const isActive = draft.styleType === item.key;
                    return (
                      <TouchableOpacity
                        key={`style-${item.key}`}
                        style={[styles.pill, isActive && styles.pillActive]}
                        onPress={() => setDraft({ ...draft, styleType: item.key })}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Filter 4: Texture */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>KẾT CẤU TÓC</Text>
                <View style={styles.chipRow}>
                  {TEXTURE_OPTIONS.map((item) => {
                    const isActive = draft.texture === item.key;
                    return (
                      <TouchableOpacity
                        key={`texture-${item.key}`}
                        style={[styles.pill, isActive && styles.pillActive]}
                        onPress={() => setDraft({ ...draft, texture: item.key })}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Filter 5: Aesthetic */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>PHONG CÁCH</Text>
                <View style={styles.chipRow}>
                  {AESTHETIC_OPTIONS.map((item) => {
                    const isActive = draft.aesthetic === item.key;
                    return (
                      <TouchableOpacity
                        key={`aesthetic-${item.key}`}
                        style={[styles.pill, isActive && styles.pillActive]}
                        onPress={() => setDraft({ ...draft, aesthetic: item.key })}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Filter 6: Sort */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>SẮP XẾP THEO</Text>
                <View style={styles.chipRow}>
                  {SORT_OPTIONS.map((item) => {
                    const isActive = draft.sort === item.key;
                    return (
                      <TouchableOpacity
                        key={`sort-${item.key}`}
                        style={[styles.pill, isActive && styles.pillActive]}
                        onPress={() => setDraft({ ...draft, sort: item.key })}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={handleReset}
                activeOpacity={0.7}
              >
                <Text style={styles.resetBtnText}>Xóa bộ lọc</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyBtn}
                onPress={handleApply}
                activeOpacity={0.85}
              >
                <Text style={styles.applyBtnText}>
                  Áp dụng ({matchingCount})
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </SafeAreaView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    maxHeight: '85%'
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '100%',
    paddingBottom: 16
  },
  handleRow: {
    alignItems: 'center',
    paddingVertical: 10
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: EXPLORE_THEME.border
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: EXPLORE_THEME.border
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: EXPLORE_THEME.text
  },
  modalSubtitle: {
    fontSize: 12,
    color: EXPLORE_THEME.textSecondary,
    marginTop: 2
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: EXPLORE_THEME.tagBg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBody: {
    maxHeight: 460
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20
  },
  filterSection: {
    gap: 8
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: EXPLORE_THEME.textSecondary,
    letterSpacing: 0.5
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  pill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: EXPLORE_THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  pillActive: {
    backgroundColor: EXPLORE_THEME.primary,
    borderColor: EXPLORE_THEME.primary
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: EXPLORE_THEME.textSecondary
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: EXPLORE_THEME.border,
    gap: 12
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: EXPLORE_THEME.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: EXPLORE_THEME.textSecondary
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: EXPLORE_THEME.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
