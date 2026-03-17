import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EMULATOR_BACKEND_URL = 'http://10.0.2.2:8000';

function getExpoHost() {
  const hostUri =
    Constants?.expoConfig?.hostUri
    || Constants?.manifest2?.extra?.expoGo?.debuggerHost
    || Constants?.manifest?.debuggerHost
    || '';

  const host = String(hostUri || '').split(':')[0].trim();
  if (!host) return '';

  if (host === 'localhost' || host === '127.0.0.1') return '';
  return host;
}

function getDefaultBackendUrl() {
  const host = getExpoHost();

  if (Platform.OS === 'android') {
    if (host) return `http://${host}:8000`;
    return EMULATOR_BACKEND_URL;
  }

  if (host) return `http://${host}:8000`;
  return 'http://127.0.0.1:8000';
}

const DEFAULT_BACKEND_URL = getDefaultBackendUrl();

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

function isLikelyNetworkError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('network request failed') || message.includes('failed to fetch');
}

function buildPhoneNetworkHelp(baseUrl) {
  return [
    `Cannot reach ${baseUrl}.`,
    'If you are on a real Android phone:',
    '- Use your computer LAN IP (example: http://192.168.1.12:8000)',
    '- Ensure phone and computer are on the same Wi-Fi',
    '- Keep backend running with --host 0.0.0.0',
    '- Allow Python/Uvicorn through Windows Firewall for private networks'
  ].join('\n');
}

