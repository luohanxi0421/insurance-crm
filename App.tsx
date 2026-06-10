import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import { useAuth } from './src/store/authStore';
import { supabase } from './src/lib/supabase';
import { setInitialUrl } from './src/lib/deepLinkStore';
import AppNavigator from './src/navigation/AppNavigator';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: sentryDsn,
  enabled: !__DEV__ && Boolean(sentryDsn),
});

function App() {
  const { loading, initialize, setUser, setPasswordResetMode } = useAuth();
  const initialized = useRef(false);

  const handlePasswordResetUrl = (url: string | null) => {
    if (!url || !url.includes('reset-password')) return;

    const fragment = url.split('#')[1];
    if (!fragment) return;

    try {
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (!accessToken || !refreshToken) return;

      setPasswordResetMode(true);
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).catch(() => {
        setPasswordResetMode(false);
      });
    } catch {
      // Invalid URL – ignore, user can request a new reset link.
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initialize();
  }, [initialize]);

  // Capture the initial deep-link URL before React Navigation consumes it.
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      setInitialUrl(url);
      handlePasswordResetUrl(url);
    });

    // Also listen for URLs when the app is already running.
    const sub = Linking.addEventListener('url', ({ url }) => {
      handlePasswordResetUrl(url);
    });
    return () => sub.remove();
  }, []);

  // Listen for auth state changes (session expiry, token refresh, etc.).
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, [setUser]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default Sentry.wrap(App);
