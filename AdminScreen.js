import React, { useContext, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { BrandDataContext } from './BrandDataContext';
import { BRANDS, validateBrandData } from './sizeCharts';
import { parseBrandsFromSpreadsheetRows } from './sizeChartImport';

const formatJson = (value) => JSON.stringify(value, null, 2);

export default function AdminScreen() {
  const { brands, setBrands, lastUpdated } = useContext(BrandDataContext);
  const [jsonText, setJsonText] = useState(formatJson(brands));
  const [mode, setMode] = useState('json');
  const [selectedFile, setSelectedFile] = useState('');
  const [status, setStatus] = useState({ type: 'info', message: '' });

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) return 'Not updated yet';
    return `Last updated: ${new Date(lastUpdated).toLocaleString()}`;
  }, [lastUpdated]);

  useEffect(() => {
    setJsonText(formatJson(brands));
  }, [brands]);

  const applyBrandData = (nextBrands) => {
    const result = validateBrandData(nextBrands);
    if (!result.valid) {
      setStatus({
        type: 'error',
        message: `Validation failed: ${result.errors.slice(0, 3).join(' ')}`
      });
      return false;
    }

    setBrands(nextBrands);
    setStatus({ type: 'success', message: 'Brand data updated.' });
    return true;
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonText);
      applyBrandData(parsed);
    } catch (error) {
      setStatus({ type: 'error', message: 'Invalid JSON. Please check formatting.' });
    }
  };

  const handleFileImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: [
          'text/csv',
          'application/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/json',
          'text/plain'
        ]
      });

      if (result.canceled || !Array.isArray(result.assets) || result.assets.length === 0) return;

      const asset = result.assets[0];
      const fileName = String(asset.name || 'selected-file');
      const lowerName = fileName.toLowerCase();
      const response = await fetch(asset.uri);

      setSelectedFile(fileName);

      if (lowerName.endsWith('.json')) {
        const text = await response.text();
        const parsed = JSON.parse(text);
        const ok = applyBrandData(parsed);
        if (ok) {
          setStatus({ type: 'success', message: `Imported JSON file: ${fileName}` });
        }
        return;
      }

      if (lowerName.endsWith('.csv') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        const workbook = lowerName.endsWith('.csv')
          ? XLSX.read(await response.text(), { type: 'string' })
          : XLSX.read(await response.arrayBuffer(), { type: 'array' });

        const allRows = workbook.SheetNames.flatMap((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          return XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: '',
            raw: false
          });
        });

        const { brands: parsedBrands, warnings } = parseBrandsFromSpreadsheetRows(allRows);
        if (!Array.isArray(parsedBrands) || parsedBrands.length === 0) {
          setStatus({
            type: 'error',
            message: 'Could not parse any valid brand charts from this file. Please verify the format.'
          });
          return;
        }

        const ok = applyBrandData(parsedBrands);
        if (ok) {
          const warningText = Array.isArray(warnings) && warnings.length > 0
            ? ` Warning: ${warnings[0]}`
            : '';
          setStatus({
            type: 'success',
            message: `Imported ${parsedBrands.length} brands from ${fileName}.${warningText}`
          });
        }
        return;
      }

      setStatus({
        type: 'error',
        message: 'Unsupported file type. Use .json, .csv, .xls, or .xlsx.'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'File import failed. Please check file format and try again.'
      });
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
        Choose JSON paste or file upload (CSV/XLSX/JSON). Imported data must contain top and bottom charts.
      </Text>

      <View style={styles.modeSwitchRow}>
        <Pressable
          style={[styles.modeChip, mode === 'json' && styles.modeChipActive]}
          onPress={() => setMode('json')}
        >
          <Text style={[styles.modeChipText, mode === 'json' && styles.modeChipTextActive]}>Paste JSON</Text>
        </Pressable>

        <Pressable
          style={[styles.modeChip, mode === 'file' && styles.modeChipActive]}
          onPress={() => setMode('file')}
        >
          <Text style={[styles.modeChipText, mode === 'file' && styles.modeChipTextActive]}>Upload File</Text>
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusText}>{formattedLastUpdated}</Text>
      </View>

      {mode === 'json' ? (
        <TextInput
          style={styles.editor}
          value={jsonText}
          onChangeText={setJsonText}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          textAlignVertical="top"
        />
      ) : (
        <View style={styles.fileCard}>
          <Text style={styles.fileTitle}>Supported: .json, .csv, .xls, .xlsx</Text>
          <Text style={styles.fileHint}>
            The app will convert spreadsheet rows into brand size charts automatically.
          </Text>
          {selectedFile ? <Text style={styles.fileName}>Selected: {selectedFile}</Text> : null}
          <Pressable style={styles.primaryButton} onPress={handleFileImport}>
            <Text style={styles.primaryButtonText}>Choose File and Import</Text>
          </Pressable>
        </View>
      )}

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
        {mode === 'json' ? (
          <Pressable style={styles.primaryButton} onPress={handleImport}>
            <Text style={styles.primaryButtonText}>Import JSON</Text>
          </Pressable>
        ) : null}
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
  modeSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12
  },
  modeChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginHorizontal: 6
  },
  modeChipActive: {
    borderColor: '#84ccbf',
    backgroundColor: '#d1fae5'
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151'
  },
  modeChipTextActive: {
    color: '#115e59'
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
  fileCard: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 14
  },
  fileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  fileHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 10
  },
  fileName: {
    fontSize: 12,
    color: '#1f2937',
    marginBottom: 10,
    fontWeight: '600'
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