export default function StyleAIScreen() {
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const [analysisMode, setAnalysisMode] = useState('auto');
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const configAnim = useRef(new Animated.Value(0)).current;
  const mediaAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  const endpoint = useMemo(() => {
    return `${normalizeBaseUrl(backendUrl)}/analyze-style`;
  }, [backendUrl]);

  const healthEndpoint = useMemo(() => {
    return `${normalizeBaseUrl(backendUrl)}/health`;
  }, [backendUrl]);

  const modelStatusEndpoint = useMemo(() => {
    return `${normalizeBaseUrl(backendUrl)}/model-status`;
  }, [backendUrl]);

  useEffect(() => {
    const animateIn = (value, delay = 0, distance = 10) => {
      value.setValue(0);
      return Animated.timing(value, {
        toValue: 1,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    };

    Animated.parallel([
      animateIn(heroAnim, 10),
      animateIn(configAnim, 90),
      animateIn(mediaAnim, 170),
    ]).start();
  }, [heroAnim, configAnim, mediaAnim]);

  useEffect(() => {
    if (!analysis) return;
    resultAnim.setValue(0);
    Animated.timing(resultAnim, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [analysis, resultAnim]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission needed', 'Allow gallery access to analyze your outfit image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1
    });

    if (!result.canceled && result.assets?.length > 0) {
      setSelectedImage(result.assets[0]);
      setAnalysis(null);
      resultAnim.setValue(0);
    }
  };

  const analyzeStyle = async () => {
    if (!selectedImage?.uri) {
      Alert.alert('Image required', 'Select an image first.');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage.uri,
        type: selectedImage.mimeType || 'image/jpeg',
        name: selectedImage.fileName || `style-photo-${Date.now()}.jpg`
      });
      formData.append('mode', analysisMode);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json'
        },
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || 'Failed to analyze image.');
      }

      setAnalysis(data);
    } catch (error) {
      if (isLikelyNetworkError(error)) {
        Alert.alert('Analysis failed', buildPhoneNetworkHelp(normalizeBaseUrl(backendUrl)));
      } else if (String(error?.name || '') === 'AbortError') {
        Alert.alert('Analysis timed out', 'Backend took too long to respond. Please retry.');
      } else {
        Alert.alert('Analysis failed', error.message || 'Unable to process this image right now.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsCheckingConnection(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const [healthResponse, statusResponse] = await Promise.all([
        fetch(healthEndpoint, { signal: controller.signal }),
        fetch(modelStatusEndpoint, { signal: controller.signal })
      ]);

      clearTimeout(timeoutId);

      if (!healthResponse.ok) {
        throw new Error(`Health check failed (${healthResponse.status})`);
      }

      const health = await healthResponse.json();
      const status = await statusResponse.json().catch(() => ({}));
      const modelInfo = status?.vlm_model ? `\nVLM: ${status.vlm_model}` : '';

      if (health?.status === 'ok') {
        Alert.alert('Connection OK', `Backend reachable at ${normalizeBaseUrl(backendUrl)}${modelInfo}`);
      } else {
        throw new Error('Backend responded but health status is not ok.');
      }
    } catch (error) {
      if (isLikelyNetworkError(error) || String(error?.name || '') === 'AbortError') {
        Alert.alert('Connection failed', buildPhoneNetworkHelp(normalizeBaseUrl(backendUrl)));
      } else {
        Alert.alert('Connection failed', error.message || 'Unable to reach backend.');
      }
    } finally {
      setIsCheckingConnection(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.bgLayer}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.eyebrow}>STYLE LAB</Text>
          <Text style={styles.title}>Style AI Studio</Text>
          <Text style={styles.subtitle}>Upload an outfit photo and get color-aware styling ideas instantly.</Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Mode {analysisMode.toUpperCase()}</Text>
            </View>
            <Text style={styles.pillHint}>Detected backend: {DEFAULT_BACKEND_URL}</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              opacity: configAnim,
              transform: [
                {
                  translateY: configAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionHeading}>Connection</Text>
          <Text style={styles.label}>Backend URL</Text>
          <TextInput
            style={styles.input}
            value={backendUrl}
            onChangeText={setBackendUrl}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://127.0.0.1:8000"
            placeholderTextColor="#6c7288"
          />
          <Text style={styles.helperText}>
            Android emulator uses 10.0.2.2. Real phones must use your LAN IP.
          </Text>

          <Pressable
            style={[styles.secondaryBtn, styles.connectionBtn, isCheckingConnection && styles.btnDisabled]}
            onPress={testConnection}
            disabled={isCheckingConnection}
          >
            <Text style={styles.secondaryBtnText}>
              {isCheckingConnection ? 'Checking Connection...' : 'Test Backend Connection'}
            </Text>
          </Pressable>

          <Text style={[styles.label, styles.modeLabel]}>Analysis Mode</Text>
          <View style={styles.modeRow}>
            {['auto', 'vlm', 'heuristic'].map((mode) => (
              <Pressable
                key={mode}
                style={[
                  styles.modeChip,
                  analysisMode === mode ? styles.modeChipActive : null,
                ]}
                onPress={() => setAnalysisMode(mode)}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    analysisMode === mode ? styles.modeChipTextActive : null,
                  ]}
                >
                  {mode.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              opacity: mediaAnim,
              transform: [
                {
                  translateY: mediaAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionHeading}>Photo Analysis</Text>

          <Pressable style={styles.secondaryBtn} onPress={pickImage}>
            <Text style={styles.secondaryBtnText}>Choose Outfit Image</Text>
          </Pressable>

          {selectedImage?.uri ? (
            <Image source={{ uri: selectedImage.uri }} style={styles.preview} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderBadge}>Preview</Text>
              <Text style={styles.placeholderText}>No image selected yet</Text>
            </View>
          )}

          <Pressable
            style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
            onPress={analyzeStyle}
            disabled={isLoading}
          >
            <Text style={styles.primaryBtnText}>{isLoading ? 'Analyzing...' : 'Analyze Style'}</Text>
          </Pressable>

          {isLoading ? <ActivityIndicator style={styles.loader} size="small" color="#ff8f66" /> : null}
        </Animated.View>

        {analysis ? (
          <Animated.View
            style={[
              styles.card,
              styles.resultCard,
              {
                opacity: resultAnim,
                transform: [
                  {
                    translateY: resultAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.sectionHeading}>AI Summary</Text>
            <Text style={styles.summaryText}>{analysis.caption}</Text>

            <View style={styles.statRow}>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>Style</Text>
                <Text style={styles.statValue}>{analysis.style_direction}</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>Model</Text>
                <Text style={styles.statValue}>{analysis.model || 'unknown'}</Text>
              </View>
            </View>

            {analysis.fallback_reason ? (
              <Text style={styles.warningText}>Fallback: {analysis.fallback_reason}</Text>
            ) : null}

            <Text style={styles.sectionTitle}>Dominant Colors</Text>
            {analysis.dominant_colors?.map((color) => (
              <View key={color.hex} style={styles.colorRow}>
                <View style={[styles.colorSwatch, { backgroundColor: color.hex }]} />
                <Text style={styles.valueText}>{color.name} ({color.hex})</Text>
                <Text style={styles.percentText}>{color.percentage}%</Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Color Suggestions</Text>
            {analysis.color_palette_advice?.map((tip, index) => (
              <Text key={`tip-${index}`} style={styles.bulletText}>• {tip}</Text>
            ))}

            <Text style={styles.sectionTitle}>Outfit Ideas</Text>
            {analysis.outfit_ideas?.map((idea, index) => (
              <Text key={`idea-${index}`} style={styles.bulletText}>• {idea}</Text>
            ))}
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0c1020',
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: '#ff8358',
    opacity: 0.24,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: '#60a5fa',
    opacity: 0.22,
  },
  container: {
    padding: 16,
    paddingBottom: 44,
  },
  hero: {
    backgroundColor: '#131a33',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#263156',
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5,
  },
  eyebrow: {
    color: '#ffbe9f',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#f7f8fb',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 13,
    color: '#d2d8eb',
    marginTop: 7,
    lineHeight: 19,
  },
  heroMetaRow: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pill: {
    backgroundColor: '#253159',
    borderWidth: 1,
    borderColor: '#38467a',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    color: '#ffbe9f',
    fontSize: 11,
    fontWeight: '700',
  },
  pillHint: {
    flex: 1,
    textAlign: 'right',
    fontSize: 10,
    color: '#b6bfdd',
  },
  card: {
    backgroundColor: '#f6f8ff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#d9def2',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111936',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2f3a67',
    marginBottom: 7,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbc3e6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111936',
    backgroundColor: '#ffffff',
  },
  helperText: {
    fontSize: 11,
    color: '#5f6787',
    marginTop: 6,
    lineHeight: 16,
  },
  modeLabel: {
    marginTop: 12,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  modeChip: {
    borderWidth: 1,
    borderColor: '#bfc6e8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  modeChipActive: {
    borderColor: '#ff8358',
    backgroundColor: '#ffe8df',
  },
  modeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  modeChipTextActive: {
    color: '#7d2c12',
  },
  primaryBtn: {
    backgroundColor: '#111936',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryBtnText: {
    color: '#f7f8ff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#2c3969',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  connectionBtn: {
    marginTop: 10,
    backgroundColor: '#eef2ff',
    borderColor: '#9ca8dd',
  },
  secondaryBtnText: {
    color: '#1f2a4d',
    fontWeight: '700',
    fontSize: 13,
  },
  preview: {
    marginTop: 12,
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: '#e8ecff',
  },
  placeholder: {
    marginTop: 12,
    height: 146,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c7d0ef',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#edf1ff',
    gap: 7,
  },
  placeholderBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5063a8',
    backgroundColor: '#dbe3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  placeholderText: {
    color: '#6474ac',
    fontSize: 12,
  },
  loader: {
    marginTop: 10,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  resultCard: {
    backgroundColor: '#fff7f3',
    borderColor: '#ffd4c5',
    marginBottom: 18,
  },
  summaryText: {
    fontSize: 13,
    color: '#402319',
    lineHeight: 20,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ffd3c4',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  statLabel: {
    fontSize: 10,
    color: '#9a5f4d',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  statValue: {
    color: '#3f241b',
    fontSize: 12,
    fontWeight: '700',
  },
  warningText: {
    marginTop: 8,
    color: '#8d390c',
    backgroundColor: '#ffe8dd',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
    fontSize: 11,
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#3a2218',
  },
  valueText: {
    fontSize: 12,
    color: '#402d24',
    lineHeight: 18,
  },
  percentText: {
    marginLeft: 'auto',
    fontSize: 11,
    fontWeight: '700',
    color: '#925746',
  },
  bulletText: {
    fontSize: 12,
    color: '#49332a',
    lineHeight: 18,
    marginBottom: 3,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
    gap: 8,
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
});
