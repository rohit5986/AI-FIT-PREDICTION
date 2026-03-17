import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { CATEGORIES } from './sizeCharts';
import { BrandDataContext } from './BrandDataContext';

export default function MeasurementScreen({ navigation }) {
  const { brands } = useContext(BrandDataContext);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [brandId, setBrandId] = useState(brands[0]?.id || '');
  const [error, setError] = useState('');

  const brandOptions = useMemo(() => brands, [brands]);
  const categoryOptions = useMemo(() => CATEGORIES, []);

  useEffect(() => {
    if (!brands.find((brand) => brand.id === brandId)) {
      setBrandId(brands[0]?.id || '');
    }
  }, [brands, brandId]);

  const toNumber = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const handleSubmit = () => {
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

    if (missing.length > 0) {
      setError(`Please enter valid numbers for: ${missing.join(', ')}.`);
      return;
    }

    if (!brandId) {
      setError('Please select a brand before continuing.');
      return;
    }

    setError('');
    navigation.navigate('Result', {
      measurements: parsed,
      category,
      brandId
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
        <Text style={styles.title}>Enter Your Measurements</Text>
        <Text style={styles.subtitle}>
          Use a measuring tape for best results. Required fields: height, chest, waist.
        </Text>

        <Text style={styles.sectionLabel}>Category</Text>
        {renderChips(categoryOptions, category, setCategory)}

        <Text style={styles.sectionLabel}>Brand</Text>
        {renderChips(brandOptions, brandId, setBrandId)}
        <Pressable
          style={styles.linkButton}
          onPress={() => navigation.navigate('Admin')}
        >
          <Text style={styles.linkText}>Manage brand size data</Text>
        </Pressable>

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
          <Text style={styles.submitButtonText}>Predict Size</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f5f2' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: {
    fontSize: 24,
    fontWeight: '700',
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
  linkButton: {
    alignSelf: 'flex-start',
    marginBottom: 16
  },
  linkText: {
    color: '#1f2937',
    textDecorationLine: 'underline',
    fontSize: 12,
    fontWeight: '600'
  }
});
