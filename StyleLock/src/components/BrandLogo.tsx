import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export const STYLELOCK_LOGO_SOURCE = require('../../assets/stylelock-logo-transparent.png');

type BrandLogoProps = {
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export const BrandLogo: React.FC<BrandLogoProps> = ({ containerStyle, imageStyle }) => (
  <View style={[styles.container, containerStyle]}>
    <Image source={STYLELOCK_LOGO_SOURCE} style={[styles.image, imageStyle]} resizeMode="contain" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible'
  },
  image: {
    width: '100%',
    height: '100%'
  }
});
