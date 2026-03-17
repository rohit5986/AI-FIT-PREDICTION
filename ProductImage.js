import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

function normalizeImageUrl(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return '';
}

export default function ProductImage({
  imageUrl,
  fallback = '👕',
  containerStyle,
  imageStyle,
  fallbackTextStyle,
  resizeMode = 'cover'
}) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const uri = useMemo(() => normalizeImageUrl(imageUrl), [imageUrl]);

  useEffect(() => {
    setHasLoadError(false);
  }, [uri]);

  const showImage = Boolean(uri) && !hasLoadError;

  return (
    <View style={[styles.container, containerStyle]}>
      {showImage ? (
        <Image
          source={{ uri }}
          style={[styles.image, imageStyle]}
          resizeMode={resizeMode}
          onError={() => setHasLoadError(true)}
        />
      ) : (
        <Text style={[styles.fallbackText, fallbackTextStyle]}>{fallback}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  fallbackText: {
    fontSize: 40
  }
});
