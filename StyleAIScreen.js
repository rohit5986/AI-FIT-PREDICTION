import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import { UserProfileContext } from './UserProfileContext';

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
const CHAT_QUICK_PROMPTS = [
  'Review this outfit for office',
  'Suggest better color combinations',
  'Give footwear and accessory tips'
];

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
  const { profile } = useContext(UserProfileContext);
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const [analysisMode, setAnalysisMode] = useState('auto');
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

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

  const chatEndpoint = useMemo(() => {
    return `${normalizeBaseUrl(backendUrl)}/chatbot`;
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
      setChatMessages([]);
      setChatInput('');
      resultAnim.setValue(0);
    }
  };

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const buildChatContext = () => {
    const measurements = profile?.measurements || {};
    return {
      measurements: {
        height: toNumber(measurements.height),
        weight: toNumber(measurements.weight),
        chest: toNumber(measurements.chest),
        waist: toNumber(measurements.waist)
      },
      preferred_brands: Array.isArray(profile?.preferredBrands) ? profile.preferredBrands : [],
      audience: profile?.audience || 'all',
      style_direction: analysis?.style_direction || '',
      dominant_colors: Array.isArray(analysis?.dominant_colors)
        ? analysis.dominant_colors.map((item) => item?.name).filter(Boolean)
        : []
    };
  };

  const sendChatMessage = async (presetText) => {
    const messageText = String(presetText ?? chatInput).trim();
    if (!messageText || isChatLoading) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: messageText
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          context: buildChatContext()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || 'Chat request failed.');
      }

      const nextQuestions = Array.isArray(data?.suggested_questions)
        ? data.suggested_questions.slice(0, 3)
        : [];
      const assistantText = nextQuestions.length > 0
        ? `${data?.reply || 'I could not generate a response right now.'}\n\nTry next:\n- ${nextQuestions.join('\n- ')}`
        : (data?.reply || 'I could not generate a response right now.');

      setChatMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: assistantText
        }
      ]);
    } catch (error) {
      const errorText = isLikelyNetworkError(error)
        ? 'Could not connect to chatbot backend. Check URL and network settings.'
        : (error.message || 'Something went wrong.');

      setChatMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: errorText
        }
      ]);
    } finally {
      setIsChatLoading(false);
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
      setChatMessages([
        {
          id: `seed-${Date.now()}`,
          role: 'assistant',
          text: 'You can now ask chat questions about this look. Try: "Review this outfit for office", "Suggest better colors", or "What size advice fits this style?"'
        }
      ]);
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
            <View style={styles.summaryHeaderRow}>
              <Text style={styles.sectionHeading}>AI Summary</Text>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE ANALYSIS</Text>
              </View>
            </View>
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
            <View style={styles.colorGrid}>
              {analysis.dominant_colors?.map((color) => (
                <View key={color.hex} style={styles.colorCard}>
                  <View style={[styles.colorSwatch, { backgroundColor: color.hex }]} />
                  <Text style={styles.colorNameText}>{color.name}</Text>
                  <Text style={styles.colorHexText}>{color.hex}</Text>
                  <Text style={styles.percentText}>{color.percentage}%</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Color Suggestions</Text>
            <View style={styles.tipPanel}>
              {analysis.color_palette_advice?.map((tip, index) => (
                <Text key={`tip-${index}`} style={styles.bulletText}>• {tip}</Text>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Outfit Ideas</Text>
            <View style={styles.tipPanel}>
              {analysis.outfit_ideas?.map((idea, index) => (
                <Text key={`idea-${index}`} style={styles.bulletText}>• {idea}</Text>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Style Chat</Text>
            <View style={styles.chatPanel}>
              <Text style={styles.chatPanelHint}>Continue this look in chat with personalized guidance.</Text>

              <View style={styles.quickPromptRow}>
                {CHAT_QUICK_PROMPTS.map((prompt) => (
                <Pressable
                  key={prompt}
                  onPress={() => sendChatMessage(prompt)}
                  style={styles.quickPromptChip}
                >
                  <Text style={styles.quickPromptText}>{prompt}</Text>
                </Pressable>
                ))}
              </View>

              <View style={styles.chatMessagesWrap}>
                {chatMessages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.chatBubble,
                      msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant
                    ]}
                  >
                    <Text style={msg.role === 'user' ? styles.chatRoleUser : styles.chatRoleAssistant}>
                      {msg.role === 'user' ? 'YOU' : 'STYLE AI'}
                    </Text>
                    <Text style={msg.role === 'user' ? styles.chatTextUser : styles.chatTextAssistant}>
                      {msg.text}
                    </Text>
                  </View>
                ))}

                {isChatLoading ? (
                  <View style={[styles.chatBubble, styles.chatBubbleAssistant, styles.chatLoadingBubble]}>
                    <ActivityIndicator size="small" color="#8d390c" />
                    <Text style={styles.chatLoadingText}>Thinking...</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatInput}
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder="Ask follow-up about this look..."
                  placeholderTextColor="#936b5e"
                  multiline
                />
                <Pressable
                  style={[styles.chatSendBtn, (!chatInput.trim() || isChatLoading) && styles.btnDisabled]}
                  onPress={() => sendChatMessage()}
                  disabled={!chatInput.trim() || isChatLoading}
                >
                  <Text style={styles.chatSendBtnText}>Send</Text>
                </Pressable>
              </View>
            </View>
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
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBadge: {
    borderWidth: 1,
    borderColor: '#f8b49a',
    backgroundColor: '#fff0e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveBadgeText: {
    fontSize: 9,
    letterSpacing: 0.7,
    color: '#8d390c',
    fontWeight: '800',
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
    marginTop: 14,
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorCard: {
    width: (SCREEN_WIDTH - 72) / 3,
    minWidth: 94,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1cdbf',
    backgroundColor: '#fffaf7',
    padding: 8,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
    gap: 8,
  },
  colorSwatch: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 6,
  },
  colorNameText: {
    color: '#432a1f',
    fontWeight: '700',
    fontSize: 11,
  },
  colorHexText: {
    color: '#8f6f62',
    fontSize: 10,
    marginTop: 2,
  },
  tipPanel: {
    borderWidth: 1,
    borderColor: '#f3cdc0',
    backgroundColor: '#fffaf7',
    borderRadius: 10,
    padding: 10,
    marginBottom: 2,
  },
  chatPanel: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#efc0ae',
    backgroundColor: '#fff4ee',
    borderRadius: 12,
    padding: 10,
  },
  chatPanelHint: {
    color: '#754536',
    fontSize: 11,
    marginBottom: 8,
  },
  chatMessagesWrap: {
    borderWidth: 1,
    borderColor: '#f2cbbd',
    borderRadius: 10,
    backgroundColor: '#fff9f6',
    padding: 8,
    marginBottom: 8,
  },
  quickPromptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 10,
  },
  quickPromptChip: {
    borderWidth: 1,
    borderColor: '#f0b7a2',
    backgroundColor: '#fff0e8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickPromptText: {
    fontSize: 11,
    color: '#7f3e29',
    fontWeight: '700',
  },
  chatBubble: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    maxWidth: '92%',
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#7d2c12',
  },
  chatBubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff9f6',
    borderWidth: 1,
    borderColor: '#f1cdbf',
  },
  chatTextUser: {
    color: '#fff6f2',
    fontSize: 12,
    lineHeight: 18,
  },
  chatTextAssistant: {
    color: '#46261b',
    fontSize: 12,
    lineHeight: 18,
  },
  chatRoleUser: {
    color: '#ffd8cb',
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: '800',
    marginBottom: 2,
  },
  chatRoleAssistant: {
    color: '#8d5a48',
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: '800',
    marginBottom: 2,
  },
  chatLoadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatLoadingText: {
    color: '#8d390c',
    fontSize: 12,
  },
  chatInputRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: '#e9b8a7',
    borderRadius: 10,
    backgroundColor: '#fffaf7',
    color: '#46261b',
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 12,
  },
  chatSendBtn: {
    borderRadius: 10,
    backgroundColor: '#7d2c12',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  chatSendBtnText: {
    color: '#fff6f2',
    fontSize: 12,
    fontWeight: '700',
  },
});
