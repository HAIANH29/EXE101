import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LocalizedText as Text } from '../i18n/LocalizedComponents';

type DataStateProps = {
  loading?: boolean;
  error?: string;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
};

/** Renders loading / error / empty feedback; returns null when there is data to show. */
export const DataState: React.FC<DataStateProps> = ({ loading, error, empty, emptyText, onRetry }) => {
  if (loading) {
    return (
      <View style={styles.box}>
        <ActivityIndicator color="#B8895A" />
        <Text style={styles.text}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.box}>
        <Text style={styles.text}>{error}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (empty) {
    return (
      <View style={styles.box}>
        <Text style={styles.text}>{emptyText || 'Chưa có dữ liệu.'}</Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 10
  },
  text: {
    color: '#6F6255',
    fontSize: 14,
    textAlign: 'center'
  },
  retryBtn: {
    backgroundColor: '#B8895A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 22
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700'
  }
});
