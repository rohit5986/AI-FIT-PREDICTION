import React, { useContext } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import {
  BRANDS,
  CATEGORIES,
  getBrandById,
  getCategoryById,
  predictSize,
  getEquivalentSizes
} from './sizeCharts';
import { BrandDataContext } from './BrandDataContext';

export default function ResultScreen({ route, navigation }) {
  const { brands } = useContext(BrandDataContext);
  const params = route?.params || {};
  const measurements = params.measurements || {};
  const categoryId = params.category || CATEGORIES[0].id;
  const brandId = params.brandId || brands[0]?.id || BRANDS[0]?.id;

  if (!brandId) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Size Recommendation</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No Brand Chart Data</Text>
          <Text style={styles.cardText}>
            AI size prediction needs brand size-chart data. You can still shop products in the Shop tab.
          </Text>
        </View>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const brand = getBrandById(brandId, brands);
  const category = getCategoryById(categoryId);
  const prediction = predictSize({
    brandId,
    category: category.id,
    measurements,
    brandsOverride: brands
  });
  const equivalents = getEquivalentSizes({
    category: category.id,
    measurements,
    brandsOverride: brands
  });

  const handleContinueToStyleAI = () => {
    navigation.navigate('StyleAI', {
      fitSummary: {
        size: prediction.size,
        confidence: prediction.confidence,
        brandName: brand.name,
        categoryLabel: category.label,
        fitReason: prediction.fitReason,
        measurements
      },
      source: 'result-summary',
      seed: Date.now()
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Recommended Size</Text>
      <Text style={styles.size}>{prediction.size}</Text>
      <Text style={styles.brandLabel}>{brand.name}</Text>
      <Text style={styles.confidence}>Confidence: {prediction.confidence}</Text>
      <Text style={styles.coverage}>Data Coverage: {Math.round((prediction.measurementCoverage || 0) * 100)}%</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Inputs</Text>
        <Text style={styles.cardText}>Category: {category.label}</Text>
        <Text style={styles.cardText}>Height: {measurements.height} cm</Text>
        <Text style={styles.cardText}>Weight: {measurements.weight || 'Not provided'} kg</Text>
        <Text style={styles.cardText}>Chest: {measurements.chest} cm</Text>
        <Text style={styles.cardText}>Waist: {measurements.waist} cm</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Fit Explanation</Text>
        <Text style={styles.cardText}>{prediction.fitReason}</Text>
        {prediction.secondarySize ? (
          <Text style={styles.alternativeText}>Close alternative size: {prediction.secondarySize}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Equivalent Sizes Across Brands</Text>
        {equivalents.map((entry) => (
          <View key={entry.brandId} style={styles.equivalentRow}>
            <Text style={styles.equivalentBrand}>{entry.brandName}</Text>
            <Text style={styles.equivalentSize}>{entry.size}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.note}>
        Tip: Measurements differ across brands. Use the chart in the brand page for final check.
      </Text>

      <Pressable style={styles.nextButton} onPress={handleContinueToStyleAI}>
        <Text style={styles.nextButtonText}>Next: Continue to Style AI</Text>
      </Pressable>

      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Edit Measurements</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f6f5f2'
  },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', color: '#1a1a1a' },
  size: { fontSize: 48, fontWeight: '800', textAlign: 'center', color: '#1f2937' },
  brandLabel: { textAlign: 'center', fontSize: 16, marginTop: 4, color: '#6b7280' },
  confidence: { textAlign: 'center', fontSize: 14, marginTop: 6, color: '#92400e' },
  coverage: { textAlign: 'center', fontSize: 12, marginTop: 4, color: '#1d4ed8', fontWeight: '600' },
  card: {
    marginTop: 18,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#111827' },
  cardText: { fontSize: 14, color: '#374151', marginBottom: 4 },
  alternativeText: { fontSize: 13, color: '#1f2937', marginTop: 6, fontWeight: '600' },
  equivalentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  equivalentBrand: { fontSize: 14, color: '#111827' },
  equivalentSize: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  note: { marginTop: 16, fontSize: 12, color: '#6b7280', textAlign: 'center' },
  nextButton: {
    marginTop: 16,
    backgroundColor: '#0f766e',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center'
  },
  nextButtonText: { color: '#ecfeff', fontWeight: '700' },
  backButton: {
    marginTop: 16,
    backgroundColor: '#1f2937',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  backButtonText: { color: '#fef3c7', fontWeight: '600' }
});
