import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { AuthContext } from './AuthContext';

const COLORS = {
  bg: '#f4f6fb',
  card: '#ffffff',
  softCard: '#eef6f6',
  text: '#0f172a',
  muted: '#64748b',
  border: '#dbe2ee',
  accent: '#0f766e',
  accentText: '#ecfeff',
  danger: '#b91c1c'
};

export default function LoginScreen() {
  const { login, signup, isFirebaseConfigured, authError } = useContext(AuthContext);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignupMode = mode === 'signup';
  const canSubmit = isFirebaseConfigured && !isSubmitting;

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async () => {
    const trimmedEmail = String(email || '').trim().toLowerCase();
    const trimmedPassword = String(password || '').trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter email and password.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (isSignupMode && trimmedPassword !== String(confirmPassword || '').trim()) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      if (isSignupMode) {
        await signup({ email: trimmedEmail, password: trimmedPassword });
      } else {
        await login({ email: trimmedEmail, password: trimmedPassword });
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <Text style={styles.badge}>AI FIT</Text>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Login to keep your profile and recommendations synced securely with Firebase.
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.modeTitle}>{isSignupMode ? 'Create Account' : 'Login'}</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!isSubmitting}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isSubmitting}
            />

            {isSignupMode ? (
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!isSubmitting}
              />
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {!error && authError ? <Text style={styles.errorText}>{authError}</Text> : null}
            {!isFirebaseConfigured ? (
              <Text style={styles.setupText}>
                Firebase keys are missing. Add EXPO_PUBLIC_FIREBASE_* values before logging in.
              </Text>
            ) : null}

            <Pressable
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.accentText} />
              ) : (
                <Text style={styles.primaryButtonText}>{isSignupMode ? 'Create Account' : 'Login'}</Text>
              )}
            </Pressable>

            <Pressable style={styles.switchButton} onPress={toggleMode} disabled={isSubmitting}>
              <Text style={styles.switchButtonText}>
                {isSignupMode ? 'Already have an account? Login' : 'New user? Create an account'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.noteText}>
            Note: enable Email/Password provider in Firebase Authentication for this to work.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 28,
    justifyContent: 'center'
  },
  heroCard: {
    backgroundColor: COLORS.softCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5
  },
  badgeRow: {
    alignItems: 'center',
    marginBottom: 8
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: COLORS.accent,
    backgroundColor: '#d1fae5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center'
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted,
    textAlign: 'center'
  },
  formCard: {
    marginTop: 18,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: COLORS.text,
    backgroundColor: '#f8fafc'
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44
  },
  buttonDisabled: {
    opacity: 0.75
  },
  primaryButtonText: {
    color: COLORS.accentText,
    fontSize: 14,
    fontWeight: '700'
  },
  switchButton: {
    marginTop: 10,
    alignItems: 'center'
  },
  switchButtonText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 12
  },
  noteText: {
    marginTop: 12,
    color: COLORS.muted,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600'
  },
  setupText: {
    color: '#9a3412',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8
  }
});