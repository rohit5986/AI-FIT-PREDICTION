import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, FlatList } from 'react-native';
import { BrandDataContext } from './BrandDataContext';
import { getRecommendedBrands, CATEGORIES } from './sizeCharts';

const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

const formatPriceRange = (value) => String(value || '').replace(/\$/g, '₹');

export default function BrandRecommendationScreen({ route, navigation }) {
  const { brands } = useContext(BrandDataContext);
  const params = route?.params || {};
  const measurements = params.measurements || {};
  const categoryId = params.category || CATEGORIES[0].id;

  const recommendations = useMemo(() => {
    return getRecommendedBrands({
      measurements,
      category: categoryId,
      brandsOverride: brands
    });
  }, [measurements, categoryId, brands]);

  const categoryLabel = CATEGORIES.find(c => c.id === categoryId)?.label || 'Clothing';

  if (recommendations.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>AI Brand Recommendations</Text>
        <Text style={styles.subtitle}>For: {categoryLabel}</Text>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Size-Chart Brands Yet</Text>
          <Text style={styles.emptyText}>
            Product data is available in Shop. AI recommendations require brand size charts.
          </Text>
        </View>

        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = '★'.repeat(fullStars);
    const half = hasHalfStar ? '✌' : '';
    return stars + half;
  };

  const renderScoreBar = (score, label) => (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={styles.scoreBarContainer}>
        <View style={[styles.scoreBar, { width: `${score * 100}%` }]} />
      </View>
      <Text style={styles.scoreText}>{(score * 100).toFixed(0)}%</Text>
    </View>
  );

  const renderBrandCard = ({ item, index }) => (
    <View style={[styles.brandCard, index === 0 && styles.topBrand]}>
      <View style={styles.brandHeader}>
        <View style={styles.brandTitleRow}>
          <Text style={styles.rankBadge}>#{index + 1}</Text>
          <View>
            <Text style={styles.brandName}>{item.name}</Text>
            <Text style={styles.brandDescription}>{item.description}</Text>
          </View>
        </View>
        <Text style={styles.overallScore}>{(item.finalScore * 100).toFixed(0)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.recommendationInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Recommended Size:</Text>
          <Text style={styles.predictedSize}>{item.predictedSize}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fit Confidence:</Text>
          <Text style={[
            styles.confidence,
            item.confidence === 'High' && styles.confHigh,
            item.confidence === 'Medium' && styles.confMedium,
            item.confidence === 'Low' && styles.confLow
          ]}>
            {item.confidence}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Quality Rating:</Text>
          <Text style={styles.rating}>{item.quality.toFixed(1)} ★</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Price Range:</Text>
          <Text style={styles.price}>{formatPriceRange(item.priceRange)}</Text>
        </View>
      </View>

      <View style={styles.scoresContainer}>
        <Text style={styles.scoresTitle}>AI Scoring Breakdown</Text>
        {renderScoreBar(item.scores.fit, 'Fit Match')}
        {renderScoreBar(item.scores.quality, 'Brand Quality')}
        {renderScoreBar(item.scores.products, 'Product Rating')}
        {renderScoreBar(item.scores.value, 'Value')}
      </View>

      {item.products.length > 0 && (
        <View style={styles.productsContainer}>
          <Text style={styles.productsTitle}>
            Available Products ({item.products.length})
          </Text>
          {item.products.map((product) => (
            <View key={product.id} style={styles.productItem}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productRating}>
                  {renderStars(product.rating)} {product.rating.toFixed(1)}
                </Text>
              </View>
              <Text style={styles.productPrice}>{formatINR(product.price)}</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        style={styles.selectButton}
        onPress={() => {
          navigation.navigate('Result', {
            measurements,
            category: categoryId,
            brandId: item.brandId
          });
        }}
      >
        <Text style={styles.selectButtonText}>View Details</Text>
      </Pressable>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>AI Brand Recommendations</Text>
      <Text style={styles.subtitle}>For: {categoryLabel}</Text>

      <View style={styles.measurementCard}>
        <Text style={styles.measurementCardTitle}>Your Measurements</Text>
        <View style={styles.measurementGrid}>
          <View style={styles.measurementItem}>
            <Text style={styles.measurementLabel}>Height</Text>
            <Text style={styles.measurementValue}>{measurements.height} cm</Text>
          </View>
          <View style={styles.measurementItem}>
            <Text style={styles.measurementLabel}>Chest</Text>
            <Text style={styles.measurementValue}>{measurements.chest} cm</Text>
          </View>
          <View style={styles.measurementItem}>
            <Text style={styles.measurementLabel}>Waist</Text>
            <Text style={styles.measurementValue}>{measurements.waist} cm</Text>
          </View>
          {measurements.weight && (
            <View style={styles.measurementItem}>
              <Text style={styles.measurementLabel}>Weight</Text>
              <Text style={styles.measurementValue}>{measurements.weight} kg</Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        scrollEnabled={false}
        data={recommendations}
        renderItem={renderBrandCard}
        keyExtractor={(item) => item.brandId}
        contentContainerStyle={styles.listContent}
      />

      <Pressable
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Edit Measurements</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30,
    backgroundColor: '#f6f5f2'
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 16
  },
  measurementCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  measurementCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10
  },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  measurementItem: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6'
  },
  measurementLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2
  },
  measurementValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937'
  },
  listContent: {
    marginBottom: 12
  },
  brandCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  topBrand: {
    borderColor: '#fbbf24',
    backgroundColor: '#fffbf0'
  },
  brandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12
  },
  rankBadge: {
    backgroundColor: '#fbbf24',
    color: '#92400e',
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
    fontSize: 12,
    minWidth: 32,
    textAlign: 'center'
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2
  },
  brandDescription: {
    fontSize: 12,
    color: '#6b7280',
    maxWidth: 220
  },
  overallScore: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fbbf24',
    textAlign: 'center'
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12
  },
  recommendationInfo: {
    marginBottom: 14
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500'
  },
  predictedSize: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  confidence: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  confHigh: {
    backgroundColor: '#d1fae5',
    color: '#065f46'
  },
  confMedium: {
    backgroundColor: '#fcd34d',
    color: '#92400e'
  },
  confLow: {
    backgroundColor: '#fee2e2',
    color: '#991b1b'
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fbbf24'
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669'
  },
  scoresContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6'
  },
  scoresTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10
  },
  scoreRow: {
    marginBottom: 8
  },
  scoreLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 3
  },
  scoreBarContainer: {
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    height: 6,
    overflow: 'hidden',
    marginBottom: 2
  },
  scoreBar: {
    backgroundColor: '#3b82f6',
    height: '100%',
    borderRadius: 6
  },
  scoreText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600'
  },
  productsContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  productsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 8
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#d1fae5'
  },
  productInfo: {
    flex: 1
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2
  },
  productRating: {
    fontSize: 11,
    color: '#6b7280'
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669'
  },
  selectButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 0
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  backButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db'
  },
  backButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18
  }
});
