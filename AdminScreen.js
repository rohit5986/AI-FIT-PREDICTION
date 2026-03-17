import React, { useContext, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { BrandDataContext } from './BrandDataContext';
import { BRANDS, validateBrandData } from './sizeCharts';

const formatJson = (value) => JSON.stringify(value, null, 2);

export default function AdminScreen() {
  const { brands, setBrands, lastUpdated } = useContext(BrandDataContext);
  const [jsonText, setJsonText] = useState(formatJson(brands));
  const [status, setStatus] = useState({ type: 'info', message: '' });

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) return 'Not updated yet';
    return `Last updated: ${new Date(lastUpdated).toLocaleString()}`;
  }, [lastUpdated]);

  useEffect(() => {
    setJsonText(formatJson(brands));
  }, [brands]);

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const result = validateBrandData(parsed);
      if (!result.valid) {
        setStatus({
          type: 'error',
          message: `Validation failed: ${result.errors.slice(0, 3).join(' ')}`
        });
        return;
      }
      setBrands(parsed);
      setStatus({ type: 'success', message: 'Brand data updated.' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Invalid JSON. Please check formatting.' });
    }
  };

  const handleReset = () => {
    setBrands(BRANDS);
    setStatus({ type: 'success', message: 'Reverted to default sample data.' });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Brand Data Import</Text>
      <Text style={styles.subtitle}>
        Paste brand size charts in JSON format. The data must include top and bottom charts.
      </Text>

      <View style={styles.statusRow}>
        <Text style={styles.statusText}>{formattedLastUpdated}</Text>
      </View>

      <TextInput
        style={styles.editor}
        value={jsonText}
        onChangeText={setJsonText}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        textAlignVertical="top"
      />

      {status.message ? (
        <Text
          style={[
            styles.statusMessage,
            status.type === 'error' && styles.statusError,
            status.type === 'success' && styles.statusSuccess
          ]}
        >
          {status.message}
        </Text>
      ) : null}

      <View style={styles.buttonRow}>
        <Pressable style={styles.primaryButton} onPress={handleImport}>
          <Text style={styles.primaryButtonText}>Import JSON</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={handleReset}>
          <Text style={styles.secondaryButtonText}>Reset Sample Data</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f6f5f2'
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: '#4b5563',
    marginBottom: 16
  },
  statusRow: {
    paddingVertical: 6,
    alignItems: 'center'
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280'
  },
  editor: {
    minHeight: 280,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 12
  },
  statusMessage: {
    marginTop: 12,
    fontSize: 12,
    textAlign: 'center',
    color: '#374151'
  },
  statusError: {
    color: '#b91c1c'
  },
  statusSuccess: {
    color: '#047857'
  },
  buttonRow: {
    marginTop: 16
  },
  primaryButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10
  },
  primaryButtonText: {
    color: '#1a1a1a',
    fontWeight: '700'
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#1f2937',
    fontWeight: '600'
  }
});
