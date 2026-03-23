import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth, firebaseConfigError, isFirebaseConfigured } from './firebase';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const getAuthErrorMessage = (error) => {
  const code = String(error?.code || '');

  if (code.includes('invalid-email')) return 'Please enter a valid email address.';
  if (code.includes('missing-password')) return 'Please enter your password.';
  if (code.includes('invalid-credential')) return 'Invalid email or password.';
  if (code.includes('user-not-found')) return 'No account found for this email.';
  if (code.includes('wrong-password')) return 'Invalid email or password.';
  if (code.includes('email-already-in-use')) return 'This email is already registered. Please login.';
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('network-request-failed')) return 'Network issue. Check your internet and try again.';

  return error?.message || 'Authentication failed. Please try again.';
};

export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  isFirebaseConfigured: false,
  authError: '',
  login: async () => {},
  signup: async () => {},
  logout: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthError(firebaseConfigError || 'Firebase is not configured.');
      setUser(null);
      setIsInitializing(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (!firebaseUser) {
          setUser(null);
          setIsInitializing(false);
          return;
        }

        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || ''
        });
        setIsInitializing(false);
      },
      (error) => {
        setAuthError(getAuthErrorMessage(error));
        setUser(null);
        setIsInitializing(false);
      }
    );

    return unsubscribe;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(firebaseConfigError || 'Firebase is not configured.');
    }

    const normalizedEmail = normalizeEmail(email);
    const passwordValue = String(password || '').trim();

    if (!normalizedEmail || !passwordValue) {
      throw new Error('Enter both email and password.');
    }

    try {
      setAuthError('');
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, passwordValue);
      return {
        id: credential.user.uid,
        email: credential.user.email || normalizedEmail
      };
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const signup = useCallback(async ({ email, password }) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(firebaseConfigError || 'Firebase is not configured.');
    }

    const normalizedEmail = normalizeEmail(email);
    const passwordValue = String(password || '').trim();

    if (!normalizedEmail || !passwordValue) {
      throw new Error('Enter both email and password.');
    }

    if (passwordValue.length < 6) {
      throw new Error('Password should be at least 6 characters.');
    }

    try {
      setAuthError('');
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, passwordValue);
      return {
        id: credential.user.uid,
        email: credential.user.email || normalizedEmail
      };
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    if (!auth) {
      setUser(null);
      return;
    }

    try {
      await signOut(auth);
      setAuthError('');
      setUser(null);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      isFirebaseConfigured,
      authError,
      login,
      signup,
      logout
    }),
    [user, isInitializing, authError, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};