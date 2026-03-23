import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { CATEGORIES } from './sizeCharts';
import { BrandDataContext } from './BrandDataContext';
import { UserProfileContext } from './UserProfileContext';
import { getPersonalizedRecommendations } from './productsData';
import ProductImage from './ProductImage';

const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

export default function MeasurementScreen({ navigation }) {
  const { brands } = useContext(BrandDataContext);
  const { profile } = useContext(UserProfileContext);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [audience, setAudience] = useState('all');
  const [error, setError] = useState('');
  const [recommendationResult, setRecommendationResult] = useState(null);

  const categoryOptions = useMemo(() => CATEGORIES, []);
  const audienceOptions = useMemo(
    () => [
      { id: 'all', label: 'All' },
      { id: 'men', label: 'Men' },
      { id: 'women', label: 'Women' }
    ],
    []
  );
  const hasBrandChartData = Array.isArray(brands) && brands.length > 0;

  useEffect(() => {
    const saved = profile?.measurements || {};
    setHeight(saved.height ? String(saved.height) : '');
    setWeight(saved.weight ? String(saved.weight) : '');
    setChest(saved.chest ? String(saved.chest) : '');
    setWaist(saved.waist ? String(saved.waist) : '');
    setAudience(profile?.audience || 'all');
  }, [profile]);

  const formatBrandLabel = (brandId) =>
    String(brandId || '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b(menswear|womenswear|kidswear|unisex)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const toNumber = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const parseMeasurements = () => {
    const parsed = {
      height: toNumber(height),
      weight: toNumber(weight),
      chest: toNumber(chest),
      waist: toNumber(waist)
    };

    const missing = [];
    if (parsed.height === null) missing.push('height');
    if (parsed.chest === null) missing.push('chest');
    if (parsed.waist === null) missing.push('waist');

    return { parsed, missing };
  };

  const handleSubmit = () => {
    const { parsed, missing } = parseMeasurements();

    if (missing.length > 0) {
      setError(`Please enter valid numbers for: ${missing.join(', ')}.`);
      return;
    }

    const personalized = getPersonalizedRecommendations({
      measurements: parsed,
      category,
      audience,
      preferredBrandIds: profile?.preferredBrands || [],
      limitProducts: 8,
      limitBrands: 5
    });

    setError('');
    setRecommendationResult({
      ...personalized,
      measurements: parsed,
      category
    });
  };

  const handleOpenDetailedBrandAI = () => {
    const { parsed, missing } = parseMeasurements();
    if (missing.length > 0) {
      setError(`Please enter valid numbers for: ${missing.join(', ')}.`);
      return;
    }

    if (!hasBrandChartData) {
      Alert.alert(
        'Brand chart data missing',
        'Detailed brand AI needs chart data. You can still use the precise product suggestions below.'
      );
      return;
    }

    setError('');
    navigation.navigate('BrandRecommendation', {
      measurements: parsed,
      category
    });
  };

  const navigateToProductDetail = (product) => {
    navigation.navigate('Shopping', {
      screen: 'ProductDetail',
      params: { product }
    });
  };

  const renderChips = (options, selectedId, onSelect) => (
    <View style={styles.chipGroup}>
      {options.map((option) => {
        const selected = option.id === selectedId;
        return (
          <Pressable
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {option.label || option.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Home Fit Finder</Text>
        <Text style={styles.subtitle}>
          Enter your fit details once and get precise brand and product suggestions instantly.
        </Text>

        {Array.isArray(profile?.preferredBrands) && profile.preferredBrands.length > 0 ? (
          <View style={styles.profileHintBox}>
            <Text style={styles.profileHintText}>
              Using your saved profile preferences ({profile.preferredBrands.length} preferred brands).
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Clothing Type</Text>
        {renderChips(categoryOptions, category, setCategory)}

        <Text style={styles.sectionLabel}>Audience</Text>
        {renderChips(audienceOptions, audience, setAudience)}

        <TextInput
          style={styles.input}
          placeholder="Height (cm)"
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
        />
        <TextInput
          style={styles.input}
          placeholder="Weight (kg) - optional"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />
        <TextInput
          style={styles.input}
          placeholder="Chest (cm)"
          keyboardType="numeric"
          value={chest}
          onChangeText={setChest}
        />
        <TextInput
          style={styles.input}
          placeholder="Waist (cm)"
          keyboardType="numeric"
          value={waist}
          onChangeText={setWaist}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Get Precise Suggestions</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleOpenDetailedBrandAI}>
          <Text style={styles.secondaryButtonText}>Open Detailed Brand AI</Text>
        </Pressable>

        {recommendationResult ? (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Your Personalized Results</Text>

            {!hasBrandChartData ? (
              <View style={styles.analysisModeBanner}>
                <Text style={styles.analysisModeText}>
                  Product-based analysis mode: brand chart data is not loaded yet, so fit precision is approximate.
                </Text>
              </View>
            ) : null}

            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Suggested Size</Text>
                <Text style={styles.summaryValue}>{recommendationResult.suggestedSize}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Top Brands</Text>
                <Text style={styles.summaryValue}>{recommendationResult.topBrands.length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Products Scanned</Text>
                <Text style={styles.summaryValue}>{recommendationResult.totalCandidates}</Text>
              </View>
            </View>

            {recommendationResult.preferredBrandsApplied > 0 ? (
              <Text style={styles.profileAppliedText}>
                Preferred-brand boost applied to {recommendationResult.preferredBrandsApplied} saved brands.
              </Text>
            ) : null}

            <Text style={styles.sectionLabel}>Best Matching Brands</Text>
            <View style={styles.brandChipWrap}>
              {recommendationResult.topBrands.map((brand) => (
                <View key={brand.brandId} style={styles.brandChip}>
                  <Text style={styles.brandChipText}>{brand.brandName}</Text>
                  <Text style={styles.brandChipScore}>{Math.round(brand.score * 100)}%</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionLabel, styles.productsLabel]}>Precise Product Picks</Text>
            {recommendationResult.topProducts.map((product) => {
              const sizeAvailable = Array.isArray(product.sizes)
                ? product.sizes.includes(recommendationResult.suggestedSize)
                : false;

              return (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productImageBox}>
                    <ProductImage
                      imageUrl={product.imageUrl}
                      fallback={product.image}
                      containerStyle={styles.productImageFrame}
                      imageStyle={styles.productImageAsset}
                      fallbackTextStyle={styles.productFallback}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.productMeta}>
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                    <Text style={styles.productBrand}>{formatBrandLabel(product.brandId)}</Text>
                    <Text style={styles.productPrice}>{formatINR(product.price)}</Text>
                    <Text style={styles.productHint}>
                      {sizeAvailable
                        ? `Size ${recommendationResult.suggestedSize} likely available`
                        : `Closest fit around size ${recommendationResult.suggestedSize}`}
                    </Text>
                    <Pressable
                      style={styles.productButton}
                      onPress={() => navigateToProductDetail(product)}
                    >
                      <Text style={styles.productButtonText}>View Product</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f5f2' },
  scrollContent: { padding: 20, paddingBottom: 56 },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1a1a1a'
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#4a4a4a'
  },
  profileHintBox: {
    marginBottom: 12,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  profileHintText: {
    color: '#3730a3',
    fontSize: 11,
    fontWeight: '600'
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937'
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c4bcb0',
    backgroundColor: '#fff',
    marginRight: 10,
    marginBottom: 10
  },
  chipSelected: {
    backgroundColor: '#1f2937',
    borderColor: '#1f2937'
  },
  chipText: { fontSize: 13, color: '#1f2937' },
  chipTextSelected: { color: '#fef3c7' },
  input: {
    borderWidth: 1,
    borderColor: '#d4d4d4',
    padding: 12,
    marginBottom: 14,
    borderRadius: 10,
    backgroundColor: '#fff'
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    marginBottom: 12
  },
  submitButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6
  },
  submitButtonText: {
    color: '#1a1a1a',
    fontWeight: '700',
    fontSize: 16
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  secondaryButtonText: {
    color: '#1f2937',
    fontWeight: '600'
  },
  resultContainer: {
    marginTop: 20
  },
  analysisModeBanner: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 10
  },
  analysisModeText: {
    color: '#9a3412',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600'
  },
  resultTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 14
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center'
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1f2937'
  },
  profileAppliedText: {
    marginBottom: 10,
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '600'
  },
  brandChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10
  },
  brandChip: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  brandChipText: {
    color: '#9a3412',
    fontWeight: '700',
    fontSize: 12,
    marginRight: 6
  },
  brandChipScore: {
    color: '#b45309',
    fontWeight: '700',
    fontSize: 11
  },
  productsLabel: {
    marginTop: 2
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row'
  },
  productImageBox: {
    width: 88,
    height: 88,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    marginRight: 10,
    overflow: 'hidden'
  },
  productImageFrame: {
    width: '100%',
    height: '100%'
  },
  productImageAsset: {
    width: '100%',
    height: '100%'
  },
  productFallback: {
    fontSize: 32
  },
  productMeta: {
    flex: 1
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827'
  },
  productBrand: {
    marginTop: 3,
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '700'
  },
  productPrice: {
    marginTop: 4,
    fontSize: 13,
    color: '#0f766e',
    fontWeight: '700'
  },
  productHint: {
    marginTop: 3,
    fontSize: 11,
    color: '#374151'
  },
  productButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8
  },
  productButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fef3c7'
  }
});
