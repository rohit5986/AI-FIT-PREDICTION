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
                <ActivityIndicator color="#fef3c7" />
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
    backgroundColor: '#efe9df'
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 28,
    justifyContent: 'center'
  },
  heroCard: {
    backgroundColor: '#fdfbf6',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dfd7ca',
    paddingHorizontal: 16,
    paddingVertical: 18
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center'
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: '#4b5563',
    textAlign: 'center'
  },
  formCard: {
    marginTop: 18,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: '#111827',
    backgroundColor: '#fff'
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8
  },
  primaryButton: {
    backgroundColor: '#111827',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44
  },
  buttonDisabled: {
    opacity: 0.75
  },
  primaryButtonText: {
    color: '#fef3c7',
    fontSize: 14,
    fontWeight: '700'
  },
  switchButton: {
    marginTop: 10,
    alignItems: 'center'
  },
  switchButtonText: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: 12
  },
  noteText: {
    marginTop: 12,
    color: '#6b7280',
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